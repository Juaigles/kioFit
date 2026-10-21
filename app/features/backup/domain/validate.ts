import { BACKUP_MIGRATIONS, CURRENT_FORMAT_VERSION, migrateBackup, type BackupData, type BackupFile, type BackupMigrations } from './format'

export interface BackupSummary {
  exportedAt: string
  sessionCount: number
  customExerciseCount: number
}

export type ParseBackupResult
  = | { ok: true, backup: BackupFile, summary: BackupSummary }
    | { ok: false, reason: 'not_backup' | 'newer_version' | 'invalid', error: string }

export interface ParseBackupOptions {
  currentVersion?: number
  migrations?: BackupMigrations
  /** Tablas que la versión actual añade a las de fuerza y que este validador aún no conoce: solo se exige que sean listas. */
  extraTables?: string[]
}

type Rec = Record<string, unknown>
type Kind = 'string' | 'boolean' | 'instant' | 'date' | 'kg' | 'reps' | 'seconds' | 'position' | { oneOf: readonly string[] }
type TableSpec = Record<string, { kind: Kind, optional?: boolean }>

const TABLES: Record<keyof BackupData, TableSpec> = {
  exercises: {
    id: { kind: 'string' }, name: { kind: 'string' }, normalizedName: { kind: 'string' },
    measure: { kind: { oneOf: ['weight_reps', 'reps', 'duration'] } }, origin: { kind: { oneOf: ['catalog', 'custom'] } },
    sourceId: { kind: 'string', optional: true }, createdAt: { kind: 'instant' }, updatedAt: { kind: 'instant' },
  },
  sessions: {
    id: { kind: 'string' }, type: { kind: { oneOf: ['strength'] } }, localDate: { kind: 'date' }, startedAt: { kind: 'instant' },
    endedAt: { kind: 'instant', optional: true }, status: { kind: { oneOf: ['in_progress', 'finished'] } },
  },
  sessionExercises: { id: { kind: 'string' }, sessionId: { kind: 'string' }, exerciseId: { kind: 'string' }, position: { kind: 'position' } },
  sets: {
    id: { kind: 'string' }, sessionExerciseId: { kind: 'string' }, position: { kind: 'position' },
    weightKg: { kind: 'kg', optional: true }, reps: { kind: 'reps', optional: true }, durationSeconds: { kind: 'seconds', optional: true },
    done: { kind: 'boolean' }, doneAt: { kind: 'instant', optional: true },
  },
}

const NOT_A_BACKUP = 'Este archivo no es una copia de kioFit'

const isRecord = (value: unknown): value is Rec => typeof value === 'object' && value !== null && !Array.isArray(value)
const isInstant = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) && !Number.isNaN(Date.parse(v))
const isInt = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

function isLocalDate(v: unknown): boolean {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [y, m, d] = v.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/** Devuelve el problema del valor, o `undefined` si es válido. */
function problem(kind: Kind, v: unknown): string | undefined {
  if (typeof kind === 'object') return kind.oneOf.includes(v as string) ? undefined : `debe ser uno de ${kind.oneOf.join(', ')}`
  switch (kind) {
    case 'string': return typeof v === 'string' && v !== '' ? undefined : 'debe ser un texto no vacío'
    case 'boolean': return typeof v === 'boolean' ? undefined : 'debe ser verdadero o falso'
    case 'instant': return isInstant(v) ? undefined : 'debe ser un instante ISO 8601'
    case 'date': return isLocalDate(v) ? undefined : 'debe ser una fecha válida YYYY-MM-DD'
    case 'position': return isInt(v, 0, Number.MAX_SAFE_INTEGER) ? undefined : 'debe ser un entero desde 0'
    case 'reps': return isInt(v, 1, 999) ? undefined : 'debe ser un entero de 1 a 999'
    case 'seconds': return isInt(v, 1, 3599) ? undefined : 'debe ser un entero de 1 a 3599 segundos'
    case 'kg': {
      const ok = typeof v === 'number' && v >= 0 && v <= 999.99 && Math.abs(v * 100 - Math.round(v * 100)) < 1e-6
      return ok ? undefined : 'debe ser un número de 0 a 999,99 kg con hasta 2 decimales'
    }
  }
}

const invalid = (table: string, detail: string): ParseBackupResult => ({ ok: false, reason: 'invalid', error: `Copia no válida en «${table}»: ${detail}` })

function checkTable(table: string, rows: unknown[], spec: TableSpec): string | undefined {
  for (const [i, row] of rows.entries()) {
    const at = `registro ${i + 1}`
    if (!isRecord(row)) return `${at} no es un objeto`
    for (const key of Object.keys(row)) if (!(key in spec)) return `${at} tiene un campo desconocido «${key}»`
    for (const [field, { kind, optional }] of Object.entries(spec)) {
      if (!(field in row)) {
        if (!optional) return `${at} no tiene el campo obligatorio «${field}»`
        continue
      }
      const bad = problem(kind, row[field])
      if (bad) return `${at}: «${field}» ${bad}`
    }
  }
  return undefined
}

function checkRelations(data: BackupData): ParseBackupResult | undefined {
  for (const table of ['exercises', 'sessions', 'sessionExercises', 'sets'] as const) {
    const seen = new Set<string>()
    for (const row of data[table]) {
      if (seen.has(row.id)) return invalid(table, `el id «${row.id}» está repetido`)
      seen.add(row.id)
    }
  }
  const ids = (rows: { id: string }[]) => new Set(rows.map(r => r.id))
  const exercises = ids(data.exercises)
  const sessions = ids(data.sessions)
  const sessionExercises = ids(data.sessionExercises)
  for (const row of data.sessionExercises) {
    if (!sessions.has(row.sessionId)) return invalid('sessionExercises', `«sessionId» apunta a una sesión que no existe («${row.sessionId}»)`)
    if (!exercises.has(row.exerciseId)) return invalid('sessionExercises', `«exerciseId» apunta a un ejercicio que no existe («${row.exerciseId}»)`)
  }
  for (const row of data.sets) {
    if (!sessionExercises.has(row.sessionExerciseId)) return invalid('sets', `«sessionExerciseId» apunta a un ejercicio de la sesión que no existe («${row.sessionExerciseId}»)`)
  }
  if (data.sessions.filter(s => s.status === 'in_progress').length > 1) return invalid('sessions', 'hay más de una sesión en curso')
  return undefined
}

/** Lee, migra y valida el texto de un archivo de copia, todo en memoria. No escribe nada. */
export function parseBackup(text: string, options: ParseBackupOptions = {}): ParseBackupResult {
  const { currentVersion = CURRENT_FORMAT_VERSION, migrations = BACKUP_MIGRATIONS, extraTables = [] } = options
  const notBackup: ParseBackupResult = { ok: false, reason: 'not_backup', error: NOT_A_BACKUP }

  let raw: unknown
  try {
    raw = JSON.parse(text)
  }
  catch {
    return notBackup
  }
  if (!isRecord(raw) || raw.app !== 'kiofit' || !isInt(raw.formatVersion, 1, Number.MAX_SAFE_INTEGER)) return notBackup
  const version = raw.formatVersion as number
  if (version > currentVersion) {
    return { ok: false, reason: 'newer_version', error: `Esta copia es de una versión más nueva de kioFit (formato ${version}, esta app entiende hasta el ${currentVersion}). Actualiza la app para poder importarla` }
  }

  for (const key of Object.keys(raw)) {
    if (!['app', 'formatVersion', 'exportedAt', 'data'].includes(key)) return invalid('archivo', `tiene un campo desconocido «${key}»`)
  }
  if (!isInstant(raw.exportedAt)) return invalid('archivo', '«exportedAt» debe ser un instante ISO 8601')
  if (!isRecord(raw.data)) return invalid('archivo', 'falta «data» o no es un objeto')

  let file: BackupFile
  try {
    file = migrateBackup(raw as unknown as BackupFile, migrations, currentVersion) // raw ya tiene la cabecera comprobada; `data` se valida abajo
  }
  catch {
    return invalid('archivo', `no se puede migrar desde la versión ${version} del formato`)
  }

  const known = [...Object.keys(TABLES), ...extraTables]
  const data = file.data as unknown as Rec // tras migrar puede traer tablas que BackupData aún no declara; se comprueban abajo
  for (const key of Object.keys(data)) if (!known.includes(key)) return invalid(key, 'tabla desconocida para esta versión del formato')
  for (const name of known) {
    if (!(name in data)) return invalid(name, 'falta la tabla')
    if (!Array.isArray(data[name])) return invalid(name, 'debe ser una lista de registros')
  }
  for (const [name, spec] of Object.entries(TABLES)) {
    const bad = checkTable(name, data[name] as unknown[], spec)
    if (bad) return invalid(name, bad)
  }
  const relation = checkRelations(file.data)
  if (relation) return relation

  return {
    ok: true,
    backup: file,
    summary: {
      exportedAt: file.exportedAt,
      sessionCount: file.data.sessions.length,
      customExerciseCount: file.data.exercises.filter(e => e.origin === 'custom').length,
    },
  }
}

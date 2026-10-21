import { describe, expect, it } from 'vitest'
import { buildBackup, migrateBackup, type BackupData, type BackupFile, type BackupMigrations } from '../../../../../app/features/backup/domain/format'
import { parseBackup } from '../../../../../app/features/backup/domain/validate'

const NOT_A_BACKUP = 'Este archivo no es una copia de kioFit'

function validData(): BackupData {
  return {
    exercises: [
      { id: 'ex-press', name: 'Press de banca', normalizedName: 'press de banca', measure: 'weight_reps', origin: 'catalog', sourceId: 'Barbell_Bench_Press', createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z' },
      { id: 'ex-plancha', name: 'Plancha', normalizedName: 'plancha', measure: 'duration', origin: 'custom', createdAt: '2026-10-02T10:00:00.000Z', updatedAt: '2026-10-02T10:00:00.000Z' },
    ],
    sessions: [
      { id: 's1', type: 'strength', localDate: '2026-10-18', startedAt: '2026-10-18T21:30:00.000Z', endedAt: '2026-10-18T22:30:00.000Z', status: 'finished' },
      { id: 's2', type: 'strength', localDate: '2026-10-20', startedAt: '2026-10-20T17:00:00.000Z', status: 'in_progress' },
    ],
    sessionExercises: [
      { id: 'se1', sessionId: 's1', exerciseId: 'ex-press', position: 1 },
      { id: 'se2', sessionId: 's1', exerciseId: 'ex-plancha', position: 2 },
    ],
    sets: [
      { id: 'st1', sessionExerciseId: 'se1', position: 1, weightKg: 82.5, reps: 8, done: true, doneAt: '2026-10-18T21:40:00.000Z' },
      { id: 'st2', sessionExerciseId: 'se2', position: 1, durationSeconds: 90, done: false },
    ],
  }
}

function fileText(mutate?: (data: BackupData) => void, header: Record<string, unknown> = {}): string {
  const file: BackupFile = buildBackup(validData(), new Date('2026-10-21T08:00:00.000Z'))
  mutate?.(file.data)
  return JSON.stringify({ ...file, ...header })
}

function expectRejected(text: string, ...fragments: (string | RegExp)[]) {
  const result = parseBackup(text)
  expect(result.ok).toBe(false)
  if (result.ok) return
  for (const fragment of fragments) expect(result.error).toMatch(fragment)
}

describe('parseBackup', () => {
  it('acepta una copia válida y resume fecha, sesiones y ejercicios propios', () => {
    const result = parseBackup(fileText())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.backup.data).toEqual(validData())
    expect(result.summary).toEqual({ exportedAt: '2026-10-21T08:00:00.000Z', sessionCount: 2, customExerciseCount: 1 })
  })

  it('acepta una copia con las tablas vacías', () => {
    const result = parseBackup(fileText((d) => {
      d.exercises = []
      d.sessions = []
      d.sessionExercises = []
      d.sets = []
    }))
    expect(result.ok).toBe(true)
  })
})

describe('C-16 no es una copia de kioFit', () => {
  it.each([
    ['un archivo que no es JSON', 'esto no es json {'],
    ['un archivo vacío', ''],
    ['un JSON que no es un objeto', '[1, 2, 3]'],
    ['un JSON sin app', JSON.stringify({ formatVersion: 1, exportedAt: 'x', data: {} })],
    ['un JSON de otra app', JSON.stringify({ app: 'hevy', formatVersion: 1, data: {} })],
    ['un JSON sin formatVersion', JSON.stringify({ app: 'kiofit', exportedAt: 'x', data: {} })],
    ['una formatVersion que no es un entero positivo', JSON.stringify({ app: 'kiofit', formatVersion: '1', data: {} })],
  ])('C-16 rechaza %s con el mensaje exacto', (_name, text) => {
    expect(parseBackup(text)).toEqual({ ok: false, reason: 'not_backup', error: NOT_A_BACKUP })
  })
})

describe('C-17 copia de una versión más nueva', () => {
  it('C-17 rechaza una formatVersion mayor y pide actualizar la app', () => {
    const result = parseBackup(fileText(undefined, { formatVersion: 2 }))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('newer_version')
    expect(result.error).toMatch(/versión más nueva/)
    expect(result.error).toMatch(/Actualiza/)
  })
})

describe('C-18 copia de una versión anterior', () => {
  const migrations: BackupMigrations = {
    1: file => ({ ...file, formatVersion: 2, data: { ...file.data, weights: [] } }),
  }

  it('C-18 migra la 1 a la 2 en memoria: la tabla nueva queda vacía y el resto se conserva', () => {
    const result = parseBackup(fileText(), { currentVersion: 2, migrations, extraTables: ['weights'] })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.backup.formatVersion).toBe(2)
    expect(result.backup.data).toEqual({ ...validData(), weights: [] })
    expect(result.summary.sessionCount).toBe(2)
  })

  it('C-18 migrateBackup encadena las migraciones hasta la versión pedida', () => {
    const chain: BackupMigrations = {
      ...migrations,
      2: file => ({ ...file, formatVersion: 3, data: { ...file.data, foods: [] } }),
    }
    const file = buildBackup(validData(), new Date('2026-10-21T08:00:00.000Z'))
    const migrated = migrateBackup(file, chain, 3)

    expect(migrated.formatVersion).toBe(3)
    expect(Object.keys(migrated.data)).toEqual(expect.arrayContaining(['weights', 'foods']))
    expect(file.formatVersion).toBe(1)
  })

  it('C-18 rechaza con un error claro si falta el paso de migración', () => {
    const result = parseBackup(fileText(), { currentVersion: 2, migrations: {}, extraTables: ['weights'] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/migrar/)
  })
})

describe('C-19 datos incoherentes', () => {
  it('C-19 rechaza un campo obligatorio que falta, nombrando tabla y campo', () => {
    expectRejected(fileText((d) => {
      delete (d.sessions[0] as Partial<typeof d.sessions[0]>).localDate
    }), /sessions/, /localDate/)
    expectRejected(fileText((d) => {
      delete (d.sets[0] as Partial<typeof d.sets[0]>).done
    }), /sets/, /done/)
  })

  it('C-19 rechaza una tabla que falta o no es una lista', () => {
    expectRejected(fileText((d) => {
      delete (d as Partial<BackupData>).sets
    }), /sets/, /falta/)
    expectRejected(fileText((d) => {
      Object.assign(d, { sets: {} })
    }), /sets/, /lista/)
  })

  it('C-19 rechaza un peso negativo, mayor que 999,99 o con más de 2 decimales', () => {
    for (const weightKg of [-1, 1000, 82.555]) {
      expectRejected(fileText((d) => {
        d.sets[0]!.weightKg = weightKg
      }), /sets/, /weightKg/)
    }
  })

  it('C-19 admite 0 y 999,99 kg', () => {
    for (const weightKg of [0, 999.99, 82.5]) {
      expect(parseBackup(fileText((d) => {
        d.sets[0]!.weightKg = weightKg
      })).ok).toBe(true)
    }
  })

  it('C-19 valida las repeticiones: entero de 1 a 999', () => {
    for (const reps of [0, 1000, 8.5, -3]) {
      expectRejected(fileText((d) => {
        d.sets[0]!.reps = reps
      }), /sets/, /reps/)
    }
    for (const reps of [1, 999]) expect(parseBackup(fileText((d) => {
      d.sets[0]!.reps = reps
    })).ok).toBe(true)
  })

  it('C-19 valida los segundos: entero de 1 a 3599', () => {
    for (const durationSeconds of [0, 3600, 1.5]) {
      expectRejected(fileText((d) => {
        d.sets[1]!.durationSeconds = durationSeconds
      }), /sets/, /durationSeconds/)
    }
    for (const durationSeconds of [1, 3599]) expect(parseBackup(fileText((d) => {
      d.sets[1]!.durationSeconds = durationSeconds
    })).ok).toBe(true)
  })

  it('C-19 rechaza una fecha que no es YYYY-MM-DD o no existe', () => {
    for (const localDate of ['18/10/2026', '2026-10-8', '2026-02-30', '2026-13-01', '2026-10-18T10:00:00Z']) {
      expectRejected(fileText((d) => {
        d.sessions[0]!.localDate = localDate
      }), /sessions/, /localDate/)
    }
  })

  it('C-19 rechaza valores fuera de los enumerados', () => {
    expectRejected(fileText((d) => {
      Object.assign(d.exercises[0]!, { measure: 'distance' })
    }), /exercises/, /measure/)
    expectRejected(fileText((d) => {
      Object.assign(d.exercises[0]!, { origin: 'other' })
    }), /exercises/, /origin/)
    expectRejected(fileText((d) => {
      Object.assign(d.sessions[0]!, { status: 'paused' })
    }), /sessions/, /status/)
    expectRejected(fileText((d) => {
      Object.assign(d.sessions[0]!, { type: 'muay_thai' })
    }), /sessions/, /type/)
  })

  it('C-19 rechaza tipos equivocados y valores nulos', () => {
    expectRejected(fileText((d) => {
      Object.assign(d.sets[0]!, { done: 'sí' })
    }), /sets/, /done/)
    expectRejected(fileText((d) => {
      Object.assign(d.sets[0]!, { weightKg: null })
    }), /sets/, /weightKg/)
    expectRejected(fileText((d) => {
      Object.assign(d.sessions[0]!, { startedAt: 'ayer' })
    }), /sessions/, /startedAt/)
    expectRejected(fileText((d) => {
      Object.assign(d.sessions, { 0: 'no soy un registro' })
    }), /sessions/)
  })

  it.each([
    ['exercises', (d: BackupData) => {
      d.exercises[1]!.id = d.exercises[0]!.id
    }],
    ['sessions', (d: BackupData) => {
      d.sessions[1]!.id = d.sessions[0]!.id
    }],
    ['sessionExercises', (d: BackupData) => {
      d.sessionExercises[1]!.id = d.sessionExercises[0]!.id
    }],
    ['sets', (d: BackupData) => {
      d.sets[1]!.id = d.sets[0]!.id
    }],
  ])('C-19 rechaza un id repetido en %s', (table, mutate) => {
    expectRejected(fileText(mutate), new RegExp(table), /repetido/)
  })

  it('C-19 rechaza un ejercicio de la sesión que apunta a una sesión o un ejercicio que no existen', () => {
    expectRejected(fileText((d) => {
      d.sessionExercises[0]!.sessionId = 'no-existe'
    }), /sessionExercises/, /sessionId/)
    expectRejected(fileText((d) => {
      d.sessionExercises[0]!.exerciseId = 'no-existe'
    }), /sessionExercises/, /exerciseId/)
  })

  it('C-19 rechaza una serie que apunta a un ejercicio de la sesión que no existe', () => {
    expectRejected(fileText((d) => {
      d.sets[0]!.sessionExerciseId = 'no-existe'
    }), /sets/, /sessionExerciseId/)
  })

  it('C-19 rechaza dos sesiones en curso', () => {
    expectRejected(fileText((d) => {
      d.sessions[0] = { id: 's1', type: 'strength', localDate: '2026-10-18', startedAt: '2026-10-18T21:30:00.000Z', status: 'in_progress' }
    }), /sessions/, /en curso/)
  })

  it('C-19 un rechazo no modifica ni devuelve datos', () => {
    const result = parseBackup(fileText((d) => {
      d.sets[0]!.weightKg = -1
    }))
    expect(Object.keys(result).sort()).toEqual(['error', 'ok', 'reason'])
    if (!result.ok) expect(result.reason).toBe('invalid')
  })
})

describe('C-20 campos desconocidos', () => {
  it('C-20 rechaza una tabla desconocida en la versión actual', () => {
    expectRejected(fileText((d) => {
      Object.assign(d, { weights: [] })
    }), /weights/, /desconocid/)
  })

  it('C-20 rechaza un campo desconocido en un registro', () => {
    expectRejected(fileText((d) => {
      Object.assign(d.sets[0]!, { rpe: 9 })
    }), /sets/, /rpe/, /desconocid/)
    expectRejected(fileText((d) => {
      Object.assign(d.exercises[0]!, { muscle: 'pecho' })
    }), /exercises/, /muscle/)
  })

  it('C-20 rechaza una clave desconocida en la cabecera del archivo', () => {
    expectRejected(fileText(undefined, { extra: true }), /extra/, /desconocid/)
  })
})

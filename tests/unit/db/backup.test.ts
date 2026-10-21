import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createBackupRepository } from '../../../app/db/backup-repository'
import { createDatabase, type KioFitDb } from '../../../app/db/database'
import { createExerciseRepository, createSessionRepository } from '../../../app/db/dexie-repositories'
import seed from '../../../app/db/seed/exercises.json'
import { buildBackup } from '../../../app/features/backup/domain/format'
import { parseBackup } from '../../../app/features/backup/domain/validate'
import type { BackupData } from '../../../app/types/backup'
import type { Exercise, SeedExercise, Session, SessionExercise, WorkoutSet } from '../../../app/types/workouts'
import { normalizeText } from '../../../app/utils/normalize'

const catalog = seed as SeedExercise[]
const originalTz = process.env.TZ
let db: KioFitDb

beforeEach(() => {
  db = createDatabase(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  process.env.TZ = originalTz
  await db.delete()
})

function exercise(over: Partial<Exercise> = {}): Exercise {
  const name = over.name ?? 'Remo propio'
  return {
    id: crypto.randomUUID(), name, normalizedName: normalizeText(name), measure: 'weight_reps',
    origin: 'custom', createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z', ...over,
  }
}

function session(over: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(), type: 'strength', localDate: '2026-10-10',
    startedAt: '2026-10-10T17:00:00.000Z', endedAt: '2026-10-10T18:00:00.000Z', status: 'finished', ...over,
  }
}

/** Datos variados: catálogo y propios, dos sesiones terminadas, una en curso, series con y sin valores. */
async function fillVaried(): Promise<void> {
  await createExerciseRepository(db).seedCatalog(catalog)
  const bench = (await db.exercises.where('sourceId').equals(catalog[0]!.sourceId).first())!
  const custom = exercise()
  await db.exercises.add(custom)
  const done1 = session({ localDate: '2026-10-10' })
  const done2 = session({ localDate: '2026-10-12', startedAt: '2026-10-12T17:00:00.000Z', endedAt: '2026-10-12T18:00:00.000Z' })
  const live = session({ localDate: '2026-10-18', startedAt: '2026-10-18T17:00:00.000Z', endedAt: undefined, status: 'in_progress' })
  delete live.endedAt
  await db.sessions.bulkAdd([done1, done2, live])
  const links: SessionExercise[] = [
    { id: crypto.randomUUID(), sessionId: done1.id, exerciseId: bench.id, position: 1 },
    { id: crypto.randomUUID(), sessionId: done2.id, exerciseId: custom.id, position: 1 },
    { id: crypto.randomUUID(), sessionId: live.id, exerciseId: bench.id, position: 1 },
  ]
  await db.sessionExercises.bulkAdd(links)
  const sets: WorkoutSet[] = [
    { id: crypto.randomUUID(), sessionExerciseId: links[0]!.id, position: 1, weightKg: 82.5, reps: 8, done: true, doneAt: '2026-10-10T17:10:00.000Z' },
    { id: crypto.randomUUID(), sessionExerciseId: links[1]!.id, position: 1, durationSeconds: 90, done: true, doneAt: '2026-10-12T17:10:00.000Z' },
    { id: crypto.randomUUID(), sessionExerciseId: links[2]!.id, position: 1, done: false },
  ]
  await db.sets.bulkAdd(sets)
}

/** Lo que hace la app: el `data` pasa por el archivo (JSON) y por el validador. */
function throughFile(data: BackupData): BackupData {
  const parsed = parseBackup(JSON.stringify(buildBackup(data)))
  if (!parsed.ok) throw new Error(parsed.error)
  return parsed.backup.data
}

async function readTables(): Promise<BackupData> {
  return { exercises: await db.exercises.toArray(), sessions: await db.sessions.toArray(), sessionExercises: await db.sessionExercises.toArray(), sets: await db.sets.toArray() }
}

function byId<T extends { id: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.id.localeCompare(b.id))
}

function sorted(data: BackupData): BackupData {
  return { exercises: byId(data.exercises), sessions: byId(data.sessions), sessionExercises: byId(data.sessionExercises), sets: byId(data.sets) }
}

describe('BackupRepository', () => {
  it('C-01 exporta todas las tablas de dominio con todos sus campos y sin meta', async () => {
    await fillVaried()
    await db.meta.put({ key: 'lastExportAt', value: '2026-10-01T00:00:00.000Z' })

    const data = await createBackupRepository(db, catalog).exportData()

    expect(Object.keys(data).sort()).toEqual(['exercises', 'sessionExercises', 'sessions', 'sets'])
    expect(sorted(data)).toEqual(sorted(await readTables()))
    expect(data.exercises).toHaveLength(catalog.length + 1)
    expect(data.sessions.map(s => s.status).sort()).toEqual(['finished', 'finished', 'in_progress'])
    expect(data.sets).toHaveLength(3)
    expect(data.sets.find(s => s.weightKg === 82.5)?.doneAt).toBe('2026-10-10T17:10:00.000Z')
    expect(await db.meta.count()).toBe(1)
  })

  it('C-03 exporta una base sin sesiones ni ejercicios propios: catálogo y el resto vacío', async () => {
    await createExerciseRepository(db).seedCatalog(catalog)

    const data = await createBackupRepository(db, catalog).exportData()

    expect(data.exercises).toHaveLength(catalog.length)
    expect(data.exercises.every(e => e.origin === 'catalog')).toBe(true)
    expect(data.sessions).toEqual([])
    expect(data.sessionExercises).toEqual([])
    expect(data.sets).toEqual([])
    expect(parseBackup(JSON.stringify(buildBackup(data))).ok).toBe(true)
  })

  it('C-04 exporta los valores tal como se guardaron, con otra zona horaria', async () => {
    process.env.TZ = 'America/Bogota'
    const start = new Date(2026, 9, 18, 23, 30)
    const s = session({ localDate: '2026-10-18', startedAt: start.toISOString(), status: 'finished', endedAt: new Date(2026, 9, 19, 0, 40).toISOString() })
    const ex = exercise()
    const link: SessionExercise = { id: crypto.randomUUID(), sessionId: s.id, exerciseId: ex.id, position: 1 }
    await db.exercises.add(ex)
    await db.sessions.add(s)
    await db.sessionExercises.add(link)
    await db.sets.bulkAdd([
      { id: crypto.randomUUID(), sessionExerciseId: link.id, position: 1, weightKg: 82.5, reps: 8, done: true },
      { id: crypto.randomUUID(), sessionExerciseId: link.id, position: 2, durationSeconds: 90, done: true },
    ])

    process.env.TZ = 'Asia/Tokyo'
    const data = throughFile(await createBackupRepository(db, catalog).exportData())

    expect(data.sessions[0]?.localDate).toBe('2026-10-18')
    expect(data.sessions[0]?.startedAt).toBe('2026-10-19T04:30:00.000Z')
    expect(data.sets.find(x => x.position === 1)?.weightKg).toBe(82.5)
    expect(data.sets.find(x => x.position === 2)?.durationSeconds).toBe(90)
    expect(JSON.stringify(data)).toContain('"localDate":"2026-10-18"')
  })

  it('C-08 ida y vuelta: exportar, vaciar, importar y exportar da el mismo data', async () => {
    await fillVaried()
    const repo = createBackupRepository(db, catalog)
    const first = throughFile(await repo.exportData())
    await Promise.all([db.exercises.clear(), db.sessions.clear(), db.sessionExercises.clear(), db.sets.clear()])

    await repo.restore(first)
    const second = throughFile(await repo.exportData())

    expect(sorted(second)).toEqual(sorted(first))
    expect(sorted(await readTables())).toEqual(sorted(first))
  })

  it('C-09 restaurar sustituye los datos actuales', async () => {
    await fillVaried()
    const repo = createBackupRepository(db, catalog)
    const backup = throughFile(await repo.exportData())
    const stray = session({ localDate: '2026-11-01' })
    await db.sessions.add(stray)
    await db.exercises.add(exercise({ name: 'Ejercicio que sobra' }))

    await repo.restore(backup)

    expect(await db.sessions.get(stray.id)).toBeUndefined()
    expect(sorted(await readTables())).toEqual(sorted(backup))
  })

  it('C-12 la sesión en curso de la copia queda en curso y es la única', async () => {
    await fillVaried()
    const repo = createBackupRepository(db, catalog)
    const backup = throughFile(await repo.exportData())
    const live = backup.sessions.find(s => s.status === 'in_progress')!
    await Promise.all([db.exercises.clear(), db.sessions.clear(), db.sessionExercises.clear(), db.sets.clear()])

    await repo.restore(backup)

    const inProgress = await db.sessions.where('status').equals('in_progress').toArray()
    expect(inProgress.map(s => s.id)).toEqual([live.id])
    const started = await createSessionRepository(db).startSession()
    expect(started.id).toBe(live.id)
    expect(await db.sessions.where('status').equals('in_progress').count()).toBe(1)
  })

  it('C-13 completa el catálogo con la semilla actual y conserva los ids de la copia', async () => {
    const olderSeed = catalog.slice(1)
    const missing = catalog[0]!
    await createExerciseRepository(db).seedCatalog(olderSeed)
    const fromBackup = await db.exercises.toArray()
    const backup = throughFile({ exercises: fromBackup, sessions: [], sessionExercises: [], sets: [] })
    await db.exercises.clear()
    await db.exercises.add(exercise({ name: 'Otro' }))

    await createBackupRepository(db, catalog).restore(backup)

    const after = await db.exercises.toArray()
    expect(after).toHaveLength(catalog.length)
    const added = after.find(e => e.sourceId === missing.sourceId)
    expect(added).toMatchObject({ name: missing.name, origin: 'catalog' })
    expect(fromBackup.every(e => after.some(a => a.id === e.id && a.sourceId === e.sourceId))).toBe(true)
    expect(after.filter(e => e.sourceId).length).toBe(new Set(after.map(e => e.sourceId).filter(Boolean)).size)
  })

  it('C-15 si falla a mitad de la restauración la base queda exactamente como estaba', async () => {
    await fillVaried()
    const repo = createBackupRepository(db, catalog)
    const before = await readTables()
    const metaBefore = await db.meta.toArray()
    const s = session()
    const link: SessionExercise = { id: crypto.randomUUID(), sessionId: s.id, exerciseId: before.exercises[0]!.id, position: 1 }
    const dup = crypto.randomUUID()
    const bad: BackupData = {
      exercises: before.exercises, sessions: [s], sessionExercises: [link],
      // `sets` con id duplicado: falla en el último `bulkAdd`, con las otras tablas ya escritas.
      sets: [
        { id: dup, sessionExerciseId: link.id, position: 1, done: false },
        { id: dup, sessionExerciseId: link.id, position: 2, done: false },
      ],
    }

    await expect(repo.restore(bad)).rejects.toBeDefined()

    expect(await readTables()).toEqual(before)
    expect(await db.meta.toArray()).toEqual(metaBefore)
  })

  it('tamaño: 250 sesiones y 6.000 series caben en menos de 2 MB de JSON', async () => {
    await createExerciseRepository(db).seedCatalog(catalog)
    const exercises = await db.exercises.toArray()
    const sessions: Session[] = []
    const links: SessionExercise[] = []
    const sets: WorkoutSet[] = []
    for (let i = 0; i < 250; i++) {
      const s = session({ localDate: `2026-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}` })
      sessions.push(s)
      for (let e = 0; e < 4; e++) {
        const link: SessionExercise = { id: crypto.randomUUID(), sessionId: s.id, exerciseId: exercises[(i + e) % exercises.length]!.id, position: e + 1 }
        links.push(link)
        for (let n = 0; n < 6; n++) {
          sets.push({ id: crypto.randomUUID(), sessionExerciseId: link.id, position: n + 1, weightKg: 82.5, reps: 8, done: true, doneAt: '2026-10-10T17:10:00.000Z' })
        }
      }
    }
    await db.sessions.bulkAdd(sessions)
    await db.sessionExercises.bulkAdd(links)
    await db.sets.bulkAdd(sets)

    const data = await createBackupRepository(db, catalog).exportData()
    const json = JSON.stringify(buildBackup(data))

    expect(data.sets).toHaveLength(6000)
    expect(new TextEncoder().encode(json).length).toBeLessThan(2 * 1024 * 1024)
  })
})

import { liveQuery, type EntityTable } from 'dexie'
import { validateExerciseName } from '../features/workouts/domain/exercise-rules'
import type { ActiveSession, ExerciseRepository, ExerciseRuleResult, MetaRepository, SessionRepository } from '../types/repositories'
import type { Exercise, SeedExercise, Session, SessionExercise, WorkoutSet } from '../types/workouts'
import { normalizeText } from '../utils/normalize'
import { toLocalDate } from '../utils/to-local-date'
import type { KioFitDb } from './database'

/** Añade los ejercicios de la semilla que aún no están (por `sourceId`). Debe llamarse dentro de una transacción `rw` sobre `exercises`. */
export async function addMissingCatalog(db: KioFitDb, entries: readonly SeedExercise[]): Promise<void> {
  // Los ejercicios propios no tienen `sourceId`, así que no entran en este índice.
  const present = new Set(await db.exercises.orderBy('sourceId').keys())
  const now = new Date().toISOString()
  const missing = entries.filter(entry => !present.has(entry.sourceId))
  await db.exercises.bulkAdd(missing.map(entry => ({
    id: crypto.randomUUID(),
    name: entry.name,
    normalizedName: normalizeText(entry.name),
    measure: entry.measure,
    origin: 'catalog' as const,
    sourceId: entry.sourceId,
    createdAt: now,
    updatedAt: now,
  })))
}

export function createSessionRepository(db: KioFitDb): SessionRepository {
  return {
    async save(session) {
      await db.sessions.put(session)
    },
    get: id => db.sessions.get(id),
    startSession(now = new Date()) {
      // Una sola transacción: dos arranques a la vez no pueden crear dos sesiones (F-11).
      return db.transaction('rw', db.sessions, async () => {
        const active = await db.sessions.where('status').equals('in_progress').first()
        if (active) return active
        const session: Session = {
          id: crypto.randomUUID(),
          type: 'strength',
          localDate: toLocalDate(now),
          startedAt: now.toISOString(),
          status: 'in_progress',
        }
        await db.sessions.add(session)
        return session
      })
    },
    watchActive() {
      return liveQuery(async () => {
        const session = await db.sessions.where('status').equals('in_progress').first()
        return session && loadSession(db, session)
      })
    },
    watchHistory() {
      return liveQuery(async () => {
        const finished = await db.sessions.where('status').equals('finished').toArray()
        finished.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        return Promise.all(finished.map(async (session) => {
          const rows = await db.sessionExercises.where('sessionId').equals(session.id).sortBy('position')
          const ids = rows.map(row => row.id)
          const sets = await db.sets.where('sessionExerciseId').anyOf(ids).toArray()
          const catalog = await db.exercises.bulkGet(rows.map(row => row.exerciseId))
          return {
            session,
            exerciseCount: rows.length,
            doneSetCount: sets.filter(set => set.done).length,
            exercises: rows.map((row, index) => ({
              name: catalog[index]?.name ?? '',
              setCount: sets.filter(set => set.sessionExerciseId === row.id).length,
            })),
          }
        }))
      })
    },
    watchSession(sessionId) {
      return liveQuery(async () => {
        const session = await db.sessions.get(sessionId)
        return session?.status === 'finished' ? loadSession(db, session) : undefined
      })
    },
    addExercise(sessionId, exerciseId) {
      return db.transaction('rw', [db.sessionExercises, db.sets], async () => {
        const position = await db.sessionExercises.where('sessionId').equals(sessionId).count()
        const row: SessionExercise = { id: crypto.randomUUID(), sessionId, exerciseId, position }
        const emptySet: WorkoutSet = { id: crypto.randomUUID(), sessionExerciseId: row.id, position: 0, done: false }
        await db.sessionExercises.add(row)
        await db.sets.add(emptySet)
        return row
      })
    },
    removeExercise(sessionExerciseId) {
      return db.transaction('rw', [db.sessionExercises, db.sets], async () => {
        const row = await db.sessionExercises.get(sessionExerciseId)
        if (!row) return
        await db.sets.where('sessionExerciseId').equals(sessionExerciseId).delete()
        await db.sessionExercises.delete(sessionExerciseId)
        const rest = await db.sessionExercises.where('sessionId').equals(row.sessionId).sortBy('position')
        await renumber(db.sessionExercises, rest)
      })
    },
    moveExercise(sessionExerciseId, direction) {
      return db.transaction('rw', db.sessionExercises, async () => {
        const row = await db.sessionExercises.get(sessionExerciseId)
        if (!row) return
        const rows = await db.sessionExercises.where('sessionId').equals(row.sessionId).sortBy('position')
        const from = rows.findIndex(item => item.id === sessionExerciseId)
        const to = from + direction
        if (to < 0 || to >= rows.length) return
        const [moved] = rows.splice(from, 1)
        rows.splice(to, 0, moved!)
        await renumber(db.sessionExercises, rows)
      })
    },
    addSet(sessionExerciseId) {
      return db.transaction('rw', db.sets, async () => {
        const position = await db.sets.where('sessionExerciseId').equals(sessionExerciseId).count()
        const set: WorkoutSet = { id: crypto.randomUUID(), sessionExerciseId, position, done: false }
        await db.sets.add(set)
        return set
      })
    },
    removeSet(setId) {
      return db.transaction('rw', db.sets, async () => {
        const set = await db.sets.get(setId)
        if (!set) return
        await db.sets.delete(setId)
        const rest = await db.sets.where('sessionExerciseId').equals(set.sessionExerciseId).sortBy('position')
        await renumber(db.sets, rest)
      })
    },
    async setValues(setId, values) {
      await db.transaction('rw', db.sets, async () => {
        const set = await db.sets.get(setId)
        if (!set) return
        const { weightKg, reps, durationSeconds, ...rest } = set
        const merged = { weightKg, reps, durationSeconds, ...values }
        // Sin `undefined` explícito: un valor borrado no deja la clave en IndexedDB.
        const next: WorkoutSet = { ...rest, ...Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== undefined)) }
        await db.sets.put(next)
      })
    },
    async setDone(setId, done, now = new Date()) {
      await db.transaction('rw', db.sets, async () => {
        const set = await db.sets.get(setId)
        if (!set) return
        const { doneAt: _previous, ...rest } = set
        await db.sets.put(done ? { ...rest, done, doneAt: now.toISOString() } : { ...rest, done })
      })
    },
    finishSession(sessionId, now = new Date()) {
      return db.transaction('rw', [db.sessions, db.sessionExercises, db.sets], async () => {
        const session = await db.sessions.get(sessionId)
        if (!session) return
        const rows = await db.sessionExercises.where('sessionId').equals(sessionId).sortBy('position')
        const kept: SessionExercise[] = []
        for (const row of rows) {
          const sets = await db.sets.where('sessionExerciseId').equals(row.id).sortBy('position')
          const done = sets.filter(set => set.done)
          await db.sets.bulkDelete(sets.filter(set => !set.done).map(set => set.id))
          if (done.length === 0) {
            await db.sessionExercises.delete(row.id)
            continue
          }
          await renumber(db.sets, done)
          kept.push(row)
        }
        await renumber(db.sessionExercises, kept)
        await db.sessions.put({ ...session, status: 'finished', endedAt: now.toISOString() })
      })
    },
    watchExerciseHistory(exerciseId) {
      return liveQuery(async () => {
        const rows = await db.sessionExercises.where('exerciseId').equals(exerciseId).toArray()
        const entries = await Promise.all(rows.map(async (row) => {
          const session = await db.sessions.get(row.sessionId)
          if (session?.status !== 'finished') return []
          const sets = await db.sets.where('sessionExerciseId').equals(row.id).sortBy('position')
          return [{ session, sets }]
        }))
        return entries.flat()
      })
    },
    discardSession(sessionId) {
      return db.transaction('rw', [db.sessions, db.sessionExercises, db.sets], async () => {
        const rowIds = await db.sessionExercises.where('sessionId').equals(sessionId).primaryKeys()
        await db.sets.where('sessionExerciseId').anyOf(rowIds).delete()
        await db.sessionExercises.bulkDelete(rowIds)
        await db.sessions.delete(sessionId)
      })
    },
  }
}

/** La sesión con sus ejercicios (por orden) y series; descarta los ejercicios cuya definición ya no existe. */
async function loadSession(db: KioFitDb, session: Session): Promise<ActiveSession> {
  const rows = await db.sessionExercises.where('sessionId').equals(session.id).sortBy('position')
  const exercises = await Promise.all(rows.map(async (row) => {
    const [exercise, sets] = await Promise.all([
      db.exercises.get(row.exerciseId),
      db.sets.where('sessionExerciseId').equals(row.id).sortBy('position'),
    ])
    return exercise ? [{ id: row.id, position: row.position, exercise, sets }] : []
  }))
  return { session, exercises: exercises.flat() }
}

/** Reescribe `position` como 0..n-1 en el orden recibido, solo donde cambia. */
async function renumber(table: EntityTable<{ id: string, position: number }, 'id'>, ordered: { id: string, position: number }[]) {
  await Promise.all(ordered.flatMap((item, position) => item.position === position ? [] : [table.update(item.id, { position })]))
}

export function createExerciseRepository(db: KioFitDb): ExerciseRepository {
  const sameName = (name: string) => db.exercises.where('normalizedName').equals(normalizeText(name)).toArray()

  /** Lee el ejercicio y comprueba que es propio: el catálogo es de solo lectura (F-09). */
  async function editable(id: string): Promise<ExerciseRuleResult<Exercise>> {
    const exercise = await db.exercises.get(id)
    if (!exercise) return { ok: false, reason: 'not_found' }
    if (exercise.origin !== 'custom') return { ok: false, reason: 'catalog_read_only' }
    return { ok: true, value: exercise }
  }

  async function update(exercise: Exercise, changes: Partial<Exercise>): Promise<ExerciseRuleResult<Exercise>> {
    const updated = { ...exercise, ...changes, updatedAt: new Date().toISOString() }
    await db.exercises.put(updated)
    return { ok: true, value: updated }
  }

  return {
    async save(exercise) {
      await db.exercises.put(exercise)
    },
    get: id => db.exercises.get(id),
    watchAll: () => liveQuery(() => db.exercises.orderBy('normalizedName').toArray()),
    async seedCatalog(entries) {
      await db.transaction('rw', db.exercises, () => addMissingCatalog(db, entries))
    },
    createCustom({ name, measure }) {
      return db.transaction('rw', db.exercises, async () => {
        const valid = validateExerciseName(name, await sameName(name))
        if (!valid.ok) return valid
        const now = new Date().toISOString()
        const exercise: Exercise = {
          id: crypto.randomUUID(),
          name: valid.name,
          normalizedName: valid.normalizedName,
          measure,
          origin: 'custom',
          createdAt: now,
          updatedAt: now,
        }
        await db.exercises.add(exercise)
        return { ok: true, value: exercise }
      })
    },
    rename(id, name) {
      return db.transaction('rw', db.exercises, async () => {
        const found = await editable(id)
        if (!found.ok) return found
        const valid = validateExerciseName(name, await sameName(name), id)
        if (!valid.ok) return valid
        return update(found.value, { name: valid.name, normalizedName: valid.normalizedName })
      })
    },
    changeMeasure(id, measure) {
      return db.transaction('rw', [db.exercises, db.sessionExercises, db.sets], async () => {
        const found = await editable(id)
        if (!found.ok) return found
        const sessionExerciseIds = await db.sessionExercises.where('exerciseId').equals(id).primaryKeys()
        if (await db.sets.where('sessionExerciseId').anyOf(sessionExerciseIds).count() > 0) {
          return { ok: false, reason: 'measure_locked' }
        }
        return update(found.value, { measure })
      })
    },
    remove(id) {
      return db.transaction('rw', [db.exercises, db.sessionExercises], async () => {
        const found = await editable(id)
        if (!found.ok) return found
        if (await db.sessionExercises.where('exerciseId').equals(id).count() > 0) {
          return { ok: false, reason: 'exercise_in_use' }
        }
        await db.exercises.delete(id)
        return { ok: true, value: undefined }
      })
    },
  }
}

export function createMetaRepository(db: KioFitDb): MetaRepository {
  return {
    async get(key) {
      return (await db.meta.get(key))?.value
    },
    async set(key, value) {
      await db.meta.put({ key, value })
    },
  }
}

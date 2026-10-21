import { liveQuery } from 'dexie'
import { validateExerciseName } from '../features/workouts/domain/exercise-rules'
import type { ExerciseRepository, ExerciseRuleResult, MetaRepository, SessionRepository } from '../types/repositories'
import type { Exercise, Session, SessionExercise, WorkoutSet } from '../types/workouts'
import { normalizeText } from '../utils/normalize'
import { toLocalDate } from '../utils/to-local-date'
import type { KioFitDb } from './database'

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
        if (!session) return undefined
        const rows = await db.sessionExercises.where('sessionId').equals(session.id).sortBy('position')
        const exercises = await Promise.all(rows.map(async (row) => {
          const [exercise, sets] = await Promise.all([
            db.exercises.get(row.exerciseId),
            db.sets.where('sessionExerciseId').equals(row.id).sortBy('position'),
          ])
          return exercise ? [{ id: row.id, position: row.position, exercise, sets }] : []
        }))
        return { session, exercises: exercises.flat() }
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
  }
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
      await db.transaction('rw', db.exercises, async () => {
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
      })
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

import { validateExerciseName } from '../features/workouts/domain/exercise-rules'
import type { ExerciseRepository, ExerciseRuleResult, MetaRepository, SessionRepository } from '../types/repositories'
import type { Exercise } from '../types/workouts'
import { normalizeText } from '../utils/normalize'
import type { KioFitDb } from './database'

export function createSessionRepository(db: KioFitDb): SessionRepository {
  return {
    async save(session) {
      await db.sessions.put(session)
    },
    get: id => db.sessions.get(id),
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

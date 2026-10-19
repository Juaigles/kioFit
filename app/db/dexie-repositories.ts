import type { ExerciseRepository, MetaRepository, SessionRepository } from '../types/repositories'
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

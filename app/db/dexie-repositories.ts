import type { ExerciseRepository, MetaRepository, SessionRepository } from '../types/repositories'
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

import { createDatabase } from './database'
import { createExerciseRepository, createMetaRepository, createSessionRepository } from './dexie-repositories'

// Instancia por defecto de la app. Los composables importan de aquí, nunca de `dexie`.
export const db = createDatabase()
export const exerciseRepository = createExerciseRepository(db)
export const sessionRepository = createSessionRepository(db)
export const metaRepository = createMetaRepository(db)

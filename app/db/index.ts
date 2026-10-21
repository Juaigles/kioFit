import type { SeedExercise } from '../types/workouts'
import { createBackupRepository } from './backup-repository'
import { createDatabase } from './database'
import { createExerciseRepository, createMetaRepository, createSessionRepository } from './dexie-repositories'
import seed from './seed/exercises.json'

// Instancia por defecto de la app. Los composables importan de aquí, nunca de `dexie`.
export const db = createDatabase()
export const exerciseRepository = createExerciseRepository(db)
export const sessionRepository = createSessionRepository(db)
export const metaRepository = createMetaRepository(db)
export const backupRepository = createBackupRepository(db, seed as SeedExercise[])

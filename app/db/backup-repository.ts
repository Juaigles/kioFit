import type { BackupRepository } from '../types/repositories'
import type { SeedExercise } from '../types/workouts'
import type { KioFitDb } from './database'
import { addMissingCatalog } from './dexie-repositories'

export function createBackupRepository(db: KioFitDb, seed: readonly SeedExercise[]): BackupRepository {
  return {
    exportData: () => db.transaction('r', [db.exercises, db.sessions, db.sessionExercises, db.sets], async () => ({
      exercises: await db.exercises.toArray(),
      sessions: await db.sessions.toArray(),
      sessionExercises: await db.sessionExercises.toArray(),
      sets: await db.sets.toArray(),
    })),
    restore: data => db.transaction('rw', [db.exercises, db.sessions, db.sessionExercises, db.sets], async () => {
      // Cualquier fallo aborta la transacción y Dexie deshace todo lo escrito (C-15).
      await Promise.all([db.exercises.clear(), db.sessions.clear(), db.sessionExercises.clear(), db.sets.clear()])
      await db.exercises.bulkAdd(data.exercises)
      await db.sessions.bulkAdd(data.sessions)
      await db.sessionExercises.bulkAdd(data.sessionExercises)
      await db.sets.bulkAdd(data.sets)
      // Una copia con una semilla anterior no tiene los ejercicios nuevos del catálogo (C-13).
      await addMissingCatalog(db, seed)
    }),
  }
}

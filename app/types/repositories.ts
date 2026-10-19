import type { Exercise, SeedExercise, Session } from './workouts'

export interface SessionRepository {
  save(session: Session): Promise<void>
  get(id: string): Promise<Session | undefined>
}

export interface ExerciseRepository {
  save(exercise: Exercise): Promise<void>
  get(id: string): Promise<Exercise | undefined>
  /** Añade los ejercicios de la semilla que aún no están (por `sourceId`); no modifica ninguno existente. */
  seedCatalog(entries: readonly SeedExercise[]): Promise<void>
}

export interface MetaRepository {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

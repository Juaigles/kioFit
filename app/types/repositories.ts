import type { Exercise, Session } from './workouts'

export interface SessionRepository {
  save(session: Session): Promise<void>
  get(id: string): Promise<Session | undefined>
}

export interface ExerciseRepository {
  save(exercise: Exercise): Promise<void>
  get(id: string): Promise<Exercise | undefined>
}

export interface MetaRepository {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

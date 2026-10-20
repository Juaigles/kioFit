import type { Exercise, Measure, SeedExercise, Session } from './workouts'

export interface SessionRepository {
  save(session: Session): Promise<void>
  get(id: string): Promise<Session | undefined>
}

/** Por qué se rechaza un cambio sobre un ejercicio (F-05 a F-09). */
export type ExerciseRuleViolation
  = | 'empty_name'
    | 'name_too_long'
    | 'duplicate_name'
    | 'catalog_read_only'
    | 'measure_locked'
    | 'exercise_in_use'
    | 'not_found'

export type ExerciseRuleResult<T>
  = | { ok: true, value: T }
    | { ok: false, reason: ExerciseRuleViolation }

export interface ExerciseRepository {
  save(exercise: Exercise): Promise<void>
  get(id: string): Promise<Exercise | undefined>
  /** Añade los ejercicios de la semilla que aún no están (por `sourceId`); no modifica ninguno existente. */
  seedCatalog(entries: readonly SeedExercise[]): Promise<void>
  /** Crea un ejercicio propio si el nombre es válido y no está repetido. */
  createCustom(input: { name: string, measure: Measure }): Promise<ExerciseRuleResult<Exercise>>
  /** Solo ejercicios propios. Las sesiones guardan el id, así que el nombre nuevo sale también en ellas. */
  rename(id: string, name: string): Promise<ExerciseRuleResult<Exercise>>
  /** Solo ejercicios propios sin ninguna serie registrada. */
  changeMeasure(id: string, measure: Measure): Promise<ExerciseRuleResult<Exercise>>
  /** Solo ejercicios propios que no aparecen en ninguna sesión. */
  remove(id: string): Promise<ExerciseRuleResult<void>>
}

export interface MetaRepository {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

import type { Exercise, Measure, SeedExercise, Session, SessionExercise, WorkoutSet } from './workouts'

/** Lectura reactiva: el repositorio vuelve a emitir cuando cambian los datos (Dexie `liveQuery`). */
export interface Watchable<T> {
  subscribe(observer: { next: (value: T) => void, error?: (error: unknown) => void }): { unsubscribe(): void }
}

/** Un ejercicio de la sesión con su definición y sus series. */
export interface SessionExerciseView {
  id: string
  position: number
  exercise: Exercise
  sets: WorkoutSet[]
}

export interface ActiveSession {
  session: Session
  exercises: SessionExerciseView[]
}

export interface SessionRepository {
  save(session: Session): Promise<void>
  get(id: string): Promise<Session | undefined>
  /** Empieza una sesión de fuerza hoy; si ya hay una en curso no crea otra y devuelve esa (F-11). */
  startSession(now?: Date): Promise<Session>
  /** La sesión en curso con sus ejercicios y series, o `undefined` si no hay (F-10). */
  watchActive(): Watchable<ActiveSession | undefined>
  /** Añade el ejercicio al final de la sesión con una serie vacía (F-04). */
  addExercise(sessionId: string, exerciseId: string): Promise<SessionExercise>
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
  /** Todo el catálogo y los ejercicios propios, por nombre. */
  watchAll(): Watchable<Exercise[]>
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

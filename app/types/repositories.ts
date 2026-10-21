import type { Exercise, Measure, SeedExercise, Session, SessionExercise, SetValues, WorkoutSet } from './workouts'

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

/** Una sesión terminada en la lista del historial, con sus totales (F-26). */
export interface SessionSummary {
  session: Session
  exerciseCount: number
  doneSetCount: number
}

/** Una sesión terminada que contiene un ejercicio, con las series que hizo en ella. */
export interface ExerciseHistoryEntry {
  session: Session
  sets: WorkoutSet[]
}

export interface SessionRepository {
  save(session: Session): Promise<void>
  get(id: string): Promise<Session | undefined>
  /** Empieza una sesión de fuerza hoy; si ya hay una en curso no crea otra y devuelve esa (F-11). */
  startSession(now?: Date): Promise<Session>
  /** La sesión en curso con sus ejercicios y series, o `undefined` si no hay (F-10). */
  watchActive(): Watchable<ActiveSession | undefined>
  /** Sesiones terminadas, de la más reciente a la más antigua, con su número de ejercicios y de series hechas (F-26). */
  watchHistory(): Watchable<SessionSummary[]>
  /** Una sesión terminada con sus ejercicios y series; `undefined` si no existe o sigue en curso (F-27). */
  watchSession(sessionId: string): Watchable<ActiveSession | undefined>
  /** Añade el ejercicio al final de la sesión con una serie vacía (F-04). */
  addExercise(sessionId: string, exerciseId: string): Promise<SessionExercise>
  /** Quita el ejercicio con sus series y renumera los que quedan (F-13). */
  removeExercise(sessionExerciseId: string): Promise<void>
  /** Intercambia el ejercicio con su vecino: -1 lo sube, 1 lo baja; en los extremos no hace nada (F-12). */
  moveExercise(sessionExerciseId: string, direction: -1 | 1): Promise<void>
  /** Añade una serie vacía al final del ejercicio (F-14). */
  addSet(sessionExerciseId: string): Promise<WorkoutSet>
  /** Quita la serie y renumera las que quedan (F-14). */
  removeSet(setId: string): Promise<void>
  /** Guarda los valores de la serie (kg, reps, segundos); `undefined` borra el valor (F-15, F-30). */
  setValues(setId: string, values: SetValues): Promise<void>
  /** Marca o desmarca una serie como hecha; guarda la hora al marcar y la borra al desmarcar. */
  setDone(setId: string, done: boolean, now?: Date): Promise<void>
  /** Termina la sesión: guarda `endedAt`, borra las series sin hacer y los ejercicios que se quedan sin series. No recalcula el día (F-23). */
  finishSession(sessionId: string, now?: Date): Promise<void>
  /** Sesiones terminadas que contienen el ejercicio, sin orden garantizado; la referencia de F-18 sale de aquí. Una sesión borrada deja de salir. */
  watchExerciseHistory(exerciseId: string): Watchable<ExerciseHistoryEntry[]>
  /** Borra la sesión con sus ejercicios y series, sin dejar rastro (F-25). */
  discardSession(sessionId: string): Promise<void>
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

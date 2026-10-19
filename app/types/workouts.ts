// Entidades del módulo de fuerza (esquema Dexie v1, specs/fuerza/plan.md).
// Peso siempre en kg; duración en segundos; instantes en ISO 8601; el día es una fecha local `YYYY-MM-DD`.

export type Measure = 'weight_reps' | 'reps' | 'duration'

export type ExerciseOrigin = 'catalog' | 'custom'

export interface Exercise {
  id: string
  name: string
  normalizedName: string
  measure: Measure
  origin: ExerciseOrigin
  /** Id en free-exercise-db; solo lo tienen los ejercicios del catálogo. */
  sourceId?: string
  createdAt: string
  updatedAt: string
}

/** Entrada de `app/db/seed/exercises.json` (ADR-0012). Músculo y material no se guardan en el esquema v1. */
export interface SeedExercise {
  sourceId: string
  name: string
  measure: Measure
  muscle: string
  equipment: string
}

export type SessionType = 'strength'

export type SessionStatus = 'in_progress' | 'finished'

export interface Session {
  id: string
  type: SessionType
  localDate: string
  startedAt: string
  endedAt?: string
  status: SessionStatus
}

export interface SessionExercise {
  id: string
  sessionId: string
  exerciseId: string
  position: number
}

export interface WorkoutSet {
  id: string
  sessionExerciseId: string
  position: number
  weightKg?: number
  reps?: number
  durationSeconds?: number
  done: boolean
  doneAt?: string
}

export interface MetaEntry {
  key: string
  value: unknown
}

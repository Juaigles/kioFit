import type { Exercise, Session, SessionExercise, WorkoutSet } from './workouts'

/** Tablas de dominio que viajan en una copia de seguridad (sin `meta`). */
export interface BackupData {
  exercises: Exercise[]
  sessions: Session[]
  sessionExercises: SessionExercise[]
  sets: WorkoutSet[]
}

import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, MetaEntry, Session, SessionExercise, WorkoutSet } from '../types/workouts'

export class KioFitDb extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  sessions!: EntityTable<Session, 'id'>
  sessionExercises!: EntityTable<SessionExercise, 'id'>
  sets!: EntityTable<WorkoutSet, 'id'>
  meta!: EntityTable<MetaEntry, 'key'>

  constructor(name: string) {
    super(name)
    // Versión 1. Cualquier cambio posterior exige versión nueva, migración y test (ADR-0009).
    this.version(1).stores({
      exercises: 'id, normalizedName, &sourceId',
      sessions: 'id, localDate, status',
      sessionExercises: 'id, sessionId, exerciseId',
      sets: 'id, sessionExerciseId',
      meta: 'key',
    })
  }
}

/** Una base por nombre, para que cada test use la suya. */
export function createDatabase(name = 'kiofit'): KioFitDb {
  return new KioFitDb(name)
}

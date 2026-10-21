import { onScopeDispose, ref } from 'vue'
import { sessionRepository } from '../../../db'
import type { ExerciseHistoryEntry, SessionRepository } from '../../../types/repositories'

/** Sesiones terminadas que contienen el ejercicio (reactivo, desde Dexie), para calcular la referencia de F-18. */
export function useExerciseHistory(exerciseId: string, sessions: Pick<SessionRepository, 'watchExerciseHistory'> = sessionRepository) {
  const history = ref<ExerciseHistoryEntry[]>([])
  const subscription = sessions.watchExerciseHistory(exerciseId).subscribe({
    next: (value) => { history.value = value },
    error: (error) => { console.error('No se pudo leer el historial del ejercicio', error) },
  })
  onScopeDispose(() => subscription.unsubscribe())
  return history
}

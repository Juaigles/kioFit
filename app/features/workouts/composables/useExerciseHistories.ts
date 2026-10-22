import { onScopeDispose, ref, watch } from 'vue'
import { sessionRepository } from '../../../db'
import type { ExerciseHistoryEntry, SessionRepository } from '../../../types/repositories'

/**
 * Historial de varios ejercicios a la vez (reactivo, desde Dexie), por id de ejercicio.
 * Lo usan las vistas para pasar la referencia de F-18 a cada tarjeta por props.
 */
export function useExerciseHistories(
  exerciseIds: () => string[],
  sessions: Pick<SessionRepository, 'watchExerciseHistory'> = sessionRepository,
) {
  const histories = ref<Record<string, ExerciseHistoryEntry[]>>({})
  const subscriptions = new Map<string, { unsubscribe(): void }>()

  function unsubscribe(id: string) {
    subscriptions.get(id)?.unsubscribe()
    subscriptions.delete(id)
    const { [id]: _removed, ...rest } = histories.value
    histories.value = rest
  }

  watch(exerciseIds, (ids) => {
    for (const id of [...subscriptions.keys()]) {
      if (!ids.includes(id)) unsubscribe(id)
    }
    for (const id of ids) {
      if (subscriptions.has(id)) continue
      subscriptions.set(id, sessions.watchExerciseHistory(id).subscribe({
        next: (value) => { histories.value[id] = value },
        error: (error) => { console.error('No se pudo leer el historial del ejercicio', error) },
      }))
    }
  }, { immediate: true })

  onScopeDispose(() => {
    for (const id of [...subscriptions.keys()]) unsubscribe(id)
  })
  return histories
}

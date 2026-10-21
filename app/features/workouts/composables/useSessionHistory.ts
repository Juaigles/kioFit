import { onScopeDispose, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { sessionRepository } from '../../../db'
import type { ActiveSession, SessionRepository, SessionSummary } from '../../../types/repositories'
import type { SetValues } from '../../../types/workouts'

/** Sesiones terminadas, de la más reciente a la más antigua (reactivo, desde Dexie); `undefined` mientras carga (F-26). */
export function useSessionHistory(sessions: Pick<SessionRepository, 'watchHistory'> = sessionRepository) {
  const list = ref<SessionSummary[] | undefined>(undefined)
  const subscription = sessions.watchHistory().subscribe({
    next: (value) => { list.value = value },
    error: (error) => { console.error('No se pudo leer el historial', error) },
  })
  onScopeDispose(() => subscription.unsubscribe())
  return list
}

/** Una sesión terminada y las acciones para corregirla (F-27). `undefined` mientras carga; `null` si no existe. */
export function useFinishedSession(sessionId: MaybeRefOrGetter<string>, sessions: SessionRepository = sessionRepository) {
  const detail = ref<ActiveSession | null | undefined>(undefined)
  let subscription: { unsubscribe(): void } | undefined
  watch(() => toValue(sessionId), (id) => {
    subscription?.unsubscribe()
    detail.value = undefined
    subscription = sessions.watchSession(id).subscribe({
      next: (value) => { detail.value = value ?? null },
      error: (error) => { console.error('No se pudo leer la sesión', error) },
    })
  }, { immediate: true })
  onScopeDispose(() => subscription?.unsubscribe())

  const actions = {
    /** Borra la sesión con sus ejercicios y series; deja de ser referencia (F-28). */
    deleteSession: () => sessions.discardSession(toValue(sessionId)),
    removeExercise: (id: string) => sessions.removeExercise(id),
    moveExercise: (id: string, direction: -1 | 1) => sessions.moveExercise(id, direction),
    removeSet: (id: string) => sessions.removeSet(id),
    setValues: (id: string, values: SetValues) => sessions.setValues(id, values),
    setDone: (id: string, done: boolean) => sessions.setDone(id, done),
    /** Marca la serie como hecha con los valores ya resueltos (F-19). */
    completeSet: async (id: string, values: SetValues) => {
      await sessions.setValues(id, values)
      await sessions.setDone(id, true)
    },
    /** Una serie de una sesión terminada nace hecha: allí todas lo están y el historial la cuenta (F-27). */
    addSet: async (sessionExerciseId: string) => {
      const set = await sessions.addSet(sessionExerciseId)
      await sessions.setDone(set.id, true)
    },
  }

  return { detail, ...actions }
}

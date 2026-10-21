import { onScopeDispose, ref } from 'vue'
import { metaRepository, sessionRepository } from '../../../db'
import { usePersistentStorage } from '../../../composables/usePersistentStorage'
import type { ActiveSession, MetaRepository, SessionRepository } from '../../../types/repositories'
import type { Session, SetValues } from '../../../types/workouts'

interface ActiveSessionDeps {
  sessions: SessionRepository
  meta: MetaRepository
  storage: Pick<StorageManager, 'persist'> | undefined
}

/** `navigator` no existe en SSR ni en algunos entornos de test; sin él la app sigue funcionando (F-31). */
function defaultDeps(): ActiveSessionDeps {
  return {
    sessions: sessionRepository,
    meta: metaRepository,
    storage: typeof navigator === 'undefined' ? undefined : navigator.storage,
  }
}

/** La sesión en curso (reactiva, desde Dexie) y la acción de empezar una. */
export function useActiveSession(deps: ActiveSessionDeps = defaultDeps()) {
  const { requestPersistentStorage } = usePersistentStorage({ storage: deps.storage, meta: deps.meta })

  /** Empieza una sesión o devuelve la que ya está en curso (F-10, F-11) y pide almacenamiento persistente (F-31). */
  async function start(): Promise<Session> {
    const session = await deps.sessions.startSession()
    await requestPersistentStorage()
    return session
  }

  /** Añade un ejercicio al final de la sesión en curso (F-04). */
  async function addExercise(exerciseId: string): Promise<void> {
    if (active.value) await deps.sessions.addExercise(active.value.session.id, exerciseId)
  }

  /** Acciones sobre los ejercicios y series de la sesión en curso (F-12, F-13, F-14). */
  const actions = {
    removeExercise: (id: string) => deps.sessions.removeExercise(id),
    moveExercise: (id: string, direction: -1 | 1) => deps.sessions.moveExercise(id, direction),
    addSet: async (id: string) => { await deps.sessions.addSet(id) },
    removeSet: (id: string) => deps.sessions.removeSet(id),
    setDone: (id: string, done: boolean) => deps.sessions.setDone(id, done),
    /** Marca la serie como hecha con los valores ya resueltos (F-19). */
    completeSet: async (id: string, values: SetValues) => {
      await deps.sessions.setValues(id, values)
      await deps.sessions.setDone(id, true)
    },
    setValues: (id: string, values: SetValues) => deps.sessions.setValues(id, values),
  }

  /** Termina la sesión en curso (F-23) o la descarta (F-25). */
  async function finish(): Promise<void> {
    if (active.value) await deps.sessions.finishSession(active.value.session.id)
  }
  async function discard(): Promise<void> {
    if (active.value) await deps.sessions.discardSession(active.value.session.id)
  }

  /** `undefined` mientras carga; `null` si no hay sesión en curso. */
  const active = ref<ActiveSession | null | undefined>(undefined)
  const subscription = deps.sessions.watchActive().subscribe({
    next: (value) => { active.value = value ?? null },
    error: (error) => { console.error('No se pudo leer la sesión en curso', error) },
  })
  onScopeDispose(() => subscription.unsubscribe())

  return { active, start, addExercise, finish, discard, ...actions }
}

import { onScopeDispose, ref } from 'vue'
import { metaRepository, sessionRepository } from '../../../db'
import { usePersistentStorage } from '../../../composables/usePersistentStorage'
import type { ActiveSession, MetaRepository, SessionRepository } from '../../../types/repositories'
import type { Session } from '../../../types/workouts'

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

  /** `undefined` mientras carga; `null` si no hay sesión en curso. */
  const active = ref<ActiveSession | null | undefined>(undefined)
  const subscription = deps.sessions.watchActive().subscribe({
    next: (value) => { active.value = value ?? null },
    error: (error) => { console.error('No se pudo leer la sesión en curso', error) },
  })
  onScopeDispose(() => subscription.unsubscribe())

  return { active, start, addExercise }
}

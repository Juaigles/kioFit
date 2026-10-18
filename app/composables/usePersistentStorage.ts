import type { MetaRepository } from '../types/repositories'

const PERSIST_REQUESTED_KEY = 'persistRequested'

interface PersistentStorageOptions {
  storage?: Pick<StorageManager, 'persist'>
  meta: MetaRepository
}

/**
 * Pide `navigator.storage.persist()` una sola vez (F-31). Nunca lanza: si el
 * navegador no lo soporta, lo rechaza o falla, la app sigue funcionando.
 */
export function usePersistentStorage({ storage, meta }: PersistentStorageOptions) {
  async function requestPersistentStorage(): Promise<void> {
    try {
      if (await meta.get(PERSIST_REQUESTED_KEY)) return
      await meta.set(PERSIST_REQUESTED_KEY, true)
      await storage?.persist()
    }
    catch {
      // Sin almacenamiento persistente la app funciona igual.
    }
  }

  return { requestPersistentStorage }
}

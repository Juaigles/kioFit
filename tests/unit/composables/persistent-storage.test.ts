import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDatabase, type KioFitDb } from '../../../app/db/database'
import { createMetaRepository, createSessionRepository } from '../../../app/db/dexie-repositories'
import { usePersistentStorage } from '../../../app/composables/usePersistentStorage'
import type { Session } from '../../../app/types/workouts'

let db: KioFitDb

beforeEach(() => {
  db = createDatabase(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await db.delete()
})

function session(): Session {
  return {
    id: crypto.randomUUID(),
    type: 'strength',
    localDate: '2026-10-18',
    startedAt: '2026-10-18T18:00:00.000Z',
    status: 'in_progress',
  }
}

describe('usePersistentStorage', () => {
  it('F-31 pide almacenamiento persistente una sola vez al guardar la primera sesión', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    const sessions = createSessionRepository(db)
    const meta = createMetaRepository(db)

    await sessions.save(session())
    await usePersistentStorage({ storage: { persist }, meta }).requestPersistentStorage()
    await sessions.save(session())
    // Otra instancia sobre la misma base: el flag sobrevive.
    await usePersistentStorage({ storage: { persist }, meta }).requestPersistentStorage()

    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('F-31 sigue funcionando si persist() devuelve false', async () => {
    const persist = vi.fn().mockResolvedValue(false)
    const meta = createMetaRepository(db)
    const { requestPersistentStorage } = usePersistentStorage({ storage: { persist }, meta })

    await expect(requestPersistentStorage()).resolves.toBeUndefined()
    await requestPersistentStorage()

    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('F-31 sigue funcionando si navigator.storage no existe', async () => {
    const meta = createMetaRepository(db)
    const { requestPersistentStorage } = usePersistentStorage({ storage: undefined, meta })

    await expect(requestPersistentStorage()).resolves.toBeUndefined()
  })

  it('F-31 sigue funcionando si persist() rechaza', async () => {
    const persist = vi.fn().mockRejectedValue(new Error('no disponible'))
    const meta = createMetaRepository(db)
    const { requestPersistentStorage } = usePersistentStorage({ storage: { persist }, meta })

    await expect(requestPersistentStorage()).resolves.toBeUndefined()
  })
})

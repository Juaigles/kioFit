import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDatabase, type KioFitDb } from '../../../app/db/database'
import { createExerciseRepository, createMetaRepository, createSessionRepository } from '../../../app/db/dexie-repositories'
import { useActiveSession } from '../../../app/features/workouts/composables/useActiveSession'

let db: KioFitDb

beforeEach(() => {
  db = createDatabase(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await db.delete()
})

describe('SessionRepository.startSession', () => {
  it('F-10 crea una sesión en curso de tipo strength con el día local y la hora de inicio', async () => {
    const sessions = createSessionRepository(db)
    const now = new Date(2026, 9, 18, 23, 30)

    const session = await sessions.startSession(now)

    expect(session).toMatchObject({
      type: 'strength',
      status: 'in_progress',
      localDate: '2026-10-18',
      startedAt: now.toISOString(),
    })
    expect(session.endedAt).toBeUndefined()
    expect(await sessions.get(session.id)).toEqual(session)
  })

  it('F-11 no crea otra sesión y devuelve la que ya está en curso', async () => {
    const sessions = createSessionRepository(db)
    const first = await sessions.startSession()

    const second = await sessions.startSession()

    expect(second).toEqual(first)
    expect(await db.sessions.count()).toBe(1)
  })

  it('F-11 no cuenta como en curso una sesión terminada', async () => {
    const sessions = createSessionRepository(db)
    const finished = await sessions.startSession()
    await db.sessions.update(finished.id, { status: 'finished', endedAt: new Date().toISOString() })

    const next = await sessions.startSession()

    expect(next.id).not.toBe(finished.id)
    expect(await db.sessions.count()).toBe(2)
  })

  it('F-04 añade un ejercicio a la sesión con una serie vacía', async () => {
    const sessions = createSessionRepository(db)
    const exercises = createExerciseRepository(db)
    const session = await sessions.startSession()
    const created = await exercises.createCustom({ name: 'Remo en anillas', measure: 'reps' })
    if (!created.ok) throw new Error('el ejercicio debería crearse')

    const added = await sessions.addExercise(session.id, created.value.id)

    expect(added).toMatchObject({ sessionId: session.id, exerciseId: created.value.id, position: 0 })
    const sets = await db.sets.where('sessionExerciseId').equals(added.id).toArray()
    expect(sets).toHaveLength(1)
    expect(sets[0]).toMatchObject({ position: 0, done: false })
  })
})

describe('useActiveSession', () => {
  it('F-31 pide almacenamiento persistente una sola vez, justo tras guardar la sesión', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    const sessions = createSessionRepository(db)
    const { start } = useActiveSession({ sessions, storage: { persist }, meta: createMetaRepository(db) })

    await start()
    await start()

    expect(persist).toHaveBeenCalledTimes(1)
    expect(await db.sessions.count()).toBe(1)
  })

  it('F-31 sigue funcionando si el navegador no ofrece almacenamiento persistente', async () => {
    const sessions = createSessionRepository(db)
    const { start } = useActiveSession({ sessions, storage: undefined, meta: createMetaRepository(db) })

    const session = await start()

    expect(session.status).toBe('in_progress')
  })
})

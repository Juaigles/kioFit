import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase, type KioFitDb } from '../../../app/db/database'
import { createExerciseRepository, createSessionRepository } from '../../../app/db/dexie-repositories'

let db: KioFitDb

beforeEach(() => {
  db = createDatabase(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await db.delete()
})

async function setup() {
  const sessions = createSessionRepository(db)
  const exercises = createExerciseRepository(db)
  const session = await sessions.startSession(new Date(2026, 5, 10, 23, 30))
  const rows = []
  for (const name of ['Uno', 'Dos', 'Tres']) {
    const created = await exercises.createCustom({ name, measure: 'reps' })
    if (!created.ok) throw new Error('el ejercicio debería crearse')
    rows.push(await sessions.addExercise(session.id, created.value.id))
  }
  return { sessions, session, rows }
}

describe('SessionRepository: terminar y descartar', () => {
  it('F-23 guarda la hora de fin, borra las series sin hacer y los ejercicios que se quedan sin series', async () => {
    const { sessions, session, rows } = await setup()
    const [uno, dos, tres] = rows as [typeof rows[0], typeof rows[0], typeof rows[0]]
    // Uno: serie 1 hecha, serie 2 sin hacer. Dos: solo sin hacer. Tres: serie hecha.
    const extra = await sessions.addSet(uno.id)
    const [first] = await db.sets.where('sessionExerciseId').equals(uno.id).sortBy('position')
    await sessions.setDone(first!.id, true)
    const [threeSet] = await db.sets.where('sessionExerciseId').equals(tres.id).toArray()
    await sessions.setDone(threeSet!.id, true)
    // Se hace la segunda de Uno y la primera queda sin hacer para comprobar la renumeración.
    await sessions.setDone(first!.id, false)
    await sessions.setDone(extra.id, true)

    await sessions.finishSession(session.id, new Date(2026, 5, 11, 0, 45))

    const saved = await db.sessions.get(session.id)
    expect(saved?.status).toBe('finished')
    expect(saved?.endedAt).toBe(new Date(2026, 5, 11, 0, 45).toISOString())
    expect(saved?.localDate).toBe('2026-06-10')
    const kept = await db.sessionExercises.where('sessionId').equals(session.id).sortBy('position')
    expect(kept.map(r => r.id)).toEqual([uno.id, tres.id])
    expect(kept.map(r => r.position)).toEqual([0, 1])
    expect(await db.sessionExercises.get(dos.id)).toBeUndefined()
    const setsOfUno = await db.sets.where('sessionExerciseId').equals(uno.id).toArray()
    expect(setsOfUno.map(s => [s.id, s.position, s.done])).toEqual([[extra.id, 0, true]])
    expect(await db.sets.where('sessionExerciseId').equals(dos.id).count()).toBe(0)
  })

  it('F-23 la sesión terminada deja de ser la sesión en curso', async () => {
    const { sessions, session } = await setup()
    await sessions.finishSession(session.id)
    const next = await sessions.startSession()
    expect(next.id).not.toBe(session.id)
  })

  it('F-25 descartar borra la sesión, sus ejercicios y sus series sin dejar rastro', async () => {
    const { sessions, session } = await setup()

    await sessions.discardSession(session.id)

    expect(await db.sessions.count()).toBe(0)
    expect(await db.sessionExercises.count()).toBe(0)
    expect(await db.sets.count()).toBe(0)
  })
})

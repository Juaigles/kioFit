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

function firstValue<T>(source: { subscribe(observer: { next: (value: T) => void }): { unsubscribe(): void } }): Promise<T> {
  return new Promise((resolve) => {
    const subscription = source.subscribe({
      next: (value) => {
        queueMicrotask(() => subscription.unsubscribe())
        resolve(value)
      },
    })
  })
}

async function setup() {
  const exercises = createExerciseRepository(db)
  const sessions = createSessionRepository(db)
  const bench = await exercises.createCustom({ name: 'Banca', measure: 'weight_reps' })
  const row = await exercises.createCustom({ name: 'Remo', measure: 'weight_reps' })
  if (!bench.ok || !row.ok) throw new Error('los ejercicios deberían crearse')
  const benchId = bench.value.id
  const rowId = row.value.id

  /** Termina una sesión con `sets` series hechas del primer ejercicio y, si se pide, una del segundo. */
  async function finished(start: Date, end: Date, sets: number, withRow = false) {
    const session = await sessions.startSession(start)
    const item = await sessions.addExercise(session.id, benchId)
    for (let i = 0; i < sets; i++) {
      const [first] = await db.sets.where('sessionExerciseId').equals(item.id).sortBy('position')
      const target = i === 0 ? first! : await sessions.addSet(item.id)
      await sessions.setValues(target.id, { weightKg: 60 + i, reps: 5 })
      await sessions.setDone(target.id, true)
    }
    if (withRow) {
      const second = await sessions.addExercise(session.id, rowId)
      const [set] = await db.sets.where('sessionExerciseId').equals(second.id).toArray()
      await sessions.setValues(set!.id, { weightKg: 40, reps: 10 })
      await sessions.setDone(set!.id, true)
    }
    await sessions.finishSession(session.id, end)
    return session
  }

  return { sessions, finished }
}

describe('SessionRepository: historial y detalle', () => {
  it('F-26 lista las sesiones terminadas de la más reciente a la más antigua, con ejercicios y series hechas', async () => {
    const { sessions, finished } = await setup()
    const a = await finished(new Date(2026, 5, 1, 10), new Date(2026, 5, 1, 11), 1)
    const c = await finished(new Date(2026, 5, 3, 10), new Date(2026, 5, 3, 11), 3, true)
    const b = await finished(new Date(2026, 5, 2, 10), new Date(2026, 5, 2, 11), 2)

    const list = await firstValue(sessions.watchHistory())

    expect(list.map(item => item.session.id)).toEqual([c.id, b.id, a.id])
    expect(list.map(item => [item.exerciseCount, item.doneSetCount])).toEqual([[2, 4], [1, 2], [1, 1]])
  })

  it('F-26 la sesión en curso no sale en el historial', async () => {
    const { sessions, finished } = await setup()
    await finished(new Date(2026, 5, 1, 10), new Date(2026, 5, 1, 11), 1)
    await sessions.startSession(new Date(2026, 5, 2, 10))

    expect(await firstValue(sessions.watchHistory())).toHaveLength(1)
  })

  it('F-27 el detalle trae la sesión terminada con sus ejercicios y series, y refleja los cambios', async () => {
    const { sessions, finished } = await setup()
    const session = await finished(new Date(2026, 5, 1, 10), new Date(2026, 5, 1, 11), 2)

    const detail = await firstValue(sessions.watchSession(session.id))
    expect(detail?.session.status).toBe('finished')
    expect(detail?.exercises.map(item => item.exercise.name)).toEqual(['Banca'])
    const [first] = detail!.exercises[0]!.sets
    await sessions.setValues(first!.id, { weightKg: 100 })
    await sessions.removeSet(detail!.exercises[0]!.sets[1]!.id)

    const after = await firstValue(sessions.watchSession(session.id))
    expect(after?.exercises[0]?.sets.map(set => [set.weightKg, set.reps])).toEqual([[100, 5]])
    const list = await firstValue(sessions.watchHistory())
    expect(list[0]?.doneSetCount).toBe(1)
  })

  it('F-27 el detalle no devuelve una sesión en curso ni una que no existe', async () => {
    const { sessions } = await setup()
    const active = await sessions.startSession(new Date(2026, 5, 2, 10))

    expect(await firstValue(sessions.watchSession(active.id))).toBeUndefined()
    expect(await firstValue(sessions.watchSession('no-existe'))).toBeUndefined()
  })
})

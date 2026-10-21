import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase, type KioFitDb } from '../../../app/db/database'
import { createExerciseRepository, createSessionRepository } from '../../../app/db/dexie-repositories'
import type { ExerciseHistoryEntry } from '../../../app/types/repositories'

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

describe('SessionRepository: historial de un ejercicio', () => {
  async function finishedSession(exerciseId: string, at: Date, weightKg: number) {
    const sessions = createSessionRepository(db)
    const session = await sessions.startSession(at)
    const row = await sessions.addExercise(session.id, exerciseId)
    const [set] = await db.sets.where('sessionExerciseId').equals(row.id).toArray()
    await sessions.setValues(set!.id, { weightKg, reps: 5 })
    await sessions.setDone(set!.id, true)
    await sessions.finishSession(session.id, at)
    return session
  }

  it('F-18 devuelve solo las sesiones terminadas que contienen el ejercicio, con sus series', async () => {
    const exercises = createExerciseRepository(db)
    const sessions = createSessionRepository(db)
    const bench = await exercises.createCustom({ name: 'Banca', measure: 'weight_reps' })
    const other = await exercises.createCustom({ name: 'Otro', measure: 'weight_reps' })
    if (!bench.ok || !other.ok) throw new Error('los ejercicios deberían crearse')
    const old = await finishedSession(bench.value.id, new Date(2026, 5, 1, 10), 70)
    await finishedSession(other.value.id, new Date(2026, 5, 2, 10), 20)
    const current = await sessions.startSession(new Date(2026, 5, 3, 10))
    await sessions.addExercise(current.id, bench.value.id)

    const history: ExerciseHistoryEntry[] = await firstValue(sessions.watchExerciseHistory(bench.value.id))

    expect(history.map(item => item.session.id)).toEqual([old.id])
    expect(history[0]!.sets.map(set => [set.weightKg, set.reps])).toEqual([[70, 5]])
  })

  it('F-18 una sesión descartada deja de aparecer en el historial', async () => {
    const exercises = createExerciseRepository(db)
    const sessions = createSessionRepository(db)
    const bench = await exercises.createCustom({ name: 'Banca', measure: 'weight_reps' })
    if (!bench.ok) throw new Error('el ejercicio debería crearse')
    const session = await finishedSession(bench.value.id, new Date(2026, 5, 1, 10), 70)
    await sessions.discardSession(session.id)

    expect(await firstValue(sessions.watchExerciseHistory(bench.value.id))).toEqual([])
  })
})

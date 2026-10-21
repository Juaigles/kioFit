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

async function setup(names: string[]) {
  const sessions = createSessionRepository(db)
  const exercises = createExerciseRepository(db)
  const session = await sessions.startSession()
  const rows = []
  for (const name of names) {
    const created = await exercises.createCustom({ name, measure: 'reps' })
    if (!created.ok) throw new Error('el ejercicio debería crearse')
    rows.push(await sessions.addExercise(session.id, created.value.id))
  }
  return { sessions, rows }
}

function readActive(sessions: ReturnType<typeof createSessionRepository>) {
  return new Promise<import('../../../app/types/repositories').ActiveSession | undefined>((resolve, reject) => {
    const sub = sessions.watchActive().subscribe({
      next: (value) => {
        sub.unsubscribe()
        resolve(value)
      },
      error: reject,
    })
  })
}

describe('SessionRepository: ejercicios de la sesión', () => {
  it('F-12 reordena los ejercicios y cada uno conserva su serie vacía', async () => {
    const { sessions, rows } = await setup(['Uno', 'Dos'])

    await sessions.moveExercise(rows[1]!.id, -1)

    const active = await readActive(sessions)
    expect(active!.exercises.map(e => e.exercise.name)).toEqual(['Dos', 'Uno'])
    expect(active!.exercises.map(e => e.position)).toEqual([0, 1])
    expect(active!.exercises.map(e => e.sets.length)).toEqual([1, 1])
  })

  it('F-12 mover el primero hacia arriba o el último hacia abajo no cambia nada', async () => {
    const { sessions, rows } = await setup(['Uno', 'Dos'])

    await sessions.moveExercise(rows[0]!.id, -1)
    await sessions.moveExercise(rows[1]!.id, 1)

    const active = await readActive(sessions)
    expect(active!.exercises.map(e => e.exercise.name)).toEqual(['Uno', 'Dos'])
  })

  it('F-13 quitar un ejercicio borra sus series y renumera los demás', async () => {
    const { sessions, rows } = await setup(['Uno', 'Dos', 'Tres'])

    await sessions.removeExercise(rows[0]!.id)

    const active = await readActive(sessions)
    expect(active!.exercises.map(e => [e.exercise.name, e.position])).toEqual([['Dos', 0], ['Tres', 1]])
    expect(await db.sets.where('sessionExerciseId').equals(rows[0]!.id).count()).toBe(0)
  })
})

describe('SessionRepository: series', () => {
  it('F-14 añade una serie al final y quitar otra renumera las que quedan', async () => {
    const { sessions, rows } = await setup(['Uno'])
    const added = await sessions.addSet(rows[0]!.id)
    await sessions.addSet(rows[0]!.id)
    expect(added).toMatchObject({ position: 1, done: false })

    await sessions.removeSet(added.id)

    const [exercise] = (await readActive(sessions))!.exercises
    expect(exercise!.sets.map(s => s.position)).toEqual([0, 1])
    expect(exercise!.sets.some(s => s.id === added.id)).toBe(false)
  })

  it('F-14 marcar una serie como hecha guarda la hora y desmarcarla la borra', async () => {
    const { sessions, rows } = await setup(['Uno'])
    const [set] = await db.sets.where('sessionExerciseId').equals(rows[0]!.id).toArray()
    const now = new Date(2026, 9, 18, 10, 0)

    await sessions.setDone(set!.id, true, now)
    expect(await db.sets.get(set!.id)).toMatchObject({ done: true, doneAt: now.toISOString() })

    await sessions.setDone(set!.id, false)
    const after = await db.sets.get(set!.id)
    expect(after).toMatchObject({ done: false })
    expect(after!.doneAt).toBeUndefined()
  })

  it('guarda los valores de la serie en kg y segundos, y undefined borra el valor', async () => {
    const { sessions, rows } = await setup(['Uno'])
    const [set] = await db.sets.where('sessionExerciseId').equals(rows[0]!.id).toArray()

    await sessions.setValues(set!.id, { weightKg: 82.5, reps: 8 })
    await sessions.setValues(set!.id, { durationSeconds: 90 })
    expect(await db.sets.get(set!.id)).toMatchObject({ weightKg: 82.5, reps: 8, durationSeconds: 90 })

    await sessions.setValues(set!.id, { weightKg: undefined })
    const after = await db.sets.get(set!.id)
    expect(after).toMatchObject({ reps: 8, durationSeconds: 90 })
    expect('weightKg' in after!).toBe(false)
  })
})

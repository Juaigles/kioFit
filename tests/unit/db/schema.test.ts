import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase, type KioFitDb } from '../../../app/db/database'
import { createExerciseRepository } from '../../../app/db/dexie-repositories'
import type { Exercise } from '../../../app/types/workouts'

let db: KioFitDb

beforeEach(() => {
  db = createDatabase(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await db.delete()
})

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: crypto.randomUUID(),
    name: 'Press de banca',
    normalizedName: 'press de banca',
    measure: 'weight_reps',
    origin: 'custom',
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-18T10:00:00.000Z',
    ...overrides,
  }
}

describe('esquema Dexie v1', () => {
  it('tiene las cinco tablas con sus índices', () => {
    expect(db.verno).toBe(1)
    const indexes = Object.fromEntries(
      db.tables.map(table => [table.name, table.schema.indexes.map(index => index.src)]),
    )

    expect(Object.keys(indexes).sort()).toEqual(
      ['exercises', 'meta', 'sessionExercises', 'sessions', 'sets'],
    )
    expect(indexes.exercises).toEqual(['normalizedName', '&sourceId'])
    expect(indexes.sessions).toEqual(['localDate', 'status'])
    expect(indexes.sessionExercises).toEqual(['sessionId', 'exerciseId'])
    expect(indexes.sets).toEqual(['sessionExerciseId'])
    expect(indexes.meta).toEqual([])
  })

  it('permite varios ejercicios propios sin sourceId', async () => {
    const exercises = createExerciseRepository(db)

    await exercises.save(exercise({ name: 'Uno', normalizedName: 'uno' }))
    await exercises.save(exercise({ name: 'Dos', normalizedName: 'dos' }))

    expect(await db.exercises.count()).toBe(2)
  })

  it('rechaza dos ejercicios con el mismo sourceId', async () => {
    const exercises = createExerciseRepository(db)
    await exercises.save(exercise({ origin: 'catalog', sourceId: 'Barbell_Bench_Press' }))

    await expect(
      exercises.save(exercise({ origin: 'catalog', sourceId: 'Barbell_Bench_Press' })),
    ).rejects.toThrow()
  })
})

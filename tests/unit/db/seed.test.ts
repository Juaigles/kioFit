import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase, type KioFitDb } from '../../../app/db/database'
import { createExerciseRepository } from '../../../app/db/dexie-repositories'
import seed from '../../../app/db/seed/exercises.json'
import type { Exercise, Measure, SeedExercise } from '../../../app/types/workouts'
import { matchesSearch, normalizeText } from '../../../app/utils/normalize'

const MEASURES: Measure[] = ['weight_reps', 'reps', 'duration']
const catalog = seed as SeedExercise[]

let db: KioFitDb

beforeEach(() => {
  db = createDatabase(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await db.delete()
})

function entry(sourceId: string, name: string, measure: Measure = 'weight_reps'): SeedExercise {
  return { sourceId, name, measure, muscle: 'pecho', equipment: 'barra' }
}

describe('semilla del catálogo', () => {
  it('F-01 carga todos los ejercicios de la semilla en una base vacía', async () => {
    await createExerciseRepository(db).seedCatalog(catalog)

    const stored = await db.exercises.toArray()
    expect(stored).toHaveLength(catalog.length)
    expect(catalog.length).toBeGreaterThanOrEqual(75)
    for (const item of catalog) {
      const exercise = stored.find(e => e.sourceId === item.sourceId)
      expect(exercise).toMatchObject({
        name: item.name,
        normalizedName: normalizeText(item.name),
        measure: item.measure,
        origin: 'catalog',
      })
    }
  })

  it('F-01 cada ejercicio de la semilla tiene nombre, tipo de medida e id de origen únicos y válidos', () => {
    const sourceIds = new Set(catalog.map(e => e.sourceId))
    const names = new Set(catalog.map(e => normalizeText(e.name)))

    expect(sourceIds.size).toBe(catalog.length)
    expect(names.size).toBe(catalog.length)
    for (const item of catalog) {
      expect(item.name.trim()).not.toBe('')
      expect(item.name.length).toBeLessThanOrEqual(60)
      expect(MEASURES).toContain(item.measure)
      expect(item.muscle).not.toBe('')
      expect(item.equipment).not.toBe('')
    }
  })

  it('F-01 asigna ids, instantes ISO y no vuelve a duplicar al arrancar de nuevo', async () => {
    const exercises = createExerciseRepository(db)
    await exercises.seedCatalog(catalog)
    await exercises.seedCatalog(catalog)

    const stored = await db.exercises.toArray()
    expect(stored).toHaveLength(catalog.length)
    expect(new Set(stored.map(e => e.id)).size).toBe(catalog.length)
    expect(stored[0]!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(stored[0]!.updatedAt).toBe(stored[0]!.createdAt)
  })

  it('F-02 añade los ejercicios nuevos y no cambia los existentes, ni siquiera uno con otro nombre', async () => {
    const exercises = createExerciseRepository(db)
    await exercises.seedCatalog([entry('a', 'Press de banca'), entry('b', 'Remo con barra')])
    const before = await db.exercises.toArray()

    await exercises.seedCatalog([
      entry('a', 'Press plano con barra', 'reps'),
      entry('b', 'Remo con barra'),
      entry('c', 'Curl con barra'),
    ])

    const after = await db.exercises.toArray()
    expect(after).toHaveLength(3)
    for (const original of before) {
      expect(after.find(e => e.id === original.id)).toEqual(original)
    }
    expect(after.find(e => e.sourceId === 'c')).toMatchObject({ name: 'Curl con barra', origin: 'catalog' })
  })

  it('F-02 no toca los ejercicios propios', async () => {
    const exercises = createExerciseRepository(db)
    const custom: Exercise = {
      id: crypto.randomUUID(),
      name: 'Mi ejercicio',
      normalizedName: 'mi ejercicio',
      measure: 'reps',
      origin: 'custom',
      createdAt: '2026-10-18T10:00:00.000Z',
      updatedAt: '2026-10-18T10:00:00.000Z',
    }
    await exercises.save(custom)

    await exercises.seedCatalog([entry('a', 'Press de banca')])

    expect(await db.exercises.toArray()).toHaveLength(2)
    expect(await exercises.get(custom.id)).toEqual(custom)
  })

  it('F-03 "Press de banca" del catálogo aparece al buscar "PRESS banca" y "press de bánca"', async () => {
    await createExerciseRepository(db).seedCatalog(catalog)
    const stored = await db.exercises.toArray()

    for (const query of ['PRESS banca', 'press de bánca']) {
      const names = stored.filter(e => matchesSearch(e.normalizedName, query)).map(e => e.name)
      expect(names).toContain('Press de banca')
    }
  })
})

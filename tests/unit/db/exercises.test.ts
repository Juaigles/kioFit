import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase, type KioFitDb } from '../../../app/db/database'
import { createExerciseRepository } from '../../../app/db/dexie-repositories'
import type { ExerciseRepository } from '../../../app/types/repositories'
import type { Exercise } from '../../../app/types/workouts'

let db: KioFitDb
let exercises: ExerciseRepository

beforeEach(() => {
  db = createDatabase(`test-${crypto.randomUUID()}`)
  exercises = createExerciseRepository(db)
})

afterEach(async () => {
  await db.delete()
})

async function custom(name = 'Remo con barra', measure: Exercise['measure'] = 'weight_reps'): Promise<Exercise> {
  const result = await exercises.createCustom({ name, measure })
  if (!result.ok) throw new Error(`no se pudo crear ${name}: ${result.reason}`)
  return result.value
}

async function seedCatalogExercise(): Promise<Exercise> {
  await exercises.seedCatalog([{ sourceId: 'Barbell_Squat', name: 'Sentadilla con barra', measure: 'weight_reps', muscle: 'piernas', equipment: 'barra' }])
  return (await db.exercises.where('sourceId').equals('Barbell_Squat').first())!
}

/** Mete el ejercicio en una sesión; con `withSet`, además le registra una serie. */
async function addToSession(exerciseId: string, withSet = false): Promise<string> {
  const sessionId = crypto.randomUUID()
  const sessionExerciseId = crypto.randomUUID()
  await db.sessions.put({ id: sessionId, type: 'strength', localDate: '2026-10-18', startedAt: '2026-10-18T18:00:00.000Z', status: 'in_progress' })
  await db.sessionExercises.put({ id: sessionExerciseId, sessionId, exerciseId, position: 0 })
  if (withSet) {
    await db.sets.put({ id: crypto.randomUUID(), sessionExerciseId, position: 0, weightKg: 60, reps: 8, done: true, doneAt: '2026-10-18T18:05:00.000Z' })
  }
  return sessionId
}

describe('ExerciseRepository: ejercicios propios', () => {
  it('crea un ejercicio propio con id, nombre recortado y nombre normalizado', async () => {
    const created = await custom('  Remo con Barra ')

    expect(await exercises.get(created.id)).toEqual(created)
    expect(created).toMatchObject({ name: 'Remo con Barra', normalizedName: 'remo con barra', origin: 'custom', measure: 'weight_reps' })
    expect(created.sourceId).toBeUndefined()
  })

  it('F-05 rechaza crear o renombrar con un nombre duplicado, vacío o de más de 60 caracteres', async () => {
    const rowing = await custom('Remo con barra')
    const other = await custom('Remo en polea')

    expect(await exercises.createCustom({ name: 'remo con bárra', measure: 'reps' })).toEqual({ ok: false, reason: 'duplicate_name' })
    expect(await exercises.createCustom({ name: ' ', measure: 'reps' })).toEqual({ ok: false, reason: 'empty_name' })
    expect(await exercises.createCustom({ name: 'a'.repeat(61), measure: 'reps' })).toEqual({ ok: false, reason: 'name_too_long' })
    expect(await exercises.rename(other.id, 'remo con bárra')).toEqual({ ok: false, reason: 'duplicate_name' })
    expect(await exercises.rename(other.id, '')).toEqual({ ok: false, reason: 'empty_name' })
    expect(await exercises.rename(other.id, 'a'.repeat(61))).toEqual({ ok: false, reason: 'name_too_long' })
    expect(await db.exercises.count()).toBe(2)
    expect((await exercises.get(other.id))?.name).toBe('Remo en polea')
    expect((await exercises.get(rowing.id))?.name).toBe('Remo con barra')
  })

  it('F-05 rechaza un nombre propio que coincide con uno del catálogo', async () => {
    await seedCatalogExercise()

    expect(await exercises.createCustom({ name: 'SENTADILLA con barra', measure: 'weight_reps' })).toEqual({ ok: false, reason: 'duplicate_name' })
  })

  it('F-06 renombra un ejercicio propio y el nombre cambia en las sesiones donde aparece', async () => {
    const rowing = await custom('Remo con barra')
    const sessionId = await addToSession(rowing.id, true)

    const result = await exercises.rename(rowing.id, ' Remo Pendlay ')

    expect(result).toMatchObject({ ok: true, value: { id: rowing.id, name: 'Remo Pendlay', normalizedName: 'remo pendlay' } })
    const [inSession] = await db.sessionExercises.where('sessionId').equals(sessionId).toArray()
    expect((await exercises.get(inSession!.exerciseId))?.name).toBe('Remo Pendlay')
    expect((await exercises.get(rowing.id))!.updatedAt >= rowing.updatedAt).toBe(true)
  })

  it('F-06 permite renombrarlo cambiando solo mayúsculas o acentos', async () => {
    const rowing = await custom('Remo con barra')

    expect(await exercises.rename(rowing.id, 'Remo con Barra')).toMatchObject({ ok: true, value: { name: 'Remo con Barra' } })
  })

  it('F-07 rechaza cambiar el tipo de medida de un ejercicio con series registradas', async () => {
    const rowing = await custom('Remo con barra')
    await addToSession(rowing.id, true)

    expect(await exercises.changeMeasure(rowing.id, 'reps')).toEqual({ ok: false, reason: 'measure_locked' })
    expect((await exercises.get(rowing.id))?.measure).toBe('weight_reps')
  })

  it('F-07 permite cambiar el tipo de medida sin series registradas, aunque esté en una sesión', async () => {
    const rowing = await custom('Remo con barra')
    const plank = await custom('Plancha lateral')
    await addToSession(plank.id)

    expect(await exercises.changeMeasure(rowing.id, 'reps')).toMatchObject({ ok: true, value: { measure: 'reps' } })
    expect(await exercises.changeMeasure(plank.id, 'duration')).toMatchObject({ ok: true, value: { measure: 'duration' } })
    expect((await exercises.get(plank.id))?.measure).toBe('duration')
  })

  it('F-08 borra un ejercicio propio que no aparece en ninguna sesión', async () => {
    const rowing = await custom('Remo con barra')

    expect(await exercises.remove(rowing.id)).toEqual({ ok: true, value: undefined })
    expect(await exercises.get(rowing.id)).toBeUndefined()
  })

  it('F-08 rechaza borrar un ejercicio propio que aparece en alguna sesión', async () => {
    const rowing = await custom('Remo con barra')
    await addToSession(rowing.id)

    expect(await exercises.remove(rowing.id)).toEqual({ ok: false, reason: 'exercise_in_use' })
    expect(await exercises.get(rowing.id)).toBeDefined()
  })

  it('F-09 rechaza renombrar, cambiar el tipo de medida o borrar un ejercicio del catálogo', async () => {
    const squat = await seedCatalogExercise()

    expect(await exercises.rename(squat.id, 'Sentadilla trasera')).toEqual({ ok: false, reason: 'catalog_read_only' })
    expect(await exercises.changeMeasure(squat.id, 'reps')).toEqual({ ok: false, reason: 'catalog_read_only' })
    expect(await exercises.remove(squat.id)).toEqual({ ok: false, reason: 'catalog_read_only' })
    expect(await exercises.get(squat.id)).toEqual(squat)
  })

  it('rechaza cambios sobre un ejercicio que no existe', async () => {
    expect(await exercises.rename('no-existe', 'Remo')).toEqual({ ok: false, reason: 'not_found' })
    expect(await exercises.changeMeasure('no-existe', 'reps')).toEqual({ ok: false, reason: 'not_found' })
    expect(await exercises.remove('no-existe')).toEqual({ ok: false, reason: 'not_found' })
  })
})

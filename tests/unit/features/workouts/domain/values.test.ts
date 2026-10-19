import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase, type KioFitDb } from '../../../../../app/db/database'
import {
  formatDuration,
  formatReps,
  formatWeightKg,
  parseDurationSeconds,
  parseReps,
  parseWeightKg,
} from '../../../../../app/features/workouts/domain/values'
import type { WorkoutSet } from '../../../../../app/types/workouts'

describe('parseWeightKg', () => {
  it('F-16 "82,5" y "82.5" dan 82,5 kg', () => {
    expect(parseWeightKg('82,5')).toEqual({ ok: true, value: 82.5 })
    expect(parseWeightKg('82.5')).toEqual({ ok: true, value: 82.5 })
  })

  it.each([
    ['0', 0],
    ['0,25', 0.25],
    ['100', 100],
    ['82,25', 82.25],
    ['999,99', 999.99],
    [' 82,5 ', 82.5],
  ])('F-16 kg admite de 0 a 999,99 con hasta 2 decimales: "%s"', (text, value) => {
    expect(parseWeightKg(text)).toEqual({ ok: true, value })
  })

  it.each(['', '   '])('F-16 kg vacío se marca como empty: "%s"', (text) => {
    expect(parseWeightKg(text)).toEqual({ ok: false, reason: 'empty' })
  })

  it.each(['1000', '82,555', '82,', ',5', '-5', '1.000', '1e2', '0x10', 'Infinity', 'abc', '82 kg'])(
    'F-16 rechaza kg fuera de rango o con formato no válido: "%s"',
    (text) => {
      expect(parseWeightKg(text)).toEqual({ ok: false, reason: 'invalid' })
    },
  )
})

describe('parseReps', () => {
  it.each([
    ['1', 1],
    ['8', 8],
    ['999', 999],
    [' 12 ', 12],
  ])('F-16 reps admite enteros de 1 a 999: "%s"', (text, value) => {
    expect(parseReps(text)).toEqual({ ok: true, value })
  })

  it('F-16 reps vacío se marca como empty', () => {
    expect(parseReps('')).toEqual({ ok: false, reason: 'empty' })
  })

  it.each(['0', '1000', '8,5', '8.5', '-1', '1e2', 'ocho'])(
    'F-16 rechaza reps no enteras o fuera de rango: "%s"',
    (text) => {
      expect(parseReps(text)).toEqual({ ok: false, reason: 'invalid' })
    },
  )
})

describe('parseDurationSeconds', () => {
  it.each([
    ['0:01', 1],
    ['1:30', 90],
    ['01:30', 90],
    ['10:00', 600],
    ['59:59', 3599],
    [' 1:30 ', 90],
  ])('F-16 duración admite de 0:01 a 59:59: "%s"', (text, value) => {
    expect(parseDurationSeconds(text)).toEqual({ ok: true, value })
  })

  it('F-16 duración vacía se marca como empty', () => {
    expect(parseDurationSeconds('')).toEqual({ ok: false, reason: 'empty' })
  })

  it.each(['0:00', '60:00', '1:60', '90', '1:5', '1:30:00', '-1:30', '1,5', 'abc'])(
    'F-16 rechaza duraciones fuera de rango o sin mm:ss: "%s"',
    (text) => {
      expect(parseDurationSeconds(text)).toEqual({ ok: false, reason: 'invalid' })
    },
  )
})

describe('formato de vuelta a texto', () => {
  it('muestra los kg con coma y sin ceros de más', () => {
    expect(formatWeightKg(82.5)).toBe('82,5')
    expect(formatWeightKg(90)).toBe('90')
    expect(formatWeightKg(82.25)).toBe('82,25')
    expect(formatWeightKg(0)).toBe('0')
  })

  it('redondea a 2 decimales los kg que vienen de una suma flotante', () => {
    expect(formatWeightKg(0.1 + 0.2)).toBe('0,3')
  })

  it('muestra las reps como entero', () => {
    expect(formatReps(8)).toBe('8')
  })

  it('muestra la duración como m:ss', () => {
    expect(formatDuration(90)).toBe('1:30')
    expect(formatDuration(1)).toBe('0:01')
    expect(formatDuration(600)).toBe('10:00')
    expect(formatDuration(3599)).toBe('59:59')
  })

  it('parsear lo formateado devuelve el mismo valor', () => {
    expect(parseWeightKg(formatWeightKg(82.25))).toEqual({ ok: true, value: 82.25 })
    expect(parseReps(formatReps(12))).toEqual({ ok: true, value: 12 })
    expect(parseDurationSeconds(formatDuration(754))).toEqual({ ok: true, value: 754 })
  })
})

describe('valores guardados', () => {
  let db: KioFitDb

  beforeEach(() => {
    db = createDatabase(`test-${crypto.randomUUID()}`)
  })

  afterEach(async () => {
    await db.delete()
  })

  it('F-30 guarda 82,5 kg como 82.5 y 1:30 como 90 segundos', async () => {
    const weight = parseWeightKg('82,5')
    const duration = parseDurationSeconds('1:30')
    if (!weight.ok || !duration.ok) throw new Error('los valores de la prueba deberían ser válidos')

    const weightSet: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionExerciseId: 'sesion-ejercicio-1',
      position: 0,
      weightKg: weight.value,
      done: true,
    }
    const durationSet: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionExerciseId: 'sesion-ejercicio-2',
      position: 0,
      durationSeconds: duration.value,
      done: true,
    }

    await db.sets.bulkPut([weightSet, durationSet])

    expect((await db.sets.get(weightSet.id))?.weightKg).toBe(82.5)
    expect((await db.sets.get(durationSet.id))?.durationSeconds).toBe(90)
  })
})

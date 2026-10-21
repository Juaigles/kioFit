import { describe, expect, it } from 'vitest'
import { previousReference, resolveSetCompletion } from '../../../../../app/features/workouts/domain/previous'
import type { ExerciseHistoryEntry } from '../../../../../app/types/repositories'
import type { WorkoutSet } from '../../../../../app/types/workouts'

function entry(startedAt: string, sets: Partial<WorkoutSet>[]): ExerciseHistoryEntry {
  return {
    session: { id: `s-${startedAt}`, type: 'strength', localDate: startedAt.slice(0, 10), startedAt, status: 'finished' },
    sets: sets.map((set, position) => ({ id: `${startedAt}-${position}`, sessionExerciseId: 'row', position, done: true, ...set })),
  }
}

const lastWeek = entry('2026-06-03T10:00:00.000Z', [{ weightKg: 60, reps: 10 }, { weightKg: 80, reps: 8 }])
const older = entry('2026-05-27T10:00:00.000Z', [{ weightKg: 50, reps: 12 }, { weightKg: 55, reps: 10 }, { weightKg: 55, reps: 9 }])

describe('previousReference', () => {
  it('F-18 la referencia de la serie 2 es "80 × 8" cuando la sesión anterior la hizo así', () => {
    const reference = previousReference([older, lastWeek], 1, 'weight_reps')
    expect(reference.text).toBe('80 × 8')
    expect(reference.values).toEqual({ weightKg: 80, reps: 8 })
  })

  it('F-18 usa la sesión terminada más reciente, sea cual sea el orden recibido', () => {
    expect(previousReference([lastWeek, older], 0, 'weight_reps').text).toBe('60 × 10')
    expect(previousReference([older, lastWeek], 0, 'weight_reps').text).toBe('60 × 10')
  })

  it('F-18 la referencia es "—" si no hay sesión anterior con el ejercicio', () => {
    expect(previousReference([], 0, 'weight_reps')).toEqual({ text: '—', values: {} })
  })

  it('F-18 la referencia es "—" si esa serie no existía en la sesión anterior, aunque una más antigua la tuviera', () => {
    expect(previousReference([older, lastWeek], 2, 'weight_reps').text).toBe('—')
  })

  it('F-18 formatea según el tipo de medida, con coma decimal', () => {
    const mixed = entry('2026-06-03T10:00:00.000Z', [{ weightKg: 82.5, reps: 5, durationSeconds: 90 }])
    expect(previousReference([mixed], 0, 'weight_reps').text).toBe('82,5 × 5')
    expect(previousReference([mixed], 0, 'reps').text).toBe('5')
    expect(previousReference([mixed], 0, 'duration').text).toBe('1:30')
  })

  it('F-18 la referencia es "—" si la serie anterior no tiene los valores del tipo de medida', () => {
    const empty = entry('2026-06-03T10:00:00.000Z', [{ weightKg: 80 }])
    expect(previousReference([empty], 0, 'weight_reps')).toEqual({ text: '—', values: {} })
  })
})

describe('resolveSetCompletion', () => {
  const reference = { weightKg: 80, reps: 8 }

  it('F-19 copia la referencia en los campos vacíos', () => {
    expect(resolveSetCompletion({}, 'weight_reps', reference)).toEqual({ ok: true, values: { weightKg: 80, reps: 8 } })
  })

  it('F-19 no pisa los campos ya rellenos', () => {
    expect(resolveSetCompletion({ weightKg: 85 }, 'weight_reps', reference)).toEqual({ ok: true, values: { weightKg: 85, reps: 8 } })
  })

  it('F-20 sin referencia y con la serie vacía indica los campos que faltan', () => {
    expect(resolveSetCompletion({}, 'weight_reps', {})).toEqual({ ok: false, missing: ['weightKg', 'reps'] })
    expect(resolveSetCompletion({}, 'duration', {})).toEqual({ ok: false, missing: ['durationSeconds'] })
  })

  it('F-20 sin referencia indica solo el campo que falta', () => {
    expect(resolveSetCompletion({ weightKg: 85 }, 'weight_reps', {})).toEqual({ ok: false, missing: ['reps'] })
  })
})

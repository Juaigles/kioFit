import { describe, expect, it } from 'vitest'
import { formatVolume, sessionSummary } from '../../../../../app/features/workouts/domain/summary'
import type { SessionExerciseView } from '../../../../../app/types/repositories'
import type { Exercise, Session, WorkoutSet } from '../../../../../app/types/workouts'

const NOW = Date.parse('2026-10-22T10:32:00.000Z')

const session: Session = {
  id: 's1',
  type: 'strength',
  localDate: '2026-10-22',
  startedAt: '2026-10-22T10:00:00.000Z',
  status: 'in_progress',
}

function exercise(measure: Exercise['measure']): Exercise {
  return { id: `e-${measure}`, name: measure, normalizedName: measure, measure, origin: 'custom', createdAt: '', updatedAt: '' }
}

function set(values: Partial<WorkoutSet>): WorkoutSet {
  return { id: crypto.randomUUID(), sessionExerciseId: 'x', position: 1, done: false, ...values }
}

function item(measure: Exercise['measure'], sets: WorkoutSet[]): SessionExerciseView {
  return { id: `i-${measure}`, position: 1, exercise: exercise(measure), sets }
}

describe('sessionSummary', () => {
  it('D-05 con 32 min, 60 × 10 y 80 × 8 hechas, una de solo reps hecha y otra pendiente: 32 min, 1.240 kg y 3/4', () => {
    const summary = sessionSummary(session, [
      item('weight_reps', [set({ weightKg: 60, reps: 10, done: true }), set({ weightKg: 80, reps: 8, done: true })]),
      item('reps', [set({ reps: 12, done: true }), set({ done: false })]),
    ], NOW)
    expect(summary).toEqual({ minutes: 32, volumeKg: 1240, doneSets: 3, totalSets: 4 })
  })

  it('D-05 las series pendientes con peso no suman volumen', () => {
    const summary = sessionSummary(session, [item('weight_reps', [set({ weightKg: 100, reps: 5, done: false })])], NOW)
    expect(summary.volumeKg).toBe(0)
    expect(summary.doneSets).toBe(0)
  })

  it('D-05 sin ejercicios todo es cero y la duración nunca es negativa', () => {
    const early = sessionSummary(session, [], Date.parse('2026-10-22T09:00:00.000Z'))
    expect(early).toEqual({ minutes: 0, volumeKg: 0, doneSets: 0, totalSets: 0 })
  })
})

describe('formatVolume', () => {
  it('D-05 agrupa miles con punto y usa coma decimal', () => {
    expect(formatVolume(1240)).toBe('1.240 kg')
    expect(formatVolume(82.5)).toBe('82,5 kg')
    expect(formatVolume(0)).toBe('0 kg')
  })
})

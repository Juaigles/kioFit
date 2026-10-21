import { describe, expect, it } from 'vitest'
import { formatSessionDate, formatSessionDuration } from '../../../../../app/features/workouts/domain/history'

describe('formatSessionDuration', () => {
  it('F-26 muestra minutos por debajo de una hora', () => {
    expect(formatSessionDuration('2026-06-01T10:00:00.000Z', '2026-06-01T10:45:00.000Z')).toBe('45 min')
  })

  it('F-26 muestra horas y minutos desde una hora', () => {
    expect(formatSessionDuration('2026-06-01T10:00:00.000Z', '2026-06-01T11:05:00.000Z')).toBe('1 h 05 min')
    expect(formatSessionDuration('2026-06-01T10:00:00.000Z', '2026-06-01T12:00:00.000Z')).toBe('2 h 00 min')
  })

  it('F-26 una sesión que cruza la medianoche cuenta el tiempo real', () => {
    expect(formatSessionDuration('2026-06-01T21:30:00.000Z', '2026-06-01T22:40:00.000Z')).toBe('1 h 10 min')
  })

  it('F-26 sin hora de fin no hay duración', () => {
    expect(formatSessionDuration('2026-06-01T10:00:00.000Z', undefined)).toBe('—')
  })
})

describe('formatSessionDate', () => {
  it('F-26 escribe el día local en español sin pasar por UTC', () => {
    expect(formatSessionDate('2026-10-18')).toBe('domingo, 18 de octubre de 2026')
  })
})

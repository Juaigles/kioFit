import { afterEach, describe, expect, it } from 'vitest'
import { toLocalDate } from '../../../app/utils/to-local-date'

const originalTz = process.env.TZ

afterEach(() => {
  process.env.TZ = originalTz
})

describe('toLocalDate', () => {
  it('F-29 da el día local aunque en UTC ya sea el día siguiente', () => {
    process.env.TZ = 'America/Bogota'
    const lateEvening = new Date(2026, 9, 18, 23, 30)

    expect(lateEvening.toISOString()).toBe('2026-10-19T04:30:00.000Z')
    expect(toLocalDate(lateEvening)).toBe('2026-10-18')
  })

  it('rellena con ceros el mes y el día', () => {
    expect(toLocalDate(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05')
  })
})

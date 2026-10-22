import { describe, expect, it } from 'vitest'
import { backupReminder } from '../../../../../app/features/backup/domain/last-backup'

// Fechas con hora local, sin 'Z': los días de calendario son locales (ADR-0009).
const now = new Date(2026, 9, 21, 9, 30)
const daysAgo = (days: number) => new Date(2026, 9, 21 - days, 12).toISOString()

describe('backupReminder', () => {
  it('D-15 con la última copia de hace 8 días avisa con los días', () => {
    expect(backupReminder(daysAgo(8), true, now)).toBe('Última copia hace 8 días')
    expect(backupReminder(daysAgo(30), true, now)).toBe('Última copia hace 30 días')
  })

  it('D-15 con una copia de hace 7 días o menos no avisa', () => {
    expect(backupReminder(daysAgo(7), true, now)).toBeNull()
    expect(backupReminder(daysAgo(1), true, now)).toBeNull()
    expect(backupReminder(daysAgo(0), true, now)).toBeNull()
  })

  it('D-15 sin ninguna copia y con al menos una sesión avisa de que no hay copia', () => {
    expect(backupReminder(null, true, now)).toBe('Aún no has hecho ninguna copia')
    expect(backupReminder(undefined, true, now)).toBe('Aún no has hecho ninguna copia')
  })

  it('D-15 sin ninguna copia y sin sesiones no avisa: no hay nada que perder', () => {
    expect(backupReminder(null, false, now)).toBeNull()
  })

  it('D-15 cuenta días de calendario locales, no de 24 horas', () => {
    expect(backupReminder(new Date(2026, 9, 13, 23, 55).toISOString(), true, now)).toBe('Última copia hace 8 días')
    expect(backupReminder(new Date(2026, 9, 14, 0, 5).toISOString(), true, now)).toBeNull()
  })
})

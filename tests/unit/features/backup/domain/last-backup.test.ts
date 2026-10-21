import { describe, expect, it } from 'vitest'
import { lastBackupLabel } from '../../../../../app/features/backup/domain/last-backup'

// Fechas con hora local, sin 'Z': los días de calendario son locales (ADR-0009).
const now = new Date(2026, 9, 21, 9, 30)

describe('lastBackupLabel', () => {
  it('C-07 sin ninguna copia dice que todavía no has hecho ninguna', () => {
    expect(lastBackupLabel(undefined, now)).toBe('Todavía no has hecho ninguna copia')
    expect(lastBackupLabel(null, now)).toBe('Todavía no has hecho ninguna copia')
  })

  it('C-07 cuenta días de calendario locales: hoy, ayer y hace N días', () => {
    expect(lastBackupLabel(new Date(2026, 9, 21, 0, 5).toISOString(), now)).toBe('Última copia: hoy')
    expect(lastBackupLabel(new Date(2026, 9, 20, 23, 55).toISOString(), now)).toBe('Última copia: ayer')
    expect(lastBackupLabel(new Date(2026, 9, 18, 22, 0).toISOString(), now)).toBe('Última copia: hace 3 días')
  })

  it('C-07 cruza el cambio de mes y de año', () => {
    expect(lastBackupLabel(new Date(2026, 8, 30, 12).toISOString(), now)).toBe('Última copia: hace 21 días')
    expect(lastBackupLabel(new Date(2025, 11, 31, 12).toISOString(), new Date(2026, 0, 1, 8))).toBe('Última copia: ayer')
  })
})

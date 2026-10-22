import { toLocalDate } from '../../../utils/to-local-date'

const DAY_MS = 86_400_000

/** Días de calendario locales entre dos fechas `YYYY-MM-DD`. */
function calendarDaysBetween(from: string, to: string): number {
  const parse = (date: string) => {
    const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  return Math.round((parse(to) - parse(from)) / DAY_MS)
}

/** Días de calendario locales desde la última copia, o `null` si no hay una válida. */
function daysSinceBackup(lastExportAt: string | null | undefined, now: Date): number | null {
  if (!lastExportAt) return null
  const exported = new Date(lastExportAt)
  if (Number.isNaN(exported.getTime())) return null
  return calendarDaysBetween(toLocalDate(exported), toLocalDate(now))
}

/** Texto de la pantalla de ajustes sobre la última copia (C-07). Cuenta días de calendario en la zona local. */
export function lastBackupLabel(lastExportAt: string | null | undefined, now: Date = new Date()): string {
  const days = daysSinceBackup(lastExportAt, now)
  if (days === null) return 'Todavía no has hecho ninguna copia'
  if (days <= 0) return 'Última copia: hoy'
  if (days === 1) return 'Última copia: ayer'
  return `Última copia: hace ${days} días`
}

/** Días sin copia a partir de los cuales Hoy avisa (D-15). */
export const BACKUP_REMINDER_AFTER_DAYS = 7

/** Aviso de Hoy sobre una copia antigua o inexistente; `null` si no hace falta avisar (D-15). */
export function backupReminder(lastExportAt: string | null | undefined, hasSessions: boolean, now: Date = new Date()): string | null {
  const days = daysSinceBackup(lastExportAt, now)
  if (days === null) return hasSessions ? 'Aún no has hecho ninguna copia' : null
  return days > BACKUP_REMINDER_AFTER_DAYS ? `Última copia hace ${days} días` : null
}

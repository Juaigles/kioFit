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

/** Texto de la pantalla de datos sobre la última copia (C-07). Cuenta días de calendario en la zona local. */
export function lastBackupLabel(lastExportAt: string | null | undefined, now: Date = new Date()): string {
  if (!lastExportAt) return 'Todavía no has hecho ninguna copia'
  const exported = new Date(lastExportAt)
  if (Number.isNaN(exported.getTime())) return 'Todavía no has hecho ninguna copia'
  const days = calendarDaysBetween(toLocalDate(exported), toLocalDate(now))
  if (days <= 0) return 'Última copia: hoy'
  if (days === 1) return 'Última copia: ayer'
  return `Última copia: hace ${days} días`
}

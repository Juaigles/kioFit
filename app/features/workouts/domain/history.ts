// Presentación del historial de sesiones (F-26). Funciones puras.

const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "domingo, 18 de octubre de 2026" a partir del día local `YYYY-MM-DD`, sin pasar por UTC. */
export function formatSessionDate(localDate: string): string {
  const [year, month, day] = localDate.split('-').map(Number)
  return DATE_FORMAT.format(new Date(year!, month! - 1, day))
}

/** "45 min" o "1 h 05 min" entre el inicio y el fin; "—" si la sesión no tiene hora de fin. */
export function formatSessionDuration(startedAt: string, endedAt: string | undefined): string {
  if (!endedAt) return '—'
  const minutes = Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 60_000))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
}

const MONTH_FORMAT = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })

/** "junio de 2026" a partir del día local `YYYY-MM-DD`, para agrupar el historial. */
export function formatSessionMonth(localDate: string): string {
  const [year, month] = localDate.split('-').map(Number)
  return MONTH_FORMAT.format(new Date(year!, month! - 1, 1))
}

// Valores de una serie: del texto que escribe el usuario a lo que se guarda, y de vuelta (F-16, F-30).
// Peso en kg, duración en segundos. Los mensajes de error en español los pone la UI.

export type ParseResult<T>
  = | { ok: true, value: T }
    | { ok: false, reason: 'empty' | 'invalid' }

const MAX_DURATION_SECONDS = 59 * 60 + 59

function parse(text: string, pattern: RegExp, toValue: (match: RegExpMatchArray) => number, min: number, max: number): ParseResult<number> {
  const trimmed = text.trim()
  if (trimmed === '') return { ok: false, reason: 'empty' }
  const match = trimmed.match(pattern)
  if (!match) return { ok: false, reason: 'invalid' }
  const value = toValue(match)
  return value >= min && value <= max ? { ok: true, value } : { ok: false, reason: 'invalid' }
}

/** kg de 0 a 999,99 con hasta 2 decimales; acepta coma o punto. */
export function parseWeightKg(text: string): ParseResult<number> {
  return parse(text, /^\d{1,3}(?:[.,]\d{1,2})?$/, match => Number(match[0].replace(',', '.')), 0, 999.99)
}

/** Repeticiones: enteros de 1 a 999. */
export function parseReps(text: string): ParseResult<number> {
  return parse(text, /^\d{1,3}$/, match => Number(match[0]), 1, 999)
}

/** Duración `m:ss` o `mm:ss`, de 0:01 a 59:59, en segundos. */
export function parseDurationSeconds(text: string): ParseResult<number> {
  return parse(text, /^(\d{1,2}):([0-5]\d)$/, match => Number(match[1]) * 60 + Number(match[2]), 1, MAX_DURATION_SECONDS)
}

/** 82.5 -> "82,5"; 90 -> "90". */
export function formatWeightKg(kg: number): string {
  return String(Math.round(kg * 100) / 100).replace('.', ',')
}

export function formatReps(reps: number): string {
  return String(reps)
}

/** 90 -> "1:30". */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

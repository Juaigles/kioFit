// Referencia de la sesión anterior y marcado de series (F-18, F-19, F-20). Funciones puras.
import type { ExerciseHistoryEntry } from '../../../types/repositories'
import type { Measure, SetValues } from '../../../types/workouts'
import { formatDuration, formatReps, formatWeightKg } from './values'

export type SetField = 'weightKg' | 'reps' | 'durationSeconds'

/** Campos que pide cada tipo de medida, en el orden en que se muestran. */
export const FIELDS_BY_MEASURE: Record<Measure, SetField[]> = {
  weight_reps: ['weightKg', 'reps'],
  reps: ['reps'],
  duration: ['durationSeconds'],
}

export interface PreviousReference {
  /** "80 × 8", "8", "1:30" o "—". */
  text: string
  /** Valores a copiar al marcar la serie; vacío si no hay referencia. */
  values: SetValues
}

const NO_REFERENCE: PreviousReference = { text: '—', values: {} }

function textOf(measure: Measure, values: Required<SetValues>): string {
  if (measure === 'weight_reps') return `${formatWeightKg(values.weightKg)} × ${formatReps(values.reps)}`
  if (measure === 'reps') return formatReps(values.reps)
  return formatDuration(values.durationSeconds)
}

/**
 * La serie en esa posición de la sesión terminada más reciente que contiene el ejercicio.
 * Si esa sesión no tuvo la serie, no se mira a otra más antigua: "—".
 */
export function previousReference(history: readonly ExerciseHistoryEntry[], position: number, measure: Measure): PreviousReference {
  const latest = history.reduce<ExerciseHistoryEntry | undefined>(
    (best, entry) => !best || entry.session.startedAt > best.session.startedAt ? entry : best,
    undefined,
  )
  const set = latest?.sets.find(item => item.position === position)
  if (!set) return NO_REFERENCE
  const values: SetValues = {}
  for (const field of FIELDS_BY_MEASURE[measure]) {
    const value = set[field]
    if (value === undefined) return NO_REFERENCE
    values[field] = value
  }
  return { text: textOf(measure, values as Required<SetValues>), values }
}

export type SetCompletion
  = | { ok: true, values: SetValues }
    | { ok: false, missing: SetField[] }

/** Marcar una serie: los campos vacíos se rellenan con la referencia; si alguno sigue vacío no se marca (F-19, F-20). */
export function resolveSetCompletion(current: SetValues, measure: Measure, reference: SetValues): SetCompletion {
  const values: SetValues = {}
  const missing: SetField[] = []
  for (const field of FIELDS_BY_MEASURE[measure]) {
    const value = current[field] ?? reference[field]
    if (value === undefined) missing.push(field)
    else values[field] = value
  }
  return missing.length > 0 ? { ok: false, missing } : { ok: true, values }
}

// Resumen de una sesión (D-05). Funciones puras.
import type { SessionExerciseView } from '../../../types/repositories'
import type { Session } from '../../../types/workouts'

export interface SessionTotals {
  minutes: number
  /** Suma de kg × reps de las series hechas con peso y repeticiones. */
  volumeKg: number
  doneSets: number
  totalSets: number
}

/** `now` en milisegundos; la duración nunca es negativa. */
export function sessionSummary(session: Session, items: SessionExerciseView[], now: number): SessionTotals {
  const sets = items.flatMap(item => item.sets)
  const done = sets.filter(set => set.done)
  const volumeKg = done.reduce((sum, set) => sum + (set.weightKg !== undefined && set.reps !== undefined ? set.weightKg * set.reps : 0), 0)
  return {
    minutes: Math.max(0, Math.round((now - Date.parse(session.startedAt)) / 60_000)),
    volumeKg,
    doneSets: done.length,
    totalSets: sets.length,
  }
}

const VOLUME_FORMAT = new Intl.NumberFormat('es-ES', { useGrouping: 'always', maximumFractionDigits: 1 })

/** "1.240 kg", "82,5 kg". */
export function formatVolume(kg: number): string {
  return `${VOLUME_FORMAT.format(kg)} kg`
}

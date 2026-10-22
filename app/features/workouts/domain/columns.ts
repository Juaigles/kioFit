// Columnas de la tabla de series según la medida del ejercicio (D-06).
import type { Measure } from '../../../types/workouts'

export const SET_COLUMN_HEADERS: Record<Measure, string[]> = {
  weight_reps: ['Serie', 'Anterior', 'Kg', 'Reps'],
  reps: ['Serie', 'Anterior', 'Reps'],
  duration: ['Serie', 'Anterior', 'Tiempo'],
}

/** Misma rejilla en la cabecera y en cada fila; la última columna es el botón de marcar (44 px). */
export const SET_GRID: Record<Measure, string> = {
  weight_reps: 'grid-cols-[2.75rem_4.5rem_1fr_1fr_2.75rem]',
  reps: 'grid-cols-[2.75rem_4.5rem_1fr_2.75rem]',
  duration: 'grid-cols-[2.75rem_4.5rem_1fr_2.75rem]',
}

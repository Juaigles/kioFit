// Reglas de los ejercicios propios (F-05 a F-09): validación del nombre y el mensaje de cada rechazo.
// El repositorio aplica las reglas que necesitan la base (duplicados, series, sesiones).

import type { ExerciseRuleViolation } from '../../../types/repositories'
import type { Exercise } from '../../../types/workouts'
import { normalizeText } from '../../../utils/normalize'

export const MAX_EXERCISE_NAME_LENGTH = 60

export type ExerciseNameResult
  = | { ok: true, name: string, normalizedName: string }
    | { ok: false, reason: 'empty_name' | 'name_too_long' | 'duplicate_name' }

/**
 * Valida un nombre de ejercicio contra los que ya existen (`existing`), sin contar
 * mayúsculas ni acentos. `ownId` es el ejercicio que se renombra: su propio nombre no cuenta como duplicado.
 */
export function validateExerciseName(
  name: string,
  existing: readonly Pick<Exercise, 'id' | 'normalizedName'>[],
  ownId?: string,
): ExerciseNameResult {
  const trimmed = name.trim()
  if (trimmed === '') return { ok: false, reason: 'empty_name' }
  if ([...trimmed].length > MAX_EXERCISE_NAME_LENGTH) return { ok: false, reason: 'name_too_long' }
  const normalizedName = normalizeText(trimmed)
  if (existing.some(e => e.id !== ownId && e.normalizedName === normalizedName)) {
    return { ok: false, reason: 'duplicate_name' }
  }
  return { ok: true, name: trimmed, normalizedName }
}

const MESSAGES: Record<ExerciseRuleViolation, string> = {
  empty_name: 'Escribe un nombre para el ejercicio.',
  name_too_long: `El nombre no puede pasar de ${MAX_EXERCISE_NAME_LENGTH} caracteres.`,
  duplicate_name: 'Ya existe un ejercicio con ese nombre.',
  catalog_read_only: 'Los ejercicios del catálogo no se pueden cambiar ni borrar.',
  measure_locked: 'No se puede cambiar el tipo de medida: el ejercicio ya tiene series registradas.',
  exercise_in_use: 'No se puede borrar: el ejercicio aparece en alguna sesión.',
  not_found: 'El ejercicio no existe.',
}

/** Texto en español que explica por qué se rechazó un cambio (F-05, F-08). */
export function exerciseRuleMessage(reason: ExerciseRuleViolation): string {
  return MESSAGES[reason]
}

import { describe, expect, it } from 'vitest'
import { exerciseRuleMessage, validateExerciseName } from '../../../../../app/features/workouts/domain/exercise-rules'
import type { ExerciseRuleViolation } from '../../../../../app/types/repositories'

const rowing = { id: 'remo', normalizedName: 'remo con barra' }

describe('validateExerciseName', () => {
  it('F-05 rechaza un nombre que ya existe sin contar mayúsculas ni acentos', () => {
    expect(validateExerciseName('remo con bárra', [rowing])).toEqual({ ok: false, reason: 'duplicate_name' })
    expect(validateExerciseName('  REMO   con barra ', [rowing])).toEqual({ ok: false, reason: 'duplicate_name' })
  })

  it.each(['', '   '])('F-05 rechaza el nombre vacío (%j)', (name) => {
    expect(validateExerciseName(name, [])).toEqual({ ok: false, reason: 'empty_name' })
  })

  it('F-05 rechaza un nombre de más de 60 caracteres y admite uno de 60', () => {
    expect(validateExerciseName('a'.repeat(61), [])).toEqual({ ok: false, reason: 'name_too_long' })
    expect(validateExerciseName(`  ${'a'.repeat(60)}  `, [])).toEqual({ ok: true, name: 'a'.repeat(60), normalizedName: 'a'.repeat(60) })
  })

  it('F-05 cada rechazo tiene un mensaje que dice por qué', () => {
    const reasons: ExerciseRuleViolation[] = ['empty_name', 'name_too_long', 'duplicate_name', 'catalog_read_only', 'measure_locked', 'exercise_in_use', 'not_found']
    const messages = reasons.map(exerciseRuleMessage)

    expect(new Set(messages).size).toBe(reasons.length)
    expect(exerciseRuleMessage('duplicate_name')).toMatch(/ya existe/i)
    expect(exerciseRuleMessage('name_too_long')).toMatch(/60/)
  })

  it('admite un nombre válido, recortado, con su forma normalizada', () => {
    expect(validateExerciseName(' Remo en polea ', [rowing])).toEqual({ ok: true, name: 'Remo en polea', normalizedName: 'remo en polea' })
  })

  it('admite el nombre del propio ejercicio al renombrarlo con otras mayúsculas', () => {
    expect(validateExerciseName('Remo con Barra', [rowing], 'remo')).toEqual({ ok: true, name: 'Remo con Barra', normalizedName: 'remo con barra' })
  })
})

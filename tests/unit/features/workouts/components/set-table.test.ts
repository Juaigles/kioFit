import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import SetTable from '../../../../../app/features/workouts/components/SetTable.vue'
import type { ExerciseHistoryEntry } from '../../../../../app/types/repositories'
import type { Measure, Session, WorkoutSet } from '../../../../../app/types/workouts'

const past: Session = { id: 'old', type: 'strength', localDate: '2026-06-01', startedAt: '2026-06-01T10:00:00.000Z', endedAt: '2026-06-01T11:00:00.000Z', status: 'finished' }

function set(position: number, values: Partial<WorkoutSet> = {}): WorkoutSet {
  return { id: `set-${position}`, sessionExerciseId: 'x', position, done: false, ...values }
}

async function mountTable(measure: Measure, sets: WorkoutSet[], history: ExerciseHistoryEntry[] = []) {
  return mountSuspended(SetTable, { props: { exerciseName: 'Press de banca', measure, sets, history } })
}

describe('SetTable', () => {
  it.each([
    ['weight_reps', ['Serie', 'Anterior', 'Kg', 'Reps']],
    ['reps', ['Serie', 'Anterior', 'Reps']],
    ['duration', ['Serie', 'Anterior', 'Tiempo']],
  ] as const)('D-06 las cabeceras de %s son %j', async (measure, headers) => {
    const wrapper = await mountTable(measure, [set(0)])
    const cells = wrapper.findAll('[data-testid="set-table-header"] > span:not([aria-hidden])').map(cell => cell.text())
    expect(cells).toEqual(headers)
  })

  it('D-07 la referencia aparece como pista en los campos vacíos, sin ser un valor guardado', async () => {
    const history: ExerciseHistoryEntry[] = [{ session: past, sets: [set(0, { weightKg: 80, reps: 7, done: true })] }]
    const wrapper = await mountTable('weight_reps', [set(0)], history)
    const [kg, reps] = wrapper.findAll('input[data-set-field]')
    expect((kg!.element as HTMLInputElement).value).toBe('')
    expect(kg!.attributes('placeholder')).toBe('80')
    expect(reps!.attributes('placeholder')).toBe('7')
  })

  it('D-07 al marcar una serie vacía se guardan los valores de la referencia (F-19)', async () => {
    const history: ExerciseHistoryEntry[] = [{ session: past, sets: [set(0, { weightKg: 80, reps: 7, done: true })] }]
    const wrapper = await mountTable('weight_reps', [set(0)], history)
    await wrapper.get('button[aria-label="Marcar serie 1 como hecha"]').trigger('click')
    expect(wrapper.emitted('complete-set')).toEqual([['set-0', { weightKg: 80, reps: 7 }]])
  })

  it('D-08 una serie hecha se anuncia como "Desmarcar serie N de <ejercicio>" y tiene el fondo de hecha', async () => {
    const wrapper = await mountTable('weight_reps', [set(0, { weightKg: 60, reps: 10, done: true })])
    expect(wrapper.find('button[aria-label="Desmarcar serie 1 de Press de banca"]').exists()).toBe(true)
    expect(wrapper.get('li').classes()).toContain('bg-done-tint')
  })
})

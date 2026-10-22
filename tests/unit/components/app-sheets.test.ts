import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import AppActionSheet from '../../../app/components/app/AppActionSheet.vue'
import AppConfirmSheet from '../../../app/components/app/AppConfirmSheet.vue'

/** Las hojas se pintan en un portal, fuera del wrapper: se consulta el documento. */
function sheetButtons() {
  return Array.from(document.body.querySelectorAll('[role="dialog"] button'))
}
function buttonByText(text: string) {
  return sheetButtons().find(button => button.textContent?.trim() === text) as HTMLButtonElement | undefined
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AppConfirmSheet', () => {
  it('D-11 muestra título, descripción, la acción y "Cancelar"', async () => {
    await mountSuspended(AppConfirmSheet, {
      props: { open: true, title: 'Borrar entrenamiento', description: 'No se puede deshacer.', confirmLabel: 'Sí, borrar' },
    })
    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog?.textContent).toContain('Borrar entrenamiento')
    expect(dialog?.textContent).toContain('No se puede deshacer.')
    expect(buttonByText('Sí, borrar')).toBeTruthy()
    expect(buttonByText('Cancelar')).toBeTruthy()
  })

  it('D-11 confirmar emite "confirm" y cancelar cierra sin confirmar', async () => {
    const wrapper = await mountSuspended(AppConfirmSheet, {
      props: { 'open': true, 'title': 'Quitar', 'confirmLabel': 'Sí, quitar', 'onUpdate:open': (open: boolean) => wrapper.setProps({ open }) },
    })
    buttonByText('Cancelar')!.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])

    await wrapper.setProps({ open: true })
    buttonByText('Sí, quitar')!.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })
})

describe('AppActionSheet', () => {
  const actions = [
    { id: 'up', label: 'Subir', disabled: true },
    { id: 'down', label: 'Bajar' },
    { id: 'remove', label: 'Quitar ejercicio', danger: true },
  ]

  it('D-09 lista las acciones y "Cancelar"; las desactivadas no se pueden pulsar', async () => {
    await mountSuspended(AppActionSheet, { props: { open: true, title: 'Opciones', actions } })
    expect(sheetButtons().map(button => button.textContent?.trim())).toEqual(
      expect.arrayContaining(['Subir', 'Bajar', 'Quitar ejercicio', 'Cancelar']),
    )
    expect(buttonByText('Subir')!.disabled).toBe(true)
    expect(buttonByText('Bajar')!.disabled).toBe(false)
  })

  it('D-09 elegir una acción emite "select" con su id y cierra la hoja', async () => {
    const wrapper = await mountSuspended(AppActionSheet, { props: { open: true, title: 'Opciones', actions } })
    buttonByText('Bajar')!.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('select')).toEqual([['down']])
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })
})

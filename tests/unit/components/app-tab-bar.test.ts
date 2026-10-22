import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AppTabBar from '../../../app/components/app/AppTabBar.vue'
import { APP_TABS } from '../../../app/utils/tabs'

describe('AppTabBar', () => {
  it('D-02 tiene, en este orden, Hoy, Entrenar y Ajustes (solo módulos construidos)', () => {
    expect(APP_TABS.map(tab => tab.label)).toEqual(['Hoy', 'Entrenar', 'Ajustes'])
  })

  it('D-01 pinta un enlace por pestaña dentro de la navegación principal', async () => {
    const wrapper = await mountSuspended(AppTabBar, { props: { items: APP_TABS }, route: '/workouts' })
    const nav = wrapper.get('nav[aria-label="Principal"]')
    const links = nav.findAll('a')
    expect(links.map(link => link.text())).toEqual(['Hoy', 'Entrenar', 'Ajustes'])
    expect(links.map(link => link.attributes('href'))).toEqual(['/', '/workouts', '/data'])
  })

  it('D-01 marca como actual solo la pestaña de la ruta abierta', async () => {
    const wrapper = await mountSuspended(AppTabBar, { props: { items: APP_TABS }, route: '/workouts/history/abc' })
    const current = wrapper.findAll('a[aria-current="page"]')
    expect(current.map(link => link.text())).toEqual(['Entrenar'])
  })

  it('D-01 en la portada solo Hoy está marcada', async () => {
    const wrapper = await mountSuspended(AppTabBar, { props: { items: APP_TABS }, route: '/' })
    expect(wrapper.findAll('a[aria-current="page"]').map(link => link.text())).toEqual(['Hoy'])
  })
})

import { describe, expect, it } from 'vitest'
import config from '../../nuxt.config'

describe('esqueleto', () => {
  it('es una SPA sin SSR con TypeScript estricto', () => {
    expect(config.ssr).toBe(false)
    expect(config.typescript?.strict).toBe(true)
  })

  it('registra los módulos del stack', () => {
    expect(config.modules).toEqual(
      expect.arrayContaining(['@nuxt/ui', '@pinia/nuxt', '@vite-pwa/nuxt', '@nuxt/eslint']),
    )
  })

  it('tiene IndexedDB falso disponible en los tests', () => {
    expect(globalThis.indexedDB).toBeDefined()
  })
})

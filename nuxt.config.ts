// Import explícito para que los tests de Vitest puedan leer esta configuración fuera de Nuxt.
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@pinia/nuxt', '@vite-pwa/nuxt', '@nuxt/eslint'],

  // SPA estática: IndexedDB solo existe en el navegador (ADR-0008).
  ssr: false,

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'kioFit',
      meta: [{ name: 'theme-color', content: '#0f172a' }],
    },
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2026-10-19',

  typescript: {
    strict: true,
    // Que `nuxt typecheck` cubra también los tests y las configs de test.
    nodeTsConfig: {
      include: ['../tests/**/*.ts', '../vitest.config.ts', '../playwright.config.ts'],
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  // Configuración mínima; el precache para funcionar sin red llega con la T10.
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'kioFit',
      short_name: 'kioFit',
      description: 'Entrenamientos de fuerza, peso y comidas, sin conexión.',
      lang: 'es',
      display: 'standalone',
      background_color: '#0f172a',
      theme_color: '#0f172a',
    },
  },
})

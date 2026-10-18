import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Entorno de Nuxt (auto-imports, plugins y módulos) sobre happy-dom.
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        overrides: {
          // El plugin que registra el service worker importa un módulo virtual de
          // vite-plugin-pwa que Vitest no resuelve; en los tests no hay service worker.
          pwa: { client: { registerPlugin: false } },
        },
      },
    },
    setupFiles: ['fake-indexeddb/auto'],
    include: ['tests/unit/**/*.test.ts'],
  },
})

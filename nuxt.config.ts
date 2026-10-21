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

  compatibilityDate: '2026-10-18',

  // Solo estáticos (ADR-0008). Sin esto, Nitro detecta Cloudflare Workers Builds y genera una
  // configuración de Worker con un `index.mjs` que `nuxt generate` no crea, y el despliegue falla.
  nitro: { preset: 'static' },

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

  // Sin red (F-22): el service worker precachea la app, las rutas y la semilla (va dentro de los chunks JS).
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
      icons: [
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,webmanifest,woff2}'],
      // SPA: cualquier ruta de navegación sin conexión arranca desde la portada y Vue Router resuelve.
      navigateFallback: '/',
    },
  },
})

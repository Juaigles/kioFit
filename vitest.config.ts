import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['fake-indexeddb/auto'],
    include: ['tests/unit/**/*.test.ts'],
  },
})

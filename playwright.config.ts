import { defineConfig, devices } from '@playwright/test'

const port = 3000
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  // Playwright se ejecuta contra el build estático de `nuxt generate` (lo mismo que `pnpm build`),
  // como en producción. Se llama a `nuxt` directamente para no depender de un pnpm global.
  webServer: {
    command: `nuxt generate && node scripts/serve-static.mjs`,
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})

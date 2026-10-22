import { expect, test } from '@playwright/test'

const BACKGROUND = {
  dark: 'rgb(11, 13, 16)',
  light: 'rgb(242, 243, 245)',
} as const

for (const scheme of ['dark', 'light'] as const) {
  test(`D-16 la app sigue al sistema en modo ${scheme}, sin destello del otro`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    // El modo debe estar puesto antes de que arranque la app, no después.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        (window as unknown as { __modeAtLoad: string }).__modeAtLoad = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      })
    })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'kioFit' })).toBeVisible()

    expect(await page.evaluate(() => (window as unknown as { __modeAtLoad: string }).__modeAtLoad)).toBe(scheme)
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(background).toBe(BACKGROUND[scheme])
  })
}

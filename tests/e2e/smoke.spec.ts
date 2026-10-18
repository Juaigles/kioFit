import { expect, test } from '@playwright/test'

test('abre la portada', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'kioFit' })).toBeVisible()
})

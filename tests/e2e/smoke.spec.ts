import { expect, test } from '@playwright/test'

test('abre Hoy', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hoy' })).toBeVisible()
})

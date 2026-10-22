import { expect, test, type Page } from '@playwright/test'

async function startWithBench(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
}

test('D-08 marcar una serie pinta su fila como hecha y el botón pasa a "Desmarcar serie N de <ejercicio>"', async ({ page }) => {
  await startWithBench(page)
  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('80')
  await page.getByRole('textbox', { name: 'Reps serie 1' }).fill('8')

  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()

  await expect(page.getByRole('button', { name: 'Desmarcar serie 1 de Press de banca' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem').first()).toHaveClass(/bg-done-tint/)
})

test('D-10 pulsar el número de la serie abre una hoja con "Borrar serie" y "Cancelar"', async ({ page }) => {
  await startWithBench(page)
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  const sets = page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem')
  await expect(sets).toHaveCount(2)

  await page.getByRole('button', { name: 'Opciones de la serie 2' }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('button', { name: 'Borrar serie' })).toBeVisible()
  await sheet.getByRole('button', { name: 'Cancelar' }).click()
  await expect(sheet).toBeHidden()
  await expect(sets).toHaveCount(2)

  await page.getByRole('button', { name: 'Opciones de la serie 2' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar serie' }).click()
  await expect(sets).toHaveCount(1)
})

test('D-18 todos los botones y campos de la sesión miden al menos 44 × 44 px', async ({ page }) => {
  await startWithBench(page)

  const targets = page.locator('button:visible, input:visible, a:visible')
  const count = await targets.count()
  expect(count).toBeGreaterThan(5)
  for (let index = 0; index < count; index++) {
    const target = targets.nth(index)
    const box = await target.boundingBox()
    const label = await target.evaluate(element => element.getAttribute('aria-label') ?? element.textContent?.trim() ?? element.tagName)
    expect(box!.width, `ancho de "${label}"`).toBeGreaterThanOrEqual(44)
    expect(box!.height, `alto de "${label}"`).toBeGreaterThanOrEqual(44)
  }
})

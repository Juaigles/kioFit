import { expect, test, type Page } from '@playwright/test'

async function startWithBench(page: Page) {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
}

async function markFirstSet(page: Page) {
  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('80')
  await page.getByRole('textbox', { name: 'Reps serie 1' }).fill('8')
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()
}

test('D-11 descartar la sesión abre la hoja con la acción y "Cancelar", y no borra hasta confirmar', async ({ page }) => {
  await startWithBench(page)
  await markFirstSet(page)

  await page.getByRole('button', { name: 'Descartar entrenamiento' }).click()

  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('¿Descartar el entrenamiento?')
  await expect(sheet.getByRole('button', { name: 'Sí, descartar' })).toBeVisible()
  await sheet.getByRole('button', { name: 'Cancelar' }).click()
  await expect(sheet).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
})

test('D-11 quitar un ejercicio con series hechas usa la misma hoja', async ({ page }) => {
  await startWithBench(page)
  await markFirstSet(page)

  await page.getByRole('button', { name: 'Quitar Press de banca' }).click()

  const sheet = page.getByRole('dialog')
  await expect(sheet).toContainText('Tiene series hechas. ¿Quitar el ejercicio?')
  await expect(sheet.getByRole('button', { name: 'Sí, quitar' })).toBeVisible()
  await sheet.getByRole('button', { name: 'Cancelar' }).click()
  await expect(sheet).toBeHidden()
  await expect(page.getByRole('heading', { level: 2, name: 'Press de banca' })).toBeVisible()
})

test('D-11 terminar sin series hechas ofrece descartar en la misma hoja', async ({ page }) => {
  await startWithBench(page)

  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()

  const sheet = page.getByRole('dialog')
  await expect(sheet).toContainText('No hay ninguna serie hecha')
  await expect(sheet.getByRole('button', { name: 'Descartar' })).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Cancelar' })).toBeVisible()
})

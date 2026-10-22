import { expect, test, type Page } from '@playwright/test'

async function addExercise(page: Page, search: string, name: string) {
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill(search)
  await page.getByRole('button', { name, exact: true }).click()
}

async function startWithTwoExercises(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await addExercise(page, 'press de banca', 'Press de banca')
  await addExercise(page, 'press de banca inclinado', 'Press de banca inclinado')
}

test('D-09 las opciones del ejercicio abren una hoja con Subir, Bajar, Quitar ejercicio y Cancelar', async ({ page }) => {
  await startWithTwoExercises(page)

  await page.getByRole('button', { name: 'Opciones de Press de banca', exact: true }).click()

  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('button', { name: 'Subir' })).toBeDisabled()
  await expect(sheet.getByRole('button', { name: 'Bajar' })).toBeEnabled()
  await expect(sheet.getByRole('button', { name: 'Quitar ejercicio' })).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Cancelar' })).toBeVisible()
})

test('D-09 Bajar está desactivado en el último ejercicio y Subir lo mueve arriba', async ({ page }) => {
  await startWithTwoExercises(page)

  await page.getByRole('button', { name: 'Opciones de Press de banca inclinado' }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('button', { name: 'Bajar' })).toBeDisabled()
  await sheet.getByRole('button', { name: 'Subir' }).click()

  await expect(sheet).toBeHidden()
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Press de banca inclinado', 'Press de banca'])
})

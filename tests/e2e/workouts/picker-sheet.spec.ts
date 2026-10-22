import { expect, test } from '@playwright/test'

test('D-12 "Añadir ejercicio" abre una hoja con el foco en la búsqueda; un toque en un resultado lo añade y cierra la hoja', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()

  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()

  const sheet = page.getByRole('dialog')
  const search = sheet.getByRole('searchbox', { name: 'Buscar ejercicio' })
  await expect(search).toBeFocused()
  await search.fill('press de banca')
  await sheet.getByRole('button', { name: 'Press de banca', exact: true }).click()

  await expect(sheet).toBeHidden()
  await expect(page.getByRole('heading', { level: 2, name: 'Press de banca' })).toBeVisible()
})

test('D-12 sin coincidencia exacta la hoja ofrece "Crear ejercicio «texto»" al final', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()

  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press')

  const create = page.getByRole('dialog').getByRole('button', { name: 'Crear ejercicio «press»' })
  await expect(create).toBeVisible()
})

test('D-12 cancelar cierra la hoja sin añadir nada', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()

  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0)
})

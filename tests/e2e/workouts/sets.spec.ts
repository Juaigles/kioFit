import { expect, test } from '@playwright/test'

test('F-14 añade una serie, quita otra y la numeración se actualiza', async ({ page }) => {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()

  const sets = page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem')
  await expect(sets).toHaveCount(1)

  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  await expect(sets).toHaveCount(3)
  // El número de serie es el botón que abre sus opciones (D-10).
  const numbers = sets.getByRole('button', { name: /Opciones de la serie/ })
  await expect(numbers).toHaveText(['1', '2', '3'])

  // Borrar una serie está en la hoja del número de serie (D-10).
  await page.getByRole('button', { name: 'Opciones de la serie 2' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar serie' }).click()

  await expect(sets).toHaveCount(2)
  await expect(numbers).toHaveText(['1', '2'])
})

test('marcar una serie como hecha con un toque la deja marcada y otro toque la desmarca', async ({ page }) => {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()

  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('80')
  await page.getByRole('textbox', { name: 'Reps serie 1' }).fill('8')
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()
  await expect(page.getByRole('button', { name: 'Desmarcar serie 1' })).toBeVisible()
  await page.getByRole('button', { name: 'Desmarcar serie 1' }).click()
  await expect(page.getByRole('button', { name: 'Marcar serie 1 como hecha' })).toBeVisible()
})

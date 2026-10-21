import { expect, test } from '@playwright/test'

test('F-21 recargar en mitad de una sesión conserva ejercicios, series y valores', async ({ page }) => {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('82,5')
  await page.getByRole('textbox', { name: 'Reps serie 1' }).fill('8')
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()
  await expect(page.getByRole('button', { name: 'Desmarcar serie 1' })).toBeVisible()

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Entrenamiento en curso' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Kg serie 1' })).toHaveValue('82,5')
  await expect(page.getByRole('textbox', { name: 'Reps serie 1' })).toHaveValue('8')
  await expect(page.getByRole('button', { name: 'Desmarcar serie 1' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toHaveCount(0)
})

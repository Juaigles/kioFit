import { expect, test, type Page } from '@playwright/test'

async function addExercise(page: Page, search: string, name: string) {
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill(search)
  await page.getByRole('button', { name: name, exact: true }).click()
}

async function startSession(page: Page) {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
}

test('F-12 añade dos ejercicios, cambia su orden y cada uno tiene una serie vacía', async ({ page }) => {
  await startSession(page)
  await addExercise(page, 'press de banca', 'Press de banca')
  await addExercise(page, 'press de banca inclinado', 'Press de banca inclinado')

  const cards = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 2 }) })
  await expect(cards.getByRole('heading', { level: 2 })).toHaveText(['Press de banca', 'Press de banca inclinado'])
  await expect(page.getByRole('list', { name: /Series de/ })).toHaveCount(2)
  await expect(page.getByRole('listitem').filter({ hasText: /^Serie 1/ })).toHaveCount(2)

  await page.getByRole('button', { name: 'Subir Press de banca inclinado' }).click()

  await expect(cards.getByRole('heading', { level: 2 })).toHaveText(['Press de banca inclinado', 'Press de banca'])
})

test('F-13 quitar un ejercicio sin series hechas no pregunta', async ({ page }) => {
  await startSession(page)
  await addExercise(page, 'press de banca', 'Press de banca')

  await page.getByRole('button', { name: 'Quitar Press de banca' }).click()

  await expect(page.getByRole('heading', { level: 2, name: 'Press de banca' })).toHaveCount(0)
})

test('F-13 con series hechas pide confirmación y solo quita si se confirma', async ({ page }) => {
  await startSession(page)
  await addExercise(page, 'press de banca', 'Press de banca')
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()

  await page.getByRole('button', { name: 'Quitar Press de banca' }).click()
  await expect(page.getByText('Tiene series hechas. ¿Quitar el ejercicio?')).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Press de banca' })).toBeVisible()

  await page.getByRole('button', { name: 'Quitar Press de banca' }).click()
  await page.getByRole('button', { name: 'Sí, quitar' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Press de banca' })).toHaveCount(0)
})

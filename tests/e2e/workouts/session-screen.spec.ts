import { expect, test, type Page } from '@playwright/test'

async function startWithBench(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
}

test('D-03 la sesión ocupa la pantalla sin barra de pestañas y con Minimizar y Terminar arriba', async ({ page }) => {
  await startWithBench(page)

  await expect(page).toHaveURL(/\/workouts\/session$/)
  await expect(page.getByRole('navigation', { name: 'Principal' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Minimizar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Terminar entrenamiento' })).toBeVisible()
  await expect(page.getByText('Duración')).toBeVisible()
  await expect(page.getByText('Volumen')).toBeVisible()
  await expect(page.getByText('0/1')).toBeVisible()
})

test('D-04 minimizada, Hoy y Entrenar ofrecen Continuar con los minutos y las series, y vuelve a la sesión', async ({ page }) => {
  await startWithBench(page)

  await page.getByRole('button', { name: 'Minimizar' }).click()
  await expect(page).toHaveURL(/\/$/)
  const nav = page.getByRole('navigation', { name: 'Principal' })
  const continueToday = page.getByRole('link', { name: /Continuar entrenamiento/ })
  await expect(continueToday).toContainText('min')
  await expect(continueToday).toContainText('0/1 series')

  await nav.getByRole('link', { name: 'Entrenar' }).click()
  await expect(page.getByRole('link', { name: /Continuar entrenamiento/ })).toContainText('0/1 series')

  await page.getByRole('link', { name: /Continuar entrenamiento/ }).click()
  await expect(page).toHaveURL(/\/workouts\/session$/)
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
})

test('D-04 abrir la sesión sin ninguna en curso lleva a Entrenar', async ({ page }) => {
  await page.goto('/workouts/session')
  await expect(page).toHaveURL(/\/workouts$/)
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
})

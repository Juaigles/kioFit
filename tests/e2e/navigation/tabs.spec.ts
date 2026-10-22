import { expect, test } from '@playwright/test'

test('D-01 la barra de pestañas lleva a Entrenar y marca la pestaña actual', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Principal' })
  await expect(nav.getByRole('link', { name: 'Hoy' })).toHaveAttribute('aria-current', 'page')

  await nav.getByRole('link', { name: 'Entrenar' }).click()

  await expect(page).toHaveURL(/\/workouts$/)
  await expect(nav.getByRole('link', { name: 'Entrenar' })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('link', { name: 'Hoy' })).not.toHaveAttribute('aria-current', 'page')
})

test('D-01 la pestaña Ajustes abre Ajustes y la barra sigue visible', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Principal' })
  await nav.getByRole('link', { name: 'Ajustes' }).click()

  await expect(page.getByRole('heading', { name: 'Ajustes', level: 1 })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Ajustes' })).toHaveAttribute('aria-current', 'page')
})

test('desde Hoy se empieza un entrenamiento con un toque', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()

  await expect(page.getByRole('heading', { name: 'Entrenamiento en curso' })).toBeVisible()
})

test('con una sesión en curso, Hoy ofrece continuarla', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  // Se espera a que la sesión esté guardada antes de salir de la página.
  await expect(page.getByRole('heading', { name: 'Entrenamiento en curso' })).toBeVisible()
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Continuar entrenamiento' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toHaveCount(0)
})

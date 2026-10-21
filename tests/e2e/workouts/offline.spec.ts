import { expect, test } from '@playwright/test'

test('F-22 sin red se puede recargar, empezar, registrar y terminar una sesión', async ({ page, context }) => {
  // Primera carga con red: el service worker precachea la app y la semilla.
  await page.goto('/workouts')
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // Con el service worker ya al mando de la página, se corta la red.
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await context.setOffline(true)

  await page.reload()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('80')
  await page.getByRole('textbox', { name: 'Reps serie 1' }).fill('8')
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()

  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
})

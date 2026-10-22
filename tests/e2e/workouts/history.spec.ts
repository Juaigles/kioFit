import { expect, test, type Page } from '@playwright/test'

/** Entrena press de banca (una serie de `kg` × 5) a las 10:00 del día dado y termina 45 min después. */
async function finishSessionOn(page: Page, day: string, kg: string, extraSets = 0) {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`))
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  for (let i = 0; i < extraSets; i++) await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  for (let serie = 1; serie <= 1 + extraSets; serie++) {
    await page.getByRole('textbox', { name: `Kg serie ${serie}` }).fill(kg)
    await page.getByRole('textbox', { name: `Reps serie ${serie}` }).fill('5')
    await page.getByRole('button', { name: `Marcar serie ${serie} como hecha` }).click()
    await expect(page.getByRole('button', { name: `Desmarcar serie ${serie}` })).toBeVisible()
  }
  await page.clock.setFixedTime(new Date(`${day}T10:45:00`))
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
}

test('F-26 el historial lista las sesiones de la más reciente a la más antigua con fecha, duración, ejercicios y series', async ({ page }) => {
  await finishSessionOn(page, '2026-06-01', '60')
  await finishSessionOn(page, '2026-06-03', '70', 2)
  await finishSessionOn(page, '2026-06-02', '65', 1)

  await page.goto('/workouts')

  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible()
  const items = page.getByRole('list', { name: 'Sesiones terminadas' }).getByRole('listitem')
  await expect(items).toHaveCount(3)
  await expect(items.nth(0)).toContainText('miércoles, 3 de junio de 2026')
  await expect(items.nth(0)).toContainText('45 min')
  await expect(items.nth(0)).toContainText('1 ejercicio')
  await expect(items.nth(0)).toContainText('3 series')
  await expect(items.nth(1)).toContainText('martes, 2 de junio de 2026')
  await expect(items.nth(1)).toContainText('2 series')
  await expect(items.nth(2)).toContainText('lunes, 1 de junio de 2026')
  await expect(items.nth(2)).toContainText('1 serie')
})

test('F-26 el historial vacío lo dice y está en Entrenar', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Entrenar' }).click()

  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible()
  await expect(page.getByText('Todavía no hay entrenamientos terminados')).toBeVisible()
})

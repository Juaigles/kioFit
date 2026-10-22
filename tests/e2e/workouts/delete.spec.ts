import { expect, test, type Page } from '@playwright/test'

/** Termina una sesión de press de banca con una serie `kg` × `reps`, el día dado. */
async function finishBenchOn(page: Page, day: string, kg: string, reps: string) {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`))
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill(kg)
  await page.getByRole('textbox', { name: 'Reps serie 1' }).fill(reps)
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()
  await expect(page.getByRole('button', { name: 'Desmarcar serie 1' })).toBeVisible()
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
}

async function openLatestDetail(page: Page) {
  await page.goto('/workouts/history')
  await page.getByRole('list', { name: 'Sesiones terminadas' }).getByRole('link').first().click()
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
}

test('F-28 cancelar el borrado conserva la sesión', async ({ page }) => {
  await finishBenchOn(page, '2026-06-01', '60', '10')
  await openLatestDetail(page)

  await page.getByRole('button', { name: 'Borrar entrenamiento' }).click()
  const confirm = page.getByRole('dialog').filter({ hasText: '¿Borrar el entrenamiento?' })
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Cancelar' }).click()

  await expect(confirm).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
  await page.goto('/workouts/history')
  await expect(page.getByRole('list', { name: 'Sesiones terminadas' }).getByRole('listitem')).toHaveCount(1)
})

test('F-28 borrar y confirmar la quita del historial y deja de ser la referencia', async ({ page }) => {
  await finishBenchOn(page, '2026-06-01', '60', '10')
  await finishBenchOn(page, '2026-06-02', '70', '5')
  await openLatestDetail(page)

  await page.getByRole('button', { name: 'Borrar entrenamiento' }).click()
  await page.getByRole('dialog').filter({ hasText: '¿Borrar el entrenamiento?' })
    .getByRole('button', { name: 'Sí, borrar' }).click()

  await expect(page).toHaveURL(/\/workouts\/history\/?$/)
  const list = page.getByRole('list', { name: 'Sesiones terminadas' }).getByRole('listitem')
  await expect(list).toHaveCount(1)

  await page.clock.setFixedTime(new Date('2026-06-03T10:00:00'))
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  const sets = page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem')
  await expect(sets.nth(0)).toContainText('60 × 10')
  await expect(sets.nth(0)).not.toContainText('70 × 5')
})

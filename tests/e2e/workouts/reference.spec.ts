import { expect, test, type Page } from '@playwright/test'

async function addExercise(page: Page, search: string, name: string) {
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill(search)
  await page.getByRole('button', { name, exact: true }).click()
}

/** Termina una sesión de press de banca con la serie 1 en 60 × 10 y la 2 en 80 × 8 (flujo de F-23). */
async function finishBenchSession(page: Page) {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await addExercise(page, 'press de banca', 'Press de banca')
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  for (const [serie, kg, reps] of [[1, '60', '10'], [2, '80', '8']] as const) {
    await page.getByRole('textbox', { name: `Kg serie ${serie}` }).fill(kg)
    await page.getByRole('textbox', { name: `Reps serie ${serie}` }).fill(reps)
    await page.getByRole('button', { name: `Marcar serie ${serie} como hecha` }).click()
    await expect(page.getByRole('button', { name: `Desmarcar serie ${serie}` })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
}

test('F-18 cada serie muestra lo que se hizo en la misma posición la vez anterior', async ({ page }) => {
  await finishBenchSession(page)
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await addExercise(page, 'press de banca', 'Press de banca')
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()

  const sets = page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem')
  await expect(sets.nth(0)).toContainText('60 × 10')
  await expect(sets.nth(1)).toContainText('80 × 8')
  await expect(sets.nth(2)).toContainText('—')
})

test('F-19 marcar una serie vacía con referencia la deja hecha con 80 kg y 8 reps', async ({ page }) => {
  await finishBenchSession(page)
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await addExercise(page, 'press de banca', 'Press de banca')
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()

  await page.getByRole('button', { name: 'Marcar serie 2 como hecha' }).click()

  await expect(page.getByRole('button', { name: 'Desmarcar serie 2' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Kg serie 2' })).toHaveValue('80')
  await expect(page.getByRole('textbox', { name: 'Reps serie 2' })).toHaveValue('8')
  await expect(page.getByRole('button', { name: 'Marcar serie 1 como hecha' })).toBeVisible()
})

test('F-19 no pisa lo que ya está escrito en la serie', async ({ page }) => {
  await finishBenchSession(page)
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await addExercise(page, 'press de banca', 'Press de banca')

  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('62,5')
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()

  await expect(page.getByRole('button', { name: 'Desmarcar serie 1' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Kg serie 1' })).toHaveValue('62,5')
  await expect(page.getByRole('textbox', { name: 'Reps serie 1' })).toHaveValue('10')
})

test('F-20 una serie vacía sin referencia no se marca e indica qué campos faltan', async ({ page }) => {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await addExercise(page, 'press de banca', 'Press de banca')
  await expect(page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem')).toContainText('—')

  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()

  await expect(page.getByRole('button', { name: 'Marcar serie 1 como hecha' })).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Faltan kg y reps' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('50')
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Falta reps' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Marcar serie 1 como hecha' })).toBeVisible()
})

import { expect, test, type Page } from '@playwright/test'

/** Termina una sesión de press de banca con 60 × 10 y 80 × 8, el día dado. */
async function finishBenchOn(page: Page, day: string) {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`))
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
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

async function openDetail(page: Page) {
  await page.goto('/workouts')
  await page.getByRole('list', { name: 'Sesiones terminadas' }).getByRole('link').first().click()
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
}

test('F-27 cambiar un valor, añadir una serie y quitar otra se guarda y el historial lo refleja', async ({ page }) => {
  await finishBenchOn(page, '2026-06-01')
  await openDetail(page)

  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('62,5')
  await page.getByRole('textbox', { name: 'Reps serie 1' }).focus()
  await expect(page.getByRole('textbox', { name: 'Kg serie 1' })).toHaveValue('62,5')

  // Borrar una serie está en la hoja del número de serie (D-10).
  await page.getByRole('button', { name: 'Opciones de la serie 2' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar serie' }).click()
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  const sets = page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem')
  await expect(sets).toHaveCount(3)
  await page.getByRole('textbox', { name: 'Kg serie 3' }).fill('90')
  await page.getByRole('textbox', { name: 'Reps serie 3' }).fill('3')
  await page.getByRole('textbox', { name: 'Reps serie 3' }).blur()
  await expect(page.getByRole('button', { name: 'Desmarcar serie 3' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Kg serie 1' })).toHaveValue('62,5')
  await expect(page.getByRole('textbox', { name: 'Kg serie 3' })).toHaveValue('90')
  await expect(page.getByRole('textbox', { name: 'Reps serie 3' })).toHaveValue('3')

  await page.getByRole('link', { name: 'Historial' }).click()
  await expect(page.getByRole('list', { name: 'Sesiones terminadas' }).getByRole('listitem')).toContainText('3 series')
})

test('F-27 en el detalle la referencia es la sesión terminada anterior, no la propia sesión', async ({ page }) => {
  await finishBenchOn(page, '2026-06-01')
  await finishBenchOn(page, '2026-06-02')
  await page.goto('/workouts')
  // La más antigua es la última de la lista: sin sesión anterior, sus referencias son "—".
  await page.getByRole('list', { name: 'Sesiones terminadas' }).getByRole('link').last().click()
  const oldSets = page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem')
  await expect(oldSets.nth(0)).toContainText('—')
  await expect(oldSets.nth(1)).toContainText('—')

  await page.goBack()
  await page.getByRole('list', { name: 'Sesiones terminadas' }).getByRole('link').first().click()
  const newSets = page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem')
  await expect(newSets.nth(0)).toContainText('60 × 10')
  await expect(newSets.nth(1)).toContainText('80 × 8')
})

test('F-27 una sesión que no existe lo dice y vuelve al historial', async ({ page }) => {
  await page.goto('/workouts/history/no-existe')

  await expect(page.getByText('No se encuentra este entrenamiento')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Historial' })).toBeVisible()
})

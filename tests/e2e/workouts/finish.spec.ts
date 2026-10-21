import { expect, test, type Page } from '@playwright/test'

async function startWithBench(page: Page) {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible()
}

test('F-24 terminar sin nada hecho ofrece descartar en lugar de terminar', async ({ page }) => {
  await startWithBench(page)

  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()

  const notice = page.getByRole('alert').filter({ hasText: 'No hay ninguna serie hecha' })
  await expect(notice).toBeVisible()
  await expect(notice.getByRole('button', { name: 'Descartar' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Entrenamiento en curso' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toHaveCount(0)
})

test('F-25 descartar y confirmar borra la sesión y vuelve a Empezar entrenamiento', async ({ page }) => {
  await startWithBench(page)
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()

  await page.getByRole('button', { name: 'Descartar entrenamiento' }).click()
  const confirm = page.getByRole('alert').filter({ hasText: '¿Descartar el entrenamiento?' })
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('heading', { name: 'Entrenamiento en curso' })).toBeVisible()

  await page.getByRole('button', { name: 'Descartar entrenamiento' }).click()
  await confirm.getByRole('button', { name: 'Sí, descartar' }).click()

  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
})

test('F-23 terminar con series hechas cierra la sesión y vuelve a Empezar entrenamiento', async ({ page }) => {
  await startWithBench(page)
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()

  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()

  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
})

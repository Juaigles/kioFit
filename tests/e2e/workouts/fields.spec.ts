import { expect, test, type Page } from '@playwright/test'

async function addExercise(page: Page, search: string, name: string) {
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill(search)
  await page.getByRole('button', { name, exact: true }).click()
}

/** Espera a que IndexedDB tenga guardados `count` valores de serie, para recargar sin carreras. */
async function waitForSavedValues(page: Page, count: number) {
  await expect.poll(() => page.evaluate(async () => {
    const [info] = await indexedDB.databases()
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(info!.name!)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const sets = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
      const request = db.transaction('sets').objectStore('sets').getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return sets.reduce((total, set) => total + ['weightKg', 'reps', 'durationSeconds'].filter(key => set[key] !== undefined).length, 0)
  })).toBe(count)
}

async function startSession(page: Page) {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
}

test('F-15 pide kg y reps, solo reps o mm:ss según el tipo de medida', async ({ page }) => {
  await startSession(page)
  await addExercise(page, 'press de banca', 'Press de banca')
  await addExercise(page, 'flexiones', 'Flexiones')
  await addExercise(page, 'plancha', 'Plancha')

  const bench = page.getByRole('list', { name: 'Series de Press de banca' })
  await expect(bench.getByRole('textbox', { name: 'Kg serie 1' })).toHaveAttribute('inputmode', 'decimal')
  await expect(bench.getByRole('textbox', { name: 'Reps serie 1' })).toHaveAttribute('inputmode', 'numeric')

  const pushups = page.getByRole('list', { name: 'Series de Flexiones' })
  await expect(pushups.getByRole('textbox', { name: 'Reps serie 1' })).toBeVisible()
  await expect(pushups.getByRole('textbox', { name: 'Kg serie 1' })).toHaveCount(0)

  const plank = page.getByRole('list', { name: 'Series de Plancha' })
  await expect(plank.getByRole('textbox', { name: 'Tiempo serie 1 (mm:ss)' })).toHaveAttribute('inputmode', 'numeric')
  await expect(plank.getByRole('textbox', { name: 'Reps serie 1' })).toHaveCount(0)
  await expect(plank.getByRole('textbox', { name: 'Kg serie 1' })).toHaveCount(0)
})

test('F-15 los valores escritos se guardan, aceptan coma y se muestran con coma', async ({ page }) => {
  await startSession(page)
  await addExercise(page, 'press de banca', 'Press de banca')
  await addExercise(page, 'plancha', 'Plancha')

  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('82.5')
  await page.getByRole('textbox', { name: 'Reps serie 1' }).fill('8')
  await page.getByRole('textbox', { name: 'Tiempo serie 1 (mm:ss)' }).fill('1:30')
  await page.getByRole('textbox', { name: 'Tiempo serie 1 (mm:ss)' }).blur()
  await waitForSavedValues(page, 3)
  await page.reload()

  await expect(page.getByRole('textbox', { name: 'Kg serie 1' })).toHaveValue('82,5')
  await expect(page.getByRole('textbox', { name: 'Reps serie 1' })).toHaveValue('8')
  await expect(page.getByRole('textbox', { name: 'Tiempo serie 1 (mm:ss)' })).toHaveValue('1:30')
})

test('F-15 un texto no válido se indica y no rompe la fila; vaciarlo borra el valor', async ({ page }) => {
  await startSession(page)
  await addExercise(page, 'press de banca', 'Press de banca')
  const kg = page.getByRole('textbox', { name: 'Kg serie 1' })

  await kg.fill('80')
  await kg.blur()
  await waitForSavedValues(page, 1)
  await kg.fill('abc')
  await kg.blur()

  await expect(kg).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('alert').filter({ hasText: 'Peso no válido' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Marcar serie 1 como hecha' })).toBeVisible()
  await waitForSavedValues(page, 1)
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Kg serie 1' })).toHaveValue('80')

  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('')
  await page.getByRole('textbox', { name: 'Kg serie 1' }).blur()
  await waitForSavedValues(page, 0)
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Kg serie 1' })).toHaveValue('')
})

test('F-17 "Siguiente" pasa de kg a reps y de reps a kg de la serie siguiente', async ({ page }) => {
  await startSession(page)
  await addExercise(page, 'press de banca', 'Press de banca')
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()

  const kg1 = page.getByRole('textbox', { name: 'Kg serie 1' })
  await expect(kg1).toHaveAttribute('enterkeyhint', 'next')
  await kg1.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('textbox', { name: 'Reps serie 1' })).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(page.getByRole('textbox', { name: 'Kg serie 2' })).toBeFocused()
})

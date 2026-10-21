import { expect, test, type Page } from '@playwright/test'

/** Lee las sesiones guardadas en IndexedDB del navegador. */
function storedSessions(page: Page) {
  return page.evaluate(() => new Promise<Record<string, unknown>[]>((resolve, reject) => {
    const open = indexedDB.open('kiofit')
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const request = open.result.transaction('sessions').objectStore('sessions').getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    }
  }))
}

test('F-10 empezar entrenamiento crea una sesión en curso con la fecha de hoy', async ({ page }) => {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()

  await expect(page.getByRole('heading', { name: 'Entrenamiento en curso' })).toBeVisible()
  const [session] = await storedSessions(page)
  const today = await page.evaluate(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  expect(session).toMatchObject({ type: 'strength', status: 'in_progress', localDate: today })
  expect(typeof session!.startedAt).toBe('string')
})

test('F-04 crear un ejercicio propio desde una búsqueda sin resultados lo añade a la sesión', async ({ page }) => {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()

  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('Zancadas búlgaras con mancuerna')
  await expect(page.getByText('Sin resultados')).toBeVisible()
  await page.getByRole('button', { name: 'Crear ejercicio propio' }).click()
  await page.getByRole('radio', { name: 'Peso y repeticiones' }).click()
  await page.getByRole('button', { name: 'Crear y añadir' }).click()

  const list = page.getByRole('list', { name: 'Ejercicios de la sesión' })
  await expect(list.getByText('Zancadas búlgaras con mancuerna')).toBeVisible()

  // Ya existe en el catálogo: al buscarlo otra vez aparece como resultado.
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('zancadas bulgaras')
  await expect(page.getByRole('button', { name: /Zancadas búlgaras con mancuerna/ })).toBeVisible()
})

test('F-04 muestra el motivo si el nombre del ejercicio propio es demasiado largo', async ({ page }) => {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('x'.repeat(61))
  await page.getByRole('button', { name: 'Crear ejercicio propio' }).click()
  await page.getByRole('button', { name: 'Crear y añadir' }).click()

  await expect(page.getByText('El nombre no puede pasar de 60 caracteres.')).toBeVisible()
})

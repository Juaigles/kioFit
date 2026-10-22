import { expect, test, type Page } from '@playwright/test'

/** Guarda `lastExportAt` en la base como si se hubiera exportado hace `days` días. */
async function seedLastExport(page: Page, days: number) {
  await page.goto('/settings')
  await expect(page.getByRole('button', { name: 'Exportar copia' })).toBeVisible()
  await page.evaluate(async (iso) => {
    const databases = await indexedDB.databases()
    const name = databases.find(db => db.name?.toLowerCase().includes('kiofit'))?.name
    if (!name) throw new Error('no se encontró la base de datos')
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open(name)
      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const tx = open.result.transaction('meta', 'readwrite')
        tx.objectStore('meta').put({ key: 'lastExportAt', value: iso })
        tx.oncomplete = () => {
          open.result.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
    })
  }, new Date(Date.now() - days * 86_400_000).toISOString())
}

async function finishOneSession(page: Page) {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('80')
  await page.getByRole('textbox', { name: 'Reps serie 1' }).fill('8')
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()
  await expect(page.getByRole('button', { name: 'Desmarcar serie 1' })).toBeVisible()
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
}

test('D-14 Ajustes agrupa la última copia, exportar e importar, y el acerca de', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Ajustes' }).click()

  await expect(page).toHaveURL(/\/settings$/)
  await expect(page.getByRole('heading', { name: 'Ajustes', level: 1 })).toBeVisible()
  const group = page.getByRole('list', { name: 'Copia de seguridad' })
  await expect(group.getByText('Todavía no has hecho ninguna copia')).toBeVisible()
  await expect(group.getByRole('button', { name: 'Exportar copia' })).toBeVisible()
  await expect(group.getByRole('button', { name: 'Importar copia' })).toBeVisible()
  await expect(page.getByText('Acerca de', { exact: true })).toBeVisible()
})

test('D-15 con una copia de hace 8 días y sesiones, Hoy avisa y el aviso lleva a Ajustes', async ({ page }) => {
  await finishOneSession(page)
  await seedLastExport(page, 8)

  await page.goto('/')
  const reminder = page.getByRole('link', { name: /Última copia hace 8 días/ })
  await expect(reminder).toBeVisible()
  await reminder.click()

  await expect(page).toHaveURL(/\/settings$/)
})

test('D-15 con una copia de hace 7 días o menos, Hoy no avisa', async ({ page }) => {
  await finishOneSession(page)
  await seedLastExport(page, 7)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hoy' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
  await expect(page.getByText(/Última copia hace|Aún no has hecho ninguna copia/)).toHaveCount(0)
})

test('D-15 sin ninguna copia pero con una sesión, Hoy avisa; sin sesiones no', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
  await expect(page.getByText('Aún no has hecho ninguna copia')).toHaveCount(0)

  await finishOneSession(page)
  await page.goto('/')

  await expect(page.getByRole('link', { name: /Aún no has hecho ninguna copia/ })).toBeVisible()
})

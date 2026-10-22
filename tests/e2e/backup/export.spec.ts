import { expect, test, type Page } from '@playwright/test'

async function finishBenchSession(page: Page) {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await page.getByRole('textbox', { name: 'Kg serie 1' }).fill('80')
  await page.getByRole('textbox', { name: 'Reps serie 1' }).fill('8')
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click()
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
}

async function goOffline(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await page.context().setOffline(true)
}

const SHARE_STUB = () => {
  const w = window as unknown as { __shared?: { name: string, text: string }[] }
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: (data?: { files?: File[] }) => !!data?.files?.length })
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: async (data: { files: File[] }) => {
      w.__shared = await Promise.all(data.files.map(async file => ({ name: file.name, text: await file.text() })))
    },
  })
}

const NO_SHARE_STUB = () => {
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
}

function localDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

test('C-02 exportar comparte kiofit-copia-<fecha>.json con la sesión terminada y actualiza la etiqueta', async ({ page }) => {
  await page.addInitScript(SHARE_STUB)
  await finishBenchSession(page)

  await page.goto('/')
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Ajustes' }).click()
  await expect(page.getByRole('heading', { name: 'Datos' })).toBeVisible()
  await expect(page.getByText('Todavía no has hecho ninguna copia')).toBeVisible()
  await page.getByRole('button', { name: 'Exportar copia' }).click()

  await expect(page.getByText('Última copia: hoy')).toBeVisible()
  const shared = await page.evaluate(() => (window as unknown as { __shared?: { name: string, text: string }[] }).__shared)
  expect(shared).toHaveLength(1)
  expect(shared![0]!.name).toBe(`kiofit-copia-${localDate()}.json`)
  const backup = JSON.parse(shared![0]!.text)
  expect(backup.app).toBe('kiofit')
  expect(backup.data.sessions).toHaveLength(1)
  expect(backup.data.sessions[0].endedAt).toBeTruthy()
  expect(backup.data.sets).toEqual([expect.objectContaining({ weightKg: 80, reps: 8 })])
})

test('C-06 sin compartir archivos, exportar descarga el archivo', async ({ page }) => {
  await page.addInitScript(NO_SHARE_STUB)
  await finishBenchSession(page)
  await page.goto('/data')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar copia' }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe(`kiofit-copia-${localDate()}.json`)
  await expect(page.getByText('Última copia: hoy')).toBeVisible()
})

test('C-05 sin red se puede exportar compartiendo', async ({ page }) => {
  await page.addInitScript(SHARE_STUB)
  await page.goto('/data')
  await expect(page.getByRole('button', { name: 'Exportar copia' })).toBeVisible()
  await goOffline(page)
  await page.reload()

  await page.getByRole('button', { name: 'Exportar copia' }).click()

  await expect(page.getByText('Última copia: hoy')).toBeVisible()
})

test('C-05 sin red se puede exportar descargando', async ({ page }) => {
  await page.addInitScript(NO_SHARE_STUB)
  await page.goto('/data')
  await expect(page.getByRole('button', { name: 'Exportar copia' })).toBeVisible()
  await goOffline(page)
  await page.reload()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar copia' }).click()
  await downloadPromise

  await expect(page.getByText('Última copia: hoy')).toBeVisible()
})

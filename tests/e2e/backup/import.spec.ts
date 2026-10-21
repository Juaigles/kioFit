import { expect, test, type Browser, type Page } from '@playwright/test'

const NO_SHARE_STUB = () => {
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
}

async function addBench(page: Page, kg: string, reps: string) {
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

/** Termina una sesión con la serie 1 en 60 × 10 y la 2 en 80 × 8. */
async function finishSession(page: Page) {
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  for (const [serie, kg, reps] of [[1, '60', '10'], [2, '80', '8']] as const) {
    if (serie === 2) await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
    await page.getByRole('textbox', { name: `Kg serie ${serie}` }).fill(kg)
    await page.getByRole('textbox', { name: `Reps serie ${serie}` }).fill(reps)
    await page.getByRole('button', { name: `Marcar serie ${serie} como hecha` }).click()
    await expect(page.getByRole('button', { name: `Desmarcar serie ${serie}` })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeVisible()
}

/** Exporta desde /data por descarga y devuelve el contenido del archivo. */
async function exportFile(page: Page): Promise<{ name: string, mimeType: string, buffer: Buffer }> {
  await page.goto('/data')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar copia' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  return { name: download.suggestedFilename(), mimeType: 'application/json', buffer: Buffer.concat(chunks) }
}

async function freshPage(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({ baseURL })
  await context.addInitScript(NO_SHARE_STUB)
  return { context, page: await context.newPage() }
}

function fileInput(page: Page) {
  return page.locator('input[type="file"]')
}

test('C-10 elegir un archivo muestra el resumen y el aviso; cancelar no cambia nada y confirmar sustituye los datos', async ({ page, browser, baseURL }) => {
  await page.addInitScript(NO_SHARE_STUB)
  await finishSession(page)
  const file = await exportFile(page)

  // Otra base con una sesión distinta (10 × 5): la importación debe sustituirla por la de la copia.
  const other = await freshPage(browser, baseURL)
  await other.page.goto('/workouts')
  await addBench(other.page, '10', '5')
  await other.page.goto('/data')
  await fileInput(other.page).setInputFiles(file)

  const dialog = other.page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('1 sesión')
  await expect(dialog).toContainText('0 ejercicios propios')
  await expect(dialog).toContainText('sustituye todos los datos actuales')

  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialog).toBeHidden()
  await other.page.goto('/workouts')
  await other.page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await other.page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await other.page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await other.page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await other.page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  await expect(other.page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem').first()).toContainText('10 × 5')

  // Se puede elegir el mismo archivo otra vez y confirmar.
  await other.page.goto('/data')
  await fileInput(other.page).setInputFiles(file)
  await other.page.getByRole('dialog').getByRole('button', { name: 'Importar' }).click()
  await expect(other.page.getByText('Copia importada')).toBeVisible()
  await other.page.goto('/workouts')
  await other.page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await other.page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await other.page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await other.page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await other.page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  await expect(other.page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem').first()).toContainText('60 × 10')
  await other.context.close()
})

test('C-11 tras borrar los datos del navegador, importar la copia devuelve la referencia 80 × 8', async ({ page, browser, baseURL }) => {
  await page.addInitScript(NO_SHARE_STUB)
  await finishSession(page)
  const file = await exportFile(page)

  const fresh = await freshPage(browser, baseURL)
  await fresh.page.goto('/data')
  await fileInput(fresh.page).setInputFiles(file)
  await fresh.page.getByRole('dialog').getByRole('button', { name: 'Importar' }).click()
  await expect(fresh.page.getByText('Copia importada')).toBeVisible()

  await fresh.page.goto('/workouts')
  await fresh.page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await fresh.page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await fresh.page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('press de banca')
  await fresh.page.getByRole('button', { name: 'Press de banca', exact: true }).click()
  await fresh.page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  await fresh.page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  const sets = fresh.page.getByRole('list', { name: 'Series de Press de banca' }).getByRole('listitem')
  await expect(sets.nth(1)).toContainText('80 × 8')
  await fresh.context.close()
})

test('C-14 sin red se puede importar una copia válida', async ({ page, browser, baseURL }) => {
  await page.addInitScript(NO_SHARE_STUB)
  await finishSession(page)
  const file = await exportFile(page)

  const fresh = await freshPage(browser, baseURL)
  await fresh.page.goto('/data')
  await expect(fresh.page.getByRole('button', { name: 'Importar copia' })).toBeVisible()
  await fresh.page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => fresh.page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await fresh.context.setOffline(true)
  await fresh.page.reload()

  await fileInput(fresh.page).setInputFiles(file)
  await fresh.page.getByRole('dialog').getByRole('button', { name: 'Importar' }).click()
  await expect(fresh.page.getByText('Copia importada')).toBeVisible()
  await fresh.context.close()
})

test('un archivo que no es una copia se rechaza con un aviso visible', async ({ page }) => {
  await page.goto('/data')
  await fileInput(page).setInputFiles({ name: 'notas.json', mimeType: 'application/json', buffer: Buffer.from('{"hola":1}') })
  await expect(page.getByText('Este archivo no es una copia de kioFit')).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden()
})

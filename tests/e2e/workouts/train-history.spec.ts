import { expect, test, type Page } from '@playwright/test'

async function addExercise(page: Page, search: string, name: string) {
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill(search)
  await page.getByRole('button', { name, exact: true }).click()
}

async function doSet(page: Page, exercise: string, serie: number, kg: string, reps: string) {
  const list = page.getByRole('list', { name: `Series de ${exercise}` })
  await list.getByRole('textbox', { name: `Kg serie ${serie}` }).fill(kg)
  await list.getByRole('textbox', { name: `Reps serie ${serie}` }).fill(reps)
  await list.getByRole('button', { name: `Marcar serie ${serie} como hecha` }).click()
  await expect(list.getByRole('button', { name: `Desmarcar serie ${serie} de ${exercise}` })).toBeVisible()
}

test('D-13 la tarjeta del historial muestra el día, la duración, el total de series y cada ejercicio con sus series', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-03T10:00:00'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await addExercise(page, 'press de banca', 'Press de banca')
  await page.getByRole('button', { name: 'Añadir serie a Press de banca' }).click()
  await addExercise(page, 'sentadilla', 'Sentadilla')
  await doSet(page, 'Press de banca', 1, '60', '10')
  await doSet(page, 'Press de banca', 2, '60', '8')
  await doSet(page, 'Sentadilla', 1, '80', '8')
  await page.clock.setFixedTime(new Date('2026-06-03T10:45:00'))
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()

  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible()
  const card = page.getByRole('list', { name: 'Sesiones terminadas' }).getByRole('listitem')
  await expect(card).toContainText('miércoles, 3 de junio de 2026')
  await expect(card).toContainText('45 min')
  await expect(card).toContainText('3 series')
  await expect(card).toContainText('2 × Press de banca')
  await expect(card).toContainText('1 × Sentadilla')
})

test('D-13 el detalle tiene resumen, vuelta a Entrenar y las opciones en una hoja', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-03T10:00:00'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await addExercise(page, 'press de banca', 'Press de banca')
  await doSet(page, 'Press de banca', 1, '60', '10')
  await page.clock.setFixedTime(new Date('2026-06-03T10:45:00'))
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click()
  await page.getByRole('list', { name: 'Sesiones terminadas' }).getByRole('link').click()

  await expect(page.getByText('Volumen')).toBeVisible()
  await expect(page.getByText('600 kg')).toBeVisible()
  await page.getByRole('button', { name: 'Opciones del entrenamiento' }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('button', { name: 'Borrar entrenamiento' })).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Cancelar' })).toBeVisible()
})

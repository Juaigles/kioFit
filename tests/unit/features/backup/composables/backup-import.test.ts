import { describe, expect, it, vi } from 'vitest'
import { createBackupImporter, type ImportState } from '../../../../../app/features/backup/composables/useBackupImport'
import { buildBackup } from '../../../../../app/features/backup/domain/format'
import type { BackupData } from '../../../../../app/types/backup'

const data: BackupData = { exercises: [], sessions: [], sets: [], sessionExercises: [] }
const validText = JSON.stringify(buildBackup(data, new Date(2026, 9, 21, 9, 30)))
const fileOf = (text: string) => new File([text], 'kiofit-copia.json', { type: 'application/json' })

function setup(restore: (d: BackupData) => Promise<void> = async () => {}) {
  const spy = vi.fn(restore)
  const states: ImportState[] = []
  const importer = createBackupImporter({ backups: { restore: spy } }, state => states.push(state))
  return { importer, spy, states }
}

describe('createBackupImporter', () => {
  it('C-10 un archivo válido pasa a confirmando con el resumen y no escribe nada', async () => {
    const { importer, spy } = setup()
    await importer.choose(fileOf(validText))
    expect(importer.state).toMatchObject({ status: 'confirming', summary: { sessionCount: 0, customExerciseCount: 0 } })
    expect(spy).not.toHaveBeenCalled()
  })

  it('C-10 cancelar vuelve a reposo sin restaurar', async () => {
    const { importer, spy } = setup()
    await importer.choose(fileOf(validText))
    importer.cancel()
    expect(importer.state).toEqual({ status: 'idle' })
    expect(spy).not.toHaveBeenCalled()
  })

  it('C-10 confirmar restaura los datos de la copia y termina', async () => {
    const { importer, spy } = setup()
    await importer.choose(fileOf(validText))
    await importer.confirm()
    expect(spy).toHaveBeenCalledWith(data)
    expect(importer.state).toEqual({ status: 'done' })
  })

  it('un archivo que no es una copia pasa a error con el mensaje de parseBackup', async () => {
    const { importer, spy } = setup()
    await importer.choose(fileOf('hola'))
    expect(importer.state).toEqual({ status: 'error', message: 'Este archivo no es una copia de kioFit' })
    expect(spy).not.toHaveBeenCalled()
  })

  it('un fallo de restore pasa a error en español', async () => {
    const { importer } = setup(async () => {
      throw new Error('boom')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await importer.choose(fileOf(validText))
    await importer.confirm()
    expect(importer.state).toEqual({ status: 'error', message: 'No se pudo importar la copia. No se ha cambiado nada.' })
  })

  it('confirmar sin haber elegido archivo no hace nada', async () => {
    const { importer, spy } = setup()
    await importer.confirm()
    expect(spy).not.toHaveBeenCalled()
    expect(importer.state).toEqual({ status: 'idle' })
  })
})

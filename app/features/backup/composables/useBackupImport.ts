import { shallowRef } from 'vue'
import { backupRepository } from '../../../db'
import type { BackupRepository } from '../../../types/repositories'
import type { BackupFile } from '../domain/format'
import { parseBackup, type BackupSummary } from '../domain/validate'

export type ImportState
  = | { status: 'idle' }
    | { status: 'confirming', summary: BackupSummary, backup: BackupFile }
    | { status: 'error', message: string }
    | { status: 'done' }

export interface ImportDeps {
  backups: Pick<BackupRepository, 'restore'>
}

/** Lógica de importar, sin Vue: leer y validar el archivo (C-10), confirmar o cancelar. `onChange` avisa de cada cambio de estado. */
export function createBackupImporter(deps: ImportDeps, onChange: (state: ImportState) => void = () => {}) {
  let state: ImportState = { status: 'idle' }
  const set = (next: ImportState) => {
    state = next
    onChange(next)
  }

  async function choose(file: File) {
    let text: string
    try {
      text = await file.text()
    }
    catch (error) {
      console.error('No se pudo leer el archivo', error)
      set({ status: 'error', message: 'No se pudo leer el archivo.' })
      return
    }
    const result = parseBackup(text)
    set(result.ok
      ? { status: 'confirming', summary: result.summary, backup: result.backup }
      : { status: 'error', message: result.error })
  }

  function cancel() {
    set({ status: 'idle' })
  }

  async function confirm() {
    if (state.status !== 'confirming') return
    const { backup } = state
    try {
      await deps.backups.restore(backup.data)
      set({ status: 'done' })
    }
    catch (error) {
      console.error('No se pudo importar la copia', error)
      set({ status: 'error', message: 'No se pudo importar la copia. No se ha cambiado nada.' })
    }
  }

  return {
    get state() {
      return state
    },
    choose,
    cancel,
    confirm,
  }
}

/** Estado de la pantalla de datos para importar una copia. */
export function useBackupImport(deps: Partial<ImportDeps> = {}) {
  const state = shallowRef<ImportState>({ status: 'idle' })
  const importer = createBackupImporter({ backups: deps.backups ?? backupRepository }, (next) => {
    state.value = next
  })
  return { state, choose: importer.choose, cancel: importer.cancel, confirm: importer.confirm }
}

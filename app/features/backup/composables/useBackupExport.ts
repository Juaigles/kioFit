import { onMounted, ref } from 'vue'
import { backupRepository, metaRepository } from '../../../db'
import type { BackupRepository, MetaRepository } from '../../../types/repositories'
import { backupFileName, buildBackup } from '../domain/format'
import { lastBackupLabel } from '../domain/last-backup'

export const LAST_EXPORT_KEY = 'lastExportAt'

/** Lo que usamos de `navigator`; en el navegador pueden faltar `share` y `canShare`. */
export interface ShareNavigator {
  canShare?: (data: { files: File[] }) => boolean
  share?: (data: { files: File[], title: string }) => Promise<void>
}

export interface ExportDeps {
  backups: Pick<BackupRepository, 'exportData'>
  meta: MetaRepository
  nav: ShareNavigator
  /** Descarga el archivo con un enlace `download`. */
  download: (file: File) => void
  now: () => Date
}

export type ExportResult
  = | { status: 'done', method: 'share' | 'download' }
    | { status: 'cancelled' }
    | { status: 'error', message: string }

export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  // El navegador necesita un momento para iniciar la descarga antes de liberar la URL.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Lógica de exportar, sin Vue: comparte con el menú del sistema (C-02) o descarga (C-06); cancelar no es un error (C-07). */
export function createBackupExporter(deps: ExportDeps) {
  async function run(): Promise<ExportResult> {
    try {
      const now = deps.now()
      const backup = buildBackup(await deps.backups.exportData(), now)
      const file = new File([JSON.stringify(backup)], backupFileName(now), { type: 'application/json' })

      // `share` se llama en el mismo manejador del toque, tras una lectura corta de Dexie (Safari exige el gesto).
      const canShare = !!deps.nav.share && !!deps.nav.canShare?.({ files: [file] })
      if (canShare) {
        try {
          await deps.nav.share!({ files: [file], title: 'Copia de seguridad de kioFit' })
        }
        catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return { status: 'cancelled' }
          throw error
        }
      }
      else {
        deps.download(file)
      }
      await deps.meta.set(LAST_EXPORT_KEY, now.toISOString())
      return { status: 'done', method: canShare ? 'share' : 'download' }
    }
    catch (error) {
      console.error('No se pudo exportar la copia', error)
      return { status: 'error', message: 'No se pudo exportar la copia. Inténtalo de nuevo.' }
    }
  }
  return { run }
}

/** Estado de la pantalla de datos: última copia y acción de exportar. */
export function useBackupExport(deps: Partial<ExportDeps> = {}) {
  const meta = deps.meta ?? metaRepository
  const exporter = createBackupExporter({
    backups: deps.backups ?? backupRepository,
    meta,
    nav: deps.nav ?? (typeof navigator === 'undefined' ? {} : navigator),
    download: deps.download ?? downloadFile,
    now: deps.now ?? (() => new Date()),
  })
  const now = deps.now ?? (() => new Date())

  const lastExportAt = ref<string | null | undefined>(undefined)
  const label = ref('')
  const exporting = ref(false)
  const error = ref<string | null>(null)

  function refreshLabel() {
    label.value = lastBackupLabel(lastExportAt.value, now())
  }

  onMounted(async () => {
    try {
      const stored = await meta.get(LAST_EXPORT_KEY)
      lastExportAt.value = typeof stored === 'string' ? stored : null
    }
    catch (readError) {
      console.error('No se pudo leer la última copia', readError)
      lastExportAt.value = null
    }
    refreshLabel()
  })

  async function exportBackup() {
    if (exporting.value) return
    exporting.value = true
    error.value = null
    const result = await exporter.run()
    if (result.status === 'done') {
      lastExportAt.value = now().toISOString()
      refreshLabel()
    }
    else if (result.status === 'error') {
      error.value = result.message
    }
    exporting.value = false
  }

  return { label, exporting, error, exportBackup }
}

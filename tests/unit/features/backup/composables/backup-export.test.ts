import { describe, expect, it, vi } from 'vitest'
import { createBackupExporter, type ExportDeps } from '../../../../../app/features/backup/composables/useBackupExport'
import type { BackupData } from '../../../../../app/types/backup'

const data: BackupData = { exercises: [], sessions: [], sets: [], sessionExercises: [] }
const now = new Date(2026, 9, 21, 9, 30)

function setup(nav: ExportDeps['nav'], overrides: Partial<ExportDeps> = {}) {
  const store = new Map<string, unknown>()
  const download = vi.fn()
  const deps: ExportDeps = {
    backups: { exportData: async () => data },
    meta: { get: async key => store.get(key), set: async (key, value) => { store.set(key, value) } },
    nav,
    download,
    now: () => now,
    ...overrides,
  }
  return { exporter: createBackupExporter(deps), store, download }
}

describe('createBackupExporter', () => {
  it('C-02 comparte el archivo con el menú del sistema y guarda la fecha', async () => {
    const share = vi.fn(async () => {})
    const { exporter, store, download } = setup({ canShare: () => true, share })

    expect(await exporter.run()).toEqual({ status: 'done', method: 'share' })

    expect(download).not.toHaveBeenCalled()
    const shared = (share.mock.calls[0] as unknown as [{ files: File[] }])[0]
    expect(shared.files[0]?.name).toBe('kiofit-copia-2026-10-21.json')
    expect(JSON.parse(await shared.files[0]!.text())).toMatchObject({ app: 'kiofit', formatVersion: 1, data })
    expect(store.get('lastExportAt')).toBe(now.toISOString())
  })

  it('C-06 si no puede compartir archivos, lo descarga y guarda la fecha', async () => {
    const { exporter, store, download } = setup({ canShare: () => false, share: vi.fn() })

    expect(await exporter.run()).toEqual({ status: 'done', method: 'download' })

    expect(download).toHaveBeenCalledOnce()
    expect((download.mock.calls[0] as unknown as [File])[0].name).toBe('kiofit-copia-2026-10-21.json')
    expect(store.get('lastExportAt')).toBe(now.toISOString())
  })

  it('C-06 sin navigator.share también descarga', async () => {
    const { exporter, download } = setup({})
    expect(await exporter.run()).toEqual({ status: 'done', method: 'download' })
    expect(download).toHaveBeenCalledOnce()
  })

  it('C-07 cancelar el menú de compartir no es un error ni cambia la fecha', async () => {
    const share = vi.fn(() => Promise.reject(new DOMException('cancelado', 'AbortError')))
    const { exporter, store, download } = setup({ canShare: () => true, share })
    store.set('lastExportAt', '2026-10-18T10:00:00.000Z')

    expect(await exporter.run()).toEqual({ status: 'cancelled' })

    expect(store.get('lastExportAt')).toBe('2026-10-18T10:00:00.000Z')
    expect(download).not.toHaveBeenCalled()
  })

  it('C-07 otro error se muestra en español y no guarda la fecha', async () => {
    const share = vi.fn(() => Promise.reject(new Error('boom')))
    const { exporter, store } = setup({ canShare: () => true, share })

    const result = await exporter.run()

    expect(result.status).toBe('error')
    expect(result.status === 'error' && result.message).toMatch(/No se pudo exportar/)
    expect(store.has('lastExportAt')).toBe(false)
  })

  it('C-07 un fallo al leer los datos es un error y no guarda la fecha', async () => {
    const { exporter, store } = setup({}, { backups: { exportData: () => Promise.reject(new Error('db')) } })
    expect((await exporter.run()).status).toBe('error')
    expect(store.has('lastExportAt')).toBe(false)
  })
})

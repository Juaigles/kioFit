import { onMounted, ref } from 'vue'
import { backupRepository, metaRepository } from '../../../db'
import type { BackupRepository, MetaRepository } from '../../../types/repositories'
import { backupReminder } from '../domain/last-backup'
import { LAST_EXPORT_KEY } from './useBackupExport'

/** El aviso de Hoy sobre la copia (D-15): `null` mientras carga y cuando no hace falta avisar. */
export function useBackupReminder(deps: {
  meta?: MetaRepository
  backups?: Pick<BackupRepository, 'hasSessions'>
  now?: () => Date
} = {}) {
  const meta = deps.meta ?? metaRepository
  const backups = deps.backups ?? backupRepository
  const now = deps.now ?? (() => new Date())
  const reminder = ref<string | null>(null)

  onMounted(async () => {
    try {
      const stored = await meta.get(LAST_EXPORT_KEY)
      reminder.value = backupReminder(typeof stored === 'string' ? stored : null, await backups.hasSessions(), now())
    }
    catch (error) {
      console.error('No se pudo comprobar la última copia', error)
    }
  })

  return reminder
}

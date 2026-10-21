import type { Exercise, Session, SessionExercise, WorkoutSet } from '../../../types/workouts'
import { toLocalDate } from '../../../utils/to-local-date'

/** Versión del formato del archivo. Sube cada vez que cambia su forma; es independiente de la versión de Dexie. */
export const CURRENT_FORMAT_VERSION = 1

export interface BackupData {
  exercises: Exercise[]
  sessions: Session[]
  sessionExercises: SessionExercise[]
  sets: WorkoutSet[]
}

export interface BackupFile {
  app: 'kiofit'
  formatVersion: number
  /** Instante ISO 8601 en UTC. */
  exportedAt: string
  data: BackupData
}

/** `{ [desde]: archivo de la versión `desde` -> archivo de la versión siguiente }`. */
export type BackupMigrations = Record<number, (file: BackupFile) => BackupFile>

/** Migraciones del formato. Vacío mientras `CURRENT_FORMAT_VERSION` sea 1. */
export const BACKUP_MIGRATIONS: BackupMigrations = {}

export function backupFileName(date: Date = new Date()): string {
  return `kiofit-copia-${toLocalDate(date)}.json`
}

export function buildBackup(data: BackupData, now: Date = new Date()): BackupFile {
  return { app: 'kiofit', formatVersion: CURRENT_FORMAT_VERSION, exportedAt: now.toISOString(), data }
}

/** Aplica en cadena las migraciones desde la versión del archivo hasta `target`, sin modificar el original. */
export function migrateBackup(file: BackupFile, migrations: BackupMigrations, target: number = CURRENT_FORMAT_VERSION): BackupFile {
  let current = file
  while (current.formatVersion < target) {
    const migrate = migrations[current.formatVersion]
    if (!migrate) throw new Error(`No hay migración desde la versión ${current.formatVersion} del formato`)
    const next = migrate(current)
    if (next.formatVersion <= current.formatVersion) throw new Error(`La migración desde la versión ${current.formatVersion} no sube la versión`)
    current = next
  }
  return current
}

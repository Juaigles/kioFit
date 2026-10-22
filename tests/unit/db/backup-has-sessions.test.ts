import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createBackupRepository } from '../../../app/db/backup-repository'
import { createDatabase, type KioFitDb } from '../../../app/db/database'
import { createSessionRepository } from '../../../app/db/dexie-repositories'

let db: KioFitDb

beforeEach(() => {
  db = createDatabase(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await db.delete()
})

describe('BackupRepository.hasSessions', () => {
  it('D-15 es falso sin sesiones y verdadero en cuanto hay una', async () => {
    const backups = createBackupRepository(db, [])
    expect(await backups.hasSessions()).toBe(false)

    await createSessionRepository(db).startSession(new Date(2026, 9, 21, 10))

    expect(await backups.hasSessions()).toBe(true)
  })
})

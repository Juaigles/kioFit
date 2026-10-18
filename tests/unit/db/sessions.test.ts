import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase, type KioFitDb } from '../../../app/db/database'
import { createSessionRepository } from '../../../app/db/dexie-repositories'
import { toLocalDate } from '../../../app/utils/to-local-date'
import type { Session } from '../../../app/types/workouts'

const originalTz = process.env.TZ
let db: KioFitDb

beforeEach(() => {
  db = createDatabase(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  process.env.TZ = originalTz
  await db.delete()
})

describe('SessionRepository', () => {
  it('F-29 conserva el día local de una sesión que cruza la medianoche', async () => {
    const sessions = createSessionRepository(db)
    process.env.TZ = 'America/Bogota'
    const start = new Date(2026, 9, 18, 23, 30)
    const end = new Date(2026, 9, 19, 0, 40)
    const session: Session = {
      id: crypto.randomUUID(),
      type: 'strength',
      localDate: toLocalDate(start),
      startedAt: start.toISOString(),
      endedAt: end.toISOString(),
      status: 'finished',
    }

    await sessions.save(session)
    process.env.TZ = 'Asia/Tokyo'
    const stored = await sessions.get(session.id)

    expect(stored?.localDate).toBe('2026-10-18')
    expect(stored?.startedAt).toBe('2026-10-19T04:30:00.000Z')
    expect(stored?.endedAt).toBe('2026-10-19T05:40:00.000Z')
  })

  it('guarda y lee una sesión', async () => {
    const sessions = createSessionRepository(db)
    const session: Session = {
      id: crypto.randomUUID(),
      type: 'strength',
      localDate: '2026-10-18',
      startedAt: '2026-10-18T18:00:00.000Z',
      status: 'in_progress',
    }

    await sessions.save(session)

    expect(await sessions.get(session.id)).toEqual(session)
  })

  it('devuelve undefined si la sesión no existe', async () => {
    const sessions = createSessionRepository(db)

    expect(await sessions.get('no-existe')).toBeUndefined()
  })
})

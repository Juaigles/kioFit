import { describe, expect, it } from 'vitest'
import { matchesSearch, normalizeText } from '../../../app/utils/normalize'

describe('normalizeText', () => {
  it('pasa a minúsculas, quita acentos y recorta espacios', () => {
    expect(normalizeText('  Press de BÁNCA  ')).toBe('press de banca')
  })

  it('trata la ñ como una n, para encontrar "Pinon" al buscar "Piñón"', () => {
    expect(normalizeText('Piñón')).toBe('pinon')
  })

  it('colapsa los espacios repetidos', () => {
    expect(normalizeText('press   de\tbanca')).toBe('press de banca')
  })
})

describe('matchesSearch', () => {
  const name = normalizeText('Press de banca')

  it('F-03 encuentra "Press de banca" con mayúsculas y sin la preposición', () => {
    expect(matchesSearch(name, 'PRESS banca')).toBe(true)
  })

  it('F-03 encuentra "Press de banca" con un acento donde no lo hay', () => {
    expect(matchesSearch(name, 'press de bánca')).toBe(true)
  })

  it('F-03 encuentra por una parte de la palabra', () => {
    expect(matchesSearch(name, 'ban')).toBe(true)
  })

  it('F-03 no encuentra si falta alguna de las palabras', () => {
    expect(matchesSearch(name, 'press militar')).toBe(false)
  })

  it('F-03 una consulta vacía no filtra nada', () => {
    expect(matchesSearch(name, '   ')).toBe(true)
  })
})

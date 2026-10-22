import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const APP = join(__dirname, '../../../app')

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? vueFiles(path) : path.endsWith('.vue') ? [path] : []
  })
}

const PALETTE_CLASS = /\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|shadow|decoration|accent|caret)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/
const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/
const STYLE_COLOR = /style="[^"]*(?:color|background)\s*:/

describe('sistema de diseño: tokens', () => {
  it('D-17 ningún componente usa colores de paleta, hexadecimales ni style con color', () => {
    const offenders: string[] = []
    for (const file of vueFiles(APP)) {
      const source = readFileSync(file, 'utf8')
      if (PALETTE_CLASS.test(source)) offenders.push(`${file}: color de paleta`)
      if (HEX_COLOR.test(source)) offenders.push(`${file}: hexadecimal`)
      if (STYLE_COLOR.test(source)) offenders.push(`${file}: style con color`)
    }
    expect(offenders).toEqual([])
  })

  it('D-17 el guardarraíl detecta un color suelto', () => {
    expect(PALETTE_CLASS.test('<div class="bg-green-500">')).toBe(true)
    expect(HEX_COLOR.test('<div class="text-[#16a34a]">')).toBe(true)
    expect(STYLE_COLOR.test('<div style="color: red">')).toBe(true)
    expect(PALETTE_CLASS.test('<div class="bg-elevated text-muted bg-done-tint">')).toBe(false)
  })

  it('D-16 los tokens existen en modo claro y oscuro', () => {
    const css = readFileSync(join(APP, 'assets/css/main.css'), 'utf8')
    const light = css.slice(css.indexOf(':root'), css.indexOf('.dark'))
    const dark = css.slice(css.indexOf('.dark'))
    for (const token of ['--ui-bg', '--ui-bg-elevated', '--ui-text', '--ui-text-muted', '--ui-border', '--ui-primary', '--kf-primary-text', '--kf-done', '--kf-done-tint', '--ui-error', '--ui-warning']) {
      expect(light, `${token} en claro`).toContain(`${token}:`)
      expect(dark, `${token} en oscuro`).toContain(`${token}:`)
    }
  })
})

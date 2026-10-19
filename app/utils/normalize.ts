/** Minúsculas, sin acentos y con los espacios colapsados: la forma en que se compara y se busca. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Búsqueda de ejercicios (F-03): cada palabra de la consulta debe aparecer en el
 * nombre ya normalizado, en cualquier orden. Una consulta vacía no filtra nada.
 */
export function matchesSearch(normalizedName: string, query: string): boolean {
  const words = normalizeText(query).split(' ').filter(Boolean)
  return words.every(word => normalizedName.includes(word))
}

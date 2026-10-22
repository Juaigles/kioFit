export interface TabItem {
  label: string
  icon: string
  to: string
}

/** Pestañas de la barra inferior. Peso y Comidas se añaden cuando exista su módulo (D-02). */
export const APP_TABS: readonly TabItem[] = [
  { label: 'Hoy', icon: 'i-lucide-house', to: '/' },
  { label: 'Entrenar', icon: 'i-lucide-dumbbell', to: '/workouts' },
  // /data pasa a /settings en la tarea D09.
  { label: 'Ajustes', icon: 'i-lucide-sliders-horizontal', to: '/data' },
]

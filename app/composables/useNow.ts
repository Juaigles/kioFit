import { onScopeDispose, ref } from 'vue'

/** Instante actual en milisegundos, refrescado cada `intervalMs` (por defecto 30 s). */
export function useNow(intervalMs = 30_000) {
  const now = ref(Date.now())
  const timer = setInterval(() => {
    now.value = Date.now()
  }, intervalMs)
  onScopeDispose(() => clearInterval(timer))
  return now
}

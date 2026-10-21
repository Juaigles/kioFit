import { computed, onScopeDispose, ref } from 'vue'
import { exerciseRepository } from '../../../db'
import { matchesSearch } from '../../../utils/normalize'
import type { Exercise, Measure } from '../../../types/workouts'

/** Ejercicios filtrados por la consulta, sin mayúsculas ni acentos (F-03). */
export function useExerciseSearch() {
  const all = ref<Exercise[]>([])
  const query = ref('')
  const subscription = exerciseRepository.watchAll().subscribe({
    next: (value) => { all.value = value },
    error: (error) => { console.error('No se pudo leer el catálogo', error) },
  })
  onScopeDispose(() => subscription.unsubscribe())

  const results = computed(() => all.value.filter(e => matchesSearch(e.normalizedName, query.value)))
  /** Alta de un ejercicio propio (F-04); el resultado trae el motivo si se rechaza (F-05). */
  const createCustom = (name: string, measure: Measure) => exerciseRepository.createCustom({ name, measure })

  return { query, results, createCustom }
}

import { exerciseRepository } from '../db'
import seed from '../db/seed/exercises.json'
import type { SeedExercise } from '../types/workouts'

// Carga el catálogo en el primer arranque y añade lo que falte en las versiones nuevas (ADR-0012).
export default defineNuxtPlugin(async () => {
  try {
    await exerciseRepository.seedCatalog(seed as SeedExercise[])
  }
  catch (error) {
    // Sin catálogo la app sigue sirviendo para los ejercicios propios.
    console.error('No se pudo cargar el catálogo de ejercicios', error)
  }
})

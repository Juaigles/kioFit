<script setup lang="ts">
import { useActiveSession } from '../composables/useActiveSession'

const { active, start } = useActiveSession()

/** Un toque: crea la sesión y abre su pantalla (por ahora en Entrenar; D04 la mueve a pantalla completa). */
async function startWorkout() {
  await start()
  await navigateTo('/workouts')
}
</script>

<template>
  <AppScreen>
    <AppPageHeader title="Hoy" />
    <template v-if="active !== undefined">
      <UButton
        v-if="active"
        to="/workouts"
        label="Continuar entrenamiento"
        block
      />
      <UButton
        v-else
        label="Empezar entrenamiento"
        block
        @click="startWorkout"
      />
    </template>
  </AppScreen>
</template>

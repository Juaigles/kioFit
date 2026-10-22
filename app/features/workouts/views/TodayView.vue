<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '../../../composables/useNow'
import { useActiveSession } from '../composables/useActiveSession'
import { sessionSummary } from '../domain/summary'
import ContinueSessionCard from '../components/ContinueSessionCard.vue'

const { active, start } = useActiveSession()
const now = useNow()
const summary = computed(() => active.value ? sessionSummary(active.value.session, active.value.exercises, now.value) : null)

/** Un toque: crea la sesión y abre su pantalla (D-03). */
async function startWorkout() {
  await start()
  await navigateTo('/workouts/session')
}
</script>

<template>
  <AppScreen>
    <AppPageHeader title="Hoy" />
    <slot />
    <template v-if="active !== undefined">
      <ContinueSessionCard
        v-if="summary"
        :summary="summary"
      />
      <UButton
        v-else
        label="Empezar entrenamiento"
        size="xl"
        block
        class="min-h-11"
        @click="startWorkout"
      />
    </template>
  </AppScreen>
</template>

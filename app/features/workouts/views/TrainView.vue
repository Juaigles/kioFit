<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '../../../composables/useNow'
import { useActiveSession } from '../composables/useActiveSession'
import { useSessionHistory } from '../composables/useSessionHistory'
import { sessionSummary } from '../domain/summary'
import ContinueSessionCard from '../components/ContinueSessionCard.vue'
import SessionHistoryList from '../components/SessionHistoryList.vue'

const { active, start } = useActiveSession()
const sessions = useSessionHistory()
const now = useNow()
const summary = computed(() => active.value ? sessionSummary(active.value.session, active.value.exercises, now.value) : null)

async function startWorkout() {
  await start()
  await navigateTo('/workouts/session')
}
</script>

<template>
  <AppScreen>
    <AppPageHeader title="Entrenar" />
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
      <section class="space-y-2">
        <h2 class="text-xl font-semibold">
          Historial
        </h2>
        <template v-if="sessions">
          <SessionHistoryList
            v-if="sessions.length > 0"
            :sessions="sessions"
          />
          <p
            v-else
            class="text-muted"
          >
            Todavía no hay entrenamientos terminados.
          </p>
        </template>
      </section>
    </template>
  </AppScreen>
</template>

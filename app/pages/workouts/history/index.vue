<script setup lang="ts">
import SessionHistoryList from '../../../features/workouts/components/SessionHistoryList.vue'
import { useSessionHistory } from '../../../features/workouts/composables/useSessionHistory'

const sessions = useSessionHistory()
</script>

<template>
  <UContainer class="space-y-4 py-6">
    <h1 class="text-2xl font-bold">
      Historial
    </h1>
    <template v-if="sessions">
      <SessionHistoryList
        v-if="sessions.length > 0"
        :sessions="sessions"
      />
      <p v-else>
        Todavía no hay entrenamientos terminados.
      </p>
    </template>
    <UButton
      to="/workouts"
      label="Entrenamiento"
      color="neutral"
      variant="outline"
      block
      class="min-h-11"
    />
  </UContainer>
</template>

<script setup lang="ts">
import SessionDetail from '../../../features/workouts/components/SessionDetail.vue'

const route = useRoute()
const sessionId = computed(() => String(route.params.id))
</script>

<template>
  <UContainer class="space-y-4 py-6">
    <UButton
      to="/workouts/history"
      label="Historial"
      color="neutral"
      variant="ghost"
      class="min-h-11"
    />
    <SessionDetail
      :session-id="sessionId"
      @deleted="navigateTo('/workouts/history')"
    />
  </UContainer>
</template>

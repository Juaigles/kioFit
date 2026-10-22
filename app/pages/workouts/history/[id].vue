<script setup lang="ts">
import SessionDetailView from '../../../features/workouts/views/SessionDetailView.vue'

const route = useRoute()
const sessionId = computed(() => String(route.params.id))
</script>

<template>
  <SessionDetailView :session-id="sessionId" />
</template>

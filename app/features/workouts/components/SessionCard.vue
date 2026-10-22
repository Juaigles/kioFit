<script setup lang="ts">
import type { SessionSummary } from '../../../types/repositories'
import { formatSessionDate, formatSessionDuration } from '../domain/history'

/** Tarjeta de una sesión terminada en el historial (D-13). */
defineProps<{ summary: SessionSummary }>()

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
</script>

<template>
  <NuxtLink
    :to="`/workouts/history/${summary.session.id}`"
    class="block min-h-11 space-y-1 rounded-lg bg-elevated p-3"
  >
    <span class="block font-semibold first-letter:uppercase">{{ formatSessionDate(summary.session.localDate) }}</span>
    <span class="block text-sm text-muted">
      {{ formatSessionDuration(summary.session.startedAt, summary.session.endedAt) }} · {{ plural(summary.exerciseCount, 'ejercicio', 'ejercicios') }} · {{ plural(summary.doneSetCount, 'serie', 'series') }}
    </span>
    <span
      v-for="exercise in summary.exercises"
      :key="exercise.name"
      class="block text-sm"
    >{{ exercise.setCount }} × {{ exercise.name }}</span>
  </NuxtLink>
</template>

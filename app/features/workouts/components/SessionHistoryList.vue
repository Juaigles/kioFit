<script setup lang="ts">
import type { SessionSummary } from '../../../types/repositories'
import { formatSessionDate, formatSessionDuration } from '../domain/history'

defineProps<{ sessions: SessionSummary[] }>()

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
</script>

<template>
  <ul
    aria-label="Sesiones terminadas"
    class="space-y-2"
  >
    <li
      v-for="{ session, exerciseCount, doneSetCount } in sessions"
      :key="session.id"
    >
      <NuxtLink
        :to="`/workouts/history/${session.id}`"
        class="block min-h-11 rounded-lg border border-default p-3"
      >
        <span class="block font-semibold first-letter:uppercase">{{ formatSessionDate(session.localDate) }}</span>
        <span class="block text-sm text-muted">
          {{ formatSessionDuration(session.startedAt, session.endedAt) }} · {{ plural(exerciseCount, 'ejercicio', 'ejercicios') }} · {{ plural(doneSetCount, 'serie', 'series') }}
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>

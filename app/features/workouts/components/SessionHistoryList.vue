<script setup lang="ts">
import type { SessionSummary } from '../../../types/repositories'
import { formatSessionMonth } from '../domain/history'
import SessionCard from './SessionCard.vue'

const props = defineProps<{ sessions: SessionSummary[] }>()

/** Las sesiones llegan de la más reciente a la más antigua; cada vez que cambia el mes se pone su cabecera. */
const rows = computed(() => props.sessions.map((summary, index) => {
  const month = formatSessionMonth(summary.session.localDate)
  const previous = props.sessions[index - 1]
  return { summary, month, startsMonth: !previous || formatSessionMonth(previous.session.localDate) !== month }
}))
</script>

<template>
  <ul
    aria-label="Sesiones terminadas"
    class="space-y-2"
  >
    <template
      v-for="row in rows"
      :key="row.summary.session.id"
    >
      <li
        v-if="row.startsMonth"
        role="presentation"
        class="pt-2 text-sm font-medium text-muted first-letter:uppercase"
      >
        {{ row.month }}
      </li>
      <li>
        <SessionCard :summary="row.summary" />
      </li>
    </template>
  </ul>
</template>

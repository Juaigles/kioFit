<script setup lang="ts">
import type { ExerciseHistoryEntry } from '../../../types/repositories'
import type { Measure, SetValues, WorkoutSet } from '../../../types/workouts'
import { SET_COLUMN_HEADERS, SET_GRID } from '../domain/columns'
import { previousReference } from '../domain/previous'
import SetRow from './SetRow.vue'

/** `before`: inicio de la sesión terminada que se corrige; la referencia sale de las anteriores a ella (F-27). */
defineProps<{ exerciseName: string, measure: Measure, sets: WorkoutSet[], history: readonly ExerciseHistoryEntry[], before?: string }>()
const emit = defineEmits<{
  'remove-set': [setId: string]
  'toggle-set': [setId: string, done: boolean]
  'complete-set': [setId: string, values: SetValues]
  'update-values': [setId: string, values: SetValues]
}>()
</script>

<template>
  <div class="space-y-1">
    <div
      data-testid="set-table-header"
      class="grid items-center gap-1 px-1 text-xs text-muted"
      :class="SET_GRID[measure]"
    >
      <span
        v-for="header in SET_COLUMN_HEADERS[measure]"
        :key="header"
        class="text-center"
      >{{ header }}</span>
      <span aria-hidden="true" />
    </div>
    <ul
      :aria-label="`Series de ${exerciseName}`"
      class="space-y-1"
    >
      <SetRow
        v-for="set in sets"
        :key="set.id"
        :set="set"
        :measure="measure"
        :exercise-name="exerciseName"
        :reference="previousReference(history, set.position, measure, before)"
        @update-values="emit('update-values', set.id, $event)"
        @toggle="emit('toggle-set', set.id, !set.done)"
        @complete="emit('complete-set', set.id, $event)"
        @remove="emit('remove-set', set.id)"
      />
    </ul>
  </div>
</template>

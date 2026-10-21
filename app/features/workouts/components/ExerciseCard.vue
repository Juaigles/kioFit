<script setup lang="ts">
import type { SessionExerciseView } from '../../../types/repositories'
import type { SetValues } from '../../../types/workouts'
import { useExerciseHistory } from '../composables/useExerciseHistory'
import { previousReference } from '../domain/previous'
import SetRow from './SetRow.vue'

/** `before`: inicio de la sesión terminada que se corrige; la referencia sale de las anteriores a ella (F-27). */
const props = defineProps<{ item: SessionExerciseView, isFirst: boolean, isLast: boolean, before?: string }>()
const emit = defineEmits<{
  'move': [direction: -1 | 1]
  'remove': []
  'add-set': []
  'remove-set': [setId: string]
  'toggle-set': [setId: string, done: boolean]
  'complete-set': [setId: string, values: SetValues]
  'update-values': [setId: string, values: SetValues]
}>()

const history = useExerciseHistory(props.item.exercise.id)

type Mode = { status: 'idle' } | { status: 'confirming-remove' }
const mode = ref<Mode>({ status: 'idle' })

/** Sin series hechas se quita sin preguntar; con ellas se pide confirmación (F-13). */
function requestRemove() {
  if (props.item.sets.some(set => set.done)) mode.value = { status: 'confirming-remove' }
  else emit('remove')
}
</script>

<template>
  <li class="rounded-lg border border-default p-3 space-y-2">
    <div class="flex items-center gap-1">
      <h2 class="flex-1 text-lg font-semibold">
        {{ item.exercise.name }}
      </h2>
      <UButton
        label="↑"
        color="neutral"
        variant="ghost"
        class="min-h-11 min-w-11 justify-center"
        :aria-label="`Subir ${item.exercise.name}`"
        :disabled="isFirst"
        @click="emit('move', -1)"
      />
      <UButton
        label="↓"
        color="neutral"
        variant="ghost"
        class="min-h-11 min-w-11 justify-center"
        :aria-label="`Bajar ${item.exercise.name}`"
        :disabled="isLast"
        @click="emit('move', 1)"
      />
      <UButton
        label="Quitar"
        color="error"
        variant="ghost"
        class="min-h-11 min-w-11 justify-center"
        :aria-label="`Quitar ${item.exercise.name}`"
        @click="requestRemove"
      />
    </div>

    <div
      v-if="mode.status === 'confirming-remove'"
      role="alert"
      class="space-y-2 rounded-lg bg-error/10 p-3"
    >
      <p>Tiene series hechas. ¿Quitar el ejercicio?</p>
      <div class="flex gap-2">
        <UButton
          label="Sí, quitar"
          color="error"
          class="min-h-11"
          @click="emit('remove')"
        />
        <UButton
          label="Cancelar"
          color="neutral"
          variant="outline"
          class="min-h-11"
          @click="mode = { status: 'idle' }"
        />
      </div>
    </div>

    <ul
      :aria-label="`Series de ${item.exercise.name}`"
      class="space-y-1"
    >
      <SetRow
        v-for="set in item.sets"
        :key="set.id"
        :set="set"
        :measure="item.exercise.measure"
        :reference="previousReference(history, set.position, item.exercise.measure, before)"
        @update-values="emit('update-values', set.id, $event)"
        @toggle="emit('toggle-set', set.id, !set.done)"
        @complete="emit('complete-set', set.id, $event)"
        @remove="emit('remove-set', set.id)"
      />
    </ul>
    <UButton
      label="Añadir serie"
      :aria-label="`Añadir serie a ${item.exercise.name}`"
      color="neutral"
      variant="soft"
      block
      class="min-h-11"
      @click="emit('add-set')"
    />
  </li>
</template>

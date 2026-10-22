<script setup lang="ts">
import type { ExerciseHistoryEntry, SessionExerciseView } from '../../../types/repositories'
import type { SetValues } from '../../../types/workouts'
import AppActionSheet, { type SheetAction } from '../../../components/app/AppActionSheet.vue'
import AppConfirmSheet from '../../../components/app/AppConfirmSheet.vue'
import SetTable from './SetTable.vue'

/** `before`: inicio de la sesión terminada que se corrige; la referencia sale de las anteriores a ella (F-27). */
const props = defineProps<{ item: SessionExerciseView, history: readonly ExerciseHistoryEntry[], isFirst: boolean, isLast: boolean, before?: string }>()
const emit = defineEmits<{
  'move': [direction: -1 | 1]
  'remove': []
  'add-set': []
  'remove-set': [setId: string]
  'toggle-set': [setId: string, done: boolean]
  'complete-set': [setId: string, values: SetValues]
  'update-values': [setId: string, values: SetValues]
}>()

type Mode = { status: 'idle' } | { status: 'menu' } | { status: 'confirming-remove' }
const mode = ref<Mode>({ status: 'idle' })

/** Sin series hechas se quita sin preguntar; con ellas se pide confirmación (F-13). */
function requestRemove() {
  if (props.item.sets.some(set => set.done)) mode.value = { status: 'confirming-remove' }
  else emit('remove')
}

const menuOpen = computed({
  get: () => mode.value.status === 'menu',
  set: (open) => {
    if (!open && mode.value.status === 'menu') mode.value = { status: 'idle' }
  },
})

const menuActions = computed<SheetAction[]>(() => [
  { id: 'up', label: 'Subir', icon: 'i-lucide-arrow-up', disabled: props.isFirst },
  { id: 'down', label: 'Bajar', icon: 'i-lucide-arrow-down', disabled: props.isLast },
  { id: 'remove', label: 'Quitar ejercicio', icon: 'i-lucide-trash-2', danger: true },
])

function onMenuSelect(id: string) {
  if (id === 'up') emit('move', -1)
  else if (id === 'down') emit('move', 1)
  else requestRemove()
}

const confirmingRemove = computed({
  get: () => mode.value.status === 'confirming-remove',
  set: (open) => {
    if (!open) mode.value = { status: 'idle' }
  },
})

function confirmRemove() {
  mode.value = { status: 'idle' }
  emit('remove')
}
</script>

<template>
  <li class="rounded-lg border border-default p-3 space-y-2">
    <div class="flex items-center gap-1">
      <h2 class="flex-1 text-lg font-semibold text-primary-text">
        {{ item.exercise.name }}
      </h2>
      <UButton
        icon="i-lucide-ellipsis"
        color="neutral"
        variant="ghost"
        class="min-h-11 min-w-11 justify-center"
        :aria-label="`Opciones de ${item.exercise.name}`"
        @click="mode = { status: 'menu' }"
      />
    </div>

    <AppActionSheet
      v-model:open="menuOpen"
      :title="item.exercise.name"
      :actions="menuActions"
      @select="onMenuSelect"
    />

    <AppConfirmSheet
      v-model:open="confirmingRemove"
      title="Quitar ejercicio"
      description="Tiene series hechas. ¿Quitar el ejercicio?"
      confirm-label="Sí, quitar"
      @confirm="confirmRemove"
    />

    <SetTable
      :exercise-name="item.exercise.name"
      :measure="item.exercise.measure"
      :sets="item.sets"
      :history="history"
      :before="before"
      @update-values="(setId, values) => emit('update-values', setId, values)"
      @toggle-set="(setId, done) => emit('toggle-set', setId, done)"
      @complete-set="(setId, values) => emit('complete-set', setId, values)"
      @remove-set="emit('remove-set', $event)"
    />
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

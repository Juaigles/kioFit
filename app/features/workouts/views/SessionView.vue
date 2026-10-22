<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppConfirmSheet from '../../../components/app/AppConfirmSheet.vue'
import { useNow } from '../../../composables/useNow'
import ExerciseCard from '../components/ExerciseCard.vue'
import ExercisePickerSheet from '../components/ExercisePickerSheet.vue'
import { useActiveSession } from '../composables/useActiveSession'
import { useExerciseHistories } from '../composables/useExerciseHistories'
import { formatVolume, sessionSummary } from '../domain/summary'

const { active, addExercise: add, finish, discard, removeExercise, moveExercise, addSet, removeSet, setDone, completeSet, setValues } = useActiveSession()
const histories = useExerciseHistories(() => active.value?.exercises.map(item => item.exercise.id) ?? [])
const picking = ref(false)
const now = useNow()
const summary = computed(() => active.value ? sessionSummary(active.value.session, active.value.exercises, now.value) : null)

/** Sin sesión en curso (terminada, descartada o recién abierta la ruta) no hay nada que mostrar aquí. */
watch(active, (value) => {
  if (value === null) navigateTo('/workouts', { replace: true })
}, { immediate: true })

type Ending = { status: 'idle' } | { status: 'nothing-done' } | { status: 'confirming-discard' }
const ending = ref<Ending>({ status: 'idle' })

/** Sin ninguna serie hecha no hay nada que terminar: se ofrece descartar (F-24). */
async function requestFinish() {
  if (active.value?.exercises.some(item => item.sets.some(set => set.done))) await finish()
  else ending.value = { status: 'nothing-done' }
}

const discardOpen = computed({
  get: () => ending.value.status !== 'idle',
  set: (open) => {
    if (!open) ending.value = { status: 'idle' }
  },
})

async function confirmDiscard() {
  await discard()
  ending.value = { status: 'idle' }
}

async function addExercise(exerciseId: string) {
  await add(exerciseId)
  picking.value = false
}
</script>

<template>
  <AppScreen v-if="active && summary">
    <div class="flex items-center justify-between gap-2">
      <UButton
        label="Minimizar"
        icon="i-lucide-chevron-down"
        color="neutral"
        variant="ghost"
        class="min-h-11"
        @click="navigateTo('/')"
      />
      <UButton
        label="Terminar"
        aria-label="Terminar entrenamiento"
        class="min-h-11"
        @click="requestFinish"
      />
    </div>
    <h1 class="text-2xl font-bold">
      Entrenamiento en curso
    </h1>
    <div class="flex gap-2">
      <AppStatTile
        label="Duración"
        :value="`${summary.minutes} min`"
      />
      <AppStatTile
        label="Volumen"
        :value="formatVolume(summary.volumeKg)"
      />
      <AppStatTile
        label="Series"
        :value="`${summary.doneSets}/${summary.totalSets}`"
      />
    </div>
    <ul
      aria-label="Ejercicios de la sesión"
      class="space-y-3"
    >
      <ExerciseCard
        v-for="(item, index) in active.exercises"
        :key="item.id"
        :item="item"
        :history="histories[item.exercise.id] ?? []"
        :is-first="index === 0"
        :is-last="index === active.exercises.length - 1"
        @move="moveExercise(item.id, $event)"
        @remove="removeExercise(item.id)"
        @add-set="addSet(item.id)"
        @remove-set="removeSet"
        @update-values="setValues"
        @toggle-set="(setId, done) => setDone(setId, done)"
        @complete-set="completeSet"
      />
    </ul>
    <UButton
      label="Añadir ejercicio"
      size="xl"
      block
      class="min-h-11"
      @click="picking = true"
    />
    <ExercisePickerSheet
      v-model:open="picking"
      @pick="addExercise"
    />
    <UButton
      label="Descartar entrenamiento"
      color="error"
      variant="ghost"
      block
      class="min-h-11"
      @click="ending = { status: 'confirming-discard' }"
    />
    <AppConfirmSheet
      v-model:open="discardOpen"
      title="Descartar entrenamiento"
      :description="ending.status === 'nothing-done'
        ? 'No hay ninguna serie hecha. ¿Descartar el entrenamiento?'
        : '¿Descartar el entrenamiento? Se borra por completo y no se puede deshacer.'"
      :confirm-label="ending.status === 'nothing-done' ? 'Descartar' : 'Sí, descartar'"
      @confirm="confirmDiscard"
    />
  </AppScreen>
</template>

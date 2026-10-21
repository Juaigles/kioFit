<script setup lang="ts">
import ExerciseCard from '../../features/workouts/components/ExerciseCard.vue'
import ExercisePicker from '../../features/workouts/components/ExercisePicker.vue'
import { useActiveSession } from '../../features/workouts/composables/useActiveSession'

const { active, start, addExercise: add, finish, discard, removeExercise, moveExercise, addSet, removeSet, setDone, completeSet, setValues } = useActiveSession()
const picking = ref(false)

type Ending = { status: 'idle' } | { status: 'nothing-done' } | { status: 'confirming-discard' }
const ending = ref<Ending>({ status: 'idle' })

/** Sin ninguna serie hecha no hay nada que terminar: se ofrece descartar (F-24). */
async function requestFinish() {
  if (active.value?.exercises.some(item => item.sets.some(set => set.done))) await finish()
  else ending.value = { status: 'nothing-done' }
}

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
  <UContainer class="space-y-4 py-6">
    <template v-if="active">
      <h1 class="text-2xl font-bold">
        Entrenamiento en curso
      </h1>
      <ul
        aria-label="Ejercicios de la sesión"
        class="space-y-3"
      >
        <ExerciseCard
          v-for="(item, index) in active.exercises"
          :key="item.id"
          :item="item"
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
      <ExercisePicker
        v-if="picking"
        @pick="addExercise"
        @cancel="picking = false"
      />
      <UButton
        v-else
        label="Añadir ejercicio"
        size="xl"
        block
        class="min-h-11"
        @click="picking = true"
      />
      <div
        v-if="ending.status === 'nothing-done'"
        role="alert"
        class="space-y-2 rounded-lg bg-warning/10 p-3"
      >
        <p>No hay ninguna serie hecha. ¿Descartar el entrenamiento?</p>
        <div class="flex gap-2">
          <UButton
            label="Descartar"
            color="error"
            class="min-h-11"
            @click="confirmDiscard"
          />
          <UButton
            label="Seguir entrenando"
            color="neutral"
            variant="outline"
            class="min-h-11"
            @click="ending = { status: 'idle' }"
          />
        </div>
      </div>
      <div
        v-else-if="ending.status === 'confirming-discard'"
        role="alert"
        class="space-y-2 rounded-lg bg-error/10 p-3"
      >
        <p>¿Descartar el entrenamiento? Se borra por completo y no se puede deshacer.</p>
        <div class="flex gap-2">
          <UButton
            label="Sí, descartar"
            color="error"
            class="min-h-11"
            @click="confirmDiscard"
          />
          <UButton
            label="Cancelar"
            color="neutral"
            variant="outline"
            class="min-h-11"
            @click="ending = { status: 'idle' }"
          />
        </div>
      </div>
      <div
        v-else
        class="flex flex-col gap-2"
      >
        <UButton
          label="Terminar entrenamiento"
          color="success"
          size="xl"
          block
          class="min-h-11"
          @click="requestFinish"
        />
        <UButton
          label="Descartar entrenamiento"
          color="error"
          variant="ghost"
          block
          class="min-h-11"
          @click="ending = { status: 'confirming-discard' }"
        />
      </div>
    </template>
    <template v-else-if="active === null">
      <h1 class="text-2xl font-bold">
        Entrenamiento
      </h1>
      <UButton
        label="Empezar entrenamiento"
        size="xl"
        block
        class="min-h-11"
        @click="start"
      />
    </template>
  </UContainer>
</template>

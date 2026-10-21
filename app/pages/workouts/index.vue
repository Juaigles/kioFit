<script setup lang="ts">
import ExerciseCard from '../../features/workouts/components/ExerciseCard.vue'
import ExercisePicker from '../../features/workouts/components/ExercisePicker.vue'
import { useActiveSession } from '../../features/workouts/composables/useActiveSession'

const { active, start, addExercise: add, removeExercise, moveExercise, addSet, removeSet, setDone } = useActiveSession()
const picking = ref(false)

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
          @toggle-set="(setId, done) => setDone(setId, done)"
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

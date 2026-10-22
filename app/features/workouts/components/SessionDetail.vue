<script setup lang="ts">
import { useFinishedSession } from '../composables/useSessionHistory'
import { formatSessionDate, formatSessionDuration } from '../domain/history'
import AppConfirmSheet from '../../../components/app/AppConfirmSheet.vue'
import ExerciseCard from './ExerciseCard.vue'

const props = defineProps<{ sessionId: string }>()
const emit = defineEmits<{ deleted: [] }>()
const { detail, deleteSession, removeExercise, moveExercise, addSet, removeSet, setDone, completeSet, setValues } = useFinishedSession(() => props.sessionId)

type Deleting = { status: 'idle' } | { status: 'confirming' }
const deleting = ref<Deleting>({ status: 'idle' })

const confirmingDelete = computed({
  get: () => deleting.value.status === 'confirming',
  set: (open) => {
    if (!open) deleting.value = { status: 'idle' }
  },
})

async function confirmDelete() {
  await deleteSession()
  emit('deleted')
}
</script>

<template>
  <template v-if="detail">
    <header class="space-y-1">
      <h1 class="text-2xl font-bold first-letter:uppercase">
        {{ formatSessionDate(detail.session.localDate) }}
      </h1>
      <p class="text-muted">
        {{ formatSessionDuration(detail.session.startedAt, detail.session.endedAt) }}
      </p>
    </header>
    <ul
      aria-label="Ejercicios de la sesión"
      class="space-y-3"
    >
      <ExerciseCard
        v-for="(item, index) in detail.exercises"
        :key="item.id"
        :item="item"
        :before="detail.session.startedAt"
        :is-first="index === 0"
        :is-last="index === detail.exercises.length - 1"
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
      label="Borrar"
      aria-label="Borrar entrenamiento"
      color="error"
      variant="outline"
      class="min-h-11"
      @click="deleting = { status: 'confirming' }"
    />
    <AppConfirmSheet
      v-model:open="confirmingDelete"
      title="Borrar entrenamiento"
      description="¿Borrar el entrenamiento? Se borra por completo y no se puede deshacer."
      confirm-label="Sí, borrar"
      @confirm="confirmDelete"
    />
  </template>
  <p v-else-if="detail === null">
    No se encuentra este entrenamiento.
  </p>
</template>

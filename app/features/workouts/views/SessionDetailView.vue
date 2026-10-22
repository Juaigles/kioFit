<script setup lang="ts">
import { computed, ref } from 'vue'
import AppActionSheet from '../../../components/app/AppActionSheet.vue'
import AppConfirmSheet from '../../../components/app/AppConfirmSheet.vue'
import ExerciseCard from '../components/ExerciseCard.vue'
import { useExerciseHistories } from '../composables/useExerciseHistories'
import { useFinishedSession } from '../composables/useSessionHistory'
import { formatSessionDate } from '../domain/history'
import { formatVolume, sessionSummary } from '../domain/summary'

const props = defineProps<{ sessionId: string }>()
const { detail, deleteSession, removeExercise, moveExercise, addSet, removeSet, setDone, completeSet, setValues } = useFinishedSession(() => props.sessionId)
const histories = useExerciseHistories(() => detail.value?.exercises.map(item => item.exercise.id) ?? [])

const back = { to: '/workouts', label: 'Historial' }

/** Totales de la sesión terminada: la duración llega hasta su hora de fin. */
const summary = computed(() => {
  const current = detail.value
  if (!current) return null
  return sessionSummary(current.session, current.exercises, Date.parse(current.session.endedAt ?? current.session.startedAt))
})

type Sheet = { status: 'none' } | { status: 'options' } | { status: 'confirming-delete' }
const sheet = ref<Sheet>({ status: 'none' })

const optionsOpen = computed({
  get: () => sheet.value.status === 'options',
  set: (open) => {
    if (!open && sheet.value.status === 'options') sheet.value = { status: 'none' }
  },
})
const confirmingDelete = computed({
  get: () => sheet.value.status === 'confirming-delete',
  set: (open) => {
    if (!open) sheet.value = { status: 'none' }
  },
})

async function confirmDelete() {
  await deleteSession()
  await navigateTo('/workouts')
}
</script>

<template>
  <AppScreen v-if="detail && summary">
    <AppPageHeader
      :title="formatSessionDate(detail.session.localDate)"
      :back="back"
    >
      <template #actions>
        <UButton
          icon="i-lucide-ellipsis"
          color="neutral"
          variant="ghost"
          class="min-h-11 min-w-11 justify-center"
          aria-label="Opciones del entrenamiento"
          @click="sheet = { status: 'options' }"
        />
      </template>
    </AppPageHeader>
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
        :value="`${summary.doneSets}`"
      />
    </div>
    <ul
      aria-label="Ejercicios de la sesión"
      class="space-y-3"
    >
      <ExerciseCard
        v-for="(item, index) in detail.exercises"
        :key="item.id"
        :item="item"
        :history="histories[item.exercise.id] ?? []"
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
    <AppActionSheet
      v-model:open="optionsOpen"
      title="Entrenamiento"
      :actions="[{ id: 'delete', label: 'Borrar entrenamiento', icon: 'i-lucide-trash-2', danger: true }]"
      @select="sheet = { status: 'confirming-delete' }"
    />
    <AppConfirmSheet
      v-model:open="confirmingDelete"
      title="Borrar entrenamiento"
      description="¿Borrar el entrenamiento? Se borra por completo y no se puede deshacer."
      confirm-label="Sí, borrar"
      @confirm="confirmDelete"
    />
  </AppScreen>
  <AppScreen v-else-if="detail === null">
    <AppPageHeader
      title="Entrenamiento"
      :back="back"
    />
    <p>No se encuentra este entrenamiento.</p>
  </AppScreen>
</template>

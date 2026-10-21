<script setup lang="ts">
import type { Measure } from '../../../types/workouts'
import { exerciseRuleMessage } from '../domain/exercise-rules'
import { useExerciseSearch } from '../composables/useExerciseSearch'

const emit = defineEmits<{ pick: [exerciseId: string], cancel: [] }>()

const { query, results, createCustom } = useExerciseSearch()

type Mode = { status: 'searching' } | { status: 'creating', name: string, measure: Measure, error?: string }
const mode = ref<Mode>({ status: 'searching' })

const measures: { value: Measure, label: string }[] = [
  { value: 'weight_reps', label: 'Peso y repeticiones' },
  { value: 'reps', label: 'Solo repeticiones' },
  { value: 'duration', label: 'Duración' },
]

function startCreating() {
  mode.value = { status: 'creating', name: query.value.trim(), measure: 'weight_reps' }
}

async function create() {
  if (mode.value.status !== 'creating') return
  const result = await createCustom(mode.value.name, mode.value.measure)
  if (result.ok) emit('pick', result.value.id)
  else mode.value = { ...mode.value, error: exerciseRuleMessage(result.reason) }
}
</script>

<template>
  <section
    class="space-y-3"
    aria-label="Elegir ejercicio"
  >
    <template v-if="mode.status === 'searching'">
      <UInput
        v-model="query"
        type="search"
        size="xl"
        class="w-full"
        placeholder="Buscar ejercicio"
        aria-label="Buscar ejercicio"
        autofocus
      />
      <ul
        v-if="results.length"
        class="divide-y divide-default"
      >
        <li
          v-for="exercise in results"
          :key="exercise.id"
        >
          <UButton
            :label="exercise.name"
            color="neutral"
            variant="ghost"
            size="xl"
            class="w-full min-h-11 justify-start"
            @click="emit('pick', exercise.id)"
          />
        </li>
      </ul>
      <div
        v-else
        class="space-y-3 py-4 text-center"
      >
        <p class="text-muted">
          Sin resultados
        </p>
        <UButton
          label="Crear ejercicio propio"
          size="xl"
          class="min-h-11"
          @click="startCreating"
        />
      </div>
    </template>

    <form
      v-else
      class="space-y-4"
      @submit.prevent="create"
    >
      <UFormField
        label="Nombre"
        :error="mode.error"
      >
        <UInput
          v-model="mode.name"
          size="xl"
          class="w-full"
        />
      </UFormField>
      <URadioGroup
        v-model="mode.measure"
        legend="Tipo de medida"
        :items="measures"
      />
      <UButton
        type="submit"
        label="Crear y añadir"
        size="xl"
        block
        class="min-h-11"
      />
    </form>

    <UButton
      label="Cancelar"
      color="neutral"
      variant="link"
      class="min-h-11"
      @click="emit('cancel')"
    />
  </section>
</template>

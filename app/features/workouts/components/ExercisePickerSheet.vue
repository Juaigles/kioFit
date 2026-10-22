<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Measure } from '../../../types/workouts'
import { exerciseRuleMessage } from '../domain/exercise-rules'
import { useExerciseSearch } from '../composables/useExerciseSearch'

/** Hoja para añadir un ejercicio: búsqueda con foco, un toque añade y "Crear ejercicio «texto»" al final (D-12). */
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ pick: [exerciseId: string] }>()

const { query, results, createCustom } = useExerciseSearch()

type Mode = { status: 'searching' } | { status: 'creating', name: string, measure: Measure, error?: string }
const mode = ref<Mode>({ status: 'searching' })

const measures: { value: Measure, label: string }[] = [
  { value: 'weight_reps', label: 'Peso y repeticiones' },
  { value: 'reps', label: 'Solo repeticiones' },
  { value: 'duration', label: 'Duración' },
]

const searchInput = ref<{ inputRef: HTMLInputElement | null } | null>(null)

/** Al abrir, el foco va a la búsqueda y no al primer elemento que encuentre la hoja (D-12). */
const content = {
  onOpenAutoFocus: (event: Event) => {
    event.preventDefault()
    searchInput.value?.inputRef?.focus()
  },
}

const typed = computed(() => query.value.trim())
/** Se ofrece crear cuando hay texto y ningún ejercicio se llama exactamente así. */
const canCreate = computed(() => typed.value !== '' && !results.value.some(exercise => exercise.name.toLowerCase() === typed.value.toLowerCase()))

watch(open, (isOpen) => {
  if (!isOpen) {
    query.value = ''
    mode.value = { status: 'searching' }
  }
})

function startCreating() {
  mode.value = { status: 'creating', name: typed.value, measure: 'weight_reps' }
}

async function create() {
  if (mode.value.status !== 'creating') return
  const result = await createCustom(mode.value.name, mode.value.measure)
  if (result.ok) emit('pick', result.value.id)
  else mode.value = { ...mode.value, error: exerciseRuleMessage(result.reason) }
}
</script>

<template>
  <UDrawer
    v-model:open="open"
    title="Añadir ejercicio"
    description="Busca un ejercicio o crea uno propio."
    :content="content"
  >
    <template #body>
      <section
        aria-label="Elegir ejercicio"
        class="space-y-3"
      >
        <template v-if="mode.status === 'searching'">
          <UInput
            ref="searchInput"
            v-model="query"
            type="search"
            size="xl"
            class="w-full"
            placeholder="Buscar ejercicio"
            aria-label="Buscar ejercicio"
          />
          <ul
            v-if="results.length"
            data-vaul-no-drag
            class="max-h-[45dvh] divide-y divide-default overflow-y-auto"
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
          <p
            v-else
            class="py-2 text-center text-muted"
          >
            Sin resultados
          </p>
          <UButton
            v-if="canCreate"
            :label="`Crear ejercicio «${typed}»`"
            icon="i-lucide-plus"
            color="neutral"
            variant="soft"
            size="xl"
            block
            class="min-h-11"
            @click="startCreating"
          />
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
      </section>
    </template>
    <template #footer>
      <UButton
        label="Cancelar"
        color="neutral"
        variant="outline"
        size="xl"
        block
        class="min-h-11 pb-[env(safe-area-inset-bottom)]"
        @click="open = false"
      />
    </template>
  </UDrawer>
</template>

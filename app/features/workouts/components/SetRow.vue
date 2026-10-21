<script setup lang="ts">
import type { Measure, SetValues, WorkoutSet } from '../../../types/workouts'
import { formatDuration, formatReps, formatWeightKg, parseDurationSeconds, parseReps, parseWeightKg, type ParseResult } from '../domain/values'

const props = defineProps<{ set: WorkoutSet, measure: Measure }>()
const emit = defineEmits<{
  'update-values': [values: SetValues]
  'toggle': []
  'remove': []
}>()

type FieldKey = 'weightKg' | 'reps' | 'durationSeconds'

interface FieldSpec {
  key: FieldKey
  label: string
  error: string
  inputmode: 'decimal' | 'numeric'
  placeholder: string
  parse: (text: string) => ParseResult<number>
  format: (value: number) => string
}

const FIELDS: Record<FieldKey, FieldSpec> = {
  weightKg: { key: 'weightKg', label: 'Kg', error: 'Peso no válido (0 a 999,99)', inputmode: 'decimal', placeholder: 'kg', parse: parseWeightKg, format: formatWeightKg },
  reps: { key: 'reps', label: 'Reps', error: 'Reps no válidas (1 a 999)', inputmode: 'numeric', placeholder: 'reps', parse: parseReps, format: formatReps },
  durationSeconds: { key: 'durationSeconds', label: 'Tiempo', error: 'Tiempo no válido (0:01 a 59:59)', inputmode: 'numeric', placeholder: 'mm:ss', parse: parseDurationSeconds, format: formatDuration },
}

const FIELDS_BY_MEASURE: Record<Measure, FieldKey[]> = {
  weight_reps: ['weightKg', 'reps'],
  reps: ['reps'],
  duration: ['durationSeconds'],
}

const fields = computed(() => FIELDS_BY_MEASURE[props.measure].map(key => FIELDS[key]))
const number = computed(() => props.set.position + 1)

function textOf(spec: FieldSpec): string {
  const value = props.set[spec.key]
  return value === undefined ? '' : spec.format(value)
}

/** Lo que se ve en cada campo; vuelve al valor guardado cuando éste cambia. */
const drafts = ref<Record<FieldKey, string>>({
  weightKg: textOf(FIELDS.weightKg),
  reps: textOf(FIELDS.reps),
  durationSeconds: textOf(FIELDS.durationSeconds),
})
const invalid = ref<Record<FieldKey, boolean>>({ weightKg: false, reps: false, durationSeconds: false })

for (const spec of Object.values(FIELDS)) {
  watch(() => props.set[spec.key], () => {
    drafts.value[spec.key] = textOf(spec)
    invalid.value[spec.key] = false
  })
}

/** Vacío borra el valor; válido lo guarda; no válido se indica y no se guarda. */
function commit(spec: FieldSpec) {
  const result = spec.parse(drafts.value[spec.key])
  if (result.ok) {
    invalid.value[spec.key] = false
    if (result.value !== props.set[spec.key]) emit('update-values', { [spec.key]: result.value })
  }
  else if (result.reason === 'empty') {
    invalid.value[spec.key] = false
    if (props.set[spec.key] !== undefined) emit('update-values', { [spec.key]: undefined })
  }
  else {
    invalid.value[spec.key] = true
  }
}

/** "Siguiente" del teclado: el foco pasa al campo siguiente de la sesión (kg, reps, kg de la serie siguiente). */
function focusNext(event: KeyboardEvent) {
  const current = event.target as HTMLElement
  const all = Array.from(document.querySelectorAll<HTMLElement>('[data-set-field]'))
  all[all.indexOf(current) + 1]?.focus()
}
</script>

<template>
  <li class="flex flex-wrap items-center gap-1">
    <span class="w-16 shrink-0">Serie {{ number }}</span>
    <div class="flex flex-1 gap-1">
      <UInput
        v-for="spec in fields"
        :key="spec.key"
        v-model="drafts[spec.key]"
        type="text"
        :inputmode="spec.inputmode"
        enterkeyhint="next"
        autocomplete="off"
        data-set-field
        :placeholder="spec.placeholder"
        :aria-label="`${spec.label} serie ${number}${spec.key === 'durationSeconds' ? ' (mm:ss)' : ''}`"
        :aria-invalid="invalid[spec.key]"
        :color="invalid[spec.key] ? 'error' : 'neutral'"
        class="min-w-0 flex-1"
        :ui="{ base: 'min-h-11 text-center' }"
        @blur="commit(spec)"
        @keydown.enter.prevent="commit(spec); focusNext($event)"
      />
    </div>
    <UButton
      :label="set.done ? '✓' : '○'"
      :color="set.done ? 'success' : 'neutral'"
      variant="ghost"
      class="min-h-11 min-w-11 justify-center"
      :aria-label="set.done ? `Desmarcar serie ${number}` : `Marcar serie ${number} como hecha`"
      :aria-pressed="set.done"
      @click="emit('toggle')"
    />
    <UButton
      label="✕"
      color="neutral"
      variant="ghost"
      class="min-h-11 min-w-11 justify-center"
      :aria-label="`Quitar serie ${number}`"
      @click="emit('remove')"
    />
    <p
      v-for="spec in fields.filter(f => invalid[f.key])"
      :key="spec.key"
      role="alert"
      class="w-full text-sm text-error"
    >
      {{ spec.error }}
    </p>
  </li>
</template>

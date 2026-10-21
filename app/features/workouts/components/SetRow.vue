<script setup lang="ts">
import type { Measure, SetValues, WorkoutSet } from '../../../types/workouts'
import { FIELDS_BY_MEASURE, resolveSetCompletion, type PreviousReference, type SetField } from '../domain/previous'
import { formatDuration, formatReps, formatWeightKg, parseDurationSeconds, parseReps, parseWeightKg, type ParseResult } from '../domain/values'

const props = defineProps<{ set: WorkoutSet, measure: Measure, reference: PreviousReference }>()
const emit = defineEmits<{
  'update-values': [values: SetValues]
  'toggle': []
  'complete': [values: SetValues]
  'remove': []
}>()

type FieldKey = SetField

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
/** Campos que faltaban al intentar marcar la serie sin referencia (F-20). */
const missing = ref<FieldKey[]>([])

for (const spec of Object.values(FIELDS)) {
  watch(() => props.set[spec.key], () => {
    drafts.value[spec.key] = textOf(spec)
    invalid.value[spec.key] = false
    missing.value = missing.value.filter(key => key !== spec.key)
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

/**
 * Marcar como hecha: los campos vacíos se rellenan con la referencia (F-19); sin referencia no se marca y se indica qué falta (F-20).
 * Lee lo que hay escrito, no lo guardado: el toque llega justo después de salir del campo, antes de que Dexie lo devuelva.
 * Desmarcar no comprueba nada.
 */
function toggle() {
  if (props.set.done) return emit('toggle')
  const current: SetValues = {}
  for (const spec of fields.value) {
    const result = spec.parse(drafts.value[spec.key])
    if (result.ok) current[spec.key] = result.value
    else if (result.reason === 'invalid') {
      invalid.value[spec.key] = true
      return
    }
  }
  const completion = resolveSetCompletion(current, props.measure, props.reference.values)
  if (completion.ok) {
    missing.value = []
    emit('complete', completion.values)
  }
  else {
    missing.value = completion.missing
  }
}

const missingMessage = computed(() => {
  const names = missing.value.map(key => FIELDS[key].label.toLowerCase())
  if (names.length === 0) return ''
  return names.length === 1 ? `Falta ${names[0]}` : `Faltan ${names.join(' y ')}`
})

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
    <span class="w-16 shrink-0 text-center text-muted"><span class="sr-only">Anterior: </span>{{ reference.text }}</span>
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
        :aria-invalid="invalid[spec.key] || missing.includes(spec.key)"
        :color="invalid[spec.key] || missing.includes(spec.key) ? 'error' : 'neutral'"
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
      @click="toggle"
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
      v-if="missingMessage"
      role="alert"
      class="w-full text-sm text-error"
    >
      {{ missingMessage }}
    </p>
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

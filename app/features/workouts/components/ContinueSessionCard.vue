<script setup lang="ts">
import type { SessionTotals } from '../domain/summary'

/** Entrada a la sesión en curso desde Hoy y Entrenar (D-04). */
defineProps<{ summary: SessionTotals }>()
</script>

<template>
  <NuxtLink
    to="/workouts/session"
    class="flex min-h-11 items-center gap-3 rounded-lg bg-primary px-4 py-3 text-white"
  >
    <span class="flex-1">
      <span class="block text-base font-semibold">Continuar entrenamiento</span>
      <span class="block text-sm opacity-90">{{ summary.minutes }} min · {{ summary.doneSets }}/{{ summary.totalSets }} series</span>
    </span>
    <UIcon
      name="i-lucide-chevron-right"
      class="size-5"
      aria-hidden="true"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
/** Dato con su etiqueta: duración, volumen, series (D-03). */
defineProps<{ label: string, value: string }>()
</script>

<template>
  <div class="flex-1 rounded-lg bg-elevated px-3 py-2">
    <p class="text-xs text-muted">
      {{ label }}
    </p>
    <p class="text-lg font-semibold">
      {{ value }}
    </p>
  </div>
</template>

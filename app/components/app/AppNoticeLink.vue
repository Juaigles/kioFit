<script setup lang="ts">
/** Aviso de una línea que lleva a otra pantalla, p. ej. el de copia antigua en Hoy (D-15). */
defineProps<{ to: string, text: string }>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex min-h-11 items-center gap-3 rounded-lg bg-elevated px-4 py-3"
  >
    <UIcon
      name="i-lucide-triangle-alert"
      class="size-5 text-primary-text"
      aria-hidden="true"
    />
    <span class="flex-1 text-base">{{ text }}</span>
    <UIcon
      name="i-lucide-chevron-right"
      class="size-5 text-muted"
      aria-hidden="true"
    />
  </NuxtLink>
</template>

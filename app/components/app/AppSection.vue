<script setup lang="ts">
/** Bloque de pantalla con un título de grupo pequeño encima (D-14). */
defineProps<{ title: string }>()
</script>

<template>
  <section class="space-y-2">
    <h2 class="px-1 text-sm font-medium text-muted">
      {{ title }}
    </h2>
    <slot />
  </section>
</template>

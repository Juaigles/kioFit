<script setup lang="ts">
/** Lista agrupada estilo Ajustes de iOS; el `label` es su nombre accesible (D-14). */
defineProps<{ label: string }>()
</script>

<template>
  <ul
    :aria-label="label"
    class="divide-y divide-default overflow-hidden rounded-xl bg-elevated"
  >
    <slot />
  </ul>
</template>

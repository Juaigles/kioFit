<script setup lang="ts">
/** Título grande de una pestaña; con `back`, barra de navegación con "atrás" (D-13, D-14). */
defineProps<{ title: string, back?: { to: string, label: string } }>()
</script>

<template>
  <header class="space-y-1">
    <NuxtLink
      v-if="back"
      :to="back.to"
      class="-ms-2 inline-flex min-h-11 items-center gap-0.5 px-2 text-base text-primary-text"
    >
      <UIcon
        name="i-lucide-chevron-left"
        class="size-5"
        aria-hidden="true"
      />
      {{ back.label }}
    </NuxtLink>
    <div class="flex items-center gap-2">
      <h1 class="flex-1 text-[34px] leading-[41px] font-bold tracking-tight">
        {{ title }}
      </h1>
      <slot name="actions" />
    </div>
  </header>
</template>

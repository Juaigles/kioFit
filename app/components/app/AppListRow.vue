<script setup lang="ts">
/** Fila de `AppListGroup`: con `to` es un enlace, con `action` un botón que emite `select`, y sin ninguno solo informa (D-14). */
withDefaults(defineProps<{
  label: string
  value?: string
  to?: string
  action?: boolean
  loading?: boolean
  tone?: 'default' | 'danger'
}>(), { tone: 'default' })

defineEmits<{ select: [] }>()
</script>

<template>
  <li>
    <NuxtLink
      v-if="to"
      :to="to"
      class="flex min-h-11 items-center gap-3 px-4 py-2.5"
      :class="tone === 'danger' ? 'text-error' : 'text-default'"
    >
      <span class="flex-1">{{ label }}</span>
      <span
        v-if="value"
        class="text-muted"
      >{{ value }}</span>
      <UIcon
        name="i-lucide-chevron-right"
        class="size-5 text-muted"
        aria-hidden="true"
      />
    </NuxtLink>
    <button
      v-else-if="action"
      type="button"
      class="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-start disabled:opacity-60"
      :class="tone === 'danger' ? 'text-error' : 'text-primary-text'"
      :disabled="loading"
      @click="$emit('select')"
    >
      <span class="flex-1">{{ label }}</span>
      <UIcon
        v-if="loading"
        name="i-lucide-loader-circle"
        class="size-5 animate-spin text-muted"
        aria-hidden="true"
      />
    </button>
    <div
      v-else
      class="flex min-h-11 items-center gap-3 px-4 py-2.5"
    >
      <span class="flex-1">{{ label }}</span>
      <span
        v-if="value"
        class="text-muted"
      >{{ value }}</span>
    </div>
  </li>
</template>

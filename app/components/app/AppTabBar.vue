<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { TabItem } from '../../utils/tabs'

defineProps<{ items: readonly TabItem[] }>()

const route = useRoute()

/** Hoy solo coincide con la portada; el resto, con su ruta y las de debajo (`/workouts/history/…`). */
function isCurrent(to: string) {
  return to === '/' ? route.path === '/' : route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <nav
    aria-label="Principal"
    class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-elevated pb-[env(safe-area-inset-bottom)]"
  >
    <ul
      class="mx-auto grid max-w-2xl"
      :style="{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }"
    >
      <li
        v-for="item in items"
        :key="item.to"
      >
        <NuxtLink
          :to="item.to"
          :aria-current="isCurrent(item.to) ? 'page' : undefined"
          class="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold"
          :class="isCurrent(item.to) ? 'text-primary-text' : 'text-muted'"
        >
          <UIcon
            :name="item.icon"
            class="size-6"
            aria-hidden="true"
          />
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { APP_TABS } from '../utils/tabs'
</script>

<template>
  <div class="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
    <slot />
    <AppTabBar :items="APP_TABS" />
  </div>
</template>

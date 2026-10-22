<script setup lang="ts">
import { useBackupReminder } from '../composables/useBackupReminder'

const reminder = useBackupReminder()
</script>

<template>
  <AppNoticeLink
    v-if="reminder"
    to="/settings"
    :text="reminder"
  />
</template>

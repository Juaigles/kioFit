<script setup lang="ts">
import { useBackupExport } from '../features/backup/composables/useBackupExport'

const { label, exporting, error, exportBackup } = useBackupExport()
</script>

<template>
  <UContainer class="space-y-4 py-8">
    <h1 class="text-2xl font-bold">
      Datos
    </h1>
    <p class="text-muted">
      {{ label }}
    </p>
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="error"
    />
    <UButton
      label="Exportar copia"
      size="xl"
      block
      class="min-h-11"
      :loading="exporting"
      @click="exportBackup"
    />
    <UButton
      to="/"
      label="Volver"
      color="neutral"
      variant="ghost"
      class="min-h-11"
    />
  </UContainer>
</template>

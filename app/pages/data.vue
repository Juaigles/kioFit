<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBackupExport } from '../features/backup/composables/useBackupExport'

import { useBackupImport } from '../features/backup/composables/useBackupImport'

const { label, exporting, error, exportBackup } = useBackupExport()
const { state: importState, choose, cancel, confirm } = useBackupImport()

const fileInput = ref<HTMLInputElement | null>(null)
const confirming = computed({
  get: () => importState.value.status === 'confirming',
  set: (open) => {
    if (!open && importState.value.status === 'confirming') cancel()
  },
})

function pluralize(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

const summaryText = computed(() => {
  const current = importState.value
  if (current.status !== 'confirming') return ''
  const { summary } = current
  const date = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(summary.exportedAt))
  return `Copia del ${date}: ${pluralize(summary.sessionCount, 'sesión', 'sesiones')} y ${pluralize(summary.customExerciseCount, 'ejercicio propio', 'ejercicios propios')}.`
})

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Se vacía para poder elegir el mismo archivo otra vez.
  input.value = ''
  if (file) await choose(file)
}
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
      label="Importar copia"
      size="xl"
      block
      color="neutral"
      variant="outline"
      class="min-h-11"
      @click="fileInput?.click()"
    />
    <input
      ref="fileInput"
      type="file"
      accept="application/json,.json"
      class="hidden"
      @change="onFileChosen"
    >
    <UAlert
      v-if="importState.status === 'error'"
      color="error"
      variant="subtle"
      :title="importState.message"
    />
    <UAlert
      v-if="importState.status === 'done'"
      color="success"
      variant="subtle"
      title="Copia importada"
      description="Tus datos se han sustituido por los de la copia."
    />
    <UModal
      v-model:open="confirming"
      title="Importar copia"
      :dismissible="false"
    >
      <template #body>
        <p>{{ summaryText }}</p>
        <p class="mt-2 font-medium">
          Importar sustituye todos los datos actuales. No se puede deshacer.
        </p>
      </template>
      <template #footer>
        <UButton
          label="Cancelar"
          color="neutral"
          variant="outline"
          class="min-h-11"
          @click="cancel"
        />
        <UButton
          label="Importar"
          color="error"
          class="min-h-11"
          @click="confirm"
        />
      </template>
    </UModal>
    <UButton
      to="/"
      label="Volver"
      color="neutral"
      variant="ghost"
      class="min-h-11"
    />
  </UContainer>
</template>

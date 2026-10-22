<script setup lang="ts">
import { computed, ref } from 'vue'
import AppConfirmSheet from '../../../components/app/AppConfirmSheet.vue'
import { useBackupExport } from '../composables/useBackupExport'
import { useBackupImport } from '../composables/useBackupImport'

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
  <AppScreen>
    <AppPageHeader title="Ajustes" />
    <AppSection title="Copia de seguridad">
      <AppListGroup label="Copia de seguridad">
        <AppListRow :label="label" />
        <AppListRow
          label="Exportar copia"
          action
          :loading="exporting"
          @select="exportBackup"
        />
        <AppListRow
          label="Importar copia"
          action
          @select="fileInput?.click()"
        />
      </AppListGroup>
    </AppSection>
    <input
      ref="fileInput"
      type="file"
      accept="application/json,.json"
      class="hidden"
      @change="onFileChosen"
    >
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="error"
    />
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
    <AppSection title="Acerca de">
      <AppListGroup label="Acerca de">
        <AppListRow
          label="kioFit"
          value="Tus datos viven solo en este dispositivo"
        />
      </AppListGroup>
    </AppSection>
    <AppConfirmSheet
      v-model:open="confirming"
      title="Importar copia"
      confirm-label="Importar"
      @confirm="confirm"
    >
      <p>{{ summaryText }}</p>
      <p class="mt-2 font-medium">
        Importar sustituye todos los datos actuales. No se puede deshacer.
      </p>
    </AppConfirmSheet>
  </AppScreen>
</template>

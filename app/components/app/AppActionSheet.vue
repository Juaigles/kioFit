<script setup lang="ts">
export interface SheetAction {
  id: string
  label: string
  icon?: string
  danger?: boolean
  disabled?: boolean
}

/** Hoja inferior con acciones; siempre termina en "Cancelar" (D-09, D-10). */
defineProps<{ title: string, actions: SheetAction[] }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ select: [id: string] }>()

function choose(id: string) {
  emit('select', id)
  open.value = false
}
</script>

<template>
  <UDrawer
    v-model:open="open"
    :title="title"
  >
    <template #footer>
      <div class="flex w-full flex-col gap-2 pb-[env(safe-area-inset-bottom)]">
        <UButton
          v-for="action in actions"
          :key="action.id"
          :label="action.label"
          :icon="action.icon"
          :color="action.danger ? 'error' : 'neutral'"
          :disabled="action.disabled"
          variant="soft"
          size="xl"
          block
          class="min-h-11"
          @click="choose(action.id)"
        />
        <UButton
          label="Cancelar"
          color="neutral"
          variant="outline"
          size="xl"
          block
          class="min-h-11"
          @click="open = false"
        />
      </div>
    </template>
  </UDrawer>
</template>

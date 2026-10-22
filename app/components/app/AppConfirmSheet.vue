<script setup lang="ts">
/** Hoja inferior para confirmar una acción que borra datos: la acción en rojo y siempre "Cancelar" (D-11). */
defineProps<{ title: string, description?: string, confirmLabel: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <UDrawer
    v-model:open="open"
    :title="title"
    :description="description"
  >
    <template
      v-if="$slots.default"
      #body
    >
      <slot />
    </template>
    <template #footer>
      <div class="flex w-full flex-col gap-2 pb-[env(safe-area-inset-bottom)]">
        <UButton
          :label="confirmLabel"
          color="error"
          size="xl"
          block
          class="min-h-11"
          @click="emit('confirm')"
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

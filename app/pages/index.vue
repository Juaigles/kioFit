<template>
  <UContainer class="space-y-4 py-8">
    <h1 class="text-2xl font-bold">
      kioFit
    </h1>
    <UButton
      to="/workouts"
      label="Entrenamiento"
      size="xl"
      block
      class="min-h-11"
    />
    <UButton
      to="/workouts/history"
      label="Historial"
      color="neutral"
      variant="outline"
      size="xl"
      block
      class="min-h-11"
    />
  </UContainer>
</template>

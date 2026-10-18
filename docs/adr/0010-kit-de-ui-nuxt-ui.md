# ADR-0010: Nuxt UI como kit de componentes

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
Faltaba elegir kit de UI (pendiente de la Fase 0). Las opciones eran Nuxt UI, shadcn-vue con Tailwind (lo que usa workouttracker) o solo Tailwind. Con tareas de 60-90 min y diffs revisables en 10-15 min (ADR-0003), cada componente escrito a mano es diff que revisar.

## Decisión
Nuxt UI 4 (gratuito y abierto entero, sobre Tailwind 4 y Reka UI), instalado como módulo de Nuxt. Se usa un componente de Nuxt UI antes de escribir uno propio, y los colores y tamaños van en `app.config.ts`, no repartidos por los componentes.

## Consecuencias
- Componentes accesibles (teclado, foco, ARIA) sin escribirlos, y diffs más pequeños.
- Dependemos de la API de Nuxt UI: una versión mayor nueva puede exigir migración.
- Menos control fino que shadcn-vue, que copia el código al repo. Si un componente se queda corto, se envuelve en `app/components/`, no se reescribe el kit.
- Elegido por Jota en la tarjeta del 2026-10-18.

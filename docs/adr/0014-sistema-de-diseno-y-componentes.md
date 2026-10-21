# ADR-0014: Sistema de diseño con tokens y arquitectura de componentes en capas

- Estado: aceptada
- Fecha: 2026-10-21 (aprobada por Jota en tarjeta el mismo día)
- Precisa: ADR-0010 (cómo se usa Nuxt UI)

## Contexto
Con Fuerza y la copia de seguridad en `main`, la app funciona pero no tiene cohesión: cada pantalla elige colores y botones (verde para añadir y para terminar, rojo en texto suelto), las confirmaciones son a veces bloques en línea y a veces modales, y no hay navegación. Vienen dos módulos más (Peso y Comidas) y los escriben agentes: sin un catálogo cerrado, cada tarea inventará su propio estilo. El ADR-0010 eligió Nuxt UI y pidió colores en `app.config.ts`, pero no definió qué colores ni qué componentes propios.

## Decisión
- **Tokens en tres capas.** Paleta en `@theme static` de `main.css`; tokens semánticos en `:root` y `.dark` (las variables `--ui-*` de Nuxt UI más las nuestras `--kf-*`); ajustes por componente en `app.config.ts`. Los componentes solo usan la capa semántica. Valores en `docs/diseno/sistema-de-diseno.md`.
- **Acento azul `kio`** (`#1F6FEB`), neutros fríos, verde solo para "hecho" y rojo solo para borrar. Modo claro y oscuro siguiendo al sistema.
- **Fuente del sistema e iconos Lucide empaquetados**: sin descargas, coherente con ADR-0004.
- **Cuatro capas de UI**, cada una solo importa de las de abajo:
  1. Primitivas de Nuxt UI (`U*`).
  2. Componentes de la app en `app/components/app/` (`App*`): piezas del sistema de diseño sin dominio.
  3. Componentes de feature en `app/features/<m>/components/`: reciben datos por props y emiten eventos; no leen repositorios.
  4. Vistas de feature en `app/features/<m>/views/` (`*View.vue`): usan los composables de datos (Dexie vía repositorio) y componen la pantalla. Las páginas solo montan una vista y eligen layout.
- **Navegación con pestañas** (`AppTabBar` en el layout `default`) y un layout `focus` sin pestañas para la sesión en curso. Las pestañas aparecen cuando existe su módulo.
- **Una sola hoja para confirmar** (`AppConfirmSheet`) y otra para acciones (`AppActionSheet`), sobre `UDrawer`.
- **Guardarraíl automático:** un test unitario falla si un `.vue` de `app/` usa colores de la paleta de Tailwind, hexadecimales o `style` con color.

## Consecuencias
- Peso y Comidas solo componen piezas existentes; una spec de módulo no discute colores.
- El agente tiene un catálogo cerrado y un test que le impide salirse; la revisión deja de ser píxel a píxel.
- Pasar de pantallas a vistas obliga a mover la lectura de datos que hoy está dentro de `ExerciseCard` (historial del ejercicio) a la vista de la sesión.
- Más archivos pequeños y una migración de 9 tareas antes de empezar Peso. Se acepta porque sin ella Peso heredaría el desorden.
- Dependencia nueva de desarrollo: `@iconify-json/lucide`, para empaquetar los iconos y que funcionen sin red. Se justifica en el plan de diseño.
- Pinia sigue sin usarse para datos (ADR-0009); el estado de hojas y confirmaciones es local, con uniones discriminadas.

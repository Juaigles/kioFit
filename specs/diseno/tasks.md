# Tareas: experiencia de uso y sistema de diseño

Cada tarea cabe en 60-90 min y ~300 líneas sin tests (ADR-0003). Una rama, un commit y un PR por tarea. Orden de arriba abajo: cada una deja la app usable y el CI en verde.

| # | Tarea | Escenarios | Tests primero | Estado |
| --- | --- | --- | --- | --- |
| D01 | Tokens, tema claro y oscuro, y guardarraíl de colores | D-16, D-17 | `tests/unit/design/tokens.test.ts`, `tests/e2e/navigation/color-mode.spec.ts` | hecha ([#31](https://github.com/Juaigles/kioFit/pull/31)) |
| D02 | Barra de pestañas, layouts y pantallas base | D-01, D-02 | `tests/unit/components/app-tab-bar.test.ts`, `tests/e2e/navigation/tabs.spec.ts` | hecha ([#32](https://github.com/Juaigles/kioFit/pull/32)) |
| D03 | Hojas de acciones y de confirmación | D-11 | `tests/unit/components/app-sheets.test.ts`, `tests/e2e/navigation/confirm-sheet.spec.ts` | hecha ([#33](https://github.com/Juaigles/kioFit/pull/33)) |
| D04 | Sesión a pantalla completa, resumen y "Continuar" | D-03, D-04, D-05 | `tests/unit/features/workouts/domain/summary.test.ts`, `tests/e2e/workouts/session-screen.spec.ts` | hecha ([#34](https://github.com/Juaigles/kioFit/pull/34)) |
| D05 | Tarjeta del ejercicio con menú en hoja | D-09 | `tests/e2e/workouts/exercise-menu.spec.ts` | hecha ([#36](https://github.com/Juaigles/kioFit/pull/36)) |
| D06 | Tabla de series | D-06, D-07, D-08, D-10, D-18 | `tests/unit/features/workouts/components/set-table.test.ts`, `tests/e2e/workouts/set-table.spec.ts` | hecha ([#37](https://github.com/Juaigles/kioFit/pull/37)) |
| D07 | Añadir ejercicio en hoja | D-12 | `tests/e2e/workouts/picker-sheet.spec.ts` | en revisión |
| D08 | Entrenar con historial y detalle | D-13 | `tests/e2e/workouts/train-history.spec.ts` | pendiente |
| D09 | Ajustes y aviso de copia antigua | D-14, D-15 | `tests/unit/features/backup/domain/backup-reminder.test.ts`, `tests/e2e/backup/settings.spec.ts` | pendiente |

Estados: pendiente · en curso · en revisión (enlace al PR) · hecha.

## Alcance de cada tarea

Estimación de líneas sin tests, orientativa.

- **D01 (~150).** `main.css` con paleta, tokens `:root`/`.dark`, `@theme inline`, fuente del sistema, números tabulares y movimiento reducido; `app.config.ts`; `nuxt.config.ts` (viewport, `theme-color` por modo, modo de color del sistema). Los iconos empaquetados y `@iconify-json/lucide` pasan a D02, donde se usan por primera vez y se puede comprobar el e2e sin red. Cambiar las dos clases `bg-warning/10` y `bg-error/10` que ya existen solo si el guardarraíl las marca. El e2e sin red (F-22) debe seguir en verde.
- **D02 (~240).** `@iconify-json/lucide` y `icon.clientBundle` en `nuxt.config.ts`; `AppScreen`, `AppPageHeader`, `AppTabBar` y el layout `default` (`<NuxtLayout>` en `app.vue`). `AppStatTile` pasa a D04 y `AppSection` a D09, y el layout `focus` a D04: se crean donde se usan por primera vez. Hoy pasa a `TodayView` con "Empezar entrenamiento" (la tarjeta "Continuar" llega en D04). Los botones "Historial" y "Datos" de la portada desaparecen: se llega por las pestañas.
- **D03 (~180).** `AppActionSheet` y `AppConfirmSheet` sobre `UDrawer`. Se migran las cuatro confirmaciones existentes (descartar, quitar ejercicio con series hechas, borrar sesión, importar) sin cambiar sus textos. Actualiza los pasos de los e2e de F-13, F-24, F-25, F-28 y C-10 si hace falta.
- **D04 (~250).** `sessionSummary` en el dominio, ruta `/workouts/session` con layout `focus`, `SessionView`, `SessionHeader` (Minimizar, Terminar, tres `AppStatTile`), `ContinueSessionCard` en Hoy y Entrenar, `TrainView` mínima (Empezar o Continuar, y el botón Historial hasta D08), `AppStatTile`, layout `focus` y `useNow`. "Empezar" navega a la sesión; "Minimizar" lleva a Hoy; sin sesión en curso, `/workouts/session` redirige a Entrenar.
- **D05 (~200).** `ExerciseCard` rediseñado: nombre en acento, botón "Opciones de <ejercicio>" con `AppActionSheet` (Subir, Bajar, Quitar). La lectura del historial del ejercicio sube a `SessionView`. Actualiza los pasos de F-12 y F-13.
- **D06 (~280).** `SetTable` con cabeceras según medida, `SetRow` con pista de referencia en el `placeholder`, fila hecha con `bg-done-tint`, check de 44 px, número de serie que abre "Borrar serie". Se mantiene "Siguiente" (F-17) y la lógica de F-19/F-20 tal cual. Jota prueba en el iPhone antes de fusionar. Si pasa de 300 líneas, D-10 se va a una tarea propia.
- **D07 (~180).** `ExercisePickerSheet`: hoja con foco en la búsqueda, filas que añaden con un toque, "Crear ejercicio «texto»" al final. Reutiliza `useExerciseSearch`. Actualiza los pasos de F-04.
- **D08 (~220).** `TrainView` con Empezar/Continuar e historial por mes en `SessionCard`; detalle con `AppPageHeader`, `AppStatTile` y opciones (Editar, Borrar) en hoja. Elimina `/workouts/history`. Actualiza los pasos de F-26 a F-28.
- **D09 (~200).** `/settings` con `SettingsView` (grupo "Copia de seguridad" con `AppListGroup`/`AppListRow`, "Acerca de"), `backupReminder` y el aviso en Hoy. Elimina `/data`. Actualiza los pasos de los e2e de copia.

## Reparto de escenarios

D01 (D-16, D-17), D02 (D-01, D-02), D03 (D-11), D04 (D-03, D-04, D-05), D05 (D-09), D06 (D-06, D-07, D-08, D-10, D-18), D07 (D-12), D08 (D-13), D09 (D-14, D-15). Total: 18, los mismos que la spec.

## Dependencias entre tareas

- Todas necesitan los tokens de D01.
- D03 a D09 usan el layout y `AppScreen` de D02.
- D05 y D08 usan `AppActionSheet` de D03; D03 se adelanta a D04 por eso.
- D06 va después de D05 porque `SetTable` vive dentro de la nueva `ExerciseCard`.
- D09 es independiente de D04-D08 y puede ir en paralelo tras D03.

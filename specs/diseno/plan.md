# Plan: experiencia de uso y sistema de diseño

- Spec: [spec.md](spec.md) (aprobada el 2026-10-21) · Redactado por Claude, a revisar por Jota · 2026-10-21
- Decisiones: ADR-0009, 0010, 0014 · Referencia: [sistema de diseño](../../docs/diseno/sistema-de-diseno.md) · Tareas: [tasks.md](tasks.md)

## Enfoque

Es una migración de presentación: el dominio (`domain/`), los repositorios y el esquema de Dexie no cambian, y los escenarios F y C siguen en verde en cada tarea. Primero se ponen los cimientos que no se ven (tokens, tema, guardarraíl), luego las piezas del sistema (`App*`), luego la navegación, y después se rehace cada pantalla de fuera hacia dentro: sesión, series, selector, historial y ajustes. Cada tarea deja la app usable y el CI en verde, así que se puede parar en cualquier punto.

## Arquitectura frontend

```
pages/            elige layout y monta una vista. Nada más.
  └─ features/<m>/views/*View.vue     contenedor: usa composables de datos, maneja hojas y estado de UI
       └─ features/<m>/components/*   presentacional: props hacia abajo, eventos hacia arriba
            └─ components/app/App*    sistema de diseño, sin dominio
                 └─ Nuxt UI (U*)      primitivas
composables de datos (liveQuery) ─► repositorios (app/types) ─► app/db (Dexie)
```

Reglas (se copian a `AGENTS.md`):
- Una capa solo importa de las de debajo. `App*` no conoce el dominio; un componente de feature no llama a composables de datos; una página no tiene lógica.
- Los datos bajan por props y las intenciones suben por eventos (`@complete-set`, `@remove`). La vista es quien llama al composable (`useActiveSession`) y por tanto al repositorio.
- Estado de UI local con uniones discriminadas: `type Sheet = { kind: 'none' } | { kind: 'exercise-actions', itemId } | { kind: 'confirm-remove', itemId }`. Una vista abre como mucho una hoja a la vez.
- Pinia no entra: no hay estado de UI que cruce pantallas. Si aparece (por ejemplo, la barra de sesión minimizada después del MVP), irá en `app/stores/` con su justificación.
- Los nombres accesibles (`aria-label`, textos de botón) son parte del contrato: los e2e los usan y el sistema los mantiene estables.

## Tokens e integración con Nuxt UI

- `app/assets/css/main.css`: `@theme static` con la paleta `kio-50…950`; `:root` y `.dark` con las `--ui-*` (fondos, texto, borde, radio) y las `--kf-*` propias; `@theme inline` para exponer `--kf-*` como utilidades (`bg-done-tint`, `text-primary-text`); `font-family` del sistema; `font-variant-numeric: tabular-nums` en la raíz; reglas de `prefers-reduced-motion`.
- `app/app.config.ts` (nuevo): `ui.colors = { primary: 'kio', neutral: 'zinc', … }` y variantes por defecto (`UButton` tamaño `xl`, radio `md`; `UInput` `xl`).
- `nuxt.config.ts`: `viewport-fit=cover` en el `<meta viewport>`, dos `<meta name="theme-color">` con `media`, `colorMode.preference: 'system'`, y, en D02, iconos empaquetados en el cliente (`icon.clientBundle`). **[a verificar en D01: nombres exactos de estas opciones en Nuxt UI 4.12]**
- Guardarraíl (D-17): `tests/unit/design/tokens.test.ts` recorre `app/**/*.vue` con una expresión regular y falla con clases de paleta (`(bg|text|border|ring|fill|stroke)-(red|green|blue|…)-\d{2,3}`), hexadecimales o `style` con `color`. Es más barato que una regla de ESLint propia y se ve en rojo igual.

## Componentes y composables

- **Nuevos en `app/components/app/`:** `AppScreen`, `AppPageHeader`, `AppTabBar`, `AppSection`, `AppListGroup`, `AppListRow`, `AppStatTile`, `AppActionSheet`, `AppConfirmSheet`, `AppEmptyState`. Cada uno con un test de componente de sus props y eventos.
- **Layouts:** `app/layouts/default.vue` (pantalla + `AppTabBar`) y `app/layouts/focus.vue` (sin pestañas).
- **Fuerza, vistas nuevas:** `TodayView` (Hoy; vive en `workouts` mientras Fuerza sea el único módulo con datos, y sube a `app/components/` cuando Peso aporte su tarjeta), `TrainView` (Entrenar + historial), `SessionView` (sesión en curso), `SessionDetailView`.
- **Fuerza, componentes:** `SessionHeader`, `SetTable`, `ContinueSessionCard`, `SessionCard`, `ExercisePickerSheet` (sustituye a `ExercisePicker`); `ExerciseCard` y `SetRow` se rehacen. `ExerciseCard` deja de llamar a `useExerciseHistory`: la vista le pasa la referencia por props.
- **Dominio nuevo (puro):** `features/workouts/domain/summary.ts` con `sessionSummary(session, items, now)` para D-05 y la tarjeta del historial.
- **Copia de seguridad:** `SettingsView` en `features/backup/views/` reutiliza `useBackupExport` y `useBackupImport` sin cambios. El aviso de D-15 es `backupReminder(lastExportAt, hasSessions, today)` en `features/backup/domain/last-backup.ts`; Hoy lo pinta con un componente de `components/app/` para no importar una feature desde otra.

## Rutas

| Antes | Después |
| --- | --- |
| `/` (tres botones) | `/` Hoy |
| `/workouts` (empezar o sesión) | `/workouts` Entrenar + historial; `/workouts/session` sesión en curso |
| `/workouts/history` | desaparece (el historial está en `/workouts`) |
| `/workouts/history/:id` | igual |
| `/data` | `/settings` |

## Dependencias nuevas

- `@iconify-json/lucide` (desarrollo): los iconos se empaquetan en el build para que funcionen sin red (ADR-0004, F-22). Sin ella, `@nuxt/icon` los pediría a la API de Iconify en tiempo de ejecución **[inferido; se comprueba en D02 con el e2e sin red]**.
- Ninguna más. Hojas, modo de color e iconos ya vienen con Nuxt UI.

## Estrategia de tests

- **Unit:** D-02, D-05, D-06, D-07, D-15, D-17, y los componentes `App*` con `@nuxt/test-utils` (`mountSuspended`).
- **E2E:** D-01, D-03, D-04, D-08 a D-14, D-16 (`page.emulateMedia({ colorScheme })`), D-18 (`boundingBox()` de cada botón y campo).
- **Regresión:** cada tarea ejecuta los e2e de Fuerza y copia que toca. Cuando una tarea cambia cómo se llega a una acción (por ejemplo "Quitar" pasa a la hoja de opciones), actualiza los pasos del test de ese escenario F o C en el mismo PR, sin cambiar lo que comprueba, y lo dice en la descripción.

## Test Scope

- `pnpm test tests/unit/design tests/unit/components tests/unit/features/workouts tests/unit/features/backup`
- `pnpm test:e2e tests/e2e/navigation tests/e2e/workouts tests/e2e/backup`

## Riesgos

- **Tests e2e que dependen de la estructura actual.** Mitigación: buscar por rol y nombre, y cambiar los pasos en la misma tarea que cambia la pantalla.
- **`UDrawer` en iOS** (gestos, teclado encima de la hoja del selector). Se prueba en el iPhone de Jota en D05 y D07, antes de fusionar.
- **Destello de modo** al arrancar en oscuro. El script de modo de color de Nuxt UI va en el `<head>` del HTML generado; se comprueba en D01 (D-16).
- **Tareas que crecen.** D05 y D06 son las más grandes; si pasan de ~300 líneas se parten antes de seguir (ADR-0003).

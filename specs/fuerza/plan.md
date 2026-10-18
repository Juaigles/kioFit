# Plan: entrenamientos de fuerza

- Spec: [spec.md](spec.md) (aprobada 2026-10-18) · Escrito en modo plan de Claude Code · 2026-10-18
- Decisiones: ADR-0002, 0003, 0005, 0008, 0009, 0010, 0011, 0012 · Benchmark: [benchmark.md](benchmark.md)
- Tareas: [tasks.md](tasks.md)

## Enfoque

Stack ya fijado en AGENTS.md y ADR-0008 a 0011: Nuxt 4 en SPA (`ssr: false`), Dexie 4 detrás de repositorios, Pinia solo para estado de UI, Nuxt UI 4, Vitest con fake-indexeddb, Playwright y `@vite-pwa/nuxt`. El módulo vive en `app/features/workouts/` (dominio, composables y componentes); las páginas en `app/pages/` solo componen. El catálogo se carga desde `app/db/seed/` (ADR-0012). No hay gráficos en este módulo, así que no se elige librería de gráficos. No se añade ninguna dependencia fuera de las ya fijadas en AGENTS.md.

## Modelo de datos

Dexie, versión 1 (la crea la T02, sin migración previa):

- `exercises`: `id` (UUID), `name`, `normalizedName` (índice), `measure` (`weight_reps` | `reps` | `duration`), `origin` (`catalog` | `custom`), `sourceId?` (índice único, `&sourceId` en Dexie; solo lo tienen los del catálogo, y los propios no chocan porque IndexedDB no indexa las claves ausentes), `createdAt`, `updatedAt`.
- `sessions`: `id`, `type` (`strength`), `localDate` (`YYYY-MM-DD`, índice), `startedAt`, `endedAt?`, `status` (`in_progress` | `finished`, índice). Solo puede existir una `in_progress`; lo impone el repositorio (F-11).
- `sessionExercises`: `id`, `sessionId` (índice), `exerciseId` (índice), `position`.
- `sets`: `id`, `sessionExerciseId` (índice), `position`, `weightKg?`, `reps?`, `durationSeconds?`, `done`, `doneAt?`.
- `meta`: `key`, `value` (p. ej. `seedVersion`, `persistRequested`).

Peso siempre en kg (`number`); duración en segundos. Cada cambio posterior de esquema exige una versión nueva de Dexie, su migración y un test con datos de la versión anterior (ADR-0009).

## Componentes y composables

- `app/db/`: esquema Dexie, semilla y repositorios `ExerciseRepository` y `SessionRepository` (interfaces + implementación Dexie). Es el único sitio que importa Dexie.
- `app/utils/`: `toLocalDate()` (día local `YYYY-MM-DD`) y normalización de texto para búsqueda (minúsculas, sin acentos).
- `app/features/workouts/domain/`: `parseSetValue` (valores de serie), validación de nombres de ejercicio, `previousReference` (referencia de la sesión anterior).
- `app/features/workouts/composables/`: `useExerciseSearch`, `useActiveSession`, `useSessionHistory`. Leen con `liveQuery`; Dexie es la fuente de verdad.
- `app/features/workouts/components/`: `ExerciseCard`, `SetRow`, `ExercisePicker`, `SessionHistoryList`, `SessionDetail`; diálogos de confirmación con componentes de Nuxt UI.
- `app/stores/workouts.ts` (Pinia): solo estado de UI (ejercicio en edición, diálogos abiertos).
- `app/composables/usePersistentStorage.ts`: pide `navigator.storage.persist()` una sola vez (F-31) y nunca bloquea la app si falla o no existe.

## Dependencias nuevas

Ninguna fuera de las fijadas en AGENTS.md. La T01 instala el stack (Nuxt 4, `@nuxt/ui`, `@nuxt/eslint`, `@nuxt/test-utils`, `vitest`, `fake-indexeddb`, `@playwright/test`, `@vite-pwa/nuxt`, `dexie`, `pinia`) con las versiones que resuelva pnpm y las anota en su PR.

## Semilla del catálogo

Unos 80 ejercicios en `app/db/seed/exercises.json`, una entrada por línea para que el diff quepa en el tamaño de tarea. Cada entrada lleva `sourceId` (id de free-exercise-db), nombre en español, `measure`, músculo principal y material. `app/db/seed/README.md` cita free-exercise-db (Unlicense). La selección concreta de los ~80 es trabajo de la T04 y se revisa como cualquier otra tarea.

## Estrategia de tests

- **Unit (Vitest + fake-indexeddb):** dominio, repositorios y migraciones. Cada escenario unit tiene su ID en el título (`it('F-13 …')`).
- **E2E (Playwright sobre `pnpm build`):** flujos de UI. F-22 (sin red) se prueba con una carga con red seguida de `context.setOffline(true)`.
- Ningún test se marca `.skip` para dejar el CI en verde.

## Test Scope

Los scripts existen desde la T01. Comandos de este módulo:

- `pnpm test tests/unit/features/workouts tests/unit/db tests/unit/utils`
- `pnpm test:e2e tests/e2e/workouts`
- Antes de abrir el PR: `pnpm check` y `pnpm test:e2e` en verde.

## Riesgos

- **Tamaño de tarea (ADR-0003):** T06, T07 y T12 son las más grandes. Si al escribirlas pasan de ~300 líneas sin tests, se parten por escenarios antes de implementar.
- **Semilla:** elegir ~80 ejercicios con nombre en español y tipo de medida correcto es trabajo manual que puede desbordar su tarea; la lista se revisa antes de codificar.
- **Esquema:** cualquier cambio posterior exige migración y test con datos de la versión 1; se detecta en unit.
- **Offline (F-22):** el precache de `@vite-pwa/nuxt` debe incluir la semilla y los chunks de las rutas usadas; se verifica en e2e con `setOffline`.

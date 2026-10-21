# Tareas: entrenamientos de fuerza

Cada tarea cabe en 60-90 min y ~300 líneas sin tests (ADR-0003). Una rama, un commit y un PR por tarea. Orden de arriba abajo.

| # | Tarea | Escenarios | Tests primero | Estado |
| --- | --- | --- | --- | --- |
| T01 | Crear el esqueleto de Nuxt 4, los scripts, el CI y los tests mínimos | — | `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts` | hecha ([#5](https://github.com/Juaigles/kioFit/pull/5)) |
| T02 | Crear el esquema Dexie v1, los repositorios y el día local | F-29, F-31 | `tests/unit/db/sessions.test.ts`, `tests/unit/utils/to-local-date.test.ts`, `tests/unit/composables/persistent-storage.test.ts` | hecha ([#8](https://github.com/Juaigles/kioFit/pull/8)) |
| T03 | Parsear y validar los valores de una serie | F-16, F-30 | `tests/unit/features/workouts/domain/values.test.ts` | hecha ([#9](https://github.com/Juaigles/kioFit/pull/9)) |
| T04 | Cargar la semilla del catálogo y buscar sin acentos | F-01, F-02, F-03 | `tests/unit/db/seed.test.ts`, `tests/unit/utils/normalize.test.ts` | hecha ([#10](https://github.com/Juaigles/kioFit/pull/10)) |
| T05 | Aplicar las reglas de los ejercicios propios | F-05, F-06, F-07, F-08, F-09 | `tests/unit/features/workouts/domain/exercise-rules.test.ts`, `tests/unit/db/exercises.test.ts` | hecha ([#11](https://github.com/Juaigles/kioFit/pull/11)) |
| T06 | Empezar una sesión y crear un ejercicio desde la búsqueda | F-04, F-10, F-11 | `tests/unit/db/session-start.test.ts`, `tests/e2e/workouts/start.spec.ts` | hecha ([#12](https://github.com/Juaigles/kioFit/pull/12)) |
| T07 | Añadir, reordenar y quitar ejercicios y series | F-12, F-13, F-14 | `tests/e2e/workouts/exercises.spec.ts`, `tests/e2e/workouts/sets.spec.ts` | hecha ([#13](https://github.com/Juaigles/kioFit/pull/13)) |
| T08 | Mostrar los campos según el tipo de medida y avanzar con "Siguiente" | F-15, F-17 | `tests/e2e/workouts/fields.spec.ts` | hecha ([#14](https://github.com/Juaigles/kioFit/pull/14)) |
| T09 | Terminar y descartar una sesión | F-23, F-24, F-25 | `tests/unit/db/finish.test.ts`, `tests/e2e/workouts/finish.spec.ts` | hecha ([#15](https://github.com/Juaigles/kioFit/pull/15)) |
| T10 | Mostrar la referencia de la sesión anterior y marcar series | F-18, F-19, F-20 | `tests/unit/features/workouts/domain/previous.test.ts`, `tests/e2e/workouts/reference.spec.ts` | hecha ([#16](https://github.com/Juaigles/kioFit/pull/16)) |
| T11 | Conservar la sesión al recargar y funcionar sin red | F-21, F-22 | `tests/e2e/workouts/persistence.spec.ts`, `tests/e2e/workouts/offline.spec.ts` | hecha ([#17](https://github.com/Juaigles/kioFit/pull/17)) |
| T12 | Mostrar el historial y corregir una sesión terminada | F-26, F-27 | `tests/e2e/workouts/history.spec.ts`, `tests/e2e/workouts/edit.spec.ts` | pendiente |
| T13 | Borrar una sesión terminada | F-28 | `tests/e2e/workouts/delete.spec.ts` | pendiente |

Estados: pendiente · en curso · en revisión (enlace al PR) · hecha.

## Alcance de cada tarea

Estimación de líneas sin tests, orientativa. Si una tarea se acerca a 300 al implementarla, se parte antes de seguir.

- **T01 (~250).** Nuxt 4 con `ssr: false`, TypeScript estricto y pnpm; módulos `@nuxt/ui`, `@pinia/nuxt`, `@vite-pwa/nuxt` y `@nuxt/eslint`. Scripts `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `build` (`nuxt generate`) y `check` de AGENTS.md. Vitest con fake-indexeddb y Playwright contra el build estático. `.github/workflows/ci.yml` con `pnpm check`, `pnpm build` y `pnpm test:e2e` en cada PR y en `main`. Un test unitario trivial y un e2e que abre la portada. Sin escenarios: no hay comportamiento de la spec. Instala las dependencias fijadas en AGENTS.md y anota las versiones en el PR.
- **T02 (~200).** Esquema Dexie v1 de [plan.md](plan.md), interfaces `ExerciseRepository` y `SessionRepository` con su implementación mínima de guardar y leer sesiones, `toLocalDate()` en `app/utils/` y `usePersistentStorage`. F-29 (día local con el reloj en otra zona) y F-31 (una sola llamada a `navigator.storage.persist()`).
- **T03 (~150).** Funciones puras de `app/features/workouts/domain/`: texto a kg (coma y punto, 0 a 999,99, 2 decimales), reps (1 a 999) y duración (`mm:ss`, 1 s a 59:59), y formato de vuelta a texto con coma. F-16 y F-30 (se guarda `82.5` y `90`).
- **T04 (~200).** `app/db/seed/exercises.json` con ~80 ejercicios en una línea cada uno, README de la semilla con la cita de free-exercise-db, carga en el primer arranque y en versiones nuevas (solo añade lo que falta), y la búsqueda normalizada de `app/utils/`. F-01, F-02 y F-03.
- **T05 (~220).** Validación de nombres (vacío, más de 60 caracteres, duplicado sin mayúsculas ni acentos) y las reglas del repositorio: renombrar un ejercicio propio, bloquear el cambio de tipo de medida con series registradas, borrar solo si no aparece en ninguna sesión y rechazar cualquier cambio sobre el catálogo. F-05 a F-09.
- **T06 (~280).** Página de entrenamiento con el botón "Empezar entrenamiento", `useActiveSession`, regla de una sola sesión en curso en el repositorio, selector de ejercicios con búsqueda y alta de ejercicio propio desde una búsqueda sin resultados. Conecta `requestPersistentStorage` tras guardar la sesión (cierra F-31, que la T02 prueba con el composable aislado). F-04, F-10 y F-11. Es de las más grandes: si no cabe, F-04 pasa a una tarea propia.
- **T07 (~280).** `ExerciseCard` y filas de serie: añadir y quitar ejercicios y series, reordenar, confirmación al quitar un ejercicio con series hechas, renumeración. Marcar una serie como hecha con un toque, sin copiar la referencia: la copia llega con F-19 (T10), y este marcado básico no tiene escenario propio. F-12, F-13 y F-14. Si no cabe, F-13 y F-14 pasan a una tarea propia.
- **T08 (~180).** `SetRow` con los campos de cada tipo de medida (kg y reps, solo reps, `mm:ss`), teclado numérico y "Siguiente" entre campos y series. F-15 y F-17.
- **T09 (~220).** Terminar (hora de fin, borra series sin hacer y ejercicios vacíos), ofrecer descartar si no hay nada hecho y descartar con confirmación sin dejar rastro en el historial. F-23, F-24 y F-25. Va antes de la referencia porque sus e2e solo necesitan el marcado básico de T07.
- **T10 (~220).** `previousReference` sobre la sesión terminada más reciente que contiene el ejercicio, columna de referencia en cada serie y marcar como hecha con un toque (copia la referencia; sin referencia indica qué falta), completando el marcado básico de T07. F-18, F-19 y F-20. Los unit de F-18 usan sesiones de fixture; los e2e terminan sesiones con T09.
- **T11 (~150).** Reabrir la sesión en curso al arrancar y configuración de `@vite-pwa/nuxt` (precache de la semilla y de las rutas, registro del service worker). F-21 y F-22.
- **T12 (~260).** Página de historial (más reciente primero, con fecha, duración, ejercicios y series hechas) y detalle de sesión terminada reutilizando `ExerciseCard` y `SetRow` para corregir valores, añadir y quitar series. F-26 y F-27.
- **T13 (~100).** Botón "Borrar" con confirmación en el detalle; la sesión borrada deja de salir en el historial y de ser referencia (F-18). F-28.

## Reparto de escenarios

Cada escenario está en una sola tarea: T02 (F-29, F-31), T03 (F-16, F-30), T04 (F-01, F-02, F-03), T05 (F-05 a F-09), T06 (F-04, F-10, F-11), T07 (F-12, F-13, F-14), T08 (F-15, F-17), T09 (F-23, F-24, F-25), T10 (F-18, F-19, F-20), T11 (F-21, F-22), T12 (F-26, F-27), T13 (F-28). Total: 31.

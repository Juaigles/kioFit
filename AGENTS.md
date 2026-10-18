# AGENTS.md

Constitución de kioFit para agentes (Claude Code, Codex) y personas. Si algo de aquí choca con una spec o un ADR, para y pregunta: no elijas tú.

## Qué es

PWA personal de fitness estilo Hevy: entrenamientos de fuerza, peso diario y comidas con kcal, en ese orden (ADR-0005). Se usa en el móvil, en mitad del gimnasio y a menudo sin cobertura. Todo vive en el dispositivo: sin backend, sin cuentas, sin red (ADR-0002, ADR-0004).

Ante una duda de diseño: ¿esto hace más rápido o más lento registrar una serie?

## Stack

| Pieza | Elección | ADR |
| --- | --- | --- |
| Framework | Nuxt 4 en modo SPA (`ssr: false`), estático con `nuxt generate` | 0001, 0008 |
| Lenguaje | TypeScript estricto | 0008 |
| PWA | `@vite-pwa/nuxt` | 0001 |
| Datos | Dexie 4 sobre IndexedDB, detrás de repositorios | 0002, 0009 |
| Estado | Pinia, solo para estado de UI | 0009 |
| UI | Nuxt UI 4 (Tailwind 4 + Reka UI) | 0010 |
| Tests | Vitest + `fake-indexeddb`, `@nuxt/test-utils`, Playwright | 0009 |
| Lint | `@nuxt/eslint` | — |
| Despliegue | Cloudflare Pages, con vista previa por PR | 0011 |
| Gráficos | Sin elegir: se decide en la spec de peso. No instales ninguna antes | — |
| Gestor de paquetes | pnpm | — |

## Comandos

La primera tarea del plan de fuerza crea estos scripts en `package.json`; hasta entonces no existen.

```bash
pnpm install      # dependencias (respeta pnpm-lock.yaml; no uses npm ni yarn)
pnpm dev          # servidor de desarrollo
pnpm lint         # ESLint (pnpm lint --fix para arreglar)
pnpm typecheck    # nuxt typecheck
pnpm test         # Vitest: dominio, repositorios y componentes
pnpm test:e2e     # Playwright contra el build estático
pnpm build        # nuxt generate -> .output/public
pnpm check        # lint + typecheck + test: lo mínimo antes de cada commit
```

Durante una tarea ejecuta los tests de lo que tocas (`pnpm test app/features/workouts`). Antes de abrir el PR, `pnpm check` y `pnpm test:e2e` en verde. No digas que algo funciona sin haber ejecutado su test.

## Estructura

```
app/
  pages/               # rutas finas: componen features, sin lógica
  layouts/
  features/<modulo>/   # workouts, weight, meals: componentes, composables y dominio del módulo
  components/          # UI compartida por 2+ features
  composables/         # lógica compartida por 2+ features
  stores/              # Pinia: estado de UI (sesión en curso abierta, filtros)
  db/                  # esquema Dexie, migraciones, repositorios, datos semilla
  utils/               # funciones puras compartidas (fechas, números)
tests/
  unit/                # espejo de app/: dominio, repositorios (fake-indexeddb)
  e2e/                 # Playwright: un spec por criterio de aceptación de UI
specs/<modulo>/        # benchmark.md -> spec.md -> plan.md -> tasks.md
docs/adr/              # decisiones; una por archivo, numeradas
```

## Flujo SDD

1. Lee `specs/<modulo>/spec.md`, su `plan.md` y la tarea de `tasks.md` antes de tocar código.
2. Una tarea = una rama, una sesión limpia y un commit. Si no cabe en 60-90 min o en un diff de ~300 líneas sin tests, párala y propón partirla (ADR-0003).
3. Tests primero o a la vez. Cada criterio de aceptación (`F-01`, `P-01`…) tiene al menos un test que lo nombra en su título.
4. Si la implementación obliga a cambiar el comportamiento, actualiza la spec en el mismo commit y dilo en el PR.
5. Cualquier idea nueva va a la lista "Después del MVP" de la spec, no al código.

## Convenciones

- **Idioma:** código, identificadores, nombres de archivo y tablas en inglés; textos de UI, specs, ADR y commits en español.
- **Commits:** Conventional Commits con ámbito, en español: `feat(workouts): registrar una serie`. Ramas `<tipo>/<slug>`. Nunca trabajes en `main`.
- **PR:** uno por tarea, con enlace a la tarea y a los criterios que cubre. Se fusiona con squash.
- **Codificación:** UTF-8 sin BOM y saltos LF en todos los archivos (en PowerShell, `Set-Content -Encoding utf8NoBOM`).
- **Componentes:** `<script setup lang="ts">`, props y emits tipados, `defineModel` para v-model. Usa primero un componente de Nuxt UI; uno propio solo si Nuxt UI no lo tiene.
- **Estado de UI:** uniones discriminadas cuando varios flags excluyentes podrían combinarse mal (`{ status: 'idle' } | { status: 'editing', setId }`).
- **Datos (ADR-0009):**
  - Solo `app/db/` importa Dexie. El resto usa repositorios (`WorkoutRepository`…) definidos como interfaces.
  - Lectura reactiva con `liveQuery` envuelto en un composable; Dexie es la fuente de verdad, no Pinia.
  - IDs con `crypto.randomUUID()` generados en el cliente.
  - Peso siempre en kg (`number`); la unidad es solo de presentación.
  - El día de un registro es una fecha local `YYYY-MM-DD` (`toLocalDate()` en `app/utils/`), nunca derivada de un timestamp UTC. Los instantes van en ISO 8601.
  - Cambiar el esquema = nueva versión de Dexie con su migración y su test con datos de la versión anterior.
- **Números en UI:** acepta coma y punto decimal (`82,5` y `82.5`); muestra con coma.
- **Dependencias:** cada dependencia nueva se justifica en el plan o en un ADR. Prefiere lo que ya trae Nuxt, Nuxt UI o VueUse.

## Patrones prohibidos

- `fetch`, `$fetch`, `useFetch`, `axios` o cualquier llamada de red a APIs. El MVP no tiene red (ADR-0004).
- Carpeta `server/`, rutas de API de Nitro, SSR o `useAsyncData` contra un servidor.
- Importar `dexie` o `app/db/*` desde componentes, páginas o stores. Solo a través de repositorios.
- Una feature que importa de otra feature. Lo compartido sube a `components/`, `composables/` o `utils/`.
- Guardar datos de dominio en `localStorage`, `sessionStorage` o cookies.
- `new Date().toISOString().slice(0, 10)` o cualquier fecha de día calculada en UTC.
- `any`, `@ts-ignore` o `as unknown as` sin un comentario que explique por qué. `@ts-expect-error` solo en tests.
- Saltarse, desactivar o marcar `.skip` un test para dejar el CI en verde. `git commit --no-verify`.
- Instalar librería de gráficos, i18n, analítica, o cualquier SDK de terceros sin ADR.
- Copiar código de proyectos AGPL (wger, LiftTrace). Los MIT se pueden estudiar citando la fuente.
- Implementar lo que la spec deja fuera de alcance (Muay Thai, rutinas, PR, temporizador, macros, sync…).

## Referencias

- Decisiones: `docs/adr/` (las de la Fase 0, resumidas en `docs/fase-0-resumen.md`).
- Inspiración de esta constitución: el `CLAUDE.md` de [alexanderop/workouttracker](https://github.com/alexanderop/workouttracker) (MIT).

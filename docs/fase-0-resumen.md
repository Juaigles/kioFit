# Fase 0 – Brainstorm: resumen

Cerrada el 2026-10-18.

## Decisiones

| ADR | Decisión |
| --- | --- |
| [0001](adr/0001-plataforma-pwa-nuxt.md) | PWA con Nuxt 3 (`@vite-pwa/nuxt`), instalable desde el navegador |
| [0002](adr/0002-local-first-sin-sync.md) | Local-first: datos en IndexedDB, sin sincronización; export/import JSON como copia |
| [0003](adr/0003-tamano-de-tarea.md) | Bloque de 2 h o más: una o dos tareas pequeñas por tarde (60-90 min de ciclo, diff revisable en 10-15 min) |
| [0004](adr/0004-sin-backend-en-mvp.md) | Sin backend en el MVP; acceso a datos tras interfaces de repositorio. Go + Postgres llega con la sincronización |
| [0005](adr/0005-alcance-del-mvp.md) | MVP = fuerza → peso diario con gráfico → comidas y kcal, en ese orden. Muay Thai fuera, pero la sesión tiene campo `tipo` |
| [0007](adr/0007-referencias-y-metodo-rea.md) | Una app de referencia por módulo y benchmark manual con el método REA antes de cada spec; la herramienta REA, tras el MVP |
| [0006](adr/0006-fuente-de-alimentos.md) | Comidas con catálogo de alimentos propios (kcal/100 g + ración opcional). Open Food Facts después del MVP |

Datos y referencias: [investigacion/referencias-open-source.md](investigacion/referencias-open-source.md). Catálogo de ejercicios candidato: free-exercise-db (dominio público).

## Fuera del MVP (lista de "después")
Muay Thai, rutinas y plantillas, récords, estadísticas, temporizador de descanso, macros, objetivos de kcal, código de barras con Open Food Facts, experimento con la herramienta REA, sincronización, backend en Go.

## Pendiente para la Fase 1 (Constitución y spec)
1. **Crear y conectar el repositorio** en GitHub. Al crearlo, mover `docs/adr/` al repo.
2. **`AGENTS.md` (constitución, < ~150 líneas):** stack exacto (Nuxt 3, TS estricto, Pinia, Dexie u otra capa sobre IndexedDB, Vitest, Playwright), comandos de dev/test/lint, convenciones de carpetas, reglas de los ADR (sin servidor, sin `fetch` a APIs en el MVP) y patrones prohibidos. Referencia útil: el `CLAUDE.md` de alexanderop/workouttracker.
3. **Librerías del stack (se deciden al escribir el `AGENTS.md`):** propuesta inicial Dexie (IndexedDB), Pinia (estado), Vitest + Playwright (tests). Abiertas: kit de UI (Tailwind + shadcn-vue o el que Jota use en el trabajo), librería de gráficos para el peso (Chart.js, unovis…), dónde se despliega el estático. ADR solo para las que no sean obvias.
4. **Spec del MVP:** una spec por módulo (fuerza, peso, comidas), cada una con qué y por qué, criterios de aceptación verificables y fuera de alcance explícito. Empezar por fuerza.
5. **Pregunta abierta para la spec de fuerza:** ¿catálogo completo de free-exercise-db (800+, en inglés) o un subconjunto traducido?

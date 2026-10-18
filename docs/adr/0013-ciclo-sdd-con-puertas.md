# ADR-0013: Ciclo SDD con puertas, escenarios trazables y CI desde la primera tarea

- Estado: aceptada
- Fecha: 2026-10-18
- Precisa: ADR-0007 (orden entre spec e investigación)

## Contexto
Al cerrar la Fase 1, la revisión del proyecto encontró tres huecos: no había verificación automática (ni tests ni CI), la investigación se hizo antes que la spec, y el ciclo spec → plan → código con tests → revisión no se había recorrido nunca de principio a fin. Jota pidió reorganizar para seguir las buenas prácticas de SDD a rajatabla.

## Decisión
- **Ciclo de 7 pasos con puertas** (tabla en `AGENTS.md`): no se pasa de paso sin cumplir su puerta. Sin tarea en `tasks.md`, no hay código.
- **Spec primero, investigación después.** El benchmark del ADR-0007 solo se hace para responder preguntas concretas que la spec deja abiertas.
- **Escenarios Dado/Cuando/Entonces** con ID y nivel de test (unit o e2e). Cada escenario tiene al menos un test con su ID en el título, para que la trazabilidad spec → test sea 1:1.
- **El plan y las tareas los escribe Jota** en el modo plan de Claude Code, a partir de las plantillas de `specs/_plantillas/`.
- **El CI llega con la primera tarea del plan**, junto al esqueleto de Nuxt, con un test unitario y uno e2e mínimos. No se crea antes, porque un CI sin código que comprobar daría un verde que no verifica nada.
- **Plantilla de PR** que pide escenarios cubiertos, tests vistos en rojo y revisión de Codex.

## Consecuencias
- Cada tarde empieza por una tarea con escenarios concretos, y termina con el CI diciendo si se cumplen.
- La spec de fuerza crece de 22 criterios a 31 escenarios, porque cada rama de un criterio pasa a ser un caso con su test.
- Más ceremonia por tarea. Si alguna puerta resulta no aportar nada, se quita con otro ADR, no saltándosela.

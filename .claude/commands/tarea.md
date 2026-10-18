---
description: Implementa una tarea de tasks.md con tests primero, de la rama al PR (pasos 5 y 6 del ciclo SDD)
argument-hint: <modulo> <id> (por ejemplo, fuerza T02)
---

Vas a implementar la tarea indicada en `$ARGUMENTS` (módulo e id), siguiendo `AGENTS.md`.

**Antes de escribir nada**
1. Lee `AGENTS.md`, la spec, el plan y la tarea en `specs/<modulo>/tasks.md`. Si la tarea no existe o no está `pendiente`, para y dímelo.
2. Enséñame el plan de la tarea: archivos que vas a tocar, escenarios que cubre y estimación de líneas sin tests. Si pasa de ~300, propón partirla.
3. Enséñame la **lista exacta de dependencias** que vas a añadir, con versión y motivo, o di "ninguna". No instales nada que no esté en la tabla del stack o en el plan sin mi visto bueno.

**Implementación**
4. Crea la rama `<tipo>/<slug>` desde `main` actualizado.
5. Escribe primero los tests de los escenarios, con su ID en el título (`it('F-13 …')`). Ejecútalos y **enséñame que fallan** por la razón esperada.
6. Implementa lo mínimo para que pasen. Ejecuta los tests de lo que tocas (Test Scope del plan).
7. Ejecuta `pnpm check` y, si la tarea toca UI, `pnpm test:e2e`. Todo en verde antes de seguir.

**Cierre**
8. Si algo obligó a cambiar el comportamiento, actualiza la spec y dilo.
9. Haz commit con Conventional Commits en español y abre el PR con `.github/pull_request_template.md` rellenada: escenarios, tests y casillas.
10. En un último commit, marca la tarea como `hecha` en `tasks.md` con el enlace al PR, para que `main` quede al día al fusionar.
11. No fusiones: la revisión de Codex y la mía van antes, y se fusiona con squash.

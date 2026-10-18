---
description: Escribe plan.md y tasks.md de un módulo a partir de su spec aprobada (pasos 3 y 4 del ciclo SDD)
argument-hint: <modulo> (por ejemplo, fuerza)
---

Vas a escribir el plan y las tareas del módulo `$ARGUMENTS`, siguiendo los pasos 3 y 4 del ciclo de `AGENTS.md`. No escribas código.

1. Lee `AGENTS.md`, `specs/$ARGUMENTS/spec.md`, los ADR que la spec cita y las plantillas de `specs/_plantillas/`.
2. **Puerta:** si la spec no dice `Estado: aprobada`, para y dímelo. No planifiques sobre un borrador.
3. Escribe `specs/$ARGUMENTS/plan.md` con la plantilla: enfoque, modelo de datos con índices y versión de Dexie, componentes, dependencias nuevas (cada una con su motivo, o "ninguna"), estrategia de tests, Test Scope y riesgos.
4. Escribe `specs/$ARGUMENTS/tasks.md` con la plantilla:
   - cada escenario de la spec en **exactamente una** tarea;
   - cada tarea por debajo de ~300 líneas sin tests (ADR-0003), con su estimación;
   - los tests que se escriben primero, con su ruta.
5. **Revisa el orden de dependencias:** recorre las tareas de arriba abajo y comprueba, para cada una, qué tiene que existir ya para que sus tests pasen. Si eso llega en una tarea posterior, reordena o mueve el comportamiento.
6. Termina con una tabla de reparto de escenarios (el total debe coincidir con la spec) y una lista de lo que no te ha quedado claro.

Trabaja en una rama `docs/plan-$ARGUMENTS` y deja un solo commit (`docs($ARGUMENTS): plan y tareas`).

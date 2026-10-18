# Documento de arranque: App Fitness SDD

Oct 17, 2026 · @Jota

Aprendes SDD y desarrollo con agentes construyendo tu propia app de fitness estilo Hevy. Este documento resume dónde estamos y es el primer archivo del Proyecto.

## Contexto y objetivo

El objetivo es interiorizar Spec-Driven Development (SDD) y el trabajo profesional con agentes de IA en proyectos propios, para luego llevarlo también al trabajo.

- **Perfil:** fullstack con foco frontend. Stack: Vue 3 / Nuxt 3, TypeScript, Node.js, Go, Docker, GitHub Actions.
- **Proyecto de práctica:** app de fitness a medida estilo Hevy para uso propio. Registro de entrenamientos, comidas con kcal y peso diario.
- **Particularidad del dominio:** entrenas fuerza y Muay Thai. Una sesión de Muay Thai se mide en rounds, duración, tipo (sombra, saco, paos, sparring) e intensidad, no en series y repeticiones. El modelo de datos debe contemplarlo desde la spec.
- **Riesgo principal:** el alcance. "La mejor app de fitness" es infinita; la primera lección es recortar a un MVP.

## Lo decidido hasta ahora

| Tema | Decisión |
| --- | --- |
| Metodología | SDD dentro de una pila más amplia: context engineering, specs, verificación automática e incrementos pequeños con revisión |
| Agentes | Claude Code implementa, Codex revisa (o al revés). Siempre un revisor que no escribió el código |
| Dónde se piensa | Proyecto de Claude (chat): un chat por fase o tema, cerrado con resumen de decisiones |
| Dónde se ejecuta | Claude Code sobre el repo, una sesión limpia por tarea |
| Fuente de verdad | Archivos en el repo: `AGENTS.md`, `specs/`, `docs/adr/`. No el chat |
| Frameworks SDD | Primero el flujo a mano. Spec Kit u OpenSpec más adelante, para comparar |
| Horario | Cada tarde a las 18:00, después del trabajo |

## Flujo SDD que vas a seguir

Siete pasos; los pasos 4 a 6 se repiten por cada tarea.

1. **Constitución:** `AGENTS.md` con stack, convenciones, comandos de test y patrones prohibidos. Menos de \~150 líneas.
2. **Brainstorm:** la IA te interroga y te lleva la contraria. Cada decisión importante queda como un ADR corto.
3. **Spec:** qué y por qué, criterios de aceptación verificables y lo que queda fuera de alcance. Entre 1 y 3 páginas por funcionalidad.
4. **Plan y tareas:** el cómo, separado de la spec. Tareas que quepan en una sesión limpia.
5. **Implementar:** tests primero o a la vez. Una sesión por tarea y un commit por tarea.
6. **Evaluar:** CI en verde, revisión del otro agente contra la spec y tu revisión del diff.
7. **Cerrar:** actualizar la spec si algo cambió, para que no se desincronice.

## Plan de aprendizaje

Cada fase del proyecto enseña una práctica concreta. Las semanas son orientativas y se ajustarán según el tiempo de cada tarde.

| Semana | Fase del proyecto | Práctica que interiorizas |
| --- | --- | --- |
| 1 | Brainstorm y decisiones: stack, arquitectura, alcance del MVP | IA como sparring crítico. Decisiones registradas como ADRs |
| 1–2 | Constitución, spec del MVP, plan y tareas | Separar qué/por qué del cómo. Criterios verificables. Fuera de alcance explícito |
| 2–3 | Incremento 1: registro de entrenamientos (fuerza y Muay Thai) | Tareas pequeñas, sesión limpia por tarea, tests primero, commit por tarea |
| 3–4 | Incremento 2: peso diario y gráfico de evolución | Ciclo completo con revisión cruzada Claude / Codex |
| 4–5 | Incremento 3: comidas y kcal | Integrar una fuente externa de alimentos. Specs con dependencias externas |
| 6 | Un incremento con Spec Kit u OpenSpec | Comparar flujo manual frente a framework |
| 7+ | Mejoras: rutinas, récords, estadísticas, uso offline | Agentes en paralelo con worktrees y CI como guardián |

## Rutina de cada tarde a las 18:00

Una tarea por tarde, con el mismo ritual. La nota final es lo que convierte el proyecto en formación.

1. **Arranque (10 min):** revisa la spec y la lista de tareas. Elige una sola tarea.
2. **Ciclo (bloque principal):** sesión limpia en Claude Code. Dale la tarea apuntando a la spec y a `AGENTS.md`. Tests e implementación. Revisas el diff.
3. **Revisión:** Codex revisa el cambio contra la spec.
4. **Cierre (10 min):** commit, marcar la tarea, actualizar la spec si algo cambió y una nota de qué aprendiste.

## Preguntas pendientes de la Fase 0

Responderlas es la entrada del primer chat del Proyecto, "Fase 0 – Brainstorm".

- [ ] **¿Dónde la usarás?** PWA con Nuxt (reutilizas lo que sabes) o app nativa / multiplataforma (aprendes algo nuevo a la vez; no recomendado si el foco es la metodología).
- [ ] **¿Debe funcionar sin conexión?** La cobertura en gimnasios falla a menudo. Offline-first implica almacenamiento local y sincronización.
- [ ] **¿Backend propio o no?** Go + Postgres (practicas tu stack), un BaaS tipo Supabase (más rápido) o solo almacenamiento local al principio.
- [ ] **¿Qué entra en el MVP?** Propuesta: sesiones de fuerza y Muay Thai más peso diario con gráfico; comidas y kcal en el incremento 3.
- [ ] **¿Cuánto dura tu bloque de las 18:00?** Sirve para dimensionar cada tarea.

## Instrucciones sugeridas para el Proyecto de Claude

Cópialas en las instrucciones del Proyecto "App Fitness SDD":

> Me estoy formando en Spec-Driven Development y desarrollo con agentes (Claude Code y Codex) construyendo una app de fitness a medida estilo Hevy: entrenamientos de fuerza y Muay Thai, peso diario y comidas con kcal. Mi stack es Vue 3 / Nuxt 3, TypeScript, Node.js y Go. Actúa como mentor: explica el porqué de cada práctica, hazme preguntas antes de decidir y llévame la contraria si algo no tiene sentido. Prioriza un MVP acotado. Cuando cerremos un tema, resume las decisiones tomadas y lo pendiente para guardarlo en los archivos del proyecto. El documento de arranque recoge el contexto, el plan y las preguntas abiertas.

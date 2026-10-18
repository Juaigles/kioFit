# ADR-0003: Tamaño de tarea con un bloque diario de 2 h o más

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
Jota trabaja cada tarde desde las 18:00 en un bloque de 2 horas o más. El ritual diario es arranque (10 min), ciclo en Claude Code, revisión de Codex y cierre (10 min). Las sesiones de agente rinden peor cuando la tarea es grande: el contexto se llena y la revisión del diff se vuelve superficial.

## Decisión
Una tarea debe caber en unos 60-90 minutos de ciclo, con un diff que se pueda revisar en 10-15 minutos (orientativo: menos de ~300 líneas cambiadas sin contar tests). Con un bloque de 2 h o más, se hacen una o dos tareas por tarde, cada una con su sesión limpia, su revisión y su commit. No se hacen tareas más grandes.

## Consecuencias
- El bloque largo da margen para el ritual completo sin prisas y para una segunda tarea si la primera termina pronto.
- Hay que resistir la tentación de meter una funcionalidad entera en una sesión. Si una tarea no cabe, se parte en el plan.
- La nota de aprendizaje del cierre se escribe una vez por tarde, aunque haya dos tareas.

# ADR-0007: Apps de referencia y método REA antes de cada spec

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
Jota propuso usar REA (Reverse Engineer Anything, [morluto/rea](https://github.com/morluto/rea)) sobre la mejor app del mercado para sacar la constitución y las specs. REA es un servidor MCP de ingeniería inversa de binarios: produce evidencias, no specs. El modelo de datos de Hevy ya es público en su API, descompilarla cuesta varias tardes fuera del foco SDD y sus términos prohíben copiar la app. Detalle en [investigacion/apps-de-referencia-y-rea.md](../investigacion/apps-de-referencia-y-rea.md).

## Decisión
- Una app de referencia por módulo: Hevy (fuerza), Happy Scale (peso), MacroFactor (comidas) y workouttracker (plantilla del `AGENTS.md`).
- Antes de cada spec se hace a mano un **benchmark funcional** con el método de REA: una sola funcionalidad, fuentes públicas y uso propio, y hallazgos marcados como visto, inferido o desconocido.
- La herramienta REA se prueba en una tarde **después del MVP**, sobre workouttracker (MIT) o sobre nuestra propia app.

## Consecuencias
- La constitución sale de los ADR 0001-0007, no de una app de terceros.
- Cada spec cita su benchmark, y lo que no entra en el MVP va a la lista de "después".
- No se descompila ninguna app propietaria.

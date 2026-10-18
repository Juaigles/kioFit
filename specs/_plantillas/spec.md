# Spec: <módulo>

- Estado: borrador | aprobada | implementada · Fecha: AAAA-MM-DD
- Decisiones: ADR-XXXX · Benchmark: [benchmark.md](benchmark.md) (solo si hubo preguntas que lo necesitaran)

## Qué y por qué
Quién lo usa, en qué situación, qué problema le resuelve. Sin tecnología.

**Éxito:** una frase medible (por ejemplo, "registra todas sus sesiones durante dos semanas").

## Conceptos
Términos del dominio con una línea cada uno. Son el vocabulario de los escenarios.

## Escenarios
Uno por caso, también los de error. Cada uno se convierte en al menos un test con su ID en el título.

### <grupo>
**X-01 <título corto>** · nivel: unit | e2e
- Dado <estado de partida>
- Cuando <acción del usuario o del sistema>
- Entonces <resultado observable>

## Requisitos no funcionales
Medibles: tiempos, toques, tamaños, sin red.

## Fuera de alcance
- **En otra spec:** …
- **Después del MVP:** …
- **Descartado:** …

## Preguntas abiertas
Cada una con quién la responde y cómo (Jota, benchmark, prototipo). La spec no se aprueba con preguntas abiertas que cambien un escenario.

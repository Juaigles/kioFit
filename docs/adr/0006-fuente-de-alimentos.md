# ADR-0006: Alimentos propios como fuente de kcal en el MVP

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
El MVP incluye comidas y kcal (ADR-0005) y es local-first (ADR-0002). Open Food Facts es la base libre más completa, pero limita a 10 búsquedas/min por IP, desaconseja la búsqueda mientras se escribe, cubre mal los alimentos frescos y no responde sin red.

## Decisión
En el MVP el usuario mantiene su propio catálogo de alimentos, guardado en IndexedDB. Cada alimento tiene nombre y kcal por 100 g y, opcionalmente, una ración con nombre y gramos (por ejemplo "1 huevo = 60 g"). Una comida del día referencia un alimento y una cantidad; las kcal se calculan a partir de ella.

## Consecuencias
- Funciona siempre sin conexión y cubre cualquier alimento, fresco o envasado.
- El primer uso cuesta más, porque hay que crear los alimentos. A cambio, se reutilizan, y los habituales son pocos.
- Sin macros en el MVP. El modelo de alimento puede ampliarse después con proteína, carbohidratos y grasa sin romper los datos.
- Open Food Facts (búsqueda por código de barras, licencia ODbL con atribución) será el primer incremento después del MVP, con su spec de dependencia externa. Los alimentos que vengan de OFF se guardarán en el mismo catálogo local.

# ADR-0005: Alcance del MVP

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
El documento de arranque proponía fuerza + Muay Thai + peso diario, con comidas y kcal en un incremento posterior. Jota prefiere que el MVP cubra ya el ciclo completo que usa a diario (entrenar, comer, pesarse), como Hevy más un contador de kcal, y aplazar Muay Thai. El riesgo principal del proyecto sigue siendo el alcance.

## Decisión
El MVP incluye tres módulos, construidos como incrementos separados y en este orden:
1. **Entrenamientos de fuerza (gimnasio):** sesión con ejercicios, series, repeticiones y peso. Catálogo precargado desde free-exercise-db más ejercicios propios.
2. **Peso diario:** un registro por día y gráfico de evolución.
3. **Comidas y kcal:** registrar lo que comes en el día y ver el total de kcal. La fuente de alimentos se decide en un ADR aparte.

Fuera del MVP: Muay Thai, rutinas y plantillas, récords (PR), estadísticas avanzadas, temporizador de descanso, macros (proteína, carbohidratos, grasa), objetivos de kcal, sincronización y backend.

## Consecuencias
- El MVP crece en un módulo respecto a la propuesta inicial. Se compensa con módulos mínimos: cada uno resuelve solo el registro y la consulta básica.
- Con un incremento por módulo, al terminar el primero ya tienes una app usable en el gimnasio, aunque falten los otros dos.
- Muay Thai sale del MVP, pero el modelo de sesión debe dejar sitio a otros tipos de entrenamiento (por ejemplo, un campo `tipo` en la sesión) para no rehacerlo después.
- Se mantiene la regla de recorte: cualquier idea nueva durante el MVP va a una lista de "después del MVP", no a la spec.

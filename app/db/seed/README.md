# Semilla del catálogo de ejercicios

`exercises.json` es el catálogo que kioFit precarga en el primer arranque (ADR-0012): 82 ejercicios habituales de fuerza, una entrada por línea para que los diffs sean legibles.

## Origen

Los `sourceId` son los `id` de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense, dominio público; no exige atribución, pero se cita aquí). De esa base solo se conserva el id: los nombres están traducidos al español y el tipo de medida, el músculo principal y el material se asignaron a mano. No se incluyen imágenes ni instrucciones.

## Formato

```json
{"sourceId":"Barbell_Bench_Press_-_Medium_Grip","name":"Press de banca","measure":"weight_reps","muscle":"pecho","equipment":"barra"}
```

- `sourceId`: id de free-exercise-db. Es único y es lo que decide si un ejercicio ya está cargado.
- `name`: nombre en español, hasta 60 caracteres y único sin mayúsculas ni acentos.
- `measure`: `weight_reps` (kg × reps), `reps` (solo reps) o `duration` (segundos).
- `muscle` y `equipment`: para filtros futuros. El esquema Dexie v1 no los guarda.

## Cómo se carga

`ExerciseRepository.seedCatalog` se ejecuta en cada arranque y añade solo los ejercicios cuyo `sourceId` falta. Nunca modifica uno existente: si cambia un nombre o un tipo de medida en este archivo, los dispositivos que ya tienen el ejercicio lo conservan como estaba. Ampliar el catálogo es añadir líneas.

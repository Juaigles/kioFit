# ADR-0012: Catálogo precargado con un subconjunto traducido de free-exercise-db

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
El ADR-0005 fija un catálogo precargado desde free-exercise-db más ejercicios propios. Esa base tiene 876 ejercicios (584 de fuerza, 123 estiramientos, 61 pliometría…), en inglés, sin tipo de medida y con imágenes que pesan. Buscar "press banca" no encontraría "Barbell Bench Press", y para uso propio 876 entradas son ruido.

## Decisión
- Se precarga un **subconjunto de unos 80 ejercicios habituales**, con nombre en español, guardado como JSON en `app/db/seed/`.
- Cada entrada conserva el `id` de free-exercise-db como `sourceId`, y se le asigna a mano el **tipo de medida** (`weight_reps`, `reps` o `duration`), el músculo principal y el material.
- **Sin imágenes ni instrucciones** en el MVP.
- La semilla se carga una vez al abrir la app por primera vez, y en versiones nuevas solo añade los ejercicios que falten, sin tocar los existentes.
- Los ejercicios del catálogo no se editan; si Jota quiere otro nombre o tipo de medida, crea uno propio.

## Consecuencias
- La búsqueda funciona en español y la lista cabe en una pantalla de scroll razonable.
- Elegir y traducir los ~80 ejercicios es una tarea del plan, de datos, que se revisa como cualquier otra.
- Como se guarda `sourceId`, ampliar el catálogo o traer imágenes después no rompe los datos.
- free-exercise-db es Unlicense (dominio público): no exige atribución, aunque se cita en `app/db/seed/README.md`.
- Elegido por Jota en la tarjeta del 2026-10-18.

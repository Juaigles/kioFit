# Spec: copia de seguridad (exportar e importar)

- Transversal a los tres módulos del MVP · Estado: borrador · Fecha: 2026-10-18
- Decisiones: ADR-0002, 0004, 0005, 0009, 0012 · Benchmark: no hace falta (ninguna pregunta lo necesita)

## Qué y por qué

Los datos de kioFit viven solo en el navegador del móvil de Jota (ADR-0002). Si borra los datos del navegador, cambia de móvil o el sistema libera espacio, lo pierde todo. Jota quiere guardar cuando quiera una copia de todos sus datos en un archivo y poder restaurarla después en el mismo móvil o en otro. La spec de fuerza la sacó aparte y pide terminarla antes de usar la app en serio.

**Éxito:** Jota exporta una copia, borra los datos del navegador, la importa y ve el mismo historial, con las mismas referencias de la sesión anterior, que tenía antes.

## Conceptos

- **Copia:** un archivo JSON con todos los datos de dominio de kioFit en un momento dado. Se llama `kiofit-copia-AAAA-MM-DD.json`, con la fecha local del día en que se exporta.
- **Versión de formato:** un entero (`formatVersion`) que sube cada vez que cambia la forma del archivo. Es independiente de la versión del esquema de Dexie.
- **Datos de dominio:** lo que Jota registra o crea: ejercicios (también los del catálogo, porque las sesiones apuntan a sus `id`), sesiones, ejercicios de la sesión y series. Peso diario y comidas se añaden cuando existan sus módulos.
- **Estado del dispositivo:** lo que no es de Jota sino de esta instalación (`meta`: versión de la semilla, si ya se pidió almacenamiento persistente). No va en la copia.
- **Restaurar:** importar una copia sustituye todos los datos de dominio actuales por los de la copia. Decidido por Jota el 2026-10-18.

Forma del archivo (la concreta el plan):

```json
{
  "app": "kiofit",
  "formatVersion": 1,
  "exportedAt": "2026-10-18T23:10:00.000+02:00",
  "data": {
    "exercises": [],
    "sessions": [],
    "sessionExercises": [],
    "sets": []
  }
}
```

Cada módulo nuevo añade sus tablas dentro de `data` (por ejemplo `weights`, `foods`, `meals`) y sube `formatVersion`.

## Escenarios

**unit** = Vitest sobre dominio y repositorios con fake-indexeddb; **e2e** = Playwright sobre el build estático. Cada escenario tiene al menos un test con su ID en el título.

### Exportar

**C-01 Exportar todo** · unit
- Dados ejercicios propios y del catálogo, dos sesiones terminadas y una en curso, con sus series
- Cuando se genera la copia
- Entonces el JSON tiene `app: "kiofit"`, la `formatVersion` actual, `exportedAt` en ISO 8601 y, en `data`, todos los registros de cada tabla de dominio con todos sus campos, sin nada de `meta`

**C-02 Descargar la copia** · e2e
- Dada la app con al menos una sesión terminada
- Cuando se pulsa "Exportar copia" en la pantalla de datos
- Entonces se descarga un archivo `kiofit-copia-<fecha local de hoy>.json` que contiene esa sesión

**C-03 Exportar sin datos** · unit
- Dada una base de datos sin sesiones ni ejercicios propios
- Cuando se genera la copia
- Entonces es válida: contiene el catálogo y las demás tablas vacías

**C-04 Valores tal como se guardaron** · unit
- Dada una sesión con día local `2026-10-18` que empezó a las 23:30 y una serie de 82,5 kg × 8 y otra de 90 s
- Cuando se genera la copia, también con el reloj en otra zona horaria
- Entonces el archivo lleva `localDate: "2026-10-18"`, `weightKg: 82.5` y `durationSeconds: 90`, sin recalcular ni convertir nada

**C-05 Exportar sin red** · e2e
- Dada la app abierta una vez con red
- Cuando el navegador pasa a modo sin conexión y se exporta
- Entonces la copia se descarga igual

### Importar

**C-06 Ida y vuelta** · unit
- Dada una base de datos con datos variados
- Cuando se exporta, se vacía la base de datos y se importa la copia
- Entonces cada tabla de dominio tiene exactamente los mismos registros, y una segunda exportación da el mismo `data`

**C-07 Restaurar sustituye los datos actuales** · unit
- Dada una base de datos con una sesión que no está en la copia
- Cuando se importa la copia
- Entonces esa sesión ya no existe y los datos de dominio son exactamente los de la copia

**C-08 Confirmar antes de sustituir** · e2e
- Dada la app con sesiones registradas
- Cuando se elige un archivo válido en "Importar copia"
- Entonces se muestra un resumen de la copia (fecha de exportación, número de sesiones y de ejercicios propios) y el aviso de que sustituye todo lo actual; solo se importa si se confirma, y al cancelar no cambia nada

**C-09 La referencia anterior sigue funcionando** · e2e
- Dada una copia con una sesión terminada donde la serie 2 de "Press de banca" fue 80 kg × 8
- Cuando se importa en una app vacía y se empieza un entrenamiento con ese ejercicio
- Entonces la serie 2 muestra la referencia "80 × 8" (F-18)

**C-10 Sesión en curso en la copia** · unit
- Dada una copia que contiene una sesión en curso
- Cuando se importa
- Entonces esa sesión queda en curso, y es la única en curso (F-11)

**C-11 Catálogo completo tras importar** · unit
- Dada una copia hecha con una semilla anterior que no tiene un ejercicio de la semilla actual
- Cuando se importa
- Entonces ese ejercicio se añade como en F-02 y los del catálogo que vienen en la copia conservan su `id`

**C-12 Importar sin red** · e2e
- Dada la app abierta una vez con red y sin conexión después
- Cuando se importa una copia válida
- Entonces se restaura igual

### Archivos no válidos

**C-13 Todo o nada** · unit
- Dada una base de datos con datos
- Cuando falla la escritura a mitad de la importación
- Entonces la base de datos queda exactamente como estaba antes de importar

**C-14 No es una copia de kioFit** · unit
- Dado un archivo que no es JSON, un JSON sin `app: "kiofit"` o uno sin `formatVersion`
- Cuando se intenta importar
- Entonces se rechaza con el mensaje "Este archivo no es una copia de kioFit" y no cambia nada

**C-15 Copia de una versión más nueva** · unit
- Dada una copia con una `formatVersion` mayor que la que entiende la app
- Cuando se intenta importar
- Entonces se rechaza con un mensaje que pide actualizar la app, y no cambia nada

**C-16 Copia de una versión anterior** · unit
- Dada una copia con `formatVersion` 1 y una app que ya entiende la 2 (con una tabla nueva, por ejemplo `weights`)
- Cuando se importa
- Entonces se migra en memoria a la versión 2, la tabla nueva queda vacía y el resto se importa como en C-06

**C-17 Datos incoherentes** · unit
- Dada una copia con `app` y `formatVersion` correctos pero con un registro inválido (un campo obligatorio que falta, un peso negativo, una fecha que no es `YYYY-MM-DD`, un `id` repetido, una serie que apunta a un ejercicio de la sesión que no existe, o dos sesiones en curso)
- Cuando se intenta importar
- Entonces se rechaza diciendo qué tabla y qué problema, y no cambia nada

**C-18 Campos desconocidos** · unit
- Dada una copia de la versión actual con una tabla o un campo que la app no conoce
- Cuando se intenta importar
- Entonces se rechaza como en C-17, porque con la misma `formatVersion` no debería haberlos

## Requisitos no funcionales

- Con un año de uso (unas 250 sesiones y 6.000 series), exportar e importar tardan menos de 2 s en un móvil medio y el archivo pesa menos de 2 MB.
- Sin llamadas de red (AGENTS.md, ADR-0004): el archivo se genera y se lee en el dispositivo.
- El archivo es JSON legible, con fechas y números tal como se guardan (kg, segundos, `YYYY-MM-DD`, ISO 8601), para que Jota pueda abrirlo y entenderlo sin la app.
- Exportar y restaurar están a dos toques desde la pantalla principal.
- Interfaz en español; claves del JSON en inglés, como las tablas (AGENTS.md).

## Fuera de alcance

- **En otra spec:** las tablas de peso diario y comidas. Cada una de esas specs añade un escenario que amplía C-01 y C-06 a sus tablas y sube `formatVersion`.
- **Después del MVP:** fusionar una copia con los datos actuales en lugar de sustituirlos, exportar solo un rango de fechas o un módulo, copias automáticas o programadas, guardar en la nube (Drive, iCloud), cifrar la copia, exportar a CSV o al formato de Hevy, e importar desde Hevy.
- **Descartado:** sincronización entre dispositivos (ADR-0002); la copia la sustituye para el caso de cambiar de móvil.

## Preguntas abiertas

Las responde Jota. Mientras sigan abiertas, la spec no se aprueba, porque las dos cambian escenarios.

- ~~Importar: ¿sustituir o fusionar?~~ Resuelta (2026-10-18): sustituir (C-07, C-08). Fusionar es el problema de la sincronización que el ADR-0002 aplaza.

2. **¿Recordar que hagas una copia?** La spec no lo incluye. Una copia que nunca se hace no protege nada; la opción mínima es mostrar en la pantalla de datos "Última copia: hace N días" (necesita guardar la fecha en `meta`).
3. **¿Descargar o compartir?** La spec propone descargar el archivo (C-02). En iPhone las descargas desde una PWA instalada son incómodas y el menú de compartir del sistema (`navigator.share` con archivo) deja guardarlo en Archivos o Drive sin que la app use la red. Depende del móvil de Jota.

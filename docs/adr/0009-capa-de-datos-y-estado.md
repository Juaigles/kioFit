# ADR-0009: Dexie detrás de repositorios y Pinia solo para la UI

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
Los datos viven en IndexedDB (ADR-0002) detrás de interfaces de repositorio (ADR-0004). Faltaba decidir con qué librería, quién es la fuente de verdad en memoria y cómo se identifican los registros. Si Pinia guarda una copia de los datos y Dexie otra, hay dos verdades que se desincronizan. workouttracker, la referencia del ADR-0007, usa Dexie y prescinde de Pinia por esa razón.

## Decisión
- **Dexie 4** como capa sobre IndexedDB. Solo `app/db/` lo importa; el resto usa interfaces de repositorio.
- **Dexie es la fuente de verdad.** La UI lee con `liveQuery` envuelto en composables, y se actualiza sola cuando cambian los datos.
- **Pinia** se queda, porque Jota la conoce y tiene devtools, pero solo para estado de UI que no se persiste (qué ejercicio se está editando, filtros, diálogos abiertos).
- **IDs con `crypto.randomUUID()`** generados en el cliente, nunca autoincrementales.
- **Fechas:** el día de un registro es una fecha local `YYYY-MM-DD`; los instantes, ISO 8601. **Peso en kg.**
- **Tests:** Vitest con `fake-indexeddb` para repositorios y migraciones; Playwright para los flujos de la spec.

## Consecuencias
- No hay que sincronizar stores con la base de datos, y la sesión en curso sobrevive a que el sistema mate la pestaña.
- Los UUID permiten fusionar datos de varios dispositivos cuando llegue la sincronización, y que el import JSON no choque con los IDs existentes.
- La fecha local evita el desfase de un día que los usuarios de Hevy sufren con las zonas horarias.
- Cada cambio de esquema exige versión nueva de Dexie, migración y test con datos antiguos. Es más trabajo, y es lo que protege los datos de Jota.

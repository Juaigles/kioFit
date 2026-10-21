# Tareas: copia de seguridad (exportar e importar)

Cada tarea cabe en 60-90 min y ~300 líneas sin tests (ADR-0003). Una rama, un commit y un PR por tarea. Orden de arriba abajo.

| # | Tarea | Escenarios | Tests primero | Estado |
| --- | --- | --- | --- | --- |
| T01 | Definir el formato de la copia y validarlo | C-16, C-17, C-18, C-19, C-20 | `tests/unit/features/backup/domain/validate.test.ts` | pendiente |
| T02 | Exportar y restaurar los datos en el repositorio | C-01, C-03, C-04, C-08, C-09, C-12, C-13, C-15 | `tests/unit/db/backup.test.ts` | pendiente |
| T03 | Exportar desde la pantalla de datos y mostrar la última copia | C-02, C-05, C-06, C-07 | `tests/unit/features/backup/domain/last-backup.test.ts`, `tests/unit/features/backup/composables/backup-export.test.ts`, `tests/e2e/backup/export.spec.ts` | pendiente |
| T04 | Importar una copia con confirmación | C-10, C-11, C-14 | `tests/e2e/backup/import.spec.ts` | pendiente |

Estados: pendiente · en curso · en revisión (enlace al PR) · hecha.

## Alcance de cada tarea

Estimación de líneas sin tests, orientativa. Si una tarea se acerca a 300 al implementarla, se parte antes de seguir.

- **T01 (~280).** `app/features/backup/domain/format.ts` (tipos, `CURRENT_FORMAT_VERSION`, nombre del archivo, `buildBackup`, `migrateBackup` con el registro de migraciones como parámetro) y `validate.ts` (`parseBackup` con el resumen y los errores en español). Funciones puras, sin Dexie. C-16 a C-20. Si no cabe, C-19 pasa a una tarea propia.
- **T02 (~150).** Interfaz `BackupRepository`, `app/db/backup-repository.ts` con `exportData()` y `restore(data)` en una sola transacción, y su instancia en `app/db/index.ts`. `restore` completa el catálogo con la semilla. C-01, C-03, C-04, C-08 (pasa por `buildBackup` y `parseBackup` de la T01), C-09, C-12, C-13 y C-15, más el test de tamaño del requisito no funcional.
- **T03 (~230).** `lastBackupLabel`, `useBackupExport` (compartir, descargar como respaldo, cancelar sin error, guardar `lastExportAt`), página `app/pages/data.vue` con "Exportar copia" y la etiqueta, y el botón "Datos" en la portada. C-02, C-05, C-06 y C-07. Jota prueba compartir en su iPhone antes de fusionar.
- **T04 (~200).** `useBackupImport` con su estado, botón "Importar copia" con el selector de archivos, `UModal` de confirmación con el resumen, aviso de error y mensaje de éxito. C-10, C-11 y C-14. Los e2e usan la descarga de la T03 para crear el archivo.

## Reparto de escenarios

Cada escenario está en una sola tarea: T01 (C-16 a C-20), T02 (C-01, C-03, C-04, C-08, C-09, C-12, C-13, C-15), T03 (C-02, C-05, C-06, C-07), T04 (C-10, C-11, C-14). Total: 20, los mismos que la spec.

## Dependencias entre tareas

- T02 necesita `buildBackup` y `parseBackup` de la T01 para la ida y vuelta de C-08.
- T03 necesita `exportData` de la T02.
- T04 necesita `restore` de la T02 y la descarga de la T03 para sus e2e.

## Lo que el plan decide y la spec no fija

- `exportedAt` se guarda en UTC (`toISOString()`), que también es ISO 8601. El ejemplo de la spec con `+02:00` es solo ilustrativo.
- La etiqueta de C-07 dice "hoy" y "ayer" para 0 y 1 días; la spec solo fija "hace 3 días" y "todavía no".
- La página se llama "Datos" y vive en `/data`.

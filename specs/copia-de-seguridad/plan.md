# Plan: copia de seguridad (exportar e importar)

- Spec: [spec.md](spec.md) (aprobada el 2026-10-21) · Redactado por Claude y revisado por Jota · 2026-10-21
- Decisiones: ADR-0002, 0004, 0009, 0012 · Tareas: [tasks.md](tasks.md)

## Enfoque

Una feature nueva, `app/features/backup/`, con el formato del archivo y su validación como funciones puras, dos composables (exportar e importar) y una página `app/pages/data.vue` ("Datos"), enlazada desde la portada. Leer y escribir las tablas lo hace un repositorio nuevo, `BackupRepository`, en `app/db/`: es lo único que toca Dexie. Importar valida y migra el archivo **entero en memoria** antes de escribir nada, y luego sustituye todas las tablas de dominio en **una sola transacción** de Dexie. Si algo falla a mitad, IndexedDB deshace la transacción completa (C-15). No se toca el esquema de Dexie: sigue en la versión 1.

## Modelo de datos

- **Esquema Dexie:** sin cambios (versión 1, ver [plan de fuerza](../fuerza/plan.md)). No hace falta migración.
- **`meta`:** clave nueva `lastExportAt` (instante ISO 8601) para C-07. Como el resto de `meta`, no va en la copia y la importación no la toca.
- **Archivo de copia, `formatVersion: 1`:**

  ```ts
  interface BackupFileV1 {
    app: 'kiofit'
    formatVersion: 1
    exportedAt: string // ISO 8601 en UTC, de `new Date().toISOString()`
    data: {
      exercises: Exercise[]
      sessions: Session[]
      sessionExercises: SessionExercise[]
      sets: WorkoutSet[]
    }
  }
  ```

  Los registros llevan los mismos campos que en Dexie (`app/types/workouts.ts`), sin transformar: `localDate` tal cual, kg y segundos como `number` (C-04). Los campos opcionales vacíos (`endedAt`, `weightKg`…) se omiten, igual que en Dexie.
- **Migraciones del formato:** un registro `{ [desde]: (archivo) => archivo de la versión siguiente }` en `app/features/backup/domain/format.ts`. Hoy está vacío. Peso y comidas añadirán la entrada `1 → 2` con sus tablas vacías (C-18). La función `migrateBackup` recibe el registro como parámetro, así que C-18 se prueba con un registro de prueba sin esperar al módulo de peso.

## Componentes y composables

- `app/features/backup/domain/format.ts`: tipos del archivo, `CURRENT_FORMAT_VERSION`, nombre del archivo (`kiofit-copia-<toLocalDate()>.json`), `buildBackup(data, now)` y `migrateBackup(file, migrations)`.
- `app/features/backup/domain/validate.ts`: `parseBackup(texto)` devuelve una unión discriminada `{ ok: true, backup, summary } | { ok: false, error }`. Comprueba, en este orden: JSON válido, `app` y `formatVersion` (C-16, C-17), migración (C-18), claves desconocidas (C-20), campos obligatorios y rangos por tabla (los de F-16: kg 0 a 999,99; reps 1 a 999; segundos 1 a 3599; `localDate` `YYYY-MM-DD`; enumerados de `measure`, `origin`, `status` y `type`), `id` repetidos, referencias rotas y más de una sesión en curso (C-19). El error dice la tabla y el problema en español. `summary` trae fecha de exportación, número de sesiones y de ejercicios propios (C-10). Validación escrita a mano, sin librería (ver Dependencias).
- `app/features/backup/domain/last-backup.ts`: `lastBackupLabel(lastExportAt, now)` con días de calendario locales: "Todavía no has hecho ninguna copia", "Última copia: hoy", "Última copia: ayer" y "Última copia: hace N días" (C-07).
- `app/db/backup-repository.ts`: `createBackupRepository(db, seed)` con `exportData()` (lee las cuatro tablas en una transacción de lectura) y `restore(data)` (en una transacción `rw`: vacía las cuatro tablas, inserta con `bulkAdd` y después completa el catálogo con `seedCatalog`, C-13). La interfaz `BackupRepository` va en `app/types/repositories.ts` y la instancia en `app/db/index.ts`.
- `app/features/backup/composables/useBackupExport.ts`: genera el archivo y lo comparte con `navigator.share({ files })` si `navigator.canShare({ files })` lo permite (C-02); si no, lo descarga con un enlace `download` y `URL.createObjectURL` (C-06). Si el usuario cancela el menú (`AbortError`), no hace nada más; solo guarda `lastExportAt` cuando se ha compartido o descargado (C-07).
- `app/features/backup/composables/useBackupImport.ts`: lee el archivo elegido (`File.text()`), lo pasa por `parseBackup` y expone un estado `{ status: 'idle' } | { status: 'confirming', summary } | { status: 'error', message } | { status: 'done' }`. Al confirmar llama a `restore` (C-10).
- `app/pages/data.vue`: botones "Exportar copia" e "Importar copia" (un `input type="file"` oculto con `accept="application/json,.json"`), la etiqueta de C-07, el `UModal` de confirmación con el resumen y un `UAlert` para los errores. La portada (`app/pages/index.vue`) gana un botón "Datos", así que exportar e importar quedan a dos toques.

## Dependencias nuevas

Ninguna. La validación se escribe a mano (~150 líneas) en lugar de añadir una librería de esquemas como Zod: son cuatro tablas con campos simples, y AGENTS.md pide justificar cada dependencia. Si peso y comidas hacen que crezca demasiado, se reconsidera con un ADR.

## Estrategia de tests

- **Unit (Vitest + fake-indexeddb):**
  - Dominio puro: C-16 a C-20 con archivos de prueba escritos en el test; C-18 con un registro de migraciones de prueba que añade una tabla `weights`; C-07 con fechas fijas.
  - Repositorio: C-01, C-03, C-04 (con el reloj en otra zona horaria, como F-29), C-08 (exportar, vaciar, importar y volver a exportar da el mismo `data`), C-09, C-12 y C-13 sobre bases de fake-indexeddb.
  - C-15: se fuerza un fallo dentro de la transacción (un `bulkAdd` de `sets` que lanza) y se comprueba que la base queda igual que antes.
  - C-07 (parte de cancelar): `useBackupExport` con un `navigator.share` falso que rechaza con `AbortError`; `lastExportAt` no cambia y no hay error.
- **E2E (Playwright sobre el build):**
  - C-02: `addInitScript` sustituye `navigator.canShare` y `navigator.share` por versiones que guardan el archivo recibido; se comprueba nombre y contenido.
  - C-06: `addInitScript` borra `navigator.share` y `navigator.canShare`; se espera el evento `download`.
  - C-05 y C-14: como F-22, carga con red y `context.setOffline(true)`.
  - C-10 y C-11: se registra una sesión por la UI, se exporta (descarga), se borra el almacenamiento del navegador, se importa el archivo descargado con `setInputFiles` y se confirma. C-11 empieza después un entrenamiento con "Press de banca" y ve "80 × 8".
- **Tamaño (requisito no funcional):** un unit que genera un año de datos (250 sesiones, 6.000 series) y comprueba que el JSON pesa menos de 2 MB. El tiempo en el móvil lo comprueba Jota a mano en el iPhone; en fake-indexeddb no es representativo.

## Test Scope

- `pnpm test tests/unit/features/backup tests/unit/db/backup.test.ts`
- `pnpm test:e2e tests/e2e/backup`
- Antes de abrir cada PR: `pnpm check` y `pnpm test:e2e` en verde.

## Riesgos

- **Compartir en iPhone:** `navigator.share` con archivos solo funciona tras un gesto del usuario y en contexto seguro. Si se llama después de un `await` largo, Safari puede rechazarlo. Mitigación: generar el archivo antes (lectura rápida de Dexie) y llamar a `share` en el mismo manejador del toque; Jota lo prueba en el iPhone al cerrar la T03.
- **Desfase con el esquema:** si fuerza cambia el esquema de Dexie y no se actualiza el validador, las copias nuevas se rechazarían. Mitigación: C-08 (ida y vuelta con datos de todas las tablas) falla en cuanto un campo nuevo no está en el validador.
- **Catálogo:** al restaurar se sustituyen también los ejercicios del catálogo (las sesiones apuntan a sus `id`). Si la copia es de una semilla anterior, `seedCatalog` añade los que falten por `sourceId` (C-13); si cambió el nombre de uno existente, se queda el de la copia, como en F-02.
- **Tamaño de la T01:** el validador es la pieza más grande. Si pasa de ~300 líneas, C-19 (referencias y sesiones en curso) pasa a una tarea propia.

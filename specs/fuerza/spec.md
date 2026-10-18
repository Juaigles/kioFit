# Spec: entrenamientos de fuerza

- Módulo 1 del MVP (ADR-0005) · Estado: borrador para revisión · 2026-10-18
- Benchmark previo: [benchmark.md](benchmark.md) · Decisiones: ADR-0002, 0005, 0008, 0009, 0012

## Qué y por qué

Jota quiere registrar en el móvil, durante el entrenamiento y sin depender de la cobertura, qué ejercicios hace y con cuántas series, repeticiones y kilos, y ver en cada serie lo que hizo la vez anterior para saber si progresa. Hoy lo resuelve Hevy; kioFit lo sustituye en lo mínimo y es el primer incremento usable de la app.

El éxito se mide así: Jota registra en kioFit todas sus sesiones de fuerza durante dos semanas sin volver a Hevy.

## Conceptos

- **Ejercicio:** nombre y tipo de medida (`weight_reps` kg × reps, `reps` solo reps, `duration` segundos). Puede venir del catálogo (ADR-0012) o ser propio.
- **Sesión:** un entrenamiento con fecha local, inicio, fin y tipo (`strength`; el campo existe para Muay Thai después). Está **en curso** o **terminada**.
- **Ejercicio de la sesión:** un ejercicio dentro de una sesión, con orden y sus series.
- **Serie:** valores según el tipo de medida y si está **hecha**.
- **Sesión anterior de un ejercicio:** la sesión terminada más reciente, distinta de la actual, que contiene ese ejercicio.

## Comportamiento y criterios de aceptación

Cada criterio tiene al menos un test que lo nombra (AGENTS.md). "Hecho" significa que todos pasan en el CI.

### Catálogo y ejercicios propios
- **F-01** La primera vez que se abre la app, el catálogo contiene los ejercicios de la semilla, con nombre en español y tipo de medida.
- **F-02** Al buscar, la lista se filtra mientras se escribe, sin distinguir mayúsculas ni acentos: "press banca" encuentra "Press de banca".
- **F-03** Desde la búsqueda se puede crear un ejercicio propio con nombre (obligatorio, 1-60 caracteres, único sin distinguir mayúsculas ni acentos) y tipo de medida, y queda añadido a la sesión en el mismo paso.
- **F-04** Un ejercicio propio se puede renombrar. Su tipo de medida no se puede cambiar si ya tiene series registradas.
- **F-05** Un ejercicio propio solo se puede borrar si no aparece en ninguna sesión; si aparece, la opción de borrar no está disponible y se explica por qué.
- **F-06** Los ejercicios del catálogo no se pueden editar ni borrar.

### Sesión en curso
- **F-07** "Empezar entrenamiento" crea una sesión en curso con la fecha local de hoy y la hora de inicio. Solo puede haber una: si ya hay una en curso, el botón lleva a ella.
- **F-08** Se pueden añadir ejercicios a la sesión, reordenarlos y quitarlos. Quitar un ejercicio con series hechas pide confirmación.
- **F-09** Cada ejercicio de la sesión empieza con una serie vacía. Se pueden añadir y quitar series.
- **F-10** Los campos de una serie dependen del tipo de medida: kg y reps, solo reps, o duración en `mm:ss`. Kg acepta coma o punto y hasta 2 decimales (0-999,99); reps es un entero de 1 a 999; duración, de 1 s a 59:59.
- **F-11** El teclado numérico avanza con "Siguiente" de kg a reps y de reps a la siguiente serie.
- **F-12** Cada serie muestra como referencia los valores de la serie con el mismo número en la sesión anterior del ejercicio (por ejemplo "80 × 8"). Si no hay sesión anterior o esa serie no existía, muestra "—".
- **F-13** Marcar una serie como hecha con los campos vacíos copia los valores de referencia de F-12. Sin referencia y con campos vacíos, no se puede marcar.
- **F-14** Cada cambio se guarda al momento en IndexedDB. Si se cierra la app o se recarga la página, al volver la sesión sigue en curso con todo lo registrado.
- **F-15** Con el dispositivo sin red (modo avión), tras haber abierto la app una vez, se puede empezar, registrar y terminar una sesión.

### Terminar, descartar e historial
- **F-16** "Terminar" guarda la hora de fin y elimina las series no hechas. Si no queda ninguna serie hecha, pide descartar la sesión en lugar de terminarla.
- **F-17** "Descartar" pide confirmación y borra la sesión en curso por completo.
- **F-18** El historial lista las sesiones terminadas de la más reciente a la más antigua, con fecha, duración, número de ejercicios y de series hechas.
- **F-19** El detalle de una sesión terminada muestra sus ejercicios y series, y permite corregir valores, añadir o quitar series y borrar la sesión (con confirmación).
- **F-20** El día de una sesión es la fecha local en que empezó (`YYYY-MM-DD`), aunque termine pasada la medianoche o se consulte desde otra zona horaria.

### Datos
- **F-21** La primera vez que se guarda una sesión, la app pide almacenamiento persistente (`navigator.storage.persist()`). Si el navegador lo deniega, la app sigue funcionando.
- **F-22** El peso se guarda en kg como número, y la duración en segundos.

## Requisitos no funcionales
- Pensada para móvil a una mano: objetivos táctiles de al menos 44 px, y registrar una serie con la referencia de F-12 cuesta un toque.
- Sin llamadas de red (AGENTS.md). Los datos no salen del dispositivo.
- Interfaz en español.

## Fuera de alcance
- **De esta spec, en otra:** exportar e importar JSON (ADR-0002). Va en una spec corta de copia de seguridad, que conviene terminar antes de usar la app en serio, porque sin ella borrar los datos del navegador lo pierde todo.
- **Después del MVP:** tipos de serie y RPE, notas, distancia, superseries, rutinas y plantillas, temporizador de descanso, récords, estadísticas y gráficos de fuerza, libras, imágenes e instrucciones de ejercicios, Muay Thai.
- **Descartado:** red social, sincronización y cuentas.

## Preguntas abiertas
Ninguna bloqueante. El plan decide el esquema de Dexie y qué ~80 ejercicios entran en la semilla.

# Spec: entrenamientos de fuerza

- Módulo 1 del MVP (ADR-0005) · Estado: aprobada (2026-10-18)
- Decisiones: ADR-0002, 0005, 0008, 0009, 0012 · Benchmark: [benchmark.md](benchmark.md)

## Qué y por qué

Jota quiere registrar en el móvil, durante el entrenamiento y sin depender de la cobertura, qué ejercicios hace y con cuántas series, repeticiones y kilos, y ver en cada serie lo que hizo la vez anterior para saber si progresa. Hoy lo resuelve Hevy; kioFit lo sustituye en lo mínimo y es el primer incremento usable de la app.

El éxito se mide así: Jota registra en kioFit todas sus sesiones de fuerza durante dos semanas sin volver a Hevy.

## Conceptos

- **Ejercicio:** nombre y tipo de medida (`weight_reps` kg × reps, `reps` solo reps, `duration` segundos). Puede venir del catálogo (ADR-0012) o ser propio.
- **Sesión:** un entrenamiento con fecha local, inicio, fin y tipo (`strength`; el campo existe para Muay Thai después). Está **en curso** o **terminada**.
- **Ejercicio de la sesión:** un ejercicio dentro de una sesión, con orden y sus series.
- **Serie:** valores según el tipo de medida y si está **hecha**.
- **Sesión anterior de un ejercicio:** la sesión terminada más reciente, distinta de la actual, que contiene ese ejercicio.

## Escenarios

Cada escenario tiene al menos un test con su ID en el título (AGENTS.md). **unit** = Vitest sobre dominio y repositorios con fake-indexeddb; **e2e** = Playwright sobre el build estático. "Hecho" significa que todos pasan en el CI.

### Catálogo y ejercicios propios

**F-01 Semilla del catálogo** · unit
- Dado que la base de datos está vacía
- Cuando la app arranca
- Entonces el catálogo contiene todos los ejercicios de la semilla, cada uno con nombre en español y tipo de medida

**F-02 Semilla en una versión nueva** · unit
- Dado un catálogo ya cargado y una semilla nueva que añade ejercicios y cambia el nombre de uno existente
- Cuando la app arranca
- Entonces se añaden los ejercicios nuevos y los existentes no cambian

**F-03 Búsqueda sin mayúsculas ni acentos** · unit
- Dado el ejercicio "Press de banca" en el catálogo
- Cuando se busca "PRESS banca" o "press de bánca"
- Entonces aparece en los resultados

**F-04 Crear ejercicio propio y añadirlo** · e2e
- Dada una sesión en curso y una búsqueda sin resultados
- Cuando se crea un ejercicio propio desde la búsqueda con nombre y tipo de medida
- Entonces el ejercicio existe en el catálogo y ya está añadido a la sesión

**F-05 Nombre de ejercicio no válido** · unit
- Dado un ejercicio llamado "Remo con barra"
- Cuando se intenta crear o renombrar otro como "remo con bárra", con el nombre vacío o con más de 60 caracteres
- Entonces se rechaza con un mensaje que dice por qué

**F-06 Renombrar ejercicio propio** · unit
- Dado un ejercicio propio
- Cuando se renombra con un nombre válido
- Entonces su nombre cambia también en las sesiones donde aparece

**F-07 Tipo de medida bloqueado** · unit
- Dado un ejercicio propio con al menos una serie registrada
- Cuando se intenta cambiar su tipo de medida
- Entonces se rechaza; sin series registradas, sí se permite

**F-08 Borrar ejercicio propio** · unit
- Dado un ejercicio propio que no aparece en ninguna sesión
- Cuando se borra
- Entonces desaparece del catálogo; si aparece en alguna sesión, se rechaza con un mensaje que lo explica

**F-09 Catálogo de solo lectura** · unit
- Dado un ejercicio del catálogo
- Cuando se intenta renombrar, cambiar su tipo de medida o borrar
- Entonces se rechaza

### Sesión en curso

**F-10 Empezar entrenamiento** · e2e
- Dado que no hay ninguna sesión en curso
- Cuando se pulsa "Empezar entrenamiento"
- Entonces se crea una sesión en curso de tipo `strength` con la fecha local de hoy y la hora de inicio

**F-11 Una sola sesión en curso** · unit
- Dada una sesión en curso
- Cuando se intenta empezar otra
- Entonces no se crea ninguna y se devuelve la que ya está en curso

**F-12 Añadir, reordenar y quitar ejercicios** · e2e
- Dada una sesión en curso
- Cuando se añaden dos ejercicios y se cambia su orden
- Entonces la sesión los muestra en el orden nuevo, cada uno con una serie vacía

**F-13 Quitar un ejercicio con series hechas** · e2e
- Dado un ejercicio de la sesión con al menos una serie hecha
- Cuando se quita
- Entonces se pide confirmación, y solo se quita si se confirma; sin series hechas se quita sin preguntar

**F-14 Añadir y quitar series** · e2e
- Dado un ejercicio de la sesión
- Cuando se añade una serie y se quita otra
- Entonces el número de series y su numeración se actualizan

**F-15 Campos según el tipo de medida** · e2e
- Dados tres ejercicios, uno de cada tipo de medida
- Cuando se muestran sus series
- Entonces piden kg y reps, solo reps, y duración en `mm:ss`, respectivamente

**F-16 Valores válidos** · unit
- Dado el texto que escribe el usuario
- Cuando se convierte a valores de serie
- Entonces "82,5" y "82.5" dan 82,5 kg; kg admite de 0 a 999,99 con hasta 2 decimales; reps, enteros de 1 a 999; duración, de 1 s a 59:59; cualquier otro valor se rechaza

**F-17 Avanzar con "Siguiente"** · e2e
- Dada una serie de peso y reps con el foco en kg
- Cuando se pulsa "Siguiente" en el teclado
- Entonces el foco pasa a reps, y desde reps a kg de la serie siguiente

**F-18 Referencia de la sesión anterior** · unit
- Dada una sesión anterior terminada donde la serie 2 del ejercicio fue 80 kg × 8
- Cuando se muestra la serie 2 de ese ejercicio en la sesión actual
- Entonces su referencia es "80 × 8"; si no hay sesión anterior con el ejercicio o esa serie no existía, la referencia es "—"

**F-19 Marcar una serie vacía copia la referencia** · e2e
- Dada una serie vacía con referencia "80 × 8"
- Cuando se marca como hecha con un toque
- Entonces queda hecha con 80 kg y 8 reps

**F-20 Serie vacía sin referencia** · e2e
- Dada una serie vacía cuya referencia es "—"
- Cuando se intenta marcar como hecha
- Entonces no se marca y se indica qué campo falta

**F-21 Nada se pierde al recargar** · e2e
- Dada una sesión en curso con series registradas
- Cuando se recarga la página o se cierra y se vuelve a abrir la app
- Entonces la sesión sigue en curso con todo lo registrado

**F-22 Sin red** · e2e
- Dada la app abierta una vez con red
- Cuando el navegador pasa a modo sin conexión
- Entonces se puede recargar, empezar, registrar y terminar una sesión

### Terminar, descartar e historial

**F-23 Terminar** · unit
- Dada una sesión en curso con series hechas y series sin hacer
- Cuando se termina
- Entonces se guarda la hora de fin, se eliminan las series sin hacer y los ejercicios que se quedan sin series

**F-24 Terminar sin nada hecho** · e2e
- Dada una sesión en curso sin ninguna serie hecha
- Cuando se pulsa "Terminar"
- Entonces se ofrece descartarla en lugar de terminarla

**F-25 Descartar** · e2e
- Dada una sesión en curso
- Cuando se pulsa "Descartar" y se confirma
- Entonces la sesión desaparece por completo y no sale en el historial

**F-26 Historial** · e2e
- Dadas tres sesiones terminadas en días distintos
- Cuando se abre el historial
- Entonces aparecen de la más reciente a la más antigua, cada una con fecha, duración, número de ejercicios y de series hechas

**F-27 Corregir una sesión terminada** · e2e
- Dada una sesión terminada
- Cuando se abre su detalle y se cambia un valor, se añade una serie y se quita otra
- Entonces los cambios se guardan y el historial los refleja

**F-28 Borrar una sesión terminada** · e2e
- Dado el detalle de una sesión terminada
- Cuando se pulsa "Borrar" y se confirma
- Entonces desaparece del historial y deja de ser la referencia de F-18

### Datos

**F-29 Día local de la sesión** · unit
- Dada una sesión que empieza el 2026-10-18 a las 23:30 hora local y termina a las 00:40
- Cuando se guarda y se consulta, también con el reloj en otra zona horaria
- Entonces su día es `2026-10-18`

**F-30 Unidades guardadas** · unit
- Dada una serie de 82,5 kg y otra de 1:30
- Cuando se guardan
- Entonces se almacenan como `82.5` (kg) y `90` (segundos)

**F-31 Almacenamiento persistente** · unit
- Dado que todavía no se ha pedido almacenamiento persistente
- Cuando se guarda la primera sesión
- Entonces se llama a `navigator.storage.persist()` una sola vez; si devuelve `false` o no existe, la app sigue funcionando

## Requisitos no funcionales
- Pensada para móvil a una mano: objetivos táctiles de al menos 44 px, y registrar una serie con la referencia de F-18 cuesta un toque (F-19).
- Sin llamadas de red (AGENTS.md). Los datos no salen del dispositivo.
- Interfaz en español.

## Fuera de alcance
- **De esta spec, en otra:** exportar e importar JSON (ADR-0002). Va en una spec corta de copia de seguridad, que conviene terminar antes de usar la app en serio, porque sin ella borrar los datos del navegador lo pierde todo.
- **Después del MVP:** tipos de serie y RPE, notas, distancia, superseries, rutinas y plantillas, temporizador de descanso, récords, estadísticas y gráficos de fuerza, libras, imágenes e instrucciones de ejercicios, Muay Thai.
- **Descartado:** red social, sincronización y cuentas.

## Preguntas abiertas
Ninguna que cambie un escenario. El plan decide el esquema de Dexie y qué ~80 ejercicios entran en la semilla (ADR-0012).

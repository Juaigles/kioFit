# Spec: experiencia de uso y sistema de diseño

- Estado: aprobada (2026-10-21) · Fecha: 2026-10-21
- Decisiones: ADR-0010, ADR-0014 · Benchmark: [benchmark.md](benchmark.md) · Referencia visual: [sistema de diseño](../../docs/diseno/sistema-de-diseno.md) y los mockups del artifact "kioFit: nuevo diseño"
- Afecta a: [spec de fuerza](../fuerza/spec.md) y [spec de copia de seguridad](../copia-de-seguridad/spec.md). No cambia ninguno de sus escenarios; cambia cómo se llega a ellos y cómo se ven.

## Qué y por qué

kioFit funciona, pero cada pantalla decide sola sus colores, botones y confirmaciones: "Añadir ejercicio" y "Terminar" son el mismo botón verde, quitar un ejercicio es un texto rojo junto a dos flechas, y no hay forma de saber en qué parte de la app estás. Jota lo usa en el iPhone con una mano, entre series, cansado y a menudo sin cobertura. Necesita que la app se entienda de un vistazo y que registrar una serie no exija pensar.

Esta spec fija la navegación, el comportamiento de las pantallas existentes y un sistema de diseño común para que Peso y Comidas nazcan ya coherentes.

**Éxito:** Jota hace un entrenamiento completo en su iPhone sin dudar dónde tocar, y una serie con la referencia anterior se registra con un toque.

## Principios

1. **Un toque por serie.** Todo lo demás de la sesión (reordenar, quitar, borrar) está a un toque más, en una hoja.
2. **El pulgar manda.** Lo frecuente, abajo y grande; lo raro o peligroso, arriba o detrás de una confirmación.
3. **Un color, un significado.** Acento = acción; verde = serie hecha; rojo = borrar; gris = referencia y secundario.
4. **Nada destructivo sin "Cancelar".** Toda confirmación es la misma hoja inferior.
5. **Se comporta como una app del iPhone.** Pestañas abajo, títulos grandes, hojas, fuente del sistema, zonas seguras.
6. **Sin red, sin descargas.** Fuentes e iconos van dentro de la app.

## Conceptos

- **Pestaña:** destino principal de la barra inferior. Hoy: Hoy, Entrenar y Ajustes. Peso y Comidas se añaden cuando exista su módulo.
- **Pantalla de foco:** pantalla a pantalla completa, sin barra de pestañas (la sesión en curso).
- **Hoja:** panel que sube desde abajo con acciones o una confirmación, y que siempre tiene "Cancelar".
- **Resumen de la sesión:** duración desde el inicio, volumen (suma de kg × reps de las series hechas con peso) y series hechas sobre el total.
- **Pista de referencia:** la referencia de F-18 mostrada en gris dentro de un campo vacío; no es un valor guardado.

## Escenarios

**unit** = Vitest (dominio y componentes con `@nuxt/test-utils`); **e2e** = Playwright sobre el build estático.

### Navegación

**D-01 Barra de pestañas** · e2e
- Dado la app abierta en Hoy
- Cuando pulso "Entrenar" en la barra inferior
- Entonces veo la pantalla Entrenar y esa pestaña está marcada como la actual

**D-02 Solo pestañas con módulo** · unit
- Dado los módulos construidos (Fuerza y copia de seguridad)
- Cuando se pinta la barra
- Entonces tiene, en este orden, Hoy, Entrenar y Ajustes

**D-03 Sesión a pantalla completa** · e2e
- Dado una sesión en curso
- Cuando la abro
- Entonces no se ve la barra de pestañas, y arriba están "Minimizar" y "Terminar"

**D-04 Continuar una sesión** · e2e
- Dado una sesión en curso y que la he minimizado
- Cuando abro Hoy o Entrenar
- Entonces veo "Continuar" con los minutos transcurridos y las series hechas sobre el total, y al pulsarlo vuelvo a la sesión

### Sesión en curso

**D-05 Resumen de la sesión** · unit
- Dado una sesión empezada hace 32 minutos con 60 × 10 y 80 × 8 hechas, una serie de solo reps hecha y otra pendiente
- Cuando se calcula el resumen
- Entonces la duración es 32 min, el volumen 1.240 kg (las series sin peso no suman) y las series 3/4

**D-06 Columnas según la medida** · unit
- Dado un ejercicio de cada tipo de medida
- Cuando se pinta su tabla
- Entonces las cabeceras son "Serie · Anterior · Kg · Reps" para peso y reps, "Serie · Anterior · Reps" para solo reps y "Serie · Anterior · Tiempo" para duración

**D-07 Pista de referencia** · unit
- Dado una serie vacía con referencia 80 × 7
- Cuando se pinta
- Entonces los campos están vacíos y muestran "80" y "7" como pista; al marcarla, F-19 guarda esos valores

**D-08 Serie hecha a la vista** · e2e
- Dado una serie pendiente
- Cuando la marco
- Entonces su fila pasa al estado hecho (verde) y el botón se anuncia como "Desmarcar serie N de <ejercicio>"

**D-09 Menú del ejercicio** · e2e
- Dado un ejercicio en la sesión
- Cuando pulso "Opciones de <ejercicio>"
- Entonces se abre una hoja con "Subir", "Bajar", "Quitar ejercicio" y "Cancelar"; "Subir" está desactivado en el primero y "Bajar" en el último

**D-10 Borrar una serie desde su número** · e2e
- Dado una serie
- Cuando pulso su número
- Entonces se abre una hoja con "Borrar serie" y "Cancelar"

**D-11 Confirmaciones en hoja** · e2e
- Dado cualquier acción que borra datos (descartar la sesión, quitar un ejercicio con series hechas, borrar una sesión terminada, importar una copia)
- Cuando la pido
- Entonces se abre la misma hoja de confirmación, con la acción en rojo y "Cancelar", y nada se borra hasta confirmar

**D-12 Añadir ejercicio en hoja** · e2e
- Dado una sesión en curso
- Cuando pulso "Añadir ejercicio"
- Entonces se abre una hoja con el foco en la búsqueda; un toque en un resultado lo añade y cierra la hoja

### Historial, ajustes y aviso de copia

**D-13 Tarjeta del historial** · e2e
- Dado una sesión terminada con dos ejercicios
- Cuando abro Entrenar
- Entonces su tarjeta muestra el día, la duración, el total de series y cada ejercicio con su número de series

**D-14 Copia de seguridad en Ajustes** · e2e
- Dado la app abierta
- Cuando abro Ajustes
- Entonces veo "Última copia", "Exportar copia" e "Importar copia" en un mismo grupo, con el comportamiento de C-01 a C-20 sin cambios

**D-15 Aviso de copia antigua** · unit
- Dado que la última copia es de hace 8 días, o que no hay ninguna y existe al menos una sesión
- Cuando abro Hoy
- Entonces veo el aviso "Última copia hace 8 días" (o "Aún no has hecho ninguna copia") que lleva a Ajustes; con una copia de hace 7 días o menos no aparece

### Sistema de diseño

**D-16 Modo claro y oscuro** · e2e
- Dado el iPhone en modo oscuro (o claro)
- Cuando abro la app
- Entonces se pinta con los tokens de ese modo, sin destello del otro

**D-17 Sin colores sueltos** · unit
- Dado el código de `app/`
- Cuando se analiza
- Entonces ningún componente usa colores de paleta de Tailwind (`bg-green-500`), hexadecimales ni `style` con color; solo tokens semánticos

**D-18 Objetivos táctiles** · e2e
- Dado una sesión en curso con un ejercicio de peso y reps
- Cuando se mide cada botón y campo de la sesión
- Entonces todos miden al menos 44 × 44 px

## Requisitos no funcionales

- **Toques:** registrar una serie con referencia = 1 toque (F-19); añadir un ejercicio ya usado = 3 toques más lo que se escriba (Añadir ejercicio → buscar → tocar); empezar un entrenamiento desde Hoy = 1 toque.
- **Contraste:** texto ≥ 4,5:1 y elementos gráficos ≥ 3:1 en ambos modos.
- **Movimiento:** con "Reducir movimiento" del sistema, las transiciones pasan a fundido sin desplazamiento.
- **Zonas seguras:** nada interactivo bajo la muesca ni bajo el indicador de inicio (`env(safe-area-inset-*)`).
- **Sin red:** fuentes del sistema e iconos empaquetados; ninguna petición externa (F-22 sigue en verde).

## Fuera de alcance

- **En otra spec:** el aspecto de Peso (gráfico) y Comidas usará este sistema, pero sus pantallas se diseñan en sus specs.
- **Después del MVP:** barra de sesión minimizada sobre las pestañas, pantalla siempre encendida (Wake Lock), temporizador de descanso, notas y RPE, deslizar para borrar, reordenar arrastrando, elegir acento en Ajustes, guía de estilo navegable (`/dev/design`).
- **Descartado:** Live Activity y widgets (no existen para una PWA), vibración (Safari iOS no la expone).

## Preguntas abiertas

Ninguna que cambie un escenario. El color de acento (azul por defecto; violeta y verde azulado como alternativas en los mockups) lo confirma Jota al aprobar.

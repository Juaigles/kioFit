# Benchmark UX/UI: cómo se siente una app de entrenamiento rápida

- Fecha: 2026-10-21 · Método: REA manual (ADR-0007): **[visto]** = leído en una fuente citada; **[inferido]** = deducción o recuerdo de uso sin fuente citada aquí; **[desconocido]** = no se pudo comprobar.
- Responde a las preguntas de la spec de diseño ([spec.md](spec.md)) y nada más.

## Preguntas que responde

1. ¿Cómo se organiza la pantalla de la sesión en curso para que registrar una serie sea lo más rápido posible?
2. ¿Qué navegación usan estas apps y dónde vive cada cosa?
3. ¿Qué hace que una app de registro "se sienta" rápida, y cómo se mide?
4. ¿Qué reglas de plataforma (iPhone) hay que respetar para que una PWA no parezca una web?

## Hallazgos

### Hevy (fuerza, referencia principal)

- El temporizador de descanso vive en cada ejercicio, debajo de su nota, y arranca al marcar una serie como hecha **[visto, [Hevy: rest timer](https://www.hevyapp.com/features/workout-rest-timer/)]**.
- Los ajustes de la sesión están al final de la pantalla, en un botón gris "Settings", lejos de lo que se toca a menudo **[visto, [Hevy: workout settings](https://www.hevyapp.com/features/workout-settings/)]**.
- Los valores anteriores se muestran en cada serie y se pueden basar en la última vez del ejercicio o de la rutina **[visto, mismo enlace]**.
- Las series se registran en columnas (peso, reps, tiempo, RPE); RPE y temporizador en línea son columnas opcionales **[visto, mismo enlace]**.
- Mantener la pantalla encendida durante el entreno es un ajuste, para no desbloquear en cada serie **[visto, mismo enlace]**.
- La Live Activity permite marcar una serie sin abrir la app y muestra el tiempo transcurrido **[visto, [Hevy: Live Activity](https://help.hevyapp.com/hc/en-us/articles/35649846517399-How-to-Use-Hevy-s-Live-Activity-on-iOS-and-Android)]**. Una PWA no puede crear Live Activities **[inferido]**.
- Disposición de la fila: `SET · PREVIOUS · KG · REPS · ✓`; la fila hecha se tiñe de verde; el nombre del ejercicio va en el color de acento; "Add Set" es un botón gris ancho bajo las series; "Finish" arriba a la derecha; la sesión se puede minimizar a una barra sobre las pestañas **[inferido, de uso de la app]**.
- Las quejas de usuarios que importan aquí: falta de "Siguiente" entre campos y desfases de fecha **[visto, ya recogido en `docs/investigacion/apps-de-referencia-y-rea.md`]**.

### Strong (contraste)

- Centrada solo en registrar, sin red social **[visto, [Setgraph](https://setgraph.app/ai-blog/hevy-vs-strong-app-comparison-2026)]**.
- Misma tabla de series que Hevy, interfaz más sobria y casi monocroma **[inferido, de uso]**. Confirma que la fórmula de la tabla es el estándar del sector y no una rareza de Hevy.

### MacroFactor (comidas, y cómo medir la rapidez)

- Mide la rapidez contando **acciones discretas** por caso de uso (su índice FLSI): 10 para buscar y añadir, 4 para kcal rápidas; menos es mejor **[visto, [MacroFactor: fastest food logger](https://macrofactor.com/fastest-food-logger/)]**.
- No optimiza solo velocidad: busca "intuitivo y cómodo" además de rápido **[visto, mismo enlace]**.
- Añadir varios alimentos sin salir de la hoja de búsqueda; la interfaz se reinicia sola para escribir el siguiente; recuerda la última cantidad **[visto, [MacroFactor: new food logger](https://macrofactor.com/new-food-logger/)]**.
- Un banner fijo con el total del día mientras se registra **[visto, mismo enlace]**.

### Patrones de apps de entrenamiento en general

- Etiquetar cada valor por su estado: objetivo, valor anterior y valor de hoy; un valor rellenado de antemano debe verse sin confirmar **[visto, [ScreensDesign](https://screensdesign.com/articles/workout-tracker-app-design-examples/)]**.
- La sesión muestra tiempo transcurrido, progreso y la acción de terminar; se confirma si quedan cosas sin registrar **[visto, mismo enlace]**.
- Corregir (deshacer, editar, reordenar, borrar) sin perder la sesión; guardar primero en local **[visto, mismo enlace]**.

### Plataforma (iPhone)

- Objetivo táctil mínimo de 44 × 44 pt **[visto, [Deque: touch target size](https://dequeuniversity.com/rules/attest-ios/1.0/touch-target-size)]**.
- La zona cómoda del pulgar es la mitad inferior de la pantalla; arriba se ponen las acciones raras **[visto, [Glance: one-handed use](https://thisisglance.com/learning-centre/how-should-i-design-my-app-for-one-handed-use)]**.
- Patrones nativos que el usuario ya sabe usar: barra de pestañas abajo, título grande que se encoge al hacer scroll, hojas inferiores para acciones y confirmaciones **[inferido, de las guías de Apple]**.
- Safari en iOS no implementa la API de vibración, así que no hay háptica desde la web **[inferido; se comprueba en la tarea D06 antes de prometer nada]**.

## La fórmula que copiamos

| De | Copiamos | Por qué |
| --- | --- | --- |
| Hevy | La tabla de series `Serie · Anterior · Kg · Reps · ✓`, fila verde al marcar, nombre del ejercicio en acento, "Terminar" arriba a la derecha | Es lo que Jota ya sabe usar: cero aprendizaje. "Terminar" arriba evita pulsarlo sin querer |
| Hevy + ScreensDesign | La referencia anterior como pista gris dentro del campo vacío, distinta del valor de hoy | Encaja con F-18/F-19: un toque en ✓ copia la pista |
| Strong | Sobriedad: un solo acento, sin social, sin adornos | Menos ruido = se lee de un vistazo entre series |
| MacroFactor | Medir la rapidez en toques y fijarla como requisito; volver al punto de partida tras añadir | Convierte "se siente rápido" en algo comprobable |
| iOS | Barra de pestañas, títulos grandes, hojas inferiores, fuente del sistema, zonas seguras | Una PWA que se comporta como una app nativa |

## Clasificación

- **Entra en el MVP (spec de diseño):** tabla de series, pista de referencia, menú del ejercicio en hoja, confirmaciones en hoja, barra de pestañas, sesión a pantalla completa con "Terminar", resumen de la sesión en la cabecera (duración, volumen y series), tarjeta "Continuar" en Hoy, modo claro y oscuro, medición en toques.
- **Después del MVP:** barra de sesión minimizada sobre las pestañas, temporizador de descanso (ya fuera en la spec de fuerza), mantener la pantalla encendida (Wake Lock API, a comprobar en iOS), notas por ejercicio, RPE.
- **Descartado:** Live Activity y widgets (no existen para una PWA), red social.

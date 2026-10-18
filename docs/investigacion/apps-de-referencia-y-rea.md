# Apps de referencia y encaje de REA

Investigación del 2026-10-18 para decidir qué apps tomar como referencia y si aplicamos REA (Reverse Engineer Anything) para sacar la constitución y las specs. Etiquetas de evidencia, al estilo de REA: **[visto]** = leído en una fuente citada; **[inferido]** = deducción mía sin confirmar.

## 1. Qué es REA en realidad

- Repositorio original: [morluto/rea](https://github.com/morluto/rea), licencia MIT, ~5,6k estrellas **[visto]**. [NabilRFG12/Reverse-Engineer-anything](https://github.com/NabilRFG12/Reverse-Engineer-anything) parece una copia que enlaza al original **[visto]**.
- Es un **servidor MCP + CLI** (`npx rea-agents setup`) que conecta un agente (Claude Code, Codex…) con herramientas de ingeniería inversa: Ghidra o Hopper para binarios, análisis de APK/IPA/ASAR/Electron, inspección de páginas web por CDP y captura de procesos **[visto]**.
- Fases: decompilar → comprender → recrear. Produce **evidencias** (hallazgos con ubicación, confianza y limitaciones, snapshots JSON, capturas, preguntas abiertas) **[visto]**.
- **No produce specs, PRDs ni constitución.** Tampoco recupera el código fuente original ni clona una app **[visto]**.
- Requisitos: Node 22.19+, y para binarios nativos Ghidra 12 + JDK 21 o Hopper **[visto]**.
- Lo valioso es el **método**, que el artículo de [MindStudio](https://www.mindstudio.ai/blog/reverse-engineer-anything-repo) resume bien **[visto]**:
  1. Elegir **una funcionalidad concreta**, nunca "toda la app" (los alcances amplios dan resultados vagos y erróneos).
  2. Resumen primero: qué hace, cómo y qué sigue sin estar claro.
  3. Clasificar cada hallazgo en visto / inferido / desconocido.
  4. Reconstruir y probar hasta que el comportamiento coincida.

## 2. Por qué no recomiendo usar la herramienta REA sobre Hevy (la contraria)

1. **No da lo que buscamos.** La constitución (`AGENTS.md`) son *tus* reglas (stack, ADRs, comandos, prohibiciones). Ninguna app de terceros te la puede dar, ni siquiera descompilada. Las specs salen de *tus* necesidades; la referencia solo informa.
2. **Lo que necesitamos de Hevy ya es público y legal.** Su API pública documenta el modelo de datos completo de entrenamiento, serie y tipo de serie (ver sección 4) y su centro de ayuda explica las reglas de negocio. Descompilar daría lo mismo, peor y con más ruido.
3. **Coste fuera de foco.** Hevy es React Native **[visto, [Hevy](https://www.hevyapp.com/how-we-built-hevy/)]**: en Android el JS va empaquetado como bytecode Hermes y en iOS el IPA viene cifrado **[inferido]**. Montar Ghidra/JDK, sacar el APK y pelearse con el bytecode son tardes que no enseñan SDD. Viola el ADR-0003 (tareas de 60-90 min con foco).
4. **Zona gris legal.** Los términos de Hevy solo dan una licencia limitada y prohíben copiar o modificar sus materiales **[visto, [T&C](https://www.hevyapp.com/legal/terms-and-conditions/)]**. No mencionan la descompilación de forma expresa. En la UE, el usuario legítimo puede *observar y probar* el funcionamiento para entender sus ideas, pero la descompilación solo se ampara para interoperabilidad (Directiva 2009/24/CE, arts. 5.3 y 6) **[inferido, no soy abogado]**. Usar la app y leer su documentación es seguro; descompilarla para clonar funciones, no.
5. **Lo difícil de Hevy está fuera de nuestro MVP**: red social, sincronización, Apple Watch, estadísticas. Lo que nos queda (registrar series) es simple de observar usándola.

**Conclusión:** adoptamos el **método REA** (funcionalidad acotada, evidencia etiquetada, resumen primero) como paso de "benchmark funcional" antes de cada spec, hecho a mano con fuentes públicas y uso propio. La herramienta queda como experimento opcional después del MVP (sección 6).

## 3. Apps de referencia elegidas, una por módulo

No hay una sola "mejor app" que cubra los tres módulos bien. Cada líder lo es en lo suyo, así que tomamos una referencia por módulo del ADR-0005.

| Módulo | Referencia principal | Por qué | Fuentes legales |
| --- | --- | --- | --- |
| Constitución y arquitectura | [alexanderop/workouttracker](https://github.com/alexanderop/workouttracker) (MIT) | Mismo stack que nuestros ADR: Vue + TS, Pinia, Dexie, PWA, Vitest/Playwright. Tiene `CLAUDE.md`, `AGENTS.md`, `specs/` y reglas de dependencias entre features **[visto]** | Código fuente abierto: se lee directamente, REA no aporta nada |
| 1. Fuerza | **Hevy** | Es la referencia que Jota usa y el líder del sector; su modelo de datos es público | API pública v1, centro de ayuda, tu propio uso |
| (contraste) | Strong | Flujo centrado solo en registrar, exporta CSV **[visto, [Setgraph](https://setgraph.app/ai-blog/hevy-vs-strong-app-comparison-2026)]** | Uso y documentación |
| 2. Peso diario | **Happy Scale** (o Libra en Android) | Media móvil de tendencia para que la fluctuación diaria no confunda **[visto, [App Store](https://apps.apple.com/app/id532430574)]** | Uso y ficha de la tienda |
| 3. Comidas y kcal | **MacroFactor** | Se diseñó y midió como el registrador de comidas más rápido **[visto, [MacroFactor](https://macrofactor.com/new-food-logger/)]** | Artículos públicos de su equipo |

## 4. Hallazgos por módulo y qué implican para nuestras specs

### Fuerza (Hevy)

Modelo de la API pública **[visto, [doc de la API](https://mintlify.wiki/imalfect/hevy-http-mcp/api-reference/types/workouts)]**:

- `Workout`: `title`, `description`, `start_time`, `end_time`, `routine_id`, `exercises[]`.
- `WorkoutExercise`: `index`, `exercise_template_id`, `notes`, `superset_id`, `sets[]`.
- `WorkoutSet`: `index`, `type` (`normal | warmup | dropset | failure`), `weight_kg`, `reps`, `distance_meters`, `duration_seconds`, `rpe` (6-10 en pasos de 0,5), `custom_metric`. Todos los valores son anulables.
- El ejercicio tiene un **tipo de medida** (peso y reps, reps con peso corporal, duración…) que no se puede cambiar una vez creado **[visto, [ayuda](https://help.hevyapp.com/hc/en-us/articles/35688251991575-Hevy-Exercise-Library-400-Exercises-and-Custom-Exercises)]**.

Lo que más valoran y odian los usuarios **[visto, [reseñas](https://justuseapp.com/en/app/1458862350/hevy-gym-trainingstagebuch/reviews)]**:

- Valoran ver las series de la **sesión anterior** al registrar (clave para la sobrecarga progresiva) y la interfaz rápida.
- Se quejan de: falta de botón "Siguiente" entre campos, no poder elegir cómo se mide un ejercicio, notas que no persisten, y **desfases de un día por zona horaria** al importar.

Implicaciones para la spec de fuerza:
- El peso se guarda siempre en **kg** como número; la unidad es solo de presentación.
- El **tipo de medida va en el ejercicio** (`peso_reps`, `reps`, `duracion`). Así Muay Thai (rounds × duración) entra después sin rehacer el modelo, como pide el ADR-0005.
- Mostrar la serie equivalente de la sesión anterior es barato y es el valor central: candidato a criterio de aceptación del MVP (no es "récords", que siguen fuera).
- `tipo` de serie y `rpe` son opcionales y baratos de guardar; mostrarlos o no se decide en la spec.
- Fuera, aunque Hevy lo tenga: superseries, rutinas, temporizador, PR, social (ya fuera por ADR-0005).

### Peso diario (Happy Scale)

- El valor diferencial es la **tendencia** (media móvil) sobre el dato bruto, porque el peso diario fluctúa **[visto]**. Ventana y algoritmo no publicados **[desconocido]**.
- Implicación: la spec del gráfico debería decidir si muestra solo puntos o también una media móvil de 7 días. Es poco código y cambia mucho la utilidad.
- Implicación del hallazgo de zonas horarias: el día de un registro se guarda como **fecha local** (`YYYY-MM-DD`), no derivado de un timestamp UTC. Vale también para comidas.

### Comidas y kcal (MacroFactor)

Patrones de registro rápido **[visto]**: recordar la última cantidad usada de cada alimento, añadir con un toque desde la búsqueda, crear un alimento y añadirlo en un solo paso, volver al buscador tras añadir, y alimentos habituales según la hora.

Implicaciones, compatibles con el ADR-0006 (catálogo propio):
- Para el MVP valen tres: **recientes primero**, **recordar la última cantidad** y **crear y añadir en un paso**. Compensan el coste de primer uso que el ADR-0006 ya reconoce.
- Fuera: IA, recetas, macros, sugerencias por hora.

## 5. Cómo encaja en el flujo SDD

Antes de escribir cada spec, un paso corto de **benchmark funcional** (una tarde como máximo):
1. Elegir una sola funcionalidad (por ejemplo "registrar una serie").
2. Usar la app de referencia y leer su documentación pública.
3. Anotar hallazgos con visto / inferido / desconocido.
4. Separar en tres listas: entra en el MVP, va a "después del MVP" o se descarta.
5. Solo entonces escribir la spec.

La constitución (`AGENTS.md`) no pasa por este paso: sale de los ADR 0001-0006, usando como plantilla el `CLAUDE.md`/`AGENTS.md` de workouttracker.

## 6. Experimento con la herramienta REA (decidido, ADR-0007)

Jota eligió "método ahora + herramienta después" el 2026-10-18. Experimento **después del MVP**, de una tarde: instalar REA en Claude Code y usar `inspect-web-page` / `capture-browser-scenario` sobre la build de workouttracker (MIT, legal) o sobre nuestra propia app, para comparar comportamientos. Aprendes la herramienta sin riesgo legal ni desvío del MVP. Iría a la lista de "después".

## Fuentes
- [morluto/rea](https://github.com/morluto/rea/blob/main/README.md) · [copia NabilRFG12](https://github.com/NabilRFG12/Reverse-Engineer-anything) · [MindStudio sobre REA](https://www.mindstudio.ai/blog/reverse-engineer-anything-repo)
- [Cómo se construyó Hevy](https://www.hevyapp.com/how-we-built-hevy/) · [T&C de Hevy](https://www.hevyapp.com/legal/terms-and-conditions/) · [API de Hevy (integración)](https://docs.serval.com/sections/integrations/hevy.md) · [tipos de la API](https://mintlify.wiki/imalfect/hevy-http-mcp/api-reference/types/workouts) · [tipos de serie](https://help.hevyapp.com/hc/en-us/articles/34896293707927-Set-Types-in-Hevy-Explained-Drop-Sets-Warm-Up-Sets-and-More) · [biblioteca de ejercicios](https://help.hevyapp.com/hc/en-us/articles/35688251991575-Hevy-Exercise-Library-400-Exercises-and-Custom-Exercises) · [reseñas](https://justuseapp.com/en/app/1458862350/hevy-gym-trainingstagebuch/reviews)
- [Hevy vs Strong](https://setgraph.app/ai-blog/hevy-vs-strong-app-comparison-2026) · [MacroFactor food logger](https://macrofactor.com/new-food-logger/) · [Happy Scale](https://apps.apple.com/app/id532430574) · [workouttracker](https://github.com/alexanderop/workouttracker)

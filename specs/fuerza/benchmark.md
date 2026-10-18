# Benchmark funcional: registrar un entrenamiento de fuerza

Paso previo a la spec, según el ADR-0007. Referencia: **Hevy** (contraste: Strong). Fuentes públicas y uso propio; nada descompilado. Detalle y enlaces en [docs/investigacion/apps-de-referencia-y-rea.md](../../docs/investigacion/apps-de-referencia-y-rea.md).

Etiquetas: **[visto]** en una fuente citada · **[inferido]** deducción sin confirmar · **[desconocido]** no averiguado.

## Preguntas de la spec que responde
Este benchmark se hizo antes que la spec, en la Fase 0. Desde la Fase 1 el orden es al revés (AGENTS.md): la spec plantea preguntas y el benchmark solo las responde. Estas son las preguntas a las que contestó:
1. ¿Qué campos necesita una serie para no rehacer el modelo después? (H1-H4 → F-15, F-30)
2. ¿Qué hace que registrar sea rápido? (H5-H7 → F-17, F-18, F-19)
3. ¿Qué pasa con la sesión si se cierra la app? (H8-H9 → F-11, F-21)

Funcionalidad acotada: empezar una sesión, añadir ejercicios, registrar series y terminarla. Nada de rutinas, social ni estadísticas.

## Hallazgos

| # | Hallazgo | Evidencia |
| --- | --- | --- |
| H1 | Un entrenamiento tiene título, inicio, fin y una lista ordenada de ejercicios, cada uno con series ordenadas | [visto] API pública v1 |
| H2 | Una serie guarda `weight_kg`, `reps`, `duration_seconds`, `distance_meters`, `rpe` y `type` (`normal`, `warmup`, `dropset`, `failure`), todos anulables | [visto] API pública v1 |
| H3 | El peso se guarda en kg; la unidad de la UI es una preferencia | [visto] `weight_kg` en la API · [inferido] conversión solo en pantalla |
| H4 | Cada ejercicio tiene un tipo de medida (peso y reps, reps con peso corporal, duración…) que no se cambia una vez creado | [visto] centro de ayuda |
| H5 | Al registrar, cada serie muestra lo que hiciste en la misma serie de la sesión anterior; los usuarios lo valoran como lo más útil para progresar | [visto] reseñas |
| H6 | Marcar una serie vacía como hecha copia los valores de la sesión anterior | [inferido] uso propio, no documentado |
| H7 | Quejas: falta de "Siguiente" entre campos, notas que no persisten, días desplazados por la zona horaria | [visto] reseñas |
| H8 | La sesión en curso sigue abierta si cierras la app y vuelves | [inferido] uso propio |
| H9 | Cómo resuelve Hevy dos sesiones en curso a la vez | [desconocido] |

## Clasificación

**Entra en el MVP:** H1 (con campo `type` de sesión, ADR-0005), H3, H4, H5, H6, H8, fecha local contra H7, "Siguiente" entre campos (H7). Para H9 decidimos nosotros: una sola sesión en curso.

**Después del MVP:** tipos de serie y RPE (H2), notas, distancia, superseries, rutinas, temporizador de descanso, récords, estadísticas, cambio de unidad a libras.

**Descartado:** red social, Apple Watch y sincronización en la nube (ADR-0002).

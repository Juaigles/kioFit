# Referencias open source para una app tipo Hevy

Búsqueda del 2026-10-18. Sirve para inspirarnos en funcionalidades y modelos de datos, y para reutilizar datos con licencia libre. Regla: **no copiar código de proyectos AGPL** (obligaría a publicar el nuestro con esa licencia); los MIT se pueden estudiar y reutilizar citando la fuente.

## Apps de referencia

| Proyecto | Stack | Licencia | Qué nos sirve |
| --- | --- | --- | --- |
| [alexanderop/workouttracker](https://github.com/alexanderop/workouttracker) | Vue 3.5 + TS estricto, Pinia, **Dexie (IndexedDB)**, Vite PWA, Vitest + Playwright | MIT | La más cercana a nuestras decisiones (PWA local-first en Vue). Tiene `CLAUDE.md`, plantillas, biblioteca de ejercicios con búsqueda, export/import. Ver cómo modela bloques, series y RIR |
| [wger](https://github.com/wger-project/wger) | Django, REST API, Docker | AGPL-3.0 | Referencia funcional completa: rutinas, nutrición, peso corporal. Su wiki de ejercicios y su API pública pueden ser fuente de datos |
| [Lyftr](https://github.com/Cawlumm/lyftr) | SQLite, Docker, APK Android | MIT | Registro de entrenos + nutrición + peso en una sola app (justo nuestro MVP). Modo gimnasio con temporizador de descanso |
| [Workout Cool](https://github.com/Snouzy/workout-cool) | Next.js, PostgreSQL | MIT | Base de ejercicios con instrucciones y vídeos, importación CSV |
| [GymCoach](https://github.com/Julien-Au/gymcoach) | PWA, Postgres | MIT | Registro rápido de series, calculadora de discos y calentamiento, offline |
| [LiftTrace](https://github.com/TraceApps/lifttrace) | PWA, SQLite | AGPL-3.0 | Plantillas, récords (PR), estadísticas. Solo como inspiración |
| [Stronk](https://github.com/alshdavid/stronk) | Web app, SQLite en cliente | No indicada | Diario de levantamientos local, idea de backups opcionales |

Fuente del listado: [selfhostedworld.com/alternative/hevy](https://selfhostedworld.com/alternative/hevy).

## Datos de ejercicios

- **[free-exercise-db](https://github.com/yuhonas/free-exercise-db)**: 800+ ejercicios en JSON con imágenes, licencia Unlicense (dominio público). Campos: `id`, `name`, `force`, `level`, `mechanic`, `equipment`, `primaryMuscles`, `secondaryMuscles`, `instructions`, `category`, `images`. Nombres en inglés; `force`, `mechanic` y `equipment` pueden ser `null`. **Candidata principal** para precargar el catálogo.

## Datos de alimentos

- **[Open Food Facts](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/)**: base colaborativa de productos envasados, licencia ODbL (hay que atribuir). Lectura sin cuenta, con `User-Agent` propio. Límites: 15 lecturas/min y **10 búsquedas/min por IP**; desaconsejan buscar mientras se escribe. Lo útil para nosotros: consulta por código de barras (`/api/v3/product/{barcode}.json`, campo `nutriments.energy-kcal_100g`).
- Alimentos frescos (pollo, arroz, fruta) suelen faltar o estar mal en OFF. Para eso, alimentos propios con kcal por 100 g o por ración.

## Implicaciones para el MVP
- Catálogo de ejercicios: precargar free-exercise-db (o un subconjunto) y permitir ejercicios propios.
- Comidas: depender de una API externa con límites tan bajos en el MVP es arriesgado. Ver ADR-0005 y la decisión pendiente sobre la fuente de alimentos.

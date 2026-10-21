# Sistema de diseño de kioFit

Referencia viva para personas y agentes. Si una pantalla necesita algo que no está aquí, se añade aquí primero (en el mismo PR) y luego se usa. Decisión: ADR-0014. Mockups: artifact "kioFit: nuevo diseño".

## 1. Tokens

Tres capas. Los componentes solo usan la capa semántica (o las utilidades de Nuxt UI que apuntan a ella), nunca la paleta.

| Capa | Dónde vive | Ejemplo |
| --- | --- | --- |
| Primitivos (paleta) | `app/assets/css/main.css`, `@theme static` | `--color-kio-500: #1F6FEB` |
| Semánticos | `main.css`, `:root` y `.dark` | `--kf-done-tint`, `--ui-bg-elevated` |
| De componente | `app/app.config.ts` (`ui.*`) | `button.defaultVariants`, `slots` de `UInput` |

### Color

Nombres de intención. La columna Nuxt UI indica la variable de Nuxt UI que lo implementa; las que empiezan por `--kf-` son nuestras y se exponen a Tailwind con `@theme inline` (`bg-done-tint`, `text-done`…).

| Token | Nuxt UI | Oscuro | Claro | Uso |
| --- | --- | --- | --- | --- |
| fondo | `--ui-bg` | `#0B0D10` | `#F2F3F5` | Fondo de pantalla |
| superficie | `--ui-bg-elevated` | `#16191E` | `#FFFFFF` | Tarjetas, barra de pestañas, hojas |
| elevado | `--ui-bg-accented` | `#22262D` | `#EBEDF0` | Campos, botón neutro, grupos dentro de hojas |
| borde | `--ui-border` | `#2B3038` | `#DADEE3` | Separadores |
| texto | `--ui-text` | `#F2F4F7` | `#0E1116` | Texto principal |
| texto secundario | `--ui-text-muted` | `#9BA4AF` | `#586271` | Secundario, referencia, cabeceras de columna |
| acento | `--ui-primary` (`kio`) | `#1F6FEB` | `#1F6FEB` | Botón principal, pestaña activa |
| acento como texto | `--kf-primary-text` | `#6EA8FF` | `#1A5FD0` | Nombre del ejercicio, enlaces, botón suave |
| hecho | `--kf-done` | `#16A34A` | `#16A34A` | Check de serie hecha |
| hecho (fondo) | `--kf-done-tint` | verde 18 % | verde 14 % | Fila de serie hecha |
| peligro | `--ui-error` | `#FF6B6B` | `#C62828` | Borrar, descartar |
| aviso | `--ui-warning` | `#F5A524` | `#B45309` | Copia antigua |

Reglas:
- Un solo botón con relleno de acento por pantalla. El resto, suave (`soft`), neutro o fantasma.
- El verde no es un color de botón: solo marca "hecho".
- El rojo aparece casi siempre dentro de una hoja de confirmación, no en la pantalla principal.
- Contraste: texto ≥ 4,5:1, gráficos ≥ 3:1, en los dos modos.
- El modo sigue al sistema (`colorMode.preference = 'system'`). `theme-color` tiene dos `<meta>` con `media` para que la barra de Safari acompañe.

### Tipografía

Fuente del sistema (San Francisco en el iPhone): `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`. Sin descargas. Los números siempre `tabular-nums`.

| Token | Tamaño / alto de línea | Peso | Uso |
| --- | --- | --- | --- |
| `title-large` | 34 / 41 | 700 | Título de pestaña |
| `title` | 22 / 28 | 700 | Título de sección, de hoja |
| `headline` | 17 / 22 | 600 | Nombre del ejercicio, botones |
| `body` | 17 / 22 | 400 | Texto general (17 px evita el zoom de iOS al enfocar un campo) |
| `value` | 20 / 24 | 600 | Valores de la serie |
| `stat` | 28 / 34 | 700 | Cifras del resumen |
| `footnote` | 13 / 18 | 400 | Ayudas, metadatos |
| `caption` | 12 / 16 | 600, mayúsculas, +0,06em | Cabeceras de columna y de grupo |

### Espacio, tamaño y radios

- Escala de 4 px: 4, 8, 12, 16, 20, 24, 32. Margen lateral de pantalla: 16. Entre tarjetas: 12.
- Objetivo táctil mínimo: 44 × 44. Fila de serie: 52 de alto, campos de 44. Botón principal: 52. Filas de lista: 52.
- Radios: `sm` 8 (check, chips), `md` 12 (botones, campos), `lg` 16 (tarjetas), hoja 24 arriba, `full` (píldoras).
- En oscuro no hay sombras: la profundidad se da subiendo de superficie (fondo → superficie → elevado).

### Movimiento

| Token | Duración | Uso |
| --- | --- | --- |
| `--kf-motion-press` | 120 ms | Escala 0,97 al pulsar |
| `--kf-motion-check` | 200 ms, `ease-out` | Fila que pasa a hecha |
| `--kf-motion-sheet` | 280 ms, `cubic-bezier(0.32, 0.72, 0, 1)` | Hojas inferiores |

Con `prefers-reduced-motion: reduce`, todo pasa a fundido de 120 ms.

### Iconos

Lucide (el set por defecto de Nuxt UI), trazo 2, 20-24 px, empaquetados en la app para que funcionen sin red. Un icono sin texto siempre lleva `aria-label`.

## 2. Catálogo de componentes

### Primitivas de Nuxt UI (se usan tal cual, con tokens)

| Componente | Variantes permitidas |
| --- | --- |
| `UButton` | `solid` (acción principal), `soft` (acción secundaria), `neutral` (`color="neutral" variant="soft"`), `ghost` (barra superior, destructivo fuera de hoja) |
| `UInput` | Tamaño `xl`, centrado para valores numéricos, `inputmode` siempre puesto |
| `UDrawer` | Base de las hojas inferiores; no se usa directo en pantallas |
| `UAlert` | Solo errores de importación o de validación |
| `UBadge` | "Propio" en ejercicios propios |

### Componentes de la app (`app/components/app/`, prefijo `App`)

| Componente | Qué es | Props / slots principales |
| --- | --- | --- |
| `AppScreen` | Contenedor de pantalla: fondo, márgenes, zonas seguras y scroll | slot por defecto, `padded` |
| `AppPageHeader` | Título grande de pestaña o barra de navegación con "atrás" y acciones | `title`, `back`, slot `actions` |
| `AppTabBar` | Barra de pestañas inferior | `items` (etiqueta, icono, ruta) |
| `AppSection` | Bloque con título de grupo en `caption` | `title`, slot |
| `AppListGroup` / `AppListRow` | Lista agrupada estilo Ajustes de iOS | `label`, `value`, `to`, `tone` |
| `AppStatTile` | Cifra con etiqueta | `label`, `value`, `unit` |
| `AppActionSheet` | Hoja con una lista de acciones y "Cancelar" | `title`, `actions[]` (`label`, `icon`, `danger`, `disabled`) |
| `AppConfirmSheet` | Hoja de confirmación de algo destructivo | `title`, `description`, `confirmLabel` |
| `AppEmptyState` | Pantalla o sección vacía con una acción | `title`, `description`, slot `action` |

### Componentes de Fuerza (`app/features/workouts/components/`)

| Componente | Qué es |
| --- | --- |
| `SessionHeader` | Cabecera de la sesión: Minimizar, título, Terminar y `AppStatTile` × 3 |
| `ExerciseCard` | Tarjeta del ejercicio: nombre en acento, botón de opciones, `SetTable`, "Añadir serie" |
| `SetTable` | Cabeceras de columna según la medida y filas `SetRow` |
| `SetRow` | Número (abre su hoja), anterior, campos con pista, check |
| `ExercisePickerSheet` | Hoja de búsqueda y creación de ejercicios |
| `SessionCard` | Tarjeta del historial |
| `ContinueSessionCard` | "Continuar" con minutos y series, usada en Hoy y Entrenar |

## 3. Pantallas

| Ruta | Pestaña | Layout | Contenido |
| --- | --- | --- | --- |
| `/` | Hoy | `default` | Continuar o Empezar, aviso de copia, y las tarjetas de Peso y Comidas cuando existan |
| `/workouts` | Entrenar | `default` | Empezar o Continuar, e historial agrupado por mes |
| `/workouts/session` | — | `focus` | Sesión en curso |
| `/workouts/history/:id` | Entrenar | `default` | Detalle, con "Editar" y "Borrar" en su hoja de opciones |
| `/settings` | Ajustes | `default` | Copia de seguridad y "Acerca de" |

`/workouts/history` y `/data` desaparecen: el historial vive en Entrenar y los datos en Ajustes. Los e2e se actualizan en la tarea que mueve cada ruta.

# ADR-0004: Sin backend en el MVP

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
Con los datos solo en el dispositivo (ADR-0002), el MVP no necesita servidor. Jota quiere practicar Go, pero una API que nadie consume añade mantenimiento, despliegue y tests sin aportar nada al usuario. Las alternativas eran Go + Postgres desde el inicio o un BaaS como Supabase.

## Decisión
El MVP es solo frontend: Nuxt + IndexedDB, sin servidor, sin autenticación y sin BaaS. El acceso a datos va detrás de una interfaz de repositorio (por ejemplo `WorkoutRepository`, `WeightRepository`) con una implementación sobre IndexedDB.

## Consecuencias
- El MVP es más pequeño y se puede desplegar como estático (por ejemplo GitHub Pages, Netlify o Cloudflare Pages).
- Go + Postgres entrará con el incremento de sincronización. Ese incremento tendrá su propia spec y su ADR, y el backend tendrá un problema real que resolver.
- La interfaz de repositorio permite añadir una implementación remota sin tocar la UI.
- Se descarta Supabase por ahora: no practica el stack de Jota y añade una dependencia externa.

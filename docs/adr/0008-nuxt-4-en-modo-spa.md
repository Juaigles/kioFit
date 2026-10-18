# ADR-0008: Nuxt 4 en modo SPA estático

- Estado: aceptada
- Fecha: 2026-10-18
- Precisa: ADR-0001

## Contexto
El ADR-0001 eligió Nuxt 3. A fecha de hoy la versión estable es Nuxt 4 (4.6.2, del 16 de octubre de 2026) y la rama 3.x no publica desde agosto de 2026. Empezar un proyecto nuevo en una rama que ya no evoluciona es deuda desde el primer día. Además, IndexedDB solo existe en el navegador: renderizar en servidor no aporta nada a una app sin backend (ADR-0004) y obliga a proteger cada acceso a datos.

## Decisión
- Nuxt 4 (estructura con `app/`) en lugar de Nuxt 3. Lo demás del ADR-0001 sigue igual: PWA con `@vite-pwa/nuxt`.
- Modo SPA: `ssr: false` y build estático con `nuxt generate`.
- TypeScript en modo estricto, comprobado con `nuxt typecheck` en el CI.

## Consecuencias
- Lo que Jota sabe de Nuxt 3 sirve casi entero; el cambio visible es la carpeta `app/`.
- Sin SSR no hay problemas de hidratación ni de código que corre en servidor, y el agente no puede añadir rutas de servidor por accidente.
- Se pierde el SEO y el primer pintado prerenderizado, que no importan en una app personal instalada.
- Si llega el backend en Go, será un servicio aparte: Nuxt seguirá siendo solo cliente.

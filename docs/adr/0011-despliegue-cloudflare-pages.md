# ADR-0011: Despliegue en Cloudflare Pages

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
Sin backend (ADR-0004), la app es un estático de `nuxt generate` (ADR-0008). Las opciones eran GitHub Pages, Netlify y Cloudflare Pages. En GitHub Pages la app iría bajo `/kioFit/`, lo que obliga a ajustar `baseURL` y el scope del service worker de la PWA, y no hay vista previa por PR.

## Decisión
Desplegar en Cloudflare Pages conectado al repo: `main` publica producción y cada PR genera una URL de vista previa. Comando de build `pnpm build`, carpeta de salida `.output/public`.

## Consecuencias
- La PWA se sirve en la raíz de un dominio, sin trucos de rutas.
- Jota puede probar cada PR en el móvil antes de fusionarlo, que es justo su ritual de revisión.
- Plan gratuito suficiente para uso personal. Añade una cuenta externa más, sin datos de usuario porque todo vive en el dispositivo.
- Configurar el proyecto en Cloudflare es una tarea del plan, no de esta constitución.
- Elegido por Jota en la tarjeta del 2026-10-18.

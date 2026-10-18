# kioFit

App de fitness personal estilo Hevy (PWA con Nuxt, local-first): entrenamientos de fuerza, peso diario y comidas con kcal. Es también un proyecto de práctica de Spec-Driven Development con agentes.

- Constitución para agentes: [AGENTS.md](AGENTS.md)
- Specs por módulo: [specs/](specs/)
- Contexto y plan: [docs/documento-de-arranque.md](docs/documento-de-arranque.md)
- Decisiones: [docs/fase-0-resumen.md](docs/fase-0-resumen.md) y [docs/adr/](docs/adr/)

## Arrancar

Necesita Node 24. La versión de pnpm va fijada en `package.json` (`packageManager`); si no tienes pnpm, actívalo con `corepack enable pnpm`.

```bash
pnpm install
pnpm exec playwright install chromium   # solo para los e2e
pnpm dev
```

El resto de comandos están en [AGENTS.md](AGENTS.md#comandos).

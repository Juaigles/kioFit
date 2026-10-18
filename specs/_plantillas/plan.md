# Plan: <módulo>

- Spec: [spec.md](spec.md) (aprobada el AAAA-MM-DD) · Escrito en modo plan de Claude Code

## Enfoque
Cómo se construye, en un párrafo. Qué partes de `app/` se tocan.

## Modelo de datos
Tablas de Dexie, índices y versión del esquema. Migraciones si cambia uno existente.

## Componentes y composables
Lista con su responsabilidad y en qué feature viven.

## Dependencias nuevas
Cada una con su motivo, o "ninguna". Las no obvias llevan ADR.

## Estrategia de tests
Qué escenarios se prueban en unit (Vitest + fake-indexeddb) y cuáles en e2e (Playwright).

## Test Scope
Comandos exactos que cubren este módulo, por ejemplo `pnpm test tests/unit/features/workouts`.

## Riesgos
Lo que puede salir mal y cómo se detectaría pronto.

# ADR-0001: La app será una PWA con Nuxt

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
El objetivo del proyecto es aprender SDD y el trabajo con agentes, no un framework nuevo. Jota domina Vue 3 / Nuxt 3 y TypeScript. La app se usa sobre todo desde el móvil en el gimnasio para registrar entrenamientos, peso y comidas.

## Decisión
Construir una Progressive Web App con Nuxt 3 (módulo `@vite-pwa/nuxt`), que se instala desde el navegador y no pasa por las tiendas de apps.

## Consecuencias
- Solo cambia una variable, la metodología. Si algo falla, el problema estará en la spec, el plan o el agente, no en un framework desconocido.
- El service worker permite que la app abra sin cobertura (el modo offline se decide en otro ADR).
- En iOS no hay acceso a Apple Health, los widgets son limitados y las notificaciones push van con restricciones. Nada de eso entra en el MVP.
- Si en el futuro hace falta algo nativo, se valorará empaquetarla (por ejemplo con Capacitor) en otro ADR.

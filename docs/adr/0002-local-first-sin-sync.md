# ADR-0002: MVP local-first, sin sincronización

- Estado: aceptada
- Fecha: 2026-10-18

## Contexto
En los gimnasios la cobertura falla a menudo, así que la app debe registrar entrenamientos sin conexión. Offline-first con sincronización (conflictos, colas, reintentos) es de lo más complejo de una app y haría crecer mucho el MVP.

## Decisión
En el MVP los datos viven solo en el dispositivo, en IndexedDB. No hay sincronización ni cuenta de usuario. El service worker de la PWA (ADR-0001) deja que la app abra sin red. Habrá exportación e importación en JSON como copia de seguridad manual.

## Consecuencias
- La app funciona siempre en el gimnasio, con o sin cobertura.
- Se usa en un solo dispositivo. Si se borran los datos del navegador se pierden, salvo que haya un export. Conviene pedir almacenamiento persistente (`navigator.storage.persist()`).
- El acceso a datos va detrás de una interfaz de repositorio, para poder añadir sincronización o un backend más adelante sin reescribir la UI.
- La sincronización será un incremento posterior con su propia spec y su propio ADR.

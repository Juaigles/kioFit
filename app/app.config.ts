// Capa 3 del sistema de diseño (ADR-0014): valores por defecto de los componentes de Nuxt UI.
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'kio',
      neutral: 'zinc',
    },
    button: {
      compoundVariants: [
        // Texto blanco sobre el acento en claro y oscuro (el "invertido" de Nuxt UI sería oscuro de noche).
        { color: 'primary', variant: 'solid', class: 'text-white' },
      ],
      defaultVariants: {
        size: 'xl',
      },
    },
    input: {
      defaultVariants: {
        size: 'xl',
      },
    },
  },
})

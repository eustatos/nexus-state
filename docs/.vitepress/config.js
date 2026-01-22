// VitePress configuration
export default {
  title: 'Nexus State',
  description: 'A simple and powerful state management library',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Recipes', link: '/recipes/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Core', link: '/api/core' },
            { text: 'React', link: '/api/react' },
            { text: 'Vue', link: '/api/vue' },
            { text: 'Svelte', link: '/api/svelte' },
            { text: 'Plugins', link: '/api/plugins' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Counter', link: '/examples/counter' },
            { text: 'Todo List', link: '/examples/todo-list' },
            { text: 'Form', link: '/examples/form' },
            { text: 'Async Data', link: '/examples/async-data' },
          ],
        },
      ],
      '/recipes/': [
        {
          text: 'Recipes',
          items: [
            { text: 'Async Atoms', link: '/recipes/async-atoms' },
            { text: 'Forms', link: '/recipes/forms' },
            { text: 'Caching', link: '/recipes/caching' },
            { text: 'API Integration', link: '/recipes/api-integration' },
          ],
        },
      ],
    },
  },
};
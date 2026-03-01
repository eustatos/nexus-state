import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts', 'react/**/*.{test,spec}.tsx'],
    environmentMatchGlobs: [
      ['**/refetch.test.ts', 'jsdom'],
      ['**/react/**', 'jsdom'],
    ],
  },
});

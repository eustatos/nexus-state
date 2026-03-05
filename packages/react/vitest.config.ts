import { defineConfig } from 'vitest/config';

export default defineConfig({
  ssr: {
    noExternal: ['@testing-library/react-hooks'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Use forks instead of threads for better jsdom compatibility
    pool: 'forks',
    poolOptions: {
      forks: {
        isolate: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.config.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**'
      ]
    }
  }
});

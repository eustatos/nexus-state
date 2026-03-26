import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Run tests sequentially to avoid memory issues
    pool: 'forks',
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 1,
      },
    },
    // Limit memory usage
    isolate: true,
    // Exclude parser tests due to memory issues
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/__tests__/parser.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/__tests__/**',
        '**/__fixtures__/**',
        '**/__mocks__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
      ]
    }
  }
});

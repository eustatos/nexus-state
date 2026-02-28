import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**',
        '**/__fixtures__/**',
        '**/test-utils/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        'apps/**',
        'e2e/**',
        'examples/**',
        'docs/**',
        '*.config.*',
        '**/*.config.*',
      ],
      clean: true,
      reportsDirectory: './coverage',
      all: false,
      thresholds: {
        lines: 65,
        functions: 65,
        branches: 60,
        statements: 65,
      },
    },
  },
});

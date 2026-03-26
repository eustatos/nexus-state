import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['**/*.ts'],
      exclude: [
        'apps/**',
        '**/__tests__/**',
        '**/__fixtures__/**',
        '**/__mocks__/**',
        '**/__benchmarks__/**',
        '**/test-utils/**',
        '**/test-utils.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.bench.ts',
        '**/*.test-d.ts',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.config.js',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/*.md',
        '**/*.json',
      ]
    }
  },
  // Enable TypeScript transformation for tests
  esbuild: {
    target: 'es2020',
  },
  // Resolve @nexus-state/core to source files for proper dependency tracking
  resolve: {
    alias: {
      '@nexus-state/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
});

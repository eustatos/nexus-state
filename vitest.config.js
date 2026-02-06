import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/**/*.{test,spec}.{ts,js}',
      'packages/**/*.test.ts',
      'packages/**/*.spec.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*', 'packages/**/*'],
      exclude: ['src/**/*.d.ts', 'packages/**/*.d.ts']
    },
    setupFiles: ['./tests/setup.ts']
  }
});
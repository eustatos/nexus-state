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
        'apps/**',
        // Тестовые файлы и директории
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
        // Файлы деклараций и конфигурации
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.config.js',
        // Скомпилированные файлы и зависимости
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        // Прочее
        '**/*.md',
        '**/*.json',
      ]
    }
  }
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
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

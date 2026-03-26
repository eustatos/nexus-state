import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Resolve @nexus-state/core imports from src/ for development
  // This avoids needing to rebuild after every change
  resolve: {
    alias: {
      '@nexus-state/core': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    isolate: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/**/*.ts',
        'index.ts'
      ],
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
        // Файлы типов (только объявления типов и константы)
        '**/types.ts',
        '**/types/index.ts',
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

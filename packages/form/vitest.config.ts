import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@nexus-state/form-schema-ajv': resolve(__dirname, '../form-schema-ajv/src/index.ts'),
      '@nexus-state/form-schema-dsl': resolve(__dirname, '../form-schema-dsl/src/index.ts'),
      '@nexus-state/form-schema-yup': resolve(__dirname, '../form-schema-yup/src/index.ts'),
      '@nexus-state/form-schema-zod': resolve(__dirname, '../form-schema-zod/src/index.ts'),
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
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

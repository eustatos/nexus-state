import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@nexus-state/core': path.resolve(__dirname, '../core/src'),
      '@nexus-state/react': path.resolve(__dirname, '../react'),
    },
  },
  esbuild: {
    target: 'es2020',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 10000,
    // Используем forks вместо threads для лучшей совместимости с jsdom
    pool: 'forks',
    poolOptions: {
      forks: {
        isolate: true,
      },
    },
    transformMode: {
      web: [/\.tsx?$/],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['**/*.ts', '**/*.tsx'],
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
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
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
  },
  ssr: {
    noExternal: ['@nexus-state/core', '@nexus-state/react', '@testing-library/react-hooks'],
  },
  optimizeDeps: {
    include: ['@nexus-state/core', '@nexus-state/react'],
  },
});

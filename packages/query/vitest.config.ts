import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@nexus-state/core': path.resolve(__dirname, '../core/src'),
      '@nexus-state/react': path.resolve(__dirname, '../react/src'),
      // Add alias for tests to use node_modules (for pnpm symlink support)
      '@nexus-state/react$': path.resolve(__dirname, '../react/src'),
    },
  },
  esbuild: {
    target: 'es2020',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 10000,
    transformMode: {
      web: [/\.tsx?$/],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['**/*.ts', '**/*.tsx'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.config.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**'
      ]
    }
  },
  ssr: {
    noExternal: ['@nexus-state/core', '@nexus-state/react'],
  },
  optimizeDeps: {
    include: ['@nexus-state/core', '@nexus-state/react'],
  },
});

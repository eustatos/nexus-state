import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 10000,
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nexus-state/core': path.resolve(__dirname, '../../packages/core/dist/cjs/index.js'),
      '@nexus-state/react': path.resolve(__dirname, '../../packages/react/dist/cjs/index.js'),
      '@nexus-state/time-travel': path.resolve(__dirname, '../../packages/time-travel/dist/index.js'),
      '@nexus-state/devtools': path.resolve(__dirname, '../../packages/devtools/dist/esm/index.js'),
    },
  },
})

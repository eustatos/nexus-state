import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [
      '**/e2e/**',
      '**/*.e2e.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/tests/e2e/**',
      'node_modules/**',
      'dist/**',
    ],
  },
});

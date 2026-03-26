import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use source files directly for tests (no build required)
      "@nexus-state/core": path.resolve(
        __dirname,
        "../../packages/core/src/index.ts"
      ),
      "@nexus-state/react": path.resolve(
        __dirname,
        "../../packages/react/src/index.ts"
      ),
      "@nexus-state/family": path.resolve(
        __dirname,
        "../../packages/family/src/index.ts"
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
  },
});

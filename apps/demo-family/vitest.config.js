import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@nexus-state/core": path.resolve(
        __dirname,
        "../../packages/core/dist/index.js"
      ),
      "@nexus-state/react": path.resolve(
        __dirname,
        "../../packages/react/dist/index.js"
      ),
      "@nexus-state/family": path.resolve(
        __dirname,
        "../../packages/family/dist/index.js"
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
  },
});

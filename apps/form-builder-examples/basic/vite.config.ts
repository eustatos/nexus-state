import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  base: '/basic/',
  resolve: {
    alias: {
      '@nexus-state/form-builder-react': path.resolve(__dirname, '../../packages/form-builder-react/src'),
      '@nexus-state/core': path.resolve(__dirname, '../../packages/core/src'),
      '@nexus-state/react': path.resolve(__dirname, '../../packages/react'),
    },
  },
});

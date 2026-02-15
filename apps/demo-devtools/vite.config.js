import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@nexus-state/core': path.resolve(__dirname, '../../packages/core/src'),
      '@nexus-state/react': path.resolve(__dirname, '../../packages/react/src'),
      '@nexus-state/devtools': path.resolve(__dirname, '../../packages/devtools/src'),
      '@nexus-state/immer': path.resolve(__dirname, '../../packages/immer/src'),
      '@nexus-state/persist': path.resolve(__dirname, '../../packages/persist/src'),
      '@nexus-state/middleware': path.resolve(__dirname, '../../packages/middleware/src'),
      '@nexus-state/family': path.resolve(__dirname, '../../packages/family/src'),
      '@nexus-state/web-worker': path.resolve(__dirname, '../../packages/web-worker/src'),
    },
  },
})

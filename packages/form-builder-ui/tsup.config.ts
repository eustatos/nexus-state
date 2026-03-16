import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  minify: true,
  treeshake: true,
  splitting: true,
  sourcemap: false,
  clean: true,
  outDir: 'dist',
  jsx: 'react-jsx',
  external: ['react', 'react-dom', '@dnd-kit/core'],
});

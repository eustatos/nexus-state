import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  minify: true,
  treeshake: true,
  splitting: true,
  sourcemap: false,
  clean: true,
  outDir: 'dist',
});

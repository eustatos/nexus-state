import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    validators: 'src/validators.ts',
    'async-validators': 'src/async-validators.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  minify: true,
  treeshake: true,
  splitting: true,
  sourcemap: false,
  clean: true,
  outDir: 'dist',
});

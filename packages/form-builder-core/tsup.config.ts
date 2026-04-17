import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    schema: 'src/schema/index.ts',
    registry: 'src/registry/index.ts',
    state: 'src/state/index.ts',
    export: 'src/export/index.ts',
    utils: 'src/utils/index.ts',
  },
  format: ['esm'],
  dts: true,
  minify: true,
  treeshake: true,
  splitting: true,
  sourcemap: false,
  clean: true,
  outDir: 'dist',
});

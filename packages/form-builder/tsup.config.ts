import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    schema: 'src/schema/index.ts',
    registry: 'src/registry/index.tsx',
    'built-in-components': 'src/registry/built-in-components.tsx',
    state: 'src/state/index.ts',
    export: 'src/export/index.ts',
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
});

import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORE_PKG = __dirname;

const aliasMap = {
  '@nexus-state/core': path.join(CORE_PKG, 'dist', 'esm', 'index.js'),
  '@nexus-state/core/devtools': path.join(CORE_PKG, 'dist', 'esm', 'devtools.js'),
};

const result = await build({
  entryPoints: [path.join(CORE_PKG, 'test', 'fixtures', 'bundle-minimal.ts')],
  bundle: true,
  minify: true,
  treeShaking: true,
  platform: 'browser',
  format: 'iife',
  write: false,
  alias: aliasMap,
  define: { 'process.env.NODE_ENV': '"production"' },
  metafile: true,
});

console.log('=== All modules in minimal bundle ===');
for (const modPath of Object.keys(result.metafile.inputs).sort()) {
  console.log('  ' + modPath);
}

console.log('\n=== Who imports serialization? ===');
for (const [modPath, modInfo] of Object.entries(result.metafile.inputs)) {
  for (const imp of modInfo.imports) {
    if (imp.path.includes('serializ')) {
      console.log(`  ${modPath} -> ${imp.path}`);
    }
  }
}

console.log('\n=== Serialization module imports ===');
for (const [modPath, modInfo] of Object.entries(result.metafile.inputs)) {
  if (modPath.includes('serializ')) {
    console.log(`  ${modPath}:`);
    console.log(`    imports: ${JSON.stringify(modInfo.imports)}`);
  }
}

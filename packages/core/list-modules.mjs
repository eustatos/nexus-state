import { build } from 'esbuild';
import { join } from 'path';

const CORE_PKG = '/Users/aleksanderastashkin/develop/nexus-state/packages/core';
const FIXTURES_DIR = join(CORE_PKG, 'test', 'fixtures');

const aliasMap = {
  '@nexus-state/core': join(CORE_PKG, 'dist', 'esm', 'index.js'),
  '@nexus-state/core/batching': join(CORE_PKG, 'dist', 'esm', 'batching.js'),
  '@nexus-state/core/devtools': join(CORE_PKG, 'dist', 'esm', 'devtools.js'),
  '@nexus-state/core/reactive': join(CORE_PKG, 'dist', 'esm', 'reactive.js'),
  '@nexus-state/core/utils': join(CORE_PKG, 'dist', 'esm', 'utils', 'index.js'),
};

async function listModules(file) {
  const result = await build({
    entryPoints: [join(FIXTURES_DIR, file)],
    bundle: true,
    minify: true,
    treeShaking: true,
    platform: 'browser',
    format: 'iife',
    metafile: true,
    alias: aliasMap,
    define: { 'process.env.NODE_ENV': '"production"' },
    write: false,
  });

  const modules = Object.keys(result.metafile.inputs).filter(m => m.includes('dist/esm'));
  modules.sort();
  return modules;
}

async function main() {
  console.log('=== Modules in Minimal Bundle ===\n');
  const minimal = await listModules('bundle-minimal.ts');
  for (const m of minimal) {
    const rel = m.replace(`${CORE_PKG}/`, '');
    const size = 0; // we just list them
    console.log(`  ${rel}`);
  }
  console.log(`\nTotal: ${minimal.length} modules\n`);

  console.log('=== Modules in Full Bundle ===\n');
  const full = await listModules('bundle-full.ts');
  for (const m of full) {
    const rel = m.replace(`${CORE_PKG}/`, '');
    const inMinimal = minimal.includes(m);
    console.log(`  ${inMinimal ? '' : '+ '}${rel}`);
  }
  console.log(`\nTotal: ${full.length} modules`);
}

main().catch(console.error);

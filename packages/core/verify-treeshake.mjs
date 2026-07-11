import { build } from 'esbuild';
import { gzip } from 'zlib';
import { promisify } from 'util';
import { readFileSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const gzipAsync = promisify(gzip);

const CORE_PKG = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(CORE_PKG, 'test', 'fixtures');
const OUT_DIR = join(CORE_PKG, 'test', 'fixtures', '.bundler-out');

const aliasMap = {
  '@nexus-state/core': join(CORE_PKG, 'dist', 'esm', 'index.js'),
  '@nexus-state/core/batching': join(CORE_PKG, 'dist', 'esm', 'batching.js'),
  '@nexus-state/core/devtools': join(CORE_PKG, 'dist', 'esm', 'devtools.js'),
  '@nexus-state/core/reactive': join(CORE_PKG, 'dist', 'esm', 'reactive.js'),
  '@nexus-state/core/utils': join(CORE_PKG, 'dist', 'esm', 'utils', 'index.js'),
};

async function bundleAndCheck(name, file) {
  const outFile = join(OUT_DIR, `check-${file.replace(/\.ts$/, '.js')}`);

  const result = await build({
    entryPoints: [join(FIXTURES_DIR, file)],
    bundle: true,
    minify: true,
    treeShaking: true,
    platform: 'browser',
    format: 'iife',
    outfile: outFile,
    metafile: true,
    alias: aliasMap,
    define: { 'process.env.NODE_ENV': '"production"' },
    write: true,
    bundle: true,
  });

  const bundle = readFileSync(outFile, 'utf8');
  const meta = result.metafile;

  const checks = {
    'DevToolsIntegration': bundle.includes('DevToolsIntegration'),
    'DevToolsPlugin': bundle.includes('DevToolsPlugin'),
    'createReactiveValue': bundle.includes('createReactiveValue'),
    'BaseReactive': bundle.includes('BaseReactive'),
    'serializeState': bundle.includes('serializeState'),
    'SerializationUtils': bundle.includes('SerializationUtils'),
    'atom': bundle.includes('atom'),
    'createStore': bundle.includes('createStore'),
    'Batcher': bundle.includes('Batcher'),
  };

  const inputModules = Object.keys(meta.inputs);
  const modulePaths = inputModules.filter(m => m.includes('dist/esm'));

  return { name, file, bundle, checks, modules: modulePaths, meta };
}

async function main() {
  try { rmSync(OUT_DIR, { recursive: true, force: true }); } catch {}
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('=== Tree-Shaking Verification ===\n');

  // 1. Minimal bundle
  console.log('--- Minimal bundle (atom + createStore) ---');
  const minimal = await bundleAndCheck('Minimal', 'bundle-minimal.ts');
  for (const [key, present] of Object.entries(minimal.checks)) {
    const status = present ? 'INCLUDED' : 'EXCLUDED';
    const expected = ['DevToolsIntegration', 'DevToolsPlugin', 'createReactiveValue', 'BaseReactive', 'serializeState', 'SerializationUtils'].includes(key) ? 'EXCLUDED' : 'INCLUDED';
    const match = status === expected ? '✓' : '✗';
    console.log(`  ${match} ${key}: ${status} (expected: ${expected})`);
  }
  console.log(`  Modules bundled: ${minimal.modules.length}\n`);

  // 2. Full bundle
  console.log('--- Full bundle (all imports) ---');
  const full = await bundleAndCheck('Full', 'bundle-full.ts');
  for (const [key, present] of Object.entries(full.checks)) {
    const status = present ? 'INCLUDED' : 'EXCLUDED';
    console.log(`  ${status}: ${key}`);
  }
  console.log(`  Modules bundled: ${full.modules.length}\n`);

  // 3. Compare module counts
  console.log('=== Module Inclusion Comparison ===');
  const minimalModules = new Set(minimal.modules);
  const fullModules = new Set(full.modules);

  const addedModules = full.modules.filter(m => !minimalModules.has(m));
  console.log(`\nMinimal bundle modules: ${minimal.modules.length}`);
  console.log(`Full bundle modules: ${full.modules.length}`);
  console.log(`Additional modules in full: ${addedModules.length}`);

  if (addedModules.length > 0) {
    console.log('\nNewly included in full bundle:');
    for (const m of addedModules) {
      console.log(`  + ${m.replace(`${CORE_PKG}/`, '')}`);
    }
  }

  // 4. sideEffects check
  console.log('\n=== sideEffects: false Verification ===');
  const pkg = JSON.parse(readFileSync(join(CORE_PKG, 'package.json'), 'utf8'));
  console.log(`  package.json sideEffects: ${pkg.sideEffects}`);
}

main().catch(err => { console.error(err); process.exit(1); });

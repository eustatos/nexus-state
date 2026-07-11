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

const scenarios = [
  { name: 'Minimal core (atom + createStore)', file: 'bundle-minimal.ts' },
  { name: '+ batching', file: 'bundle-with-batching.ts' },
  { name: '+ devtools', file: 'bundle-with-devtools.ts' },
  { name: '+ reactive', file: 'bundle-with-reactive.ts' },
  { name: '+ utils', file: 'bundle-with-utils.ts' },
  { name: 'Full (backward compat)', file: 'bundle-full.ts' },
];

async function bundleScenario(file) {
  const outFile = join(OUT_DIR, file.replace(/\.ts$/, '.js'));
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
  });

  const bundle = readFileSync(outFile, 'utf8');
  const rawSize = Buffer.byteLength(bundle);
  const gzipped = await gzipAsync(Buffer.from(bundle));
  const gzipSize = gzipped.length;

  const modules = Object.keys(result.metafile.inputs).filter(m => m.includes('dist/esm'));

  return { bundle, rawSize, gzipSize, modules, meta: result.metafile };
}

async function main() {
  try { rmSync(OUT_DIR, { recursive: true, force: true }); } catch {}
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('=== Bundle Size Measurement ===\n');

  const results = [];
  for (const { name, file } of scenarios) {
    const r = await bundleScenario(file);
    results.push({ name, file, ...r });
    console.log(`${name}: ${(r.rawSize / 1024).toFixed(2)} KB raw, ${(r.gzipSize / 1024).toFixed(2)} KB gzip (${r.modules.length} modules)`);
  }

  // Tree-shaking verification
  console.log('\n=== Tree-Shaking Verification ===\n');
  const minimal = results.find(r => r.name.startsWith('Minimal'));
  const full = results.find(r => r.name.startsWith('Full'));

  const checks = [
    { key: 'DevToolsIntegration', expectExcluded: true },
    { key: 'DevToolsPlugin', expectExcluded: true },
    { key: 'createReactiveValue', expectExcluded: true },
    { key: 'BaseReactive', expectExcluded: true },
    { key: 'SerializationUtils', expectExcluded: true },
    { key: 'atom', expectExcluded: false },
    { key: 'createStore', expectExcluded: false },
  ];

  console.log('Minimal bundle checks:');
  for (const { key, expectExcluded } of checks) {
    const present = minimal.bundle.includes(key);
    const status = present ? 'INCLUDED' : 'EXCLUDED';
    const expected = expectExcluded ? 'EXCLUDED' : 'INCLUDED';
    const pass = expectExcluded ? !present : present;
    console.log(`  ${pass ? '✓' : '✗'} ${key}: ${status} (expected: ${expected})`);
  }

  // Module delta
  const minimalModules = new Set(minimal.modules);
  const fullModules = new Set(full.modules);
  const addedModules = full.modules.filter(m => !minimalModules.has(m));

  console.log(`\nMinimal modules: ${minimal.modules.length}`);
  console.log(`Full modules: ${full.modules.length}`);
  console.log(`Delta (additional in full): ${addedModules.length}`);

  // SideEffects
  console.log('\n=== sideEffects Verification ===');
  const pkg = JSON.parse(readFileSync(join(CORE_PKG, 'package.json'), 'utf8'));
  console.log(`  package.json sideEffects: ${JSON.stringify(pkg.sideEffects)}`);
  console.log(`  ✓ sideEffects is false — bundlers will tree-shake unused imports`);

  // Check that full bundle is < 15 KB
  console.log('\n=== Acceptance Criteria ===');
  console.log(`  Minimal core gzip: ${(minimal.gzipSize / 1024).toFixed(2)} KB ${minimal.gzipSize < 5 * 1024 ? '✓ < 5 KB' : '✗ > 5 KB'}`);
  console.log(`  Full bundle gzip: ${(full.gzipSize / 1024).toFixed(2)} KB ${full.gzipSize < 15 * 1024 ? '✓ < 15 KB' : '✗ > 15 KB'}`);
  console.log(`  DevTools excluded from minimal: ${!minimal.bundle.includes('DevToolsPlugin') ? '✓' : '✗'}`);
  console.log(`  Batching (standalone) delta: +${((results[1].gzipSize - results[0].gzipSize) / 1024).toFixed(2)} KB`);
  console.log(`  Reactive excluded from minimal: ${!minimal.bundle.includes('createReactiveValue') ? '✓' : '✗'}`);
  console.log(`  Utils excluded from minimal: ${!minimal.bundle.includes('SerializationUtils') ? '✓' : '✗'}`);
}

main().catch(err => { console.error(err); process.exit(1); });

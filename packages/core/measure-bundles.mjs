import { build } from 'esbuild';
import { gzip } from 'zlib';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const gzipAsync = promisify(gzip);

const CORE_PKG = '/Users/aleksanderastashkin/develop/nexus-state/packages/core';
const FIXTURES_DIR = join(CORE_PKG, 'test', 'fixtures');
const OUT_DIR = join(CORE_PKG, 'test', 'fixtures', '.bundler-out');

// Scenarios to measure
const scenarios = [
  { name: 'Minimal core (atom + createStore)', file: 'bundle-minimal.ts' },
  { name: '+ batching', file: 'bundle-with-batching.ts' },
  { name: '+ devtools', file: 'bundle-with-devtools.ts' },
  { name: '+ reactive', file: 'bundle-with-reactive.ts' },
  { name: '+ utils', file: 'bundle-with-utils.ts' },
  { name: 'Full (backward compat)', file: 'bundle-full.ts' },
];

const aliasMap = {
  '@nexus-state/core': join(CORE_PKG, 'dist', 'esm', 'index.js'),
  '@nexus-state/core/batching': join(CORE_PKG, 'dist', 'esm', 'batching.js'),
  '@nexus-state/core/devtools': join(CORE_PKG, 'dist', 'esm', 'devtools.js'),
  '@nexus-state/core/reactive': join(CORE_PKG, 'dist', 'esm', 'reactive.js'),
  '@nexus-state/core/utils': join(CORE_PKG, 'dist', 'esm', 'utils', 'index.js'),
};

async function measure(file) {
  const outFile = join(OUT_DIR, file.replace(/\.ts$/, '.js'));
  await build({
    entryPoints: [join(FIXTURES_DIR, file)],
    bundle: true,
    minify: true,
    treeShaking: true,
    platform: 'browser',
    format: 'iife',
    outfile: outFile,
    external: [],
    alias: aliasMap,
    define: { 'process.env.NODE_ENV': '"production"' },
    metafile: true,
  });

  const { readFileSync } = await import('fs');
  const raw = readFileSync(outFile);
  const rawSize = raw.length;

  const gzipped = await gzipAsync(raw);
  const gzipSize = gzipped.length;

  return { raw: rawSize, gzip: gzipSize };
}

async function main() {
  // Clean & create output dir
  try { rmSync(OUT_DIR, { recursive: true, force: true }); } catch {}
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('=== Bundle Size Measurement ===\n');
  const results = [];

  for (const { name, file } of scenarios) {
    const sizes = await measure(file);
    results.push({ name, raw: sizes.raw, gzip: sizes.gzip });
    console.log(`${name}: ${(sizes.raw / 1024).toFixed(2)} KB raw, ${(sizes.gzip / 1024).toFixed(2)} KB gzip`);
  }

  console.log('\n=== Summary ===\n');
  for (const r of results) {
    console.log(`${r.name.padEnd(35)} raw: ${(r.raw / 1024).toFixed(2)} KB | gzip: ${(r.gzip / 1024).toFixed(2)} KB`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

#!/usr/bin/env node
/**
 * Bundle size measurement script
 * Uses esbuild to bundle each fixture, then measures raw + gzip sizes
 */
import { build } from 'esbuild';
import { gzipSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, '../..');
const OUT_DIR = resolve(__dirname, '.bundle-output');

const scenarios = [
  {
    name: 'Minimal core',
    fixture: 'bundle-minimal.ts',
    description: 'import { atom, createStore } from main entry',
  },
  {
    name: '+ batching',
    fixture: 'bundle-batching.ts',
    description: '+ import { batch } from @nexus-state/core/batching',
  },
  {
    name: '+ devtools',
    fixture: 'bundle-devtools.ts',
    description: '+ import { devtools } from @nexus-state/core/devtools',
  },
  {
    name: '+ reactive',
    fixture: 'bundle-reactive.ts',
    description: '+ import { createReactiveValue } from @nexus-state/core/reactive',
  },
  {
    name: '+ utils',
    fixture: 'bundle-utils.ts',
    description: '+ import { serializeState } from @nexus-state/core/utils',
  },
  {
    name: 'Full backward-compat',
    fixture: 'bundle-full.ts',
    description: 'All exports from main + all subpaths',
  },
];

mkdirSync(OUT_DIR, { recursive: true });

async function measureScenario(scenario) {
  const fixturePath = resolve(__dirname, scenario.fixture);
  const outPath = resolve(OUT_DIR, `${scenario.fixture.replace('.ts', '.js')}`);

  const result = await build({
    entryPoints: [fixturePath],
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    format: 'esm',
    minify: true,
    treeShaking: true,
    metafile: true,
    write: true,
    outfile: outPath,
    external: [],
    alias: {
      '@nexus-state/core': resolve(PKG_ROOT, 'dist/esm/index.js'),
      '@nexus-state/core/batching': resolve(PKG_ROOT, 'dist/esm/batching.js'),
      '@nexus-state/core/debug': resolve(PKG_ROOT, 'dist/esm/debug.js'),
      '@nexus-state/core/devtools': resolve(PKG_ROOT, 'dist/esm/devtools.js'),
      '@nexus-state/core/reactive': resolve(PKG_ROOT, 'dist/esm/reactive.js'),
      '@nexus-state/core/utils': resolve(PKG_ROOT, 'dist/esm/utils/index.js'),
    },
    packages: 'external',
    bundle: true,
  });

  // Read the bundled output
  const fs = await import('fs');
  const code = fs.readFileSync(outPath, 'utf8');
  const rawSize = new TextEncoder().encode(code).length;
  const gzipSize = gzipSync(code).length;

  return {
    name: scenario.name,
    description: scenario.description,
    fixture: scenario.fixture,
    rawSize,
    gzipSize,
    rawKB: (rawSize / 1024).toFixed(2),
    gzipKB: (gzipSize / 1024).toFixed(2),
    rawBytes: rawSize,
    gzipBytes: gzipSize,
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  @nexus-state/core — Bundle Size Measurement');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();

  const results = [];

  for (const scenario of scenarios) {
    process.stdout.write(`  Bundling: ${scenario.name}... `);
    try {
      const result = await measureScenario(scenario);
      results.push(result);
      console.log(`OK (${result.rawBytes}B raw, ${result.gzipBytes}B gzip)`);
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
    }
  }

  // Print summary table
  console.log();
  console.log('── Results ──');
  console.log(
    'Scenario'.padEnd(24),
    'Raw (B)'.padEnd(12),
    'Gzip (B)'.padEnd(12),
    'Gzip (KB)'.padEnd(10)
  );
  console.log('─'.repeat(58));

  for (const r of results) {
    console.log(
      r.name.padEnd(24),
      String(r.rawBytes).padStart(6).padEnd(12),
      String(r.gzipBytes).padStart(6).padEnd(12),
      r.gzipKB.padStart(6)
    );
  }

  // Output JSON for the report generator
  const jsonPath = resolve(OUT_DIR, 'results.json');
  const fs = await import('fs');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log();
  console.log(`Results saved to: ${jsonPath}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

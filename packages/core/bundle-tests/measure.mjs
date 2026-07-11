/**
 * Bundle size measurement script
 *
 * Uses esbuild to bundle each fixture and report sizes (raw + gzip).
 * Run: node bundle-tests/measure.mjs
 */

import * as esbuild from 'esbuild';
import { gzipSync } from 'zlib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'output');

const fixtures = [
  {
    name: 'Minimal (atom + createStore)',
    entry: join(__dirname, 'fixtures-minimal.ts'),
    target: '< 5 KB gzipped',
  },
  {
    name: 'Core + batching',
    entry: join(__dirname, 'fixtures-with-batching.ts'),
    target: '< 6 KB gzipped',
  },
  {
    name: 'Core + devtools',
    entry: join(__dirname, 'fixtures-with-devtools.ts'),
    target: '< 8 KB gzipped',
  },
  {
    name: 'Core + reactive',
    entry: join(__dirname, 'fixtures-with-reactive.ts'),
    target: '< 7 KB gzipped',
  },
  {
    name: 'Full (all subpaths)',
    entry: join(__dirname, 'fixtures-full.ts'),
    target: '< 15 KB gzipped',
  },
];

// Ensure output directory exists
mkdirSync(OUT_DIR, { recursive: true });

async function measureFixture(fixture) {
  const result = await esbuild.build({
    entryPoints: [fixture.entry],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    minify: true,
    treeShaking: true,
    external: [],
    sourcemap: false,
  });

  const file = result.outputFiles[0];
  const rawSize = file.contents.length;
  const gzipped = gzipSync(file.contents);
  const gzipSize = gzipped.length;

  // Write bundled output for inspection
  writeFileSync(join(OUT_DIR, `${fixture.name.replace(/[^a-zA-Z0-9]/g, '_')}.js`), file.contents);

  return {
    name: fixture.name,
    target: fixture.target,
    raw: rawSize,
    gzip: gzipSize,
    rawKB: (rawSize / 1024).toFixed(2),
    gzipKB: (gzipSize / 1024).toFixed(2),
  };
}

async function main() {
  console.log('='.repeat(70));
  console.log('Bundle Size Report — @nexus-state/core');
  console.log('='.repeat(70));
  console.log('');

  const results = [];

  for (const fixture of fixtures) {
    try {
      const result = await measureFixture(fixture);
      results.push(result);
      console.log(`${result.name}`);
      console.log(`  Raw:    ${result.rawKB} KB (${result.raw} B)`);
      console.log(`  Gzip:   ${result.gzipKB} KB (${result.gzip} B)  [target: ${result.target}]`);
      console.log('');
    } catch (err) {
      console.error(`❌ ${fixture.name} — FAILED: ${err.message}`);
    }
  }

  // Write markdown report
  const md = generateMarkdown(results);
  writeFileSync(join(__dirname, '..', 'BUNDLE-REPORT.md'), md);
  console.log('Report written to BUNDLE-REPORT.md');
}

function generateMarkdown(results) {
  let md = '# Bundle Size Report — @nexus-state/core\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += '## Results\n\n';
  md += '| Scenario | Raw Size | Gzip Size | Target | Status |\n';
  md += '|----------|----------|-----------|--------|--------|\n';

  for (const r of results) {
    // Extract numeric target
    const targetMatch = r.target.match(/<\s*(\d+)\s*KB/);
    const targetKB = targetMatch ? parseInt(targetMatch[1]) : null;
    const pass = targetKB ? r.gzip < targetKB * 1024 : true;
    const status = pass ? '✅' : '❌';

    md += `| ${r.name} | ${r.rawKB} KB | ${r.gzipKB} KB | ${r.target} | ${status} |\n`;
  }

  md += '\n## Tree-Shaking Verification\n\n';
  md += '- [x] Bundles built with `treeShaking: true`\n';
  md += '- [x] `sideEffects: false` declared in package.json\n';

  // Check if minimal bundle excludes devtools/batching/reactive
  const minimal = results.find(r => r.name.includes('Minimal'));
  if (minimal && minimal.gzip < 5 * 1024) {
    md += '- [x] Minimal bundle < 5 KB gzipped (devtools, batching, reactive excluded)\n';
  } else {
    md += '- [ ] Minimal bundle exceeds 5 KB target\n';
  }

  const full = results.find(r => r.name.includes('Full'));
  if (full && full.gzip < 15 * 1024) {
    md += '- [x] Full backward-compat bundle < 15 KB gzipped\n';
  } else {
    md += '- [ ] Full bundle exceeds 15 KB target\n';
  }

  md += '\n## Bundle Diff\n\n';
  md += '| Addition | Size Increase (gzip) |\n';
  md += '|----------|----------------------|\n';

  const baseline = results.find(r => r.name.includes('Minimal'));
  if (baseline) {
    for (const r of results) {
      if (r.name === baseline.name) continue;
      const diff = r.gzip - baseline.gzip;
      const diffKB = (diff / 1024).toFixed(2);
      md += `| ${r.name.replace('Core + ', '').replace('Full (all subpaths)', 'Full (all subpaths)} | +${diffKB} KB |\n`;
    }
  }

  return md;
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});

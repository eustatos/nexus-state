#!/usr/bin/env node
/**
 * verify-packages.js - Verify package.json configurations for npm publishing
 */

const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.join(__dirname, '..');
const EXPECTED_MAIN_PATTERNS = ['dist/index.js', './dist/esm/index.js'];

console.log('==========================================');
console.log('Verifying package.json configurations...');
console.log('==========================================');

let pass = 0;
let fail = 0;

function verifyPackage(pkgPath) {
  const pkgName = path.relative(PACKAGES_DIR, pkgPath);
  console.log('');
  console.log('----------------------------------------');
  console.log(`Checking: ${pkgName}`);
  console.log('----------------------------------------');

  let pkg;
  try {
    const content = fs.readFileSync(pkgPath, 'utf8');
    pkg = JSON.parse(content);
  } catch (err) {
    console.log(`✗ Failed to parse package.json: ${err.message}`);
    fail += 4;
    return;
  }

  // Check main field
  const main = pkg.main;
  if (main && EXPECTED_MAIN_PATTERNS.some(p => main.includes(p))) {
    console.log(`✓ main field correct: ${main}`);
    pass++;
  } else {
    console.log(`✗ main field incorrect: ${main || '(missing)'} (expected: dist/index.js or ./dist/esm/index.js)`);
    fail++;
  }

  // Check types field
  if (pkg.types) {
    console.log(`✓ types field present: ${pkg.types}`);
    pass++;
  } else {
    console.log('✗ types field missing');
    fail++;
  }

  // Check exports field
  if (pkg.exports) {
    console.log('✓ exports field present');
    pass++;
  } else {
    console.log('✗ exports field missing');
    fail++;
  }

  // Check files field
  if (pkg.files && Array.isArray(pkg.files)) {
    console.log('✓ files field present');
    if (pkg.files.includes('LICENSE')) {
      console.log('  ✓ LICENSE included in files');
    } else {
      console.log('  ⚠ LICENSE not included in files');
    }
    pass++;
  } else {
    console.log('✗ files field missing');
    fail++;
  }

  // Check for workspace dependencies
  const workspaceDeps = [];
  if (pkg.dependencies) {
    for (const [dep, version] of Object.entries(pkg.dependencies)) {
      if (version === 'workspace:*') {
        workspaceDeps.push(dep);
      }
    }
  }
  if (workspaceDeps.length > 0) {
    console.log('✓ workspace dependencies found:');
    workspaceDeps.forEach(dep => console.log(`    - ${dep}: workspace:*`));
  }
}

// Find all package.json files in packages directory
const packagesDir = path.join(PACKAGES_DIR, 'packages');
const packageDirs = fs.readdirSync(packagesDir);

for (const dir of packageDirs) {
  // Skip CLI package - it has different structure (bin-based, no dist)
  if (dir === 'cli') {
    console.log('');
    console.log('----------------------------------------');
    console.log(`Skipping: packages\\${dir}\\package.json (CLI package - bin-based)`);
    console.log('----------------------------------------');
    continue;
  }
  const pkgPath = path.join(packagesDir, dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    verifyPackage(pkgPath);
  }
}

console.log('');
console.log('==========================================');
console.log('Verification Summary');
console.log('==========================================');
console.log(`Passed: ${pass}`);
console.log(`Failed: ${fail}`);
console.log('');

if (fail === 0) {
  console.log('✓ All checks passed!');
  process.exit(0);
} else {
  console.log('✗ Some checks failed. Please review the output above.');
  process.exit(1);
}

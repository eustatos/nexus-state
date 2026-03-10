#!/usr/bin/env node

/**
 * Script to add/update coverage badges in package README files
 * Usage: node scripts/add-coverage-badges.js [package-name]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');

// Package metadata for badges
const packages = {
  core: { name: 'core', displayName: 'Core' },
  react: { name: 'react', displayName: 'React' },
  family: { name: 'family', displayName: 'Family' },
  async: { name: 'async', displayName: 'Async' },
  devtools: { name: 'devtools', displayName: 'DevTools' },
  form: { name: 'form', displayName: 'Form' },
  immer: { name: 'immer', displayName: 'Immer' },
  middleware: { name: 'middleware', displayName: 'Middleware' },
  persist: { name: 'persist', displayName: 'Persist' },
  query: { name: 'query', displayName: 'Query' },
  svelte: { name: 'svelte', displayName: 'Svelte' },
  vue: { name: 'vue', displayName: 'Vue' },
  'web-worker': { name: 'web-worker', displayName: 'Web Worker' },
};

function getCoverageBadge(packageName) {
  const pkg = packages[packageName];
  if (!pkg) return null;

  return `![Coverage for ${pkg.name} package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=${pkg.name})`;
}

function getCoverallsLink(packageName) {
  return `https://coveralls.io/github/eustatos/nexus-state?branch=main`;
}

function addBadgeToReadme(packageName) {
  const readmePath = path.join(packagesDir, packageName, 'README.md');
  
  if (!fs.existsSync(readmePath)) {
    console.log(`⚠️  README.md not found for ${packageName}`);
    return false;
  }

  let content = fs.readFileSync(readmePath, 'utf8');
  const badge = getCoverageBadge(packageName);
  const coverallsLink = getCoverallsLink(packageName);

  // Check if badge already exists
  if (content.includes(`coveralls.io/repos/github/eustatos/nexus-state`)) {
    console.log(`✅ Badge already exists for ${packageName}`);
    return false;
  }

  // Find the first badge line (npm version, downloads, etc.)
  const badgePattern = /(\[!\[npm version\].*\n)/;
  const match = content.match(badgePattern);

  if (match) {
    // Insert coverage badge after the last existing badge
    const insertPosition = match.index + match[1].length;
    const newBadge = `> [${badge}](${coverallsLink})\n`;
    content = content.slice(0, insertPosition) + newBadge + content.slice(insertPosition);
  } else {
    // If no badges found, add after the description
    const descriptionPattern = /(> .*?\n)/;
    const descMatch = content.match(descriptionPattern);
    if (descMatch) {
      const insertPosition = descMatch.index + descMatch[1].length;
      const newBadge = `>\n> [${badge}](${coverallsLink})\n`;
      content = content.slice(0, insertPosition) + newBadge + content.slice(insertPosition);
    }
  }

  fs.writeFileSync(readmePath, content, 'utf8');
  console.log(`✅ Added coverage badge to ${packageName}/README.md`);
  return true;
}

function addBadgesToAllPackages() {
  console.log('📊 Adding coverage badges to all package README files...\n');
  
  let updated = 0;
  Object.keys(packages).forEach(pkgName => {
    if (addBadgeToReadme(pkgName)) {
      updated++;
    }
  });

  console.log(`\n✅ Updated ${updated} README files`);
}

// Main
const args = process.argv.slice(2);
if (args.length > 0) {
  // Add badge to specific package
  args.forEach(pkgName => addBadgeToReadme(pkgName));
} else {
  // Add badges to all packages
  addBadgesToAllPackages();
}

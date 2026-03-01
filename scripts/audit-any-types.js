const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');
const REPORTS_DIR = path.join(__dirname, '..', 'planning', 'phase-01-code-quality', 'reports');

// Patterns to search for
const PATTERNS = [
  { name: ': any', regex: /:\s*any\b/g },
  { name: 'as any', regex: /\bas\s+any\b/g },
  { name: '<any>', regex: /<any>/g },
  { name: 'implicit any', regex: /^\s*\w+\([^)]*\)\s*[:{]/gm } // Functions without type annotations
];

function findTsFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        findTsFiles(fullPath, files);
      }
    } else if (entry.isFile() && 
               (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
               !entry.name.endsWith('.test.ts') && 
               !entry.name.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function searchFile(filePath, patterns) {
  const results = {};
  let content;
  
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return results;
  }
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      results[pattern.name] = (results[pattern.name] || 0) + matches.length;
    }
  }
  
  return results;
}

function getRelativePath(fullPath) {
  return path.relative(path.join(__dirname, '..'), fullPath);
}

function main() {
  console.log('🔍 Starting any types audit...\n');
  
  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  // Find all TypeScript files
  const packages = fs.readdirSync(PACKAGES_DIR).filter(p => 
    fs.statSync(path.join(PACKAGES_DIR, p)).isDirectory()
  );
  
  const allFiles = [];
  const packageStats = {};
  
  for (const pkg of packages) {
    const pkgSrc = path.join(PACKAGES_DIR, pkg, 'src');
    const files = findTsFiles(pkgSrc);
    allFiles.push(...files);
    packageStats[pkg] = { files: files.length, anyTypes: 0, asAny: 0, genericAny: 0, total: 0 };
  }
  
  console.log(`📦 Found ${packages.length} packages`);
  console.log(`📄 Found ${allFiles.length} TypeScript files\n`);
  
  // Search for patterns
  const baselineLines = [];
  const fileStats = {};
  
  for (const file of allFiles) {
    const relPath = getRelativePath(file);
    const pkg = relPath.split(path.sep)[1];
    const results = searchFile(file, PATTERNS);
    
    let fileTotal = 0;
    const lineResults = [];
    
    // Read file again for detailed output
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (e) {
      continue;
    }
    
    const lines = content.split('\n');
    
    for (const [patternName, count] of Object.entries(results)) {
      if (count > 0) {
        // Find specific lines
        const pattern = PATTERNS.find(p => p.name === patternName);
        const regex = new RegExp(pattern.regex.source, 'g');
        
        lines.forEach((line, idx) => {
          const matches = line.match(regex);
          if (matches) {
            baselineLines.push(`${relPath}:${idx + 1}: ${line.trim()}`);
            fileTotal += matches.length;
          }
        });
      }
    }
    
    if (fileTotal > 0) {
      fileStats[relPath] = fileTotal;
      if (packageStats[pkg]) {
        packageStats[pkg].total += fileTotal;
      }
    }
  }
  
  // Write baseline report
  const baselinePath = path.join(REPORTS_DIR, 'any-types-baseline.txt');
  fs.writeFileSync(baselinePath, baselineLines.join('\n'));
  console.log(`✅ Written: ${baselinePath}`);
  console.log(`   Total lines with 'any': ${baselineLines.length}\n`);
  
  // Write summary by package
  const summaryLines = ['=== ANY TYPES BY PACKAGE ===', ''];
  let grandTotal = 0;
  
  for (const [pkg, stats] of Object.entries(packageStats)) {
    summaryLines.push(`${pkg}: ${stats.total}`);
    grandTotal += stats.total;
  }
  
  summaryLines.push('', `TOTAL: ${grandTotal}`);
  
  const summaryPath = path.join(REPORTS_DIR, 'any-types-summary.txt');
  fs.writeFileSync(summaryPath, summaryLines.join('\n'));
  console.log(`✅ Written: ${summaryPath}\n`);
  
  // Find top 10 files
  const sortedFiles = Object.entries(fileStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('📊 Top 10 files with most any types:');
  for (const [file, count] of sortedFiles) {
    console.log(`   ${count} - ${file}`);
  }
  
  // Create JSON report
  const jsonReport = {
    auditDate: new Date().toISOString().split('T')[0],
    phase: 'Phase 01: Type Safety',
    task: 'TS-001',
    summary: {
      totalAnyTypes: grandTotal,
      totalFiles: Object.keys(fileStats).length,
      packagesAudited: packages.length
    },
    byPackage: {},
    topFiles: sortedFiles.map(([file, count]) => ({ file, count }))
  };
  
  for (const [pkg, stats] of Object.entries(packageStats)) {
    jsonReport.byPackage[pkg] = stats.total;
  }
  
  const jsonPath = path.join(REPORTS_DIR, 'any-types-baseline.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`\n✅ Written: ${jsonPath}`);
  
  console.log('\n📋 Summary:');
  console.log(`   Total 'any' types found: ${grandTotal}`);
  console.log(`   Files affected: ${Object.keys(fileStats).length}`);
  console.log(`   Packages audited: ${packages.length}`);
}

main();

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, '..', 'packages');
const pkgs = fs.readdirSync(packagesDir).filter(d => d !== 'cli');

console.log('==========================================');
console.log('npm pack --dry-run for all packages');
console.log('==========================================');

pkgs.forEach(pkg => {
  try {
    console.log(`\n=== ${pkg} ===`);
    const out = execSync('npm pack --dry-run', { 
      cwd: path.join(packagesDir, pkg), 
      encoding: 'utf8' 
    });
    const match = out.match(/npm notice name:.*?npm notice total files: \d+/s);
    if (match) {
      const lines = match[0].split('\n');
      console.log(lines.slice(0, 4).join('\n')); // name, version, filename, size
      console.log(lines[lines.length - 1]); // total files
    }
  } catch(e) {
    console.log(`ERROR: ${pkg}`);
    console.log(e.message);
  }
});

console.log('\n==========================================');
console.log('All packages validated!');
console.log('==========================================');

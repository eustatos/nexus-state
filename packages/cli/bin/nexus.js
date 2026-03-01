#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

// CLI tool for nexus-state
const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');

const program = new Command();

program
  .name('nexus')
  .description('CLI tool for nexus-state')
  .version('0.0.0');

program
  .command('generate')
  .alias('g')
  .description('Generate atoms and other nexus-state components')
  .argument('<type>', 'Type of component to generate (atom, async-atom, family)')
  .argument('<name>', 'Name of the component')
  .option('-p, --path <path>', 'Path where to generate the component', 'src')
  .action((type, name, options) => {
    const outputPath = path.join(process.cwd(), options.path);
    
    switch (type) {
      case 'atom':
        generateAtom(name, outputPath);
        break;
      case 'async-atom':
        generateAsyncAtom(name, outputPath);
        break;
      case 'family':
        generateAtomFamily(name, outputPath);
        break;
      default:
        console.error(`Unknown type: ${type}`);
        process.exit(1);
    }
  });

program.parse();

function generateAtom(name, outputPath) {
  const fileName = `${name}.atom.ts`;
  const filePath = path.join(outputPath, fileName);
  
  const content = `import { atom } from '@nexus-state/core';

export const ${name}Atom = atom(undefined);

export default ${name}Atom;
`;
  
  fs.outputFileSync(filePath, content);
  console.log(`Generated atom: ${filePath}`);
}

function generateAsyncAtom(name, outputPath) {
  const fileName = `${name}.async-atom.ts`;
  const filePath = path.join(outputPath, fileName);
  
  const content = `import { atom } from '@nexus-state/core';

export const ${name}Atom = atom({
  loading: false,
  error: null,
  data: null,
});

export default ${name}Atom;
`;
  
  fs.outputFileSync(filePath, content);
  console.log(`Generated async atom: ${filePath}`);
}

function generateAtomFamily(name, outputPath) {
  const fileName = `${name}.family.ts`;
  const filePath = path.join(outputPath, fileName);
  
  const content = `import { atom } from '@nexus-state/core';

export const ${name}Family = atom.family((param) => 
  atom(undefined)
);

export default ${name}Family;
`;
  
  fs.outputFileSync(filePath, content);
  console.log(`Generated atom family: ${filePath}`);
}
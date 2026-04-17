import { rollup } from 'rollup';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const corePath = resolve(__dirname);

// Сценарии использования
const scenarios = [
  {
    name: 'minimal (atom + createStore)',
    entry: `export { atom, createStore } from '@nexus-state/core';`
  },
  {
    name: 'core only (atom, createStore, store.get/set)',
    entry: `
      import { atom, createStore } from '@nexus-state/core';
      const a = atom(0);
      const store = createStore();
      store.get(a);
      store.set(a, 1);
    `
  },
  {
    name: 'with batch',
    entry: `export { atom, createStore, batch } from '@nexus-state/core';`
  },
  {
    name: 'with debug',
    entry: `export { atom, createStore, logger } from '@nexus-state/core';`
  },
  {
    name: 'with serialization',
    entry: `export { atom, createStore, serializeState } from '@nexus-state/core';`
  },
  {
    name: 'with reactive',
    entry: `export { atom, createStore, BaseReactive } from '@nexus-state/core';`
  },
  {
    name: 'with action-tracker',
    entry: `export { atom, createStore, globalActionTracker } from '@nexus-state/core';`
  },
  {
    name: 'full import',
    entry: `export * from '@nexus-state/core';`
  },
];

async function analyze() {
  console.log('=== Tree-shaking analysis for @nexus-state/core ===\n');

  for (const scenario of scenarios) {
    // Создаём временный entry файл
    const tempEntry = resolve(corePath, `_temp-entry-${scenario.name.replace(/\s+/g, '-')}.js`);
    fs.writeFileSync(tempEntry, scenario.entry);

    try {
      const bundle = await rollup({
        input: tempEntry,
        external: [], // Всё bundle внутрь
        plugins: [{
          name: 'resolve-core',
          resolveId(source) {
            if (source === '@nexus-state/core') {
              return resolve(corePath, 'dist/esm/index.js');
            }
            return null;
          }
        }]
      });

      const { output } = await bundle.generate({ format: 'esm' });
      const code = output[0].code;
      const size = Buffer.byteLength(code, 'utf8');
      const sizeKB = (size / 1024).toFixed(2);

      console.log(`📦 ${scenario.name}: ${sizeKB} KB`);

      // Показать какие модули включены
      const modules = output[0].modules;
      const moduleList = Object.keys(modules)
        .filter(m => !m.includes('node_modules') && !m.startsWith('_temp'))
        .map(m => {
          const relative = m.replace(corePath + '\\dist\\esm\\', '').replace(/\\/g, '/');
          const moduleSize = (Buffer.byteLength(modules[m].code, 'utf8') / 1024).toFixed(2);
          return `     └─ ${relative} (${moduleSize} KB)`;
        });

      if (moduleList.length > 0) {
        console.log('     Modules included:');
        moduleList.forEach(m => console.log(m));
      }
      console.log('');

      await bundle.close();
    } catch (e) {
      console.log(`❌ ${scenario.name}: Error - ${e.message}\n`);
    } finally {
      // Cleanup
      try { fs.unlinkSync(tempEntry); } catch {}
    }
  }
}

analyze().catch(console.error);

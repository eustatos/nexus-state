/**
 * Конвертирует результаты бенчмарков vitest в формат github-action-benchmark
 * 
 * Использование: node scripts/convert-bench-results.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Читаем результаты vitest
const vitestResults = JSON.parse(
  readFileSync(join(__dirname, '../bench-result.json'), 'utf-8')
);

// Конвертируем в формат github-action-benchmark
const convertedResults = [];

for (const file of vitestResults.files) {
  for (const group of file.groups) {
    for (const benchmark of group.benchmarks) {
      // Пропускаем бенчмарки без данных
      if (!benchmark.hz || benchmark.hz === 0) continue;

      convertedResults.push({
        name: `${group.fullName} - ${benchmark.name}`,
        unit: 'ops/sec',
        value: benchmark.hz,
        range: benchmark.rme?.toFixed(2) || '0',
        extra: `Samples: ${benchmark.sampleCount || 0}\nMean: ${benchmark.mean?.toFixed(6) || 'N/A'}ms\nP99: ${benchmark.p99?.toFixed(6) || 'N/A'}ms`
      });
    }
  }
}

// Сортируем по имени для удобства чтения
convertedResults.sort((a, b) => a.name.localeCompare(b.name));

// Записываем результат
writeFileSync(
  join(__dirname, '../bench-result-converted.json'),
  JSON.stringify(convertedResults, null, 2)
);

console.log(`Конвертировано ${convertedResults.length} бенчмарков`);
console.log('Результат сохранен в bench-result-converted.json');

/**
 * Clone Methods Benchmark for Time-Travel Debugging
 * 
 * Compares performance of different cloning methods:
 * - JSON.stringify/parse
 * - structuredClone
 * - Custom deepClone
 * - lodash cloneDeep
 * 
 * Run: npm install && npm start
 */

import pkg from 'lodash';
const { cloneDeep } = pkg;

// ============================================================================
// Test Data Generator
// ============================================================================

/**
 * Generates ~100KB of test data with various types
 */
function generateTestData(size = 100 * 1024) {
  const data = {
    id: crypto.randomUUID ? crypto.randomUUID() : 'test-id',
    timestamp: Date.now(),
    metadata: {
      version: '1.0',
      createdAt: new Date(),
      tags: ['test', 'benchmark', 'time-travel'],
      settings: new Map([
        ['theme', 'dark'],
        ['language', 'en'],
        ['notifications', true]
      ]),
      permissions: new Set(['read', 'write', 'delete'])
    },
    nested: {},
    arrays: [],
    typed: new Uint8Array(1024)
  };

  // Fill nested objects to reach target size
  for (let i = 0; i < 50; i++) {
    data.nested[`level_${i}`] = {
      id: i,
      value: Math.random().toString(36),
      data: new Array(100).fill(null).map((_, j) => ({
        index: j,
        value: Math.random(),
        timestamp: Date.now() - j * 1000
      }))
    };
  }

  // Fill arrays
  for (let i = 0; i < 100; i++) {
    data.arrays.push(new Array(50).fill(null).map((_, j) => ({
      id: `${i}-${j}`,
      timestamp: Date.now() - j * 1000,
      data: {
        nested: {
          value: Math.random()
        }
      }
    })));
  }

  // Fill typed array
  for (let i = 0; i < data.typed.length; i++) {
    data.typed[i] = i % 256;
  }

  return data;
}

// ============================================================================
// Cloning Implementations
// ============================================================================

/**
 * Custom deepClone with support for Map, Set, Date, TypedArray, Circular refs
 */
function deepClone(obj, hash = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Map) {
    return new Map(Array.from(obj).map(([k, v]) => [
      k, deepClone(v, hash)
    ]));
  }
  if (obj instanceof Set) {
    return new Set(Array.from(obj).map(v => deepClone(v, hash)));
  }
  if (obj instanceof ArrayBuffer) {
    return obj.slice(0);
  }
  if (ArrayBuffer.isView(obj)) {
    return new (obj.constructor)(obj.slice(0));
  }
  
  // Handle circular references
  if (hash.has(obj)) return hash.get(obj);
  
  const cloned = Array.isArray(obj) ? [] : {};
  hash.set(obj, cloned);
  
  for (const key of Object.keys(obj)) {
    cloned[key] = deepClone(obj[key], hash);
  }
  return cloned;
}

// ============================================================================
// Benchmark Utilities
// ============================================================================

/**
 * Run benchmark for a specific method
 */
function benchmark(fn, data, iterations = 1000) {
  // Warmup
  for (let i = 0; i < 10; i++) {
    fn(data);
  }
  
  // Force GC if available
  if (global.gc) {
    global.gc();
  }
  
  const start = performance.now();
  const startMemory = process.memoryUsage?.().heapUsed || 0;
  
  // Run benchmark
  for (let i = 0; i < iterations; i++) {
    fn(data);
  }
  
  const end = performance.now();
  const endMemory = process.memoryUsage?.().heapUsed || 0;
  
  return {
    time: (end - start).toFixed(2),
    avgTime: ((end - start) / iterations).toFixed(3),
    memory: ((endMemory - startMemory) / startMemory * 100 + 100).toFixed(0) + '%',
    memoryDelta: ((endMemory - startMemory) / 1024 / 1024).toFixed(2) + ' MB'
  };
}

/**
 * Verify clone correctness
 */
function verifyClone(original, cloned, methodName) {
  const checks = {
    'Same structure': JSON.stringify(Object.keys(original)) === JSON.stringify(Object.keys(cloned)),
    'Different reference': original !== cloned,
    'Date preserved': cloned.metadata?.createdAt instanceof Date,
    'Map preserved': cloned.metadata?.settings instanceof Map,
    'Set preserved': cloned.metadata?.permissions instanceof Set,
    'TypedArray preserved': cloned.typed instanceof Uint8Array,
    'Nested arrays': Array.isArray(cloned.arrays) && cloned.arrays.length > 0
  };
  
  const passed = Object.values(checks).filter(v => v).length;
  const total = Object.values(checks).length;
  
  console.log(`\n${methodName} Verification: ${passed}/${total} checks passed`);
  if (passed < total) {
    console.log('  Failed checks:', Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k).join(', '));
  }
  
  return passed === total;
}

// ============================================================================
// Main Benchmark Runner
// ============================================================================

async function runBenchmarks() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Clone Methods Benchmark for Time-Travel Debugging      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  const iterations = 1000;
  const testData = generateTestData();
  const testDataSize = (JSON.stringify(testData).length / 1024).toFixed(2);
  
  console.log('📊 Test Configuration');
  console.log('─'.repeat(60));
  console.log(`  Test Data Size:     ${testDataSize} KB`);
  console.log(`  Iterations:         ${iterations}`);
  console.log(`  Node.js Version:    ${process.version}`);
  console.log(`  Platform:           ${process.platform} ${process.arch}`);
  console.log();
  
  const results = [];
  
  // JSON.stringify
  console.log('⏱ Running: JSON.stringify...');
  const stringifyResult = benchmark(
    (data) => JSON.parse(JSON.stringify(data)),
    testData,
    iterations
  );
  results.push({ name: 'JSON.stringify', ...stringifyResult });
  verifyClone(testData, JSON.parse(JSON.stringify(testData)), 'JSON.stringify');
  
  // structuredClone
  console.log('⏱ Running: structuredClone...');
  const structuredResult = benchmark(
    (data) => structuredClone(data),
    testData,
    iterations
  );
  results.push({ name: 'structuredClone', ...structuredResult });
  verifyClone(testData, structuredClone(testData), 'structuredClone');
  
  // Custom deepClone
  console.log('⏱ Running: deepClone (custom)...');
  const deepCloneResult = benchmark(
    (data) => deepClone(data, new WeakMap()),
    testData,
    iterations
  );
  results.push({ name: 'deepClone (custom)', ...deepCloneResult });
  verifyClone(testData, deepClone(testData, new WeakMap()), 'deepClone');
  
  // lodash cloneDeep
  console.log('⏱ Running: lodash cloneDeep...');
  const lodashResult = benchmark(
    (data) => cloneDeep(data),
    testData,
    iterations
  );
  results.push({ name: 'lodash cloneDeep', ...lodashResult });
  verifyClone(testData, cloneDeep(testData), 'lodash cloneDeep');
  
  // Print Results
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                      RESULTS                              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log('┌──────────────────────┬────────────┬────────────┬──────────────┐');
  console.log('│ Method               │ Time (ms)  │ Avg (ms)   │ Memory       │');
  console.log('├──────────────────────┼────────────┼────────────┼──────────────┤');
  
  results.forEach(r => {
    const method = r.name.padEnd(20);
    const time = r.time.padEnd(10);
    const avg = r.avgTime.padEnd(10);
    const mem = r.memory.padEnd(12);
    console.log(`│ ${method} │ ${time} │ ${avg} │ ${mem} │`);
  });
  
  console.log('└──────────────────────┴────────────┴────────────┴──────────────┘');
  
  // Find winner
  const fastest = results.reduce((a, b) => parseFloat(a.time) < parseFloat(b.time) ? a : b);
  console.log(`\n🏆 Fastest: ${fastest.name} (${fastest.time}ms)`);
  
  // Type support table
  console.log('\n');
  console.log('┌────────────────────┬────────────┬──────┬─────┬─────┬────────────┬──────────┐');
  console.log('│ Method             │ Primitives │ Date │ Map │ Set │ TypedArray │ Circular │');
  console.log('├────────────────────┼────────────┼──────┼─────┼─────┼────────────┼──────────┤');
  console.log('│ JSON.stringify     │     ✓      │  ⚠️  │  ✗  │  ✗  │     ✗      │    ✗     │');
  console.log('│ structuredClone    │     ✓      │  ✓   │  ✓  │  ✓  │     ✓      │    ✓     │');
  console.log('│ deepClone (custom) │     ✓      │  ✓   │  ✓  │  ✓  │     ✓      │    ✓     │');
  console.log('│ lodash cloneDeep   │     ✓      │  ✓   │  ✓  │  ✓  │     ✓      │    ✓     │');
  console.log('└────────────────────┴────────────┴──────┴─────┴─────┴────────────┴──────────┘');
  console.log('\n✓ = Full support | ⚠️ = Partial (loses type) | ✗ = No support');
  
  // Recommendations
  console.log('\n');
  console.log('💡 Recommendations');
  console.log('─'.repeat(60));
  console.log('  Production (modern browsers):  structuredClone()');
  console.log('  Production (old browsers):     deepClone (custom)');
  console.log('  Prototyping:                   JSON.stringify');
  console.log('  Avoid:                         lodash cloneDeep (slow + 24KB bundle)');
  console.log();
}

// Run
runBenchmarks().catch(console.error);

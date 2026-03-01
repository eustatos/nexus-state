/**
 * Simple performance test to compare batching vs no batching
 */

const { createStore, atom, batch } = require('./packages/core/dist/index.js');

function testNoBatching() {
  const store = createStore();
  const atoms = Array.from({ length: 100 }, () => atom(0));
  
  const start = performance.now();
  
  // Without batching - each set triggers notifications immediately
  for (let i = 0; i < 100; i++) {
    store.set(atoms[i], i);
  }
  
  const end = performance.now();
  return end - start;
}

function testWithBatching() {
  const store = createStore();
  const atoms = Array.from({ length: 100 }, () => atom(0));
  
  const start = performance.now();
  
  // With batching - notifications are delayed until batch ends
  batch(() => {
    for (let i = 0; i < 100; i++) {
      store.set(atoms[i], i);
    }
  });
  
  const end = performance.now();
  return end - start;
}

function testWithSubscribers() {
  const store = createStore();
  const atoms = Array.from({ length: 50 }, () => atom(0));
  
  // Add subscribers to each atom
  atoms.forEach((a, i) => {
    store.subscribe(a, () => {
      // Do nothing, just count notifications
    });
  });
  
  const start = performance.now();
  
  // Without batching
  for (let i = 0; i < 50; i++) {
    store.set(atoms[i], i);
  }
  
  const end = performance.now();
  return end - start;
}

function testWithSubscribersAndBatching() {
  const store = createStore();
  const atoms = Array.from({ length: 50 }, () => atom(0));
  
  // Add subscribers to each atom
  atoms.forEach((a, i) => {
    store.subscribe(a, () => {
      // Do nothing, just count notifications
    });
  });
  
  const start = performance.now();
  
  // With batching
  batch(() => {
    for (let i = 0; i < 50; i++) {
      store.set(atoms[i], i);
    }
  });
  
  const end = performance.now();
  return end - start;
}

console.log('Performance Comparison: Batching vs No Batching\n');
console.log('='.repeat(50));

// Run tests multiple times and average
const iterations = 10;

let noBatchTotal = 0;
let batchTotal = 0;

for (let i = 0; i < iterations; i++) {
  noBatchTotal += testNoBatching();
  batchTotal += testWithBatching();
}

console.log('\n1. Basic set operations (100 atoms, no subscribers):');
console.log(`   No batching:  ${(noBatchTotal / iterations).toFixed(3)} ms (avg)`);
console.log(`   With batching: ${(batchTotal / iterations).toFixed(3)} ms (avg)`);

noBatchTotal = 0;
batchTotal = 0;

for (let i = 0; i < iterations; i++) {
  noBatchTotal += testWithSubscribers();
  batchTotal += testWithSubscribersAndBatching();
}

console.log('\n2. Set operations with subscribers (50 atoms, 50 subscribers each):');
console.log(`   No batching:  ${(noBatchTotal / iterations).toFixed(3)} ms (avg)`);
console.log(`   With batching: ${(batchTotal / iterations).toFixed(3)} ms (avg)`);

const improvement = ((noBatchTotal - batchTotal) / noBatchTotal * 100);
console.log(`\n   Improvement: ${improvement.toFixed(1)}% faster with batching`);

console.log('\n' + '='.repeat(50));
console.log('Note: Batching is most effective when you have multiple');
console.log('updates and subscribers, as it reduces redundant notifications.');

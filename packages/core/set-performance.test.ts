import { describe, it, expect } from 'vitest';
import { atom, createStore, batch } from './src/index';

describe('Set Performance Analysis', () => {
  function measureTime(fn: () => void, iterations: number = 1): { total: number; perOp: number } {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const total = performance.now() - start;
    return { total, perOp: total / iterations };
  }

  it('set без предварительного get (1000 итераций)', () => {
    const store = createStore();
    const a = atom(0);
    
    const { total, perOp } = measureTime(() => {
      for (let i = 0; i < 1000; i++) {
        store.set(a, i);
      }
    });
    
    console.log(`\n📊 set без get (1000 итераций):`);
    console.log(`   Total: ${total.toFixed(2)}ms`);
    console.log(`   Per op: ${perOp.toFixed(4)}ms`);
    console.log(`   Ops/sec: ${(1000 / (total / 1000)).toFixed(2)}`);
  });

  it('set с предварительным get (1000 итераций)', () => {
    const store = createStore();
    const a = atom(0);
    
    // Предварительная инициализация
    store.get(a);
    
    const { total, perOp } = measureTime(() => {
      for (let i = 0; i < 1000; i++) {
        store.set(a, i);
      }
    });
    
    console.log(`\n📊 set с get (1000 итераций):`);
    console.log(`   Total: ${total.toFixed(2)}ms`);
    console.log(`   Per op: ${perOp.toFixed(4)}ms`);
    console.log(`   Ops/sec: ${(1000 / (total / 1000)).toFixed(2)}`);
  });

  it('set с batching (1000 итераций)', () => {
    const store = createStore();
    const a = atom(0);
    store.get(a);
    
    const { total, perOp } = measureTime(() => {
      for (let i = 0; i < 10; i++) {
        batch(() => {
          for (let j = 0; j < 100; j++) {
            store.set(a, i * 100 + j);
          }
        });
      }
    });
    
    console.log(`\n📊 set с batch (1000 итераций):`);
    console.log(`   Total: ${total.toFixed(2)}ms`);
    console.log(`   Per op: ${perOp.toFixed(4)}ms`);
    console.log(`   Ops/sec: ${(1000 / (total / 1000)).toFixed(2)}`);
  });

  it('set с silent mode (1000 итераций)', () => {
    const store = createStore();
    const a = atom(0);
    store.get(a);
    
    const { total, perOp } = measureTime(() => {
      for (let i = 0; i < 1000; i++) {
        store.set(a, i, { silent: true });
      }
    });
    
    console.log(`\n📊 set silent (1000 итераций):`);
    console.log(`   Total: ${total.toFixed(2)}ms`);
    console.log(`   Per op: ${perOp.toFixed(4)}ms`);
    console.log(`   Ops/sec: ${(1000 / (total / 1000)).toFixed(2)}`);
  });

  it('set с 1 подписчиком (1000 итераций)', () => {
    const store = createStore();
    const a = atom(0);
    let count = 0;
    
    store.subscribe(a, () => { count++; });
    store.get(a); // Инициализация
    
    const { total, perOp } = measureTime(() => {
      for (let i = 0; i < 1000; i++) {
        store.set(a, i);
      }
    });
    
    console.log(`\n📊 set с подписчиком (1000 итераций):`);
    console.log(`   Total: ${total.toFixed(2)}ms`);
    console.log(`   Per op: ${perOp.toFixed(4)}ms`);
    console.log(`   Ops/sec: ${(1000 / (total / 1000)).toFixed(2)}`);
    console.log(`   Subscriber calls: ${count}`);
  });
});

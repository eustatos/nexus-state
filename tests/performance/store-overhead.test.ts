// Performance tests for store enhancements
// Implements requirements from TASK-002-ENHANCE-STORE-DEVTOOLS-INTEGRATION

import { describe, it, expect } from 'vitest';
import { atom } from '../../packages/core/atom';
import { createEnhancedStore } from '../../packages/core/enhanced-store';
import { createStore } from '../../packages/core/store';
import { largeStates } from '../fixtures/store-states';

describe('Store Performance Overhead', () => {
  const TEST_ITERATIONS = 1000;
  
  describe('Basic Operations Overhead', () => {
    it('should have minimal overhead for get operations', () => {
      const countAtom = atom(0);
      const baseStore = createStore();
      const enhancedStore = createEnhancedStore();
      
      // Warm up
      for (let i = 0; i < 100; i++) {
        baseStore.set(countAtom, i);
        enhancedStore.set(countAtom, i);
      }
      
      // Measure base store performance
      const baseStart = performance.now();
      for (let i = 0; i < TEST_ITERATIONS; i++) {
        baseStore.get(countAtom);
      }
      const baseEnd = performance.now();
      const baseTime = baseEnd - baseStart;
      
      // Measure enhanced store performance
      const enhancedStart = performance.now();
      for (let i = 0; i < TEST_ITERATIONS; i++) {
        enhancedStore.get(countAtom);
      }
      const enhancedEnd = performance.now();
      const enhancedTime = enhancedEnd - enhancedStart;
      
      // Calculate overhead
      const overhead = ((enhancedTime - baseTime) / baseTime) * 100;
      
      // Should be less than 10% overhead
      expect(overhead).toBeLessThan(10);
    });
    
    it('should have minimal overhead for set operations', () => {
      const countAtom = atom(0);
      const baseStore = createStore();
      const enhancedStore = createEnhancedStore();
      
      // Warm up
      for (let i = 0; i < 100; i++) {
        baseStore.set(countAtom, i);
        enhancedStore.set(countAtom, i);
      }
      
      // Measure base store performance
      const baseStart = performance.now();
      for (let i = 0; i < TEST_ITERATIONS; i++) {
        baseStore.set(countAtom, i);
      }
      const baseEnd = performance.now();
      const baseTime = baseEnd - baseStart;
      
      // Measure enhanced store performance
      const enhancedStart = performance.now();
      for (let i = 0; i < TEST_ITERATIONS; i++) {
        enhancedStore.set(countAtom, i);
      }
      const enhancedEnd = performance.now();
      const enhancedTime = enhancedEnd - enhancedStart;
      
      // Calculate overhead
      const overhead = ((enhancedTime - baseTime) / baseTime) * 100;
      
      // Should be less than 10% overhead
      expect(overhead).toBeLessThan(10);
    });
    
    it('should have minimal overhead for subscription operations', () => {
      const countAtom = atom(0);
      const baseStore = createStore();
      const enhancedStore = createEnhancedStore();
      
      // Warm up
      for (let i = 0; i < 100; i++) {
        baseStore.set(countAtom, i);
        enhancedStore.set(countAtom, i);
      }
      
      // Measure base store subscription performance
      const baseStart = performance.now();
      const baseUnsubscribes = [];
      for (let i = 0; i < TEST_ITERATIONS; i++) {
        const unsubscribe = baseStore.subscribe(countAtom, () => {});
        baseUnsubscribes.push(unsubscribe);
      }
      const baseEnd = performance.now();
      const baseTime = baseEnd - baseStart;
      
      // Measure enhanced store subscription performance
      const enhancedStart = performance.now();
      const enhancedUnsubscribes = [];
      for (let i = 0; i < TEST_ITERATIONS; i++) {
        const unsubscribe = enhancedStore.subscribe(countAtom, () => {});
        enhancedUnsubscribes.push(unsubscribe);
      }
      const enhancedEnd = performance.now();
      const enhancedTime = enhancedEnd - enhancedStart;
      
      // Clean up
      baseUnsubscribes.forEach(unsub => unsub());
      enhancedUnsubscribes.forEach(unsub => unsub());
      
      // Calculate overhead
      const overhead = ((enhancedTime - baseTime) / baseTime) * 100;
      
      // Should be less than 15% overhead
      expect(overhead).toBeLessThan(15);
    });
  });
  
  describe('Large State Tree Performance', () => {
    it('should handle large state trees efficiently', () => {
      const baseStore = createStore();
      const enhancedStore = createEnhancedStore();
      
      // Set up large state tree
      const largeArrayAtom = largeStates.largeArray;
      const largeArray = largeArrayAtom.init;
      
      baseStore.set(largeArrayAtom, largeArray);
      enhancedStore.set(largeArrayAtom, largeArray);

      // Measure serialization performance
      const baseStart = performance.now();
      void baseStore.getState();
      const baseEnd = performance.now();
      const baseTime = baseEnd - baseStart;

      const enhancedStart = performance.now();
      void enhancedStore.serializeState();
      const enhancedEnd = performance.now();
      const enhancedTime = enhancedEnd - enhancedStart;
      
      // Serialization should be reasonably fast
      expect(baseTime).toBeLessThan(100); // Base serialization under 100ms
      expect(enhancedTime).toBeLessThan(200); // Enhanced serialization under 200ms
      
      // Enhanced should not be dramatically slower
      expect(enhancedTime).toBeLessThan(baseTime * 3);
    });
    
    it('should maintain performance with deep nested updates', () => {
      const baseStore = createStore();
      const enhancedStore = createEnhancedStore();
      
      // Set up deep nested state
      const deepNestedAtom = largeStates.deepNested;
      const deepNested = deepNestedAtom.init;
      
      baseStore.set(deepNestedAtom, deepNested);
      enhancedStore.set(deepNestedAtom, deepNested);
      
      // Measure update performance
      const baseStart = performance.now();
      for (let i = 0; i < 100; i++) {
        baseStore.set(deepNestedAtom, {
          ...deepNested,
          [`level${i % 10}`]: [
            ...deepNested[`level${i % 10}`].slice(0, -1),
            {
              ...deepNested[`level${i % 10}`].slice(-1)[0],
              id: `updated-${i}`,
            },
          ],
        });
      }
      const baseEnd = performance.now();
      const baseTime = baseEnd - baseStart;
      
      const enhancedStart = performance.now();
      for (let i = 0; i < 100; i++) {
        enhancedStore.set(deepNestedAtom, {
          ...deepNested,
          [`level${i % 10}`]: [
            ...deepNested[`level${i % 10}`].slice(0, -1),
            {
              ...deepNested[`level${i % 10}`].slice(-1)[0],
              id: `updated-${i}`,
            },
          ],
        });
      }
      const enhancedEnd = performance.now();
      const enhancedTime = enhancedEnd - enhancedStart;
      
      // Updates should be fast
      expect(baseTime).toBeLessThan(100); // Base updates under 100ms
      expect(enhancedTime).toBeLessThan(200); // Enhanced updates under 200ms
      
      // Enhanced should not be dramatically slower
      expect(enhancedTime).toBeLessThan(baseTime * 3);
    });
  });
  
  describe('Action Tracking Overhead', () => {
    it('should have minimal overhead for action tracking', () => {
      const countAtom = atom(0);
      const enhancedStore = createEnhancedStore([], {
        enableStackTrace: false, // Disable stack trace for performance
      });
      
      // Warm up
      for (let i = 0; i < 100; i++) {
        enhancedStore.setWithMetadata(countAtom, i, {
          type: 'WARMUP',
          timestamp: Date.now(),
        });
      }
      
      // Measure action tracking performance
      const start = performance.now();
      for (let i = 0; i < TEST_ITERATIONS; i++) {
        enhancedStore.setWithMetadata(countAtom, i, {
          type: 'TEST_ACTION',
          timestamp: Date.now(),
        });
      }
      const end = performance.now();
      const totalTime = end - start;
      
      // Average time per action should be less than 5ms
      const avgTime = totalTime / TEST_ITERATIONS;
      expect(avgTime).toBeLessThan(5);
    });
    
    it('should handle high-frequency updates', () => {
      const countAtom = atom(0);
      const enhancedStore = createEnhancedStore();
      
      // Simulate high-frequency updates (1000 per second)
      const updatesPerSecond = 1000;
      const durationSeconds = 5;
      const totalUpdates = updatesPerSecond * durationSeconds;
      
      const start = performance.now();
      for (let i = 0; i < totalUpdates; i++) {
        enhancedStore.set(countAtom, i);
      }
      const end = performance.now();
      const totalTime = end - start;
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(durationSeconds * 2000); // Allow 2x time buffer
      
      // Average time per update should be reasonable
      const avgTime = totalTime / totalUpdates;
      expect(avgTime).toBeLessThan(10); // Less than 10ms per update
    });
  });
  
  describe('DevTools Integration Overhead', () => {
    it('should have minimal overhead when DevTools are disabled', () => {
      const countAtom = atom(0);
      const baseStore = createStore();
      const enhancedStore = createEnhancedStore([], {
        enableDevTools: false,
      });
      
      // Warm up
      for (let i = 0; i < 100; i++) {
        baseStore.set(countAtom, i);
        enhancedStore.set(countAtom, i);
      }
      
      // Measure performance with DevTools disabled
      const baseStart = performance.now();
      for (let i = 0; i < TEST_ITERATIONS; i++) {
        baseStore.set(countAtom, i);
      }
      const baseEnd = performance.now();
      const baseTime = baseEnd - baseStart;
      
      const enhancedStart = performance.now();
      for (let i = 0; i < TEST_ITERATIONS; i++) {
        enhancedStore.set(countAtom, i);
      }
      const enhancedEnd = performance.now();
      const enhancedTime = enhancedEnd - enhancedStart;
      
      // Calculate overhead
      const overhead = ((enhancedTime - baseTime) / baseTime) * 100;
      
      // Should be minimal when DevTools are disabled
      expect(overhead).toBeLessThan(5);
    });
    
    it('should handle batched updates efficiently', () => {
      const countAtom = atom(0);
      const enhancedStore = createEnhancedStore([], {
        enableDevTools: true,
        debounceDelay: 10, // Short debounce for testing
      });
      
      // Measure batched update performance
      const start = performance.now();
      for (let i = 0; i < TEST_ITERATIONS; i++) {
        enhancedStore.set(countAtom, i);
      }
      const end = performance.now();
      const totalTime = end - start;
      
      // Batched updates should be efficient
      expect(totalTime).toBeLessThan(TEST_ITERATIONS * 2); // Less than 2ms per update
      
      // Should not send every update individually due to debouncing
      // This is harder to test directly, but we can check that it's reasonably fast
    });
  });
});
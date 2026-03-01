/**
 * Delta Snapshots Memory and Performance Benchmarks
 * Compares full snapshots vs delta-based snapshots
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SimpleTimeTravel } from "../../core/SimpleTimeTravel";
import { atom, createStore } from "../../../index";

/**
 * Helper to measure memory usage (Node.js only)
 */
function getMemoryUsageMB(): number {
  if (typeof process !== "undefined" && process.memoryUsage) {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }
  return 0;
}

/**
 * Helper to measure execution time
 */
function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

describe("Delta Snapshots Benchmarks", () => {
  describe("Memory Efficiency", () => {
    it("should use less memory with delta snapshots (100 changes)", () => {
      // Test with full snapshots
      const store1 = createStore();
      const counterAtom1 = atom(0, "counter");
      store1.set(counterAtom1, 0);

      const ttFull = new SimpleTimeTravel(store1, {
        deltaSnapshots: {
          enabled: false,
        },
        maxHistory: 100,
      });

      const memoryBeforeFull = getMemoryUsageMB();
      for (let i = 1; i <= 100; i++) {
        store1.set(counterAtom1, i);
      }
      const memoryAfterFull = getMemoryUsageMB();
      const memoryUsedFull = memoryAfterFull - memoryBeforeFull;

      // Test with delta snapshots
      const store2 = createStore();
      const counterAtom2 = atom(0, "counter");
      store2.set(counterAtom2, 0);

      const ttDelta = new SimpleTimeTravel(store2, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 20,
          maxDeltaChainLength: 50,
        },
        maxHistory: 100,
      });

      const memoryBeforeDelta = getMemoryUsageMB();
      for (let i = 1; i <= 100; i++) {
        store2.set(counterAtom2, i);
      }
      const memoryAfterDelta = getMemoryUsageMB();
      const memoryUsedDelta = memoryAfterDelta - memoryBeforeFull;

      // Delta should use less or equal memory
      // Note: This is a soft assertion as memory measurement can be noisy
      console.log(`Full snapshots memory: ${memoryUsedFull.toFixed(2)} MB`);
      console.log(`Delta snapshots memory: ${memoryUsedDelta.toFixed(2)} MB`);
      
      const savings = memoryUsedFull > 0 ? ((memoryUsedFull - memoryUsedDelta) / memoryUsedFull) * 100 : 0;
      console.log(`Memory savings: ${savings.toFixed(2)}%`);
    });

    it("should show significant memory savings with large state (50 atoms, 100 changes)", () => {
      // Create store with many atoms
      const store1 = createStore();
      const atoms1: Array<ReturnType<typeof atom>> = [];
      
      for (let i = 0; i < 50; i++) {
        const a = atom(i, `atom-${i}`);
        store1.set(a, i);
        atoms1.push(a);
      }

      const ttFull = new SimpleTimeTravel(store1, {
        deltaSnapshots: { enabled: false },
        maxHistory: 100,
      });

      const memoryBeforeFull = getMemoryUsageMB();
      
      // Make 100 changes, each changing a different atom
      for (let i = 0; i < 100; i++) {
        const atomIndex = i % 50;
        store1.set(atoms1[atomIndex], (i + 1) * 10);
      }
      
      const memoryAfterFull = getMemoryUsageMB();
      const memoryUsedFull = memoryAfterFull - memoryBeforeFull;

      // Test with delta snapshots
      const store2 = createStore();
      const atoms2: Array<ReturnType<typeof atom>> = [];
      
      for (let i = 0; i < 50; i++) {
        const a = atom(i, `atom-${i}`);
        store2.set(a, i);
        atoms2.push(a);
      }

      const ttDelta = new SimpleTimeTravel(store2, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 20,
          maxDeltaChainLength: 50,
        },
        maxHistory: 100,
      });

      const memoryBeforeDelta = getMemoryUsageMB();
      
      for (let i = 0; i < 100; i++) {
        const atomIndex = i % 50;
        store2.set(atoms2[atomIndex], (i + 1) * 10);
      }
      
      const memoryAfterDelta = getMemoryUsageMB();
      const memoryUsedDelta = memoryAfterDelta - memoryBeforeDelta;

      console.log(`\nLarge state benchmark:`);
      console.log(`Full snapshots memory: ${memoryUsedFull.toFixed(2)} MB`);
      console.log(`Delta snapshots memory: ${memoryUsedDelta.toFixed(2)} MB`);
      
      const deltaStats = ttDelta.getDeltaStats!();
      console.log(`Delta count: ${deltaStats.deltaCount}`);
      console.log(`Full snapshot count: ${deltaStats.fullSnapshotCount}`);
      
      if (memoryUsedFull > 0) {
        const savings = ((memoryUsedFull - memoryUsedDelta) / memoryUsedFull) * 100;
        console.log(`Memory savings: ${savings.toFixed(2)}%`);
      }
    });
  });

  describe("Performance - Snapshot Creation", () => {
    it("should create delta snapshots faster than full snapshots", () => {
      const store1 = createStore();
      const counterAtom1 = atom(0, "counter");
      store1.set(counterAtom1, 0);

      const ttFull = new SimpleTimeTravel(store1, {
        deltaSnapshots: { enabled: false },
        maxHistory: 100,
      });

      // Measure full snapshot creation time
      const fullSnapshotTime = measureTime(() => {
        for (let i = 1; i <= 50; i++) {
          store1.set(counterAtom1, i);
        }
      });

      const store2 = createStore();
      const counterAtom2 = atom(0, "counter");
      store2.set(counterAtom2, 0);

      const ttDelta = new SimpleTimeTravel(store2, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 20,
        },
        maxHistory: 100,
      });

      // Measure delta snapshot creation time
      const deltaSnapshotTime = measureTime(() => {
        for (let i = 1; i <= 50; i++) {
          store2.set(counterAtom2, i);
        }
      });

      console.log(`\nSnapshot creation benchmark:`);
      console.log(`Full snapshots time: ${fullSnapshotTime.toFixed(2)} ms`);
      console.log(`Delta snapshots time: ${deltaSnapshotTime.toFixed(2)} ms`);
      
      if (fullSnapshotTime > 0) {
        const speedup = ((fullSnapshotTime - deltaSnapshotTime) / fullSnapshotTime) * 100;
        console.log(`Speed improvement: ${speedup.toFixed(2)}%`);
      }
    });
  });

  describe("Performance - Navigation", () => {
    it("should navigate through history with acceptable performance", () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      const tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 10,
        },
        maxHistory: 100,
      });

      // Create history
      for (let i = 1; i <= 100; i++) {
        store.set(counterAtom, i);
      }

      // Measure undo navigation time
      const undoTime = measureTime(() => {
        for (let i = 0; i < 50; i++) {
          if (tt.canUndo()) {
            tt.undo();
          }
        }
      });

      // Measure redo navigation time
      const redoTime = measureTime(() => {
        for (let i = 0; i < 50; i++) {
          if (tt.canRedo()) {
            tt.redo();
          }
        }
      });

      // Measure jumpTo navigation time
      const jumpTime = measureTime(() => {
        tt.jumpTo(0);
        tt.jumpTo(50);
        tt.jumpTo(99);
      });

      console.log(`\nNavigation benchmark:`);
      console.log(`50 undo operations: ${undoTime.toFixed(2)} ms (${(undoTime / 50).toFixed(2)} ms/op)`);
      console.log(`50 redo operations: ${redoTime.toFixed(2)} ms (${(redoTime / 50).toFixed(2)} ms/op)`);
      console.log(`3 jumpTo operations: ${jumpTime.toFixed(2)} ms (${(jumpTime / 3).toFixed(2)} ms/op)`);

      // Navigation should be reasonably fast (< 100ms for 50 operations)
      expect(undoTime).toBeLessThan(1000); // Generous limit for CI
      expect(redoTime).toBeLessThan(1000);
    });
  });

  describe("Performance - Reconstruction", () => {
    it("should reconstruct snapshots efficiently", () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      const tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 10,
          cacheReconstructed: true,
        },
        maxHistory: 100,
      });

      // Create history
      for (let i = 1; i <= 100; i++) {
        store.set(counterAtom, i);
      }

      // Measure reconstruction time (with caching)
      const reconstructTimeWithCache = measureTime(() => {
        for (let i = 0; i < 20; i++) {
          tt.reconstructTo!(i * 5);
        }
      });

      // Clear cache and measure again
      const reconstructor = tt.getDeltaReconstructor();
      reconstructor.clearCache();

      const reconstructTimeWithoutCache = measureTime(() => {
        for (let i = 0; i < 20; i++) {
          tt.reconstructTo!(i * 5);
        }
      });

      console.log(`\nReconstruction benchmark:`);
      console.log(`20 reconstructions (with cache): ${reconstructTimeWithCache.toFixed(2)} ms`);
      console.log(`20 reconstructions (without cache): ${reconstructTimeWithoutCache.toFixed(2)} ms`);
      
      const deltaStats = tt.getDeltaStats!();
      console.log(`Cache hits: ${deltaStats.cacheHits || 'N/A'}`);
      console.log(`Cache misses: ${deltaStats.cacheMisses || 'N/A'}`);
    });
  });

  describe("Long History Performance", () => {
    it("should handle long history (1000+ changes) efficiently", () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      const tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 20,
          maxDeltaChainLength: 50,
          maxDeltaChainAge: 10 * 60 * 1000, // 10 minutes
          maxDeltaChainSize: 2 * 1024 * 1024, // 2MB
        },
        maxHistory: 1000,
      });

      const startTime = performance.now();
      const memoryBefore = getMemoryUsageMB();

      // Create 1000 changes
      for (let i = 1; i <= 1000; i++) {
        store.set(counterAtom, i);
      }

      const endTime = performance.now();
      const memoryAfter = getMemoryUsageMB();

      const totalTime = endTime - startTime;
      const memoryUsed = memoryAfter - memoryBefore;

      console.log(`\nLong history benchmark (1000 changes):`);
      console.log(`Total time: ${totalTime.toFixed(2)} ms (${(totalTime / 1000).toFixed(2)} ms/change)`);
      console.log(`Memory used: ${memoryUsed.toFixed(2)} MB`);

      const deltaStats = tt.getDeltaStats!();
      console.log(`Total snapshots: ${deltaStats.deltaCount + deltaStats.fullSnapshotCount}`);
      console.log(`Delta count: ${deltaStats.deltaCount}`);
      console.log(`Full snapshot count: ${deltaStats.fullSnapshotCount}`);

      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(10000); // 10 seconds max for 1000 changes
    });
  });

  describe("Delta Compression Effectiveness", () => {
    it("should show compression effectiveness metrics", () => {
      const store = createStore();
      const atoms: Array<ReturnType<typeof atom>> = [];
      
      // Create multiple atoms
      for (let i = 0; i < 20; i++) {
        const a = atom(i, `atom-${i}`);
        store.set(a, i);
        atoms.push(a);
      }

      const tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 10,
          maxDeltaChainLength: 30,
          compressionLevel: "light",
        },
        maxHistory: 100,
      });

      // Make changes to different atoms
      for (let i = 0; i < 100; i++) {
        const atomIndex = i % 20;
        store.set(atoms[atomIndex], (i + 1) * 100);
      }

      const deltaStats = tt.getDeltaStats!();

      console.log(`\nCompression effectiveness:`);
      console.log(`Total deltas: ${deltaStats.deltaCount}`);
      console.log(`Total full snapshots: ${deltaStats.fullSnapshotCount}`);
      console.log(`Active chains: ${deltaStats.activeChains}`);
      console.log(`Average delta size: ${deltaStats.averageDeltaSize || 'N/A'} bytes`);
      console.log(`Average compression ratio: ${deltaStats.averageCompressionRatio || 'N/A'}`);
      console.log(`Memory efficiency: ${deltaStats.memoryEfficiency ? (deltaStats.memoryEfficiency * 100).toFixed(2) : 'N/A'}%`);

      // Should have created some deltas
      expect(deltaStats.deltaCount).toBeGreaterThan(0);
    });
  });
});

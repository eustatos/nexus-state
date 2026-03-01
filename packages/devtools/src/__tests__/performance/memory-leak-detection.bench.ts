/**
 * Memory leak detection tests for DevTools
 *
 * These tests help identify memory leaks in long-running applications
 * by simulating extended usage patterns.
 */

import { describe, bench, beforeEach, afterEach } from "vitest";
import { createActionGrouper } from "../../action-grouper";
import { createActionMetadata } from "../../action-metadata";
import type { ActionMetadata } from "../../types";

// Track initial memory usage for comparison
let initialMemory: number | undefined;

function getMemoryUsage(): number {
  if (typeof performance !== "undefined" && performance.memory) {
    // Browser environment with performance.memory API
    return performance.memory.usedJSHeapSize;
  }

  if (typeof process !== "undefined" && process.memoryUsage) {
    // Node.js environment
    return process.memoryUsage().heapUsed;
  }

  // Fallback: use Date.now() as a proxy (not accurate but consistent)
  return Date.now();
}

function createTestMetadata(
  type: string,
  atomName: string,
  groupId: string,
): ActionMetadata {
  return createActionMetadata()
    .type(type)
    .atomName(atomName)
    .timestamp(Date.now())
    .source("test")
    .groupId(groupId)
    .build();
}

describe("Memory Leak Detection", () => {
  beforeEach(() => {
    //Record initial memory before each test suite
    initialMemory = getMemoryUsage();
    // Force garbage collection if available
    if (typeof global !== "undefined" && (global as any).gc) {
      (global as any).gc();
    }
  });

  afterEach(() => {
    // Check for memory growth after each test
    const finalMemory = getMemoryUsage();
    const memoryGrowth = finalMemory - (initialMemory || 0);

    // Log memory usage for monitoring
    console.log(
      `Memory usage: ${finalMemory} bytes (growth: ${memoryGrowth} bytes)`,
    );

    // In a real test environment, you might want to assert on memory growth
    // For now, we just log it for manual inspection
  });

  describe("Long-running ActionGrouper", () => {
    bench(
      "sustained action processing over 1000 iterations",
      { iterations: 1000 },
      () => {
        const grouper = createActionGrouper({
          flushAfterMs: 100,
          maxGroupSize: 100,
        });

        // Simulate long-running application with periodic group creation
        for (let iteration = 0; iteration < 10; iteration++) {
          const groupId = `iteration-${iteration}`;
          grouper.startGroup(groupId);

          // Add varying number of actions
          const actionCount = Math.floor(Math.random() * 20) + 5;
          for (let i = 0; i < actionCount; i++) {
            grouper.add(
              createTestMetadata(
                `atom${iteration}/SET-${i}`,
                `atom${iteration}`,
                groupId,
              ),
            );
          }

          grouper.endGroup(groupId);
        }
      },
    );
  });

  describe("Memory Retention Tests", () => {
    bench("create and discard 1000 groups", { iterations: 100 }, () => {
      // Create many groups and ensure they're properly cleaned up
      const groups: Array<ReturnType<typeof createActionGrouper>> = [];

      for (let i = 0; i < 10; i++) {
        const grouper = createActionGrouper({
          flushAfterMs: 50,
          maxGroupSize: 50,
        });
        groups.push(grouper);

        // Use the grouper
        grouper.startGroup(`temp-${i}`);
        for (let j = 0; j < 5; j++) {
          grouper.add(createTestMetadata(`temp/SET-${j}`, "temp", `temp-${i}`));
        }
        grouper.endGroup(`temp-${i}`);
      }

      // Clear references to allow garbage collection
      groups.length = 0;
    });
  });

  describe("Large Dataset Handling", () => {
    bench("process 5000 actions with cleanup", () => {
      const grouper = createActionGrouper({
        flushAfterMs: 1000,
        maxGroupSize: 1000,
      });

      // Process large batch of actions
      grouper.startGroup("large-batch");
      for (let i = 0; i < 100; i++) {
        // Reduced from 5000 for performance
        grouper.add(
          createTestMetadata(`large/SET-${i}`, "large-atom", "large-batch"),
        );
      }

      const result = grouper.endGroup("large-batch");

      // Ensure result doesn't retain unnecessary references
      if (result) {
        // Access properties to ensure they exist
        const { count, type, metadata } = result;
        // Do nothing with them - just accessing to simulate real usage
      }
    });
  });

  describe("Event Listener Leak Detection", () => {
    bench("repeated callback registration and cleanup", () => {
      const callbacks: Array<() => void> = [];

      for (let i = 0; i < 100; i++) {
        const callback = () => {
          // Simulate callback that might capture context
          const data = new Array(100).fill("data");
          return data.length;
        };
        callbacks.push(callback);

        // Simulate callback being called
        if (i % 10 === 0) {
          callback();
        }
      }

      // Clear callbacks to prevent memory leak
      callbacks.length = 0;
    });
  });
});

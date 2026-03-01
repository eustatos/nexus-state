// packages/core/utils/snapshot-serialization/__tests__/utils.test.ts
/**
 * Unit tests for utility functions
 * Tests isSerializable, factory functions, and helper utilities
 */

import { describe, it, expect } from "vitest";
import {
  isSerializable,
  createSnapshotSerializer,
  roundTripSnapshot,
  snapshotsEqual,
} from "../utils";

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe("Utils Performance", () => {
  it("isSerializable should complete within time budget for large objects", () => {
    const large = Object.fromEntries(
      Array.from({ length: 1000 }, (_, i) => [`key_${i}`, i]),
    );

    const start = performance.now();
    const result = isSerializable(large);
    const duration = performance.now() - start;

    expect(result).toBe(true);
    expect(duration).toBeLessThan(100); // 100ms budget
  });

  it("createSnapshotSerializer should create function quickly", () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      createSnapshotSerializer({ maxDepth: 10, skipKeys: ["secret"] });
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50); // 50ms budget
  });

  it("roundTripSnapshot should complete within time budget", () => {
    const input = {
      users: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        createdAt: new Date(),
      })),
    };

    const start = performance.now();
    const result = roundTripSnapshot(input);
    const duration = performance.now() - start;

    expect(result.users).toHaveLength(500);
    expect(duration).toBeLessThan(300); // 300ms budget
  });

  it("snapshotsEqual should complete within time budget", () => {
    const a = {
      data: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        value: `item_${i}`,
      })),
    };
    const b = {
      data: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        value: `item_${i}`,
      })),
    };

    const start = performance.now();
    const result = snapshotsEqual(a, b);
    const duration = performance.now() - start;

    expect(result).toBe(true);
    expect(duration).toBeLessThan(100); // 100ms budget
  });
});
// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe("Utils Performance", () => {
  it("isSerializable should complete within time budget for large objects", () => {
    const large = Object.fromEntries(
      Array.from({ length: 1000 }, (_, i) => [`key_${i}`, i]),
    );

    const start = performance.now();
    const result = isSerializable(large);
    const duration = performance.now() - start;

    expect(result).toBe(true);
    expect(duration).toBeLessThan(100); // 100ms budget
  });

  it("createSnapshotSerializer should create function quickly", () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      createSnapshotSerializer({ maxDepth: 10, skipKeys: ["secret"] });
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50); // 50ms budget
  });

  it("roundTripSnapshot should complete within time budget", () => {
    const input = {
      users: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        createdAt: new Date(),
      })),
    };

    const start = performance.now();
    const result = roundTripSnapshot(input);
    const duration = performance.now() - start;

    expect(result.users).toHaveLength(500);
    expect(duration).toBeLessThan(300); // 300ms budget
  });

  it("snapshotsEqual should complete within time budget", () => {
    const a = {
      data: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        value: `item_${i}`,
      })),
    };
    const b = {
      data: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        value: `item_${i}`,
      })),
    };

    const start = performance.now();
    const result = snapshotsEqual(a, b);
    const duration = performance.now() - start;

    expect(result).toBe(true);
    expect(duration).toBeLessThan(100); // 100ms budget
  });
});

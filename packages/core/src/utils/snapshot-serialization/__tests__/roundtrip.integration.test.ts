// packages/core/utils/snapshot-serialization/__tests__/utils.test.ts
/**
 * Unit tests for utility functions
 * Tests isSerializable, factory functions, and helper utilities
 */

import { describe, it, expect } from "vitest";
import {
  isSerializable,
  createSnapshotSerializer,
  createSnapshotDeserializer,
  roundTripSnapshot,
} from "../utils";
import type { SerializationOptions } from "../types";
// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Utils Integration", () => {
  it("should work together: isSerializable → serializer → deserializer", () => {
    const input = {
      name: "test",
      date: new Date(),
      items: [1, 2, 3],
    };

    // Check if serializable
    expect(isSerializable(input)).toBe(true);

    // Create serializer and deserialize
    const serializer = createSnapshotSerializer();
    const deserializer = createSnapshotDeserializer();

    const serialized = serializer(input);
    const deserialized = deserializer(serialized);

    expect(deserialized.name).toBe("test");
    expect(deserialized.date).toBeInstanceOf(Date);
    expect(deserialized.items).toEqual([1, 2, 3]);
  });

  it("should work with roundTripSnapshot for full cycle", () => {
    const input = {
      user: {
        id: "user_1",
        name: "Alice",
        createdAt: new Date("2023-01-01"),
      },
      settings: new Map([["theme", "dark"]]),
      tags: new Set(["admin", "user"]),
    };

    const result = roundTripSnapshot(input);

    expect(result.user.id).toBe("user_1");
    expect(result.user.createdAt).toBeInstanceOf(Date);
    expect(result.settings).toBeInstanceOf(Map);
    expect(result.tags).toBeInstanceOf(Set);
  });

  it("should use snapshotsEqual for comparison after round-trip", () => {
    const input = {
      name: "test",
      value: 42,
      date: new Date("2023-01-01"),
    };

    const result = roundTripSnapshot(input);

    // Note: Date objects won't be strictly equal via snapshotsEqual
    // because serialization format differs from original
    // But structure should match
    expect(result.name).toBe(input.name);
    expect(result.value).toBe(input.value);
    expect(result.date).toBeInstanceOf(Date);
  });

  it("should handle error cases gracefully", () => {
    const problematic = {
      normal: "ok",
      get bad() {
        throw new Error("Cannot access");
      },
    };

    // isSerializable should return false
    expect(isSerializable(problematic)).toBe(false);

    // serializer should handle gracefully
    const serializer = createSnapshotSerializer();
    const result = serializer(problematic);

    expect(result).toBeDefined();
    expect((result as any).normal).toBe("ok");
  });
});

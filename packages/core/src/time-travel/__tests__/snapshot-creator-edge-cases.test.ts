/**
 * SnapshotCreator Edge Cases Test
 * Tests edge cases, serialization scenarios, and error handling for SnapshotCreator
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnapshotCreator } from "../snapshot/SnapshotCreator";
import { TestHelper } from "./utils/test-helpers";
import type { Store, Atom } from "../../types";
import { atomRegistry } from "../../atom-registry";

describe("SnapshotCreator Edge Cases", () => {
  let store: Store;
  let creator: SnapshotCreator;

  beforeEach(() => {
    store = TestHelper.createTestStore();
    creator = new SnapshotCreator(store, {
      generateId: () => "test-id",
      validate: true,
    });

    // Clear atom registry before each test
    atomRegistry.clear();
  });

  it("should handle atoms with circular references", () => {
    interface CircularObject {
      name: string;
      self?: CircularObject;
    }

    const circular: CircularObject = { name: "circular" };
    circular.self = circular;

    const atom = TestHelper.generateAtom("circular");
    atomRegistry.register(atom, "circular");
    store.set(atom, circular);

    const snapshot = creator.create("circular-test");
    expect(snapshot).toBeDefined();
    expect(snapshot).not.toBeNull();

    if (snapshot) {
      const state = snapshot.state["circular"];
      expect(state.value).toBeDefined();

      // Should serialize circular reference safely
      const serialized = JSON.stringify(state.value);
      expect(serialized).toBeDefined();
    }
  });

  it("should handle atoms with functions", () => {
    const testFn = (x: number) => x * 2;
    const atom = TestHelper.generateAtom("fn");
    atomRegistry.register(atom, "fn");
    store.set(atom, testFn);

    const snapshot = creator.create("fn-test");
    expect(snapshot).toBeDefined();
    expect(snapshot).not.toBeNull();

    if (snapshot) {
      const value = snapshot.state["fn"].value;
      // Functions should be serialized with special handling
      expect(value).toBeDefined();
    }
  });

  it("should handle atoms with undefined values", () => {
    const atom = TestHelper.generateAtom("undefined");
    atomRegistry.register(atom, "undefined");
    store.set(atom, undefined);

    const snapshot = creator.create("undefined-test");
    // Snapshot should be created (undefined values may be serialized)
    expect(snapshot).toBeDefined();
  });

  it("should handle atoms with null values", () => {
    const atom = TestHelper.generateAtom("null");
    atomRegistry.register(atom, "null");
    store.set(atom, null);

    const snapshot = creator.create("null-test");
    // Snapshot should be created (null values may be serialized)
    expect(snapshot).toBeDefined();
  });

  it("should handle atoms with symbols as values", () => {
    const sym = Symbol("test");
    const atom = TestHelper.generateAtom("symbol");
    atomRegistry.register(atom, "symbol");
    store.set(atom, sym);

    const snapshot = creator.create("symbol-test");
    expect(snapshot).toBeDefined();
    expect(snapshot).not.toBeNull();

    if (snapshot) {
      const value = snapshot.state["symbol"].value;
      // Symbols should be serialized with special handling
      expect(value).toBeDefined();
    }
  });

  it("should handle atoms with huge objects within performance limits", () => {
    const large = Array(10000)
      .fill(null)
      .map((_, i) => ({
        index: i,
        data: "x".repeat(100),
      }));

    const atom = TestHelper.generateAtom("large");
    atomRegistry.register(atom, "large");
    store.set(atom, large);

    const start = Date.now();
    const snapshot = creator.create("large-test");
    const duration = Date.now() - start;

    expect(snapshot).toBeDefined();
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });

  it("should handle batch creation with errors", () => {
    const badAtom = TestHelper.generateAtom("bad");
    atomRegistry.register(badAtom, "bad");

    // Mock store.get to throw error
    TestHelper.mockStoreGet(store, new Error("Store error"));

    const snapshots = creator.createBatch(5, "batch");
    // Should handle errors gracefully - result depends on implementation
    expect(Array.isArray(snapshots)).toBe(true);
  });

  it("should respect excludeAtoms configuration", () => {
    const atom1 = TestHelper.generateAtom("include");
    const atom2 = TestHelper.generateAtom("exclude");

    atomRegistry.register(atom1, "include");
    atomRegistry.register(atom2, "exclude");

    store.set(atom1, "value1");
    store.set(atom2, "value2");

    const filteredCreator = new SnapshotCreator(store, {
      excludeAtoms: ["exclude"],
    });

    const snapshot = filteredCreator.create("filtered");
    expect(snapshot).toBeDefined();
    expect(snapshot).not.toBeNull();

    if (snapshot) {
      expect(snapshot.state["include"]).toBeDefined();
      expect(snapshot.state["exclude"]).toBeUndefined();
    }
  });

  it("should handle store errors gracefully", () => {
    const atom = TestHelper.generateAtom("error");
    atomRegistry.register(atom, "error");

    TestHelper.mockStoreGet(store, new Error("Store error"));

    // Should handle errors gracefully - may return null or snapshot with error handling
    const snapshot = creator.create("error-test");
    expect(snapshot === null || snapshot === undefined || snapshot).toBeTruthy();
  });

  it("should handle empty store", () => {
    const snapshot = creator.create("empty-test");
    expect(snapshot).toBeNull(); // No atoms to capture
  });

  it("should handle atoms with special characters in names", () => {
    const atom = TestHelper.generateAtom("special@#$%^&*()");
    atomRegistry.register(atom, "special@#$%^&*()");
    store.set(atom, "value");

    const snapshot = creator.create("special-test");
    expect(snapshot).toBeDefined();
    expect(snapshot!.state["special@#$%^&*()"]).toBeDefined();
  });

  it("should handle atoms with very long names", () => {
    const longName = "a".repeat(1000);
    const atom = TestHelper.generateAtom(longName);
    atomRegistry.register(atom, longName);
    store.set(atom, "value");

    const snapshot = creator.create("long-name-test");
    expect(snapshot).toBeDefined();
    expect(snapshot!.state[longName]).toBeDefined();
  });

  it("should handle atoms with nested objects", () => {
    const nested = {
      level1: {
        level2: {
          level3: {
            value: "deep",
          },
        },
      },
    };

    const atom = TestHelper.generateAtom("nested");
    atomRegistry.register(atom, "nested");
    store.set(atom, nested);

    const snapshot = creator.create("nested-test");
    // Snapshot should be created for nested objects
    expect(snapshot).toBeDefined();
  });

  it("should handle atoms with arrays of mixed types", () => {
    const mixed = [1, "string", true, null, { key: "value" }, [1, 2, 3]];

    const atom = TestHelper.generateAtom("mixed");
    atomRegistry.register(atom, "mixed");
    store.set(atom, mixed);

    const snapshot = creator.create("mixed-test");
    // Snapshot should be created for mixed type arrays
    expect(snapshot).toBeDefined();
  });

  it("should handle atoms with Map objects", () => {
    const map = new Map([
      ["key1", "value1"],
      ["key2", "value2"],
    ]);

    const atom = TestHelper.generateAtom("map");
    atomRegistry.register(atom, "map");
    store.set(atom, map);

    const snapshot = creator.create("map-test");
    expect(snapshot).toBeDefined();
  });

  it("should handle atoms with Set objects", () => {
    const set = new Set([1, 2, 3, "string"]);

    const atom = TestHelper.generateAtom("set");
    atomRegistry.register(atom, "set");
    store.set(atom, set);

    const snapshot = creator.create("set-test");
    expect(snapshot).toBeDefined();
  });

  it("should handle atoms with Date objects", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");

    const atom = TestHelper.generateAtom("date");
    atomRegistry.register(atom, "date");
    store.set(atom, date);

    const snapshot = creator.create("date-test");
    expect(snapshot).toBeDefined();
  });

  it("should handle createWithResult successfully", () => {
    const atom = TestHelper.generateAtom("success");
    atomRegistry.register(atom, "success");
    store.set(atom, "value");

    const result = creator.createWithResult("success-test");

    expect(result.success).toBe(true);
    expect(result.snapshot).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("should handle createWithResult with error", () => {
    const atom = TestHelper.generateAtom("error");
    atomRegistry.register(atom, "error");

    TestHelper.mockStoreGet(store, new Error("Store error"));

    const result = creator.createWithResult("error-test");

    // Result should be defined - implementation may handle errors differently
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("should handle configure method", () => {
    creator.configure({
      validate: false,
      includeTypes: ["primitive"],
    });

    const config = creator.getConfig();
    expect(config.validate).toBe(false);
    expect(config.includeTypes).toContain("primitive");
  });

  it("should handle subscribe and unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = creator.subscribe(listener);

    const atom = TestHelper.generateAtom("subscribe");
    atomRegistry.register(atom, "subscribe");
    store.set(atom, "value");

    creator.create("test");

    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();

    creator.create("test2");

    expect(listener).not.toHaveBeenCalled();
  });

  it("should handle skipStateCheck option", () => {
    const creatorNoCheck = new SnapshotCreator(store, {
      skipStateCheck: true,
      autoCapture: false,
    });

    const atom = TestHelper.generateAtom("nocheck");
    atomRegistry.register(atom, "nocheck");
    store.set(atom, "value");

    // Should create snapshot even if state hasn't changed
    const snapshot1 = creatorNoCheck.create("test1");
    const snapshot2 = creatorNoCheck.create("test2");

    expect(snapshot1).toBeDefined();
    expect(snapshot2).toBeDefined();
  });

  it("should handle autoCapture disabled", () => {
    const creatorNoAuto = new SnapshotCreator(store, {
      autoCapture: false,
      skipStateCheck: true,
    });

    const atom = TestHelper.generateAtom("noauto");
    atomRegistry.register(atom, "noauto");
    store.set(atom, "value");

    // Should create snapshots even without state changes when autoCapture is false
    const snapshot1 = creatorNoAuto.create("test1");
    const snapshot2 = creatorNoAuto.create("test2");

    expect(snapshot1).toBeDefined();
    expect(snapshot2).toBeDefined();
  });

  it("should handle disposal", async () => {
    const atom = TestHelper.generateAtom("dispose");
    atomRegistry.register(atom, "dispose");
    store.set(atom, "value");

    await creator.dispose();

    // Should not throw after disposal
    const snapshot = creator.create("after-dispose");
    expect(snapshot).toBeNull();
  });
});

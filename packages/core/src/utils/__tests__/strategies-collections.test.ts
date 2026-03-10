import { describe, it, expect } from "vitest";
import { CollectionsStrategy } from "../snapshot-serialization/advanced/strategies/collections-strategy";

describe("CollectionsStrategy - canHandle", () => {
  const strategy = new CollectionsStrategy();

  it("should handle array", () => {
    expect(strategy.canHandle([])).toBe(true);
    expect(strategy.canHandle([1, 2, 3])).toBe(true);
  });

  it("should handle TypedArray", () => {
    expect(strategy.canHandle(new Uint8Array([1, 2, 3]))).toBe(true);
    expect(strategy.canHandle(new Int16Array([1, 2, 3]))).toBe(true);
    expect(strategy.canHandle(new Float32Array([1, 2, 3]))).toBe(true);
  });

  it("should handle ArrayBuffer", () => {
    expect(strategy.canHandle(new ArrayBuffer(8))).toBe(true);
  });

  it("should not handle plain object", () => {
    expect(strategy.canHandle({})).toBe(false);
  });

  it("should not handle Map", () => {
    expect(strategy.canHandle(new Map())).toBe(false);
  });

  it("should not handle Set", () => {
    expect(strategy.canHandle(new Set())).toBe(false);
  });
});

describe("CollectionsStrategy - serialize Array", () => {
  const strategy = new CollectionsStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100 },
    refCounter: 0,
  };

  it("should serialize empty array", () => {
    const result = strategy.serialize([], context);
    expect(result.__serializedType).toBe("array");
    expect(result.values).toEqual([]);
  });

  it("should serialize array with primitives", () => {
    const result = strategy.serialize([1, "two", true], context);
    expect(result.__serializedType).toBe("array");
    expect(result.values).toEqual([1, "two", true]);
  });

  it("should serialize nested array", () => {
    const result = strategy.serialize([[1, 2], [3, 4]], context);
    expect(result.__serializedType).toBe("array");
    expect(result.values).toHaveLength(2);
  });
});

describe("CollectionsStrategy - serialize TypedArray", () => {
  const strategy = new CollectionsStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100 },
    refCounter: 0,
  };

  it("should serialize Uint8Array", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const result = strategy.serialize(arr, context);
    expect(result.__serializedType).toBe("typedarray");
    expect(result.__className).toBe("Uint8Array");
    expect(result.length).toBe(3);
  });

  it("should serialize Int16Array", () => {
    const arr = new Int16Array([10, 20, 30]);
    const result = strategy.serialize(arr, context);
    expect(result.__serializedType).toBe("typedarray");
    expect(result.__className).toBe("Int16Array");
  });

  it("should serialize Float32Array", () => {
    const arr = new Float32Array([1.5, 2.5, 3.5]);
    const result = strategy.serialize(arr, context);
    expect(result.__serializedType).toBe("typedarray");
    expect(result.__className).toBe("Float32Array");
  });
});

describe("CollectionsStrategy - serialize ArrayBuffer", () => {
  const strategy = new CollectionsStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100 },
    refCounter: 0,
  };

  it("should serialize ArrayBuffer", () => {
    const buffer = new ArrayBuffer(8);
    const result = strategy.serialize(buffer, context);
    expect(result.__serializedType).toBe("arraybuffer");
    expect(result.data).toBeDefined();
  });
});

describe("CollectionsStrategy - deserialize", () => {
  const strategy = new CollectionsStrategy();

  it("should deserialize array", () => {
    const serialized = {
      __serializedType: "array",
      values: [1, 2, 3],
    };
    const result = strategy.deserialize?.(serialized);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should deserialize empty array", () => {
    const serialized = {
      __serializedType: "array",
      values: [],
    };
    const result = strategy.deserialize?.(serialized);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });
});

describe("CollectionsStrategy - edge cases", () => {
  const strategy = new CollectionsStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100 },
    refCounter: 0,
  };

  it("should handle array with null values", () => {
    const result = strategy.serialize([null, undefined, 1], context);
    expect(result.values).toContain(null);
  });

  it("should handle large array", () => {
    const largeArray = new Array(1000).fill(42);
    const result = strategy.serialize(largeArray, context);
    expect(result.values).toHaveLength(1000);
  });
});

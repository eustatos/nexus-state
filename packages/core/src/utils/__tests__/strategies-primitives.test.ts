import { describe, it, expect } from "vitest";
import { PrimitivesStrategy } from "../snapshot-serialization/advanced/strategies/primitives-strategy";

describe("PrimitivesStrategy - canHandle", () => {
  const strategy = new PrimitivesStrategy();

  it("should handle null", () => {
    expect(strategy.canHandle(null)).toBe(true);
  });

  it("should handle undefined", () => {
    expect(strategy.canHandle(undefined)).toBe(true);
  });

  it("should handle string", () => {
    expect(strategy.canHandle("test")).toBe(true);
  });

  it("should handle number", () => {
    expect(strategy.canHandle(42)).toBe(true);
    expect(strategy.canHandle(NaN)).toBe(true);
    expect(strategy.canHandle(Infinity)).toBe(true);
  });

  it("should handle boolean", () => {
    expect(strategy.canHandle(true)).toBe(true);
    expect(strategy.canHandle(false)).toBe(true);
  });

  it("should handle bigint", () => {
    expect(strategy.canHandle(BigInt(123))).toBe(true);
  });

  it("should handle symbol", () => {
    expect(strategy.canHandle(Symbol("test"))).toBe(true);
  });

  it("should not handle object", () => {
    expect(strategy.canHandle({})).toBe(false);
  });

  it("should not handle array", () => {
    expect(strategy.canHandle([])).toBe(false);
  });
});

describe("PrimitivesStrategy - serialize", () => {
  const strategy = new PrimitivesStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100 },
    refCounter: 0,
  };

  it("should serialize null", () => {
    const result = strategy.serialize(null, context);
    expect(result).toEqual({ __serializedType: "null" });
  });

  it("should serialize undefined", () => {
    const result = strategy.serialize(undefined, context);
    expect(result).toEqual({ __serializedType: "undefined" });
  });

  it("should serialize bigint", () => {
    const result = strategy.serialize(BigInt(123), context);
    expect(result).toEqual({ __serializedType: "bigint", value: "123" });
  });

  it("should serialize symbol", () => {
    const sym = Symbol("test");
    const result = strategy.serialize(sym, context);
    expect(result.__serializedType).toBe("symbol");
    expect(result.description).toBe("test");
  });

  it("should serialize string directly", () => {
    const result = strategy.serialize("test", context);
    expect(result).toBe("test");
  });

  it("should serialize number directly", () => {
    const result = strategy.serialize(42, context);
    expect(result).toBe(42);
  });

  it("should serialize boolean directly", () => {
    const result = strategy.serialize(true, context);
    expect(result).toBe(true);
  });
});

describe("PrimitivesStrategy - deserialize", () => {
  const strategy = new PrimitivesStrategy();

  it("should deserialize null", () => {
    const result = strategy.deserialize?.({ __serializedType: "null" });
    expect(result).toBe(null);
  });

  it("should deserialize undefined", () => {
    const result = strategy.deserialize?.({ __serializedType: "undefined" });
    expect(result).toBe(undefined);
  });

  it("should deserialize bigint", () => {
    const result = strategy.deserialize?.({
      __serializedType: "bigint",
      value: "123",
    });
    expect(result).toBe(BigInt(123));
  });

  it("should deserialize symbol", () => {
    const result = strategy.deserialize?.({
      __serializedType: "symbol",
      description: "test",
    });
    expect(typeof result).toBe("symbol");
    expect(result.description).toBe("test");
  });

  it("should deserialize symbol without description", () => {
    const result = strategy.deserialize?.({
      __serializedType: "symbol",
      description: undefined,
    });
    expect(typeof result).toBe("symbol");
  });

  it("should deserialize primitive directly", () => {
    const result = strategy.deserialize?.(42);
    expect(result).toBe(42);
  });
});

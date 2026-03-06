import { describe, it, expect } from "vitest";
import { BuiltInObjectsStrategy } from "../snapshot-serialization/advanced/strategies/builtin-objects-strategy";

describe("BuiltInObjectsStrategy - canHandle", () => {
  const strategy = new BuiltInObjectsStrategy();

  it("should handle Date", () => {
    expect(strategy.canHandle(new Date())).toBe(true);
  });

  it("should handle RegExp", () => {
    expect(strategy.canHandle(/test/)).toBe(true);
  });

  it("should handle Error", () => {
    expect(strategy.canHandle(new Error("test"))).toBe(true);
  });

  it("should handle Map", () => {
    expect(strategy.canHandle(new Map())).toBe(true);
  });

  it("should handle Set", () => {
    expect(strategy.canHandle(new Set())).toBe(true);
  });

  it("should handle WeakMap", () => {
    expect(strategy.canHandle(new WeakMap())).toBe(true);
  });

  it("should handle WeakSet", () => {
    expect(strategy.canHandle(new WeakSet())).toBe(true);
  });

  it("should handle Promise", () => {
    expect(strategy.canHandle(Promise.resolve())).toBe(true);
  });

  it("should not handle plain object", () => {
    expect(strategy.canHandle({})).toBe(false);
  });

  it("should not handle array", () => {
    expect(strategy.canHandle([])).toBe(false);
  });
});

describe("BuiltInObjectsStrategy - serialize Date", () => {
  const strategy = new BuiltInObjectsStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100 },
    refCounter: 0,
  };

  it("should serialize valid Date", () => {
    const date = new Date("2023-01-01T00:00:00.000Z");
    const result = strategy.serialize(date, context);
    expect(result.__serializedType).toBe("date");
    expect(result.value).toBe("2023-01-01T00:00:00.000Z");
  });

  it("should serialize invalid Date", () => {
    const date = new Date("invalid");
    const result = strategy.serialize(date, context);
    expect(result.__serializedType).toBe("date");
    expect(result.value).toBeDefined();
  });
});

describe("BuiltInObjectsStrategy - serialize RegExp", () => {
  const strategy = new BuiltInObjectsStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100 },
    refCounter: 0,
  };

  it("should serialize RegExp", () => {
    const regex = /test/gi;
    const result = strategy.serialize(regex, context);
    expect(result.__serializedType).toBe("regexp");
    expect(result.source).toBe("test");
    expect(result.flags).toBe("gi");
  });
});

describe("BuiltInObjectsStrategy - serialize Error", () => {
  const strategy = new BuiltInObjectsStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100 },
    refCounter: 0,
  };

  it("should serialize Error", () => {
    const error = new Error("Test error");
    const result = strategy.serialize(error, context);
    expect(result.__serializedType).toBe("error");
    expect(result.name).toBe("Error");
    expect(result.message).toBe("Test error");
  });
});

describe("BuiltInObjectsStrategy - serialize Map", () => {
  const strategy = new BuiltInObjectsStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100 },
    refCounter: 0,
  };

  it("should serialize empty Map", () => {
    const map = new Map();
    const result = strategy.serialize(map, context);
    expect(result.__serializedType).toBe("map");
    expect(result.entries).toEqual([]);
  });

  it("should serialize Map with values", () => {
    const map = new Map([["key", "value"]]);
    const result = strategy.serialize(map, context);
    expect(result.__serializedType).toBe("map");
    expect(result.entries).toHaveLength(1);
  });
});

describe("BuiltInObjectsStrategy - serialize Set", () => {
  const strategy = new BuiltInObjectsStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100 },
    refCounter: 0,
  };

  it("should serialize empty Set", () => {
    const set = new Set();
    const result = strategy.serialize(set, context);
    expect(result.__serializedType).toBe("set");
    expect(result.values).toEqual([]);
  });

  it("should serialize Set with values", () => {
    const set = new Set([1, 2, 3]);
    const result = strategy.serialize(set, context);
    expect(result.__serializedType).toBe("set");
    expect(result.values).toHaveLength(3);
  });
});

describe("BuiltInObjectsStrategy - deserialize", () => {
  const strategy = new BuiltInObjectsStrategy();

  it("should deserialize Date", () => {
    const serialized = {
      __serializedType: "date",
      value: "2023-01-01T00:00:00.000Z",
    };
    const result = strategy.deserialize?.(serialized);
    expect(result).toBeInstanceOf(Date);
  });

  it("should deserialize RegExp", () => {
    const serialized = {
      __serializedType: "regexp",
      source: "test",
      flags: "gi",
    };
    const result = strategy.deserialize?.(serialized);
    expect(result).toBeInstanceOf(RegExp);
  });

  it("should deserialize Map", () => {
    const serialized = {
      __serializedType: "map",
      entries: [["key", "value"]],
    };
    const result = strategy.deserialize?.(serialized);
    expect(result).toBeInstanceOf(Map);
  });

  it("should deserialize Set", () => {
    const serialized = {
      __serializedType: "set",
      values: [1, 2, 3],
    };
    const result = strategy.deserialize?.(serialized);
    expect(result).toBeInstanceOf(Set);
  });
});

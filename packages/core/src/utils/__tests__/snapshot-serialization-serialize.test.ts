import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../snapshot-serialization/serialize";

describe("snapshotSerialization - primitives", () => {
  it("should serialize null", () => {
    expect(snapshotSerialization(null)).toBe(null);
  });

  it("should serialize undefined", () => {
    expect(snapshotSerialization(undefined)).toBe(undefined);
  });

  it("should serialize boolean", () => {
    expect(snapshotSerialization(true)).toBe(true);
    expect(snapshotSerialization(false)).toBe(false);
  });

  it("should serialize number", () => {
    expect(snapshotSerialization(42)).toBe(42);
    expect(snapshotSerialization(0)).toBe(0);
    expect(snapshotSerialization(-1)).toBe(-1);
  });

  it("should serialize string", () => {
    expect(snapshotSerialization("test")).toBe("test");
    expect(snapshotSerialization("")).toBe("");
  });

  it("should serialize bigint", () => {
    const result = snapshotSerialization(BigInt(123));
    expect(result).toEqual({ __type: "BigInt", value: "123" });
  });
});

describe("snapshotSerialization - Date", () => {
  it("should serialize valid Date", () => {
    const date = new Date("2023-01-01T00:00:00.000Z");
    const result = snapshotSerialization(date);
    expect(result).toEqual({
      __type: "Date",
      value: "2023-01-01T00:00:00.000Z",
    });
  });

  it("should serialize invalid Date", () => {
    const date = new Date("invalid");
    const result = snapshotSerialization(date);
    expect(result.__type).toBe("Date");
    expect(result.value).toBeDefined();
  });
});

describe("snapshotSerialization - RegExp", () => {
  it("should serialize RegExp", () => {
    const regex = /test/gi;
    const result = snapshotSerialization(regex);
    expect(result).toEqual({
      __type: "RegExp",
      source: "test",
      flags: "gi",
    });
  });

  it("should serialize RegExp without flags", () => {
    const regex = /test/;
    const result = snapshotSerialization(regex);
    expect(result).toEqual({
      __type: "RegExp",
      source: "test",
      flags: "",
    });
  });
});

describe("snapshotSerialization - Error", () => {
  it("should serialize Error", () => {
    const error = new Error("Test error");
    const result = snapshotSerialization(error);
    expect(result.__type).toBe("Error");
    expect(result.name).toBe("Error");
    expect(result.message).toBe("Test error");
    expect(result.stack).toBeDefined();
  });

  it("should serialize custom Error", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }
    const error = new CustomError("Custom");
    const result = snapshotSerialization(error);
    expect(result.__type).toBe("Error");
    expect(result.name).toBe("CustomError");
  });
});

describe("snapshotSerialization - Function", () => {
  it("should serialize named function", () => {
    const fn = function test() {
      return 42;
    };
    const result = snapshotSerialization(fn);
    expect(result.__type).toBe("Function");
    expect(result.name).toBe("test");
    expect(result.source).toBeDefined();
  });

  it("should serialize arrow function", () => {
    const fn = (x: number) => x * 2;
    const result = snapshotSerialization(fn);
    expect(result.__type).toBe("Function");
    expect(result.source).toContain("=>");
  });

  it("should serialize anonymous function", () => {
    const fn = function named() {
      return 1;
    };
    const result = snapshotSerialization(fn);
    expect(result.__type).toBe("Function");
    expect(result.name).toBeDefined();
  });
});

describe("snapshotSerialization - Map", () => {
  it("should serialize empty Map", () => {
    const map = new Map();
    const result = snapshotSerialization(map);
    expect(result.__type).toBe("Map");
    expect(result.entries).toEqual([]);
  });

  it("should serialize Map with primitive values", () => {
    const map = new Map([
      ["key1", "value1"],
      ["key2", 42],
    ]);
    const result = snapshotSerialization(map);
    expect(result.__type).toBe("Map");
    expect(Array.isArray(result.entries)).toBe(true);
  });

  it("should serialize Map with object values", () => {
    const map = new Map([["key", { nested: true }]]);
    const result = snapshotSerialization(map);
    expect(result.__type).toBe("Map");
    expect(Array.isArray(result.entries)).toBe(true);
  });
});

describe("snapshotSerialization - Set", () => {
  it("should serialize empty Set", () => {
    const set = new Set();
    const result = snapshotSerialization(set);
    expect(result.__type).toBe("Set");
    expect(result.values).toEqual([]);
  });

  it("should serialize Set with values", () => {
    const set = new Set([1, 2, 3]);
    const result = snapshotSerialization(set);
    expect(result.__type).toBe("Set");
    expect(Array.isArray(result.values)).toBe(true);
  });

  it("should serialize Set with objects", () => {
    const set = new Set([{ a: 1 }]);
    const result = snapshotSerialization(set);
    expect(result.__type).toBe("Set");
    expect(Array.isArray(result.values)).toBe(true);
  });
});

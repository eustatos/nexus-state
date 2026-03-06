import { describe, it, expect } from "vitest";
import { deserializeSnapshot } from "../snapshot-serialization/deserialize";
import { SerializedValue } from "../snapshot-serialization/types";

describe("deserializeSnapshot - primitives", () => {
  it("should deserialize null", () => {
    expect(deserializeSnapshot(null)).toBe(null);
  });

  it("should deserialize undefined", () => {
    expect(deserializeSnapshot(undefined)).toBe(undefined);
  });

  it("should deserialize boolean", () => {
    expect(deserializeSnapshot(true)).toBe(true);
    expect(deserializeSnapshot(false)).toBe(false);
  });

  it("should deserialize number", () => {
    expect(deserializeSnapshot(42)).toBe(42);
    expect(deserializeSnapshot(0)).toBe(0);
    expect(deserializeSnapshot(-1)).toBe(-1);
  });

  it("should deserialize string", () => {
    expect(deserializeSnapshot("test")).toBe("test");
    expect(deserializeSnapshot("")).toBe("");
  });
});

describe("deserializeSnapshot - BigInt", () => {
  it("should deserialize BigInt", () => {
    const serialized: SerializedValue = { __type: "BigInt", value: "123" };
    const result = deserializeSnapshot(serialized);
    expect(result).toBe(BigInt(123));
  });
});

describe("deserializeSnapshot - Date", () => {
  it("should deserialize Date", () => {
    const serialized: SerializedValue = {
      __type: "Date",
      value: "2023-01-01T00:00:00.000Z",
    };
    const result = deserializeSnapshot(serialized);
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).toISOString()).toBe("2023-01-01T00:00:00.000Z");
  });

  it("should return undefined for invalid Date serialization", () => {
    const serialized: SerializedValue = { __type: "Date" } as any;
    const result = deserializeSnapshot(serialized);
    expect(result).toBeUndefined();
  });
});

describe("deserializeSnapshot - RegExp", () => {
  it("should deserialize RegExp", () => {
    const serialized: SerializedValue = {
      __type: "RegExp",
      source: "test",
      flags: "gi",
    };
    const result = deserializeSnapshot(serialized);
    expect(result).toBeInstanceOf(RegExp);
    expect((result as RegExp).source).toBe("test");
    expect((result as RegExp).flags).toBe("gi");
  });

  it("should deserialize RegExp without flags", () => {
    const serialized: SerializedValue = {
      __type: "RegExp",
      source: "test",
    };
    const result = deserializeSnapshot(serialized);
    expect((result as RegExp).source).toBe("test");
    expect((result as RegExp).flags).toBe("");
  });
});

describe("deserializeSnapshot - Error", () => {
  it("should deserialize Error", () => {
    const serialized: SerializedValue = {
      __type: "Error",
      name: "Error",
      message: "Test error",
    };
    const result = deserializeSnapshot(serialized);
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toBe("Test error");
  });

  it("should deserialize Error with stack", () => {
    const serialized: SerializedValue = {
      __type: "Error",
      name: "Error",
      message: "Test",
      stack: "Error: Test\n    at test.js:1:1",
    };
    const result = deserializeSnapshot(serialized);
    expect((result as Error).stack).toContain("Error: Test");
  });
});

describe("deserializeSnapshot - Function", () => {
  it("should deserialize Function as null", () => {
    const serialized: SerializedValue = {
      __type: "Function",
      name: "test",
      source: "function test() {}",
    };
    const result = deserializeSnapshot(serialized);
    expect(result).toBeNull();
  });
});

describe("deserializeSnapshot - MaxDepthExceeded", () => {
  it("should deserialize MaxDepthExceeded marker", () => {
    const serialized: SerializedValue = {
      __type: "MaxDepthExceeded",
      __message: "Max depth reached",
    };
    const result = deserializeSnapshot(serialized);
    expect(result).toEqual({ __maxDepthExceeded: "Max depth reached" });
  });
});

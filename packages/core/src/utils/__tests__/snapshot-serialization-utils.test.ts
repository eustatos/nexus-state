import { describe, it, expect } from "vitest";
import {
  isSerializable,
  createSnapshotSerializer,
  createSnapshotDeserializer,
  roundTripSnapshot,
  snapshotsEqual,
} from "../snapshot-serialization/utils";

describe("isSerializable - primitives", () => {
  it("should return true for null", () => {
    expect(isSerializable(null)).toBe(true);
  });

  it("should return true for undefined", () => {
    expect(isSerializable(undefined)).toBe(true);
  });

  it("should return true for boolean", () => {
    expect(isSerializable(true)).toBe(true);
    expect(isSerializable(false)).toBe(true);
  });

  it("should return true for number", () => {
    expect(isSerializable(42)).toBe(true);
    expect(isSerializable(0)).toBe(true);
    expect(isSerializable(NaN)).toBe(true);
    expect(isSerializable(Infinity)).toBe(true);
  });

  it("should return true for string", () => {
    expect(isSerializable("test")).toBe(true);
    expect(isSerializable("")).toBe(true);
  });

  it("should return true for bigint", () => {
    expect(isSerializable(BigInt(123))).toBe(true);
  });
});

describe("isSerializable - special types", () => {
  it("should return true for Date", () => {
    expect(isSerializable(new Date())).toBe(true);
  });

  it("should return true for RegExp", () => {
    expect(isSerializable(/test/)).toBe(true);
  });

  it("should return true for Error", () => {
    expect(isSerializable(new Error("test"))).toBe(true);
  });

  it("should return true for function", () => {
    expect(isSerializable(() => {})).toBe(true);
    expect(isSerializable(function () {})).toBe(true);
  });
});

describe("isSerializable - containers", () => {
  it("should return true for empty array", () => {
    expect(isSerializable([])).toBe(true);
  });

  it("should return true for array with primitives", () => {
    expect(isSerializable([1, "two", true])).toBe(true);
  });

  it("should return true for empty object", () => {
    expect(isSerializable({})).toBe(true);
  });

  it("should return true for object with primitives", () => {
    expect(isSerializable({ a: 1, b: "test" })).toBe(true);
  });

  it("should return true for Map", () => {
    expect(isSerializable(new Map())).toBe(true);
  });

  it("should return true for Set", () => {
    expect(isSerializable(new Set())).toBe(true);
  });
});

describe("isSerializable - depth limit", () => {
  it("should return false when depth exceeded", () => {
    const deepObj = { a: { b: { c: { d: "deep" } } } };
    expect(isSerializable(deepObj, { maxDepth: 2 }, 0)).toBe(false);
  });

  it("should return true when within depth", () => {
    const deepObj = { a: { b: { c: "ok" } } };
    expect(isSerializable(deepObj, { maxDepth: 3 }, 0)).toBe(true);
  });
});

describe("createSnapshotSerializer", () => {
  it("should create serializer function", () => {
    const serializer = createSnapshotSerializer();
    expect(typeof serializer).toBe("function");
  });

  it("should serialize with custom options", () => {
    const serializer = createSnapshotSerializer({ maxDepth: 1 });
    const result = serializer({ a: { b: 1 } });
    expect(result).toBeDefined();
  });
});

describe("createSnapshotDeserializer", () => {
  it("should create deserializer function", () => {
    const deserializer = createSnapshotDeserializer();
    expect(typeof deserializer).toBe("function");
  });

  it("should deserialize with custom options", () => {
    const deserializer = createSnapshotDeserializer({
      restoreSpecialTypes: true,
    });
    const result = deserializer({ __type: "Date", value: "2023-01-01T00:00:00.000Z" });
    expect(result).toBeInstanceOf(Date);
  });
});

describe("roundTripSnapshot", () => {
  it("should serialize and deserialize primitives", () => {
    expect(roundTripSnapshot(42)).toBe(42);
    expect(roundTripSnapshot("test")).toBe("test");
    expect(roundTripSnapshot(true)).toBe(true);
  });

  it("should serialize and deserialize objects", () => {
    const obj = { a: 1, b: "test" };
    const result = roundTripSnapshot(obj);
    expect(result).toEqual(obj);
  });

  it("should serialize and deserialize arrays", () => {
    const arr = [1, 2, 3];
    const result = roundTripSnapshot(arr);
    expect(result).toEqual(arr);
  });

  it("should serialize and deserialize Date", () => {
    const date = new Date("2023-01-01T00:00:00.000Z");
    const result = roundTripSnapshot(date);
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).getTime()).toBe(date.getTime());
  });

  it("should serialize and deserialize Map", () => {
    const map = new Map([["key", "value"]]);
    const result = roundTripSnapshot(map);
    expect(result).toBeDefined();
  });

  it("should serialize and deserialize Set", () => {
    const set = new Set([1, 2, 3]);
    const result = roundTripSnapshot(set);
    expect(result).toBeDefined();
  });
});

describe("snapshotsEqual", () => {
  it("should compare equal primitives", () => {
    expect(snapshotsEqual(42, 42)).toBe(true);
    expect(snapshotsEqual("test", "test")).toBe(true);
    expect(snapshotsEqual(true, true)).toBe(true);
  });

  it("should compare unequal primitives", () => {
    expect(snapshotsEqual(42, 43)).toBe(false);
    expect(snapshotsEqual("test", "other")).toBe(false);
  });

  it("should compare equal objects", () => {
    expect(snapshotsEqual({ a: 1 }, { a: 1 })).toBe(true);
  });

  it("should compare unequal objects", () => {
    expect(snapshotsEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("should compare equal arrays", () => {
    expect(snapshotsEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it("should compare NaN as equal", () => {
    expect(snapshotsEqual(NaN, NaN)).toBe(true);
  });

  it("should compare equal Dates", () => {
    const date1 = new Date("2023-01-01");
    const date2 = new Date("2023-01-01");
    expect(snapshotsEqual(date1, date2)).toBe(true);
  });

  it("should compare unequal Dates", () => {
    const date1 = new Date("2023-01-01");
    const date2 = new Date("2023-01-02");
    expect(snapshotsEqual(date1, date2)).toBe(false);
  });

  it("should compare equal RegExps", () => {
    expect(snapshotsEqual(/test/gi, /test/gi)).toBe(true);
  });

  it("should compare unequal RegExps", () => {
    expect(snapshotsEqual(/test/g, /test/i)).toBe(false);
  });

  it("should compare equal Maps", () => {
    const map1 = new Map([["key", "value"]]);
    const map2 = new Map([["key", "value"]]);
    expect(snapshotsEqual(map1, map2)).toBe(true);
  });

  it("should compare equal Sets", () => {
    const set1 = new Set([1, 2, 3]);
    const set2 = new Set([1, 2, 3]);
    expect(snapshotsEqual(set1, set2)).toBe(true);
  });
});

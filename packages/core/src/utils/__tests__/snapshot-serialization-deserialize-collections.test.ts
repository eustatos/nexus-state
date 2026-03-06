import { describe, it, expect } from "vitest";
import { deserializeSnapshot } from "../snapshot-serialization/deserialize";
import { SerializedValue } from "../snapshot-serialization/types";

describe("deserializeSnapshot - Map", () => {
  it("should deserialize empty Map", () => {
    const serialized: SerializedValue = { __type: "Map", entries: [] };
    const result = deserializeSnapshot(serialized);
    expect(result).toBeInstanceOf(Map);
    expect((result as Map<any, any>).size).toBe(0);
  });

  it("should deserialize Map with primitive values", () => {
    const serialized: SerializedValue = {
      __type: "Map",
      entries: [
        ["key1", "value1"],
        ["key2", 42],
      ],
    };
    const result = deserializeSnapshot(serialized);
    expect(result).toBeInstanceOf(Map);
    const map = result as Map<string, unknown>;
    expect(map.get("key1")).toBe("value1");
    expect(map.get("key2")).toBe(42);
  });

  it("should deserialize Map with undefined entries", () => {
    const serialized: SerializedValue = { __type: "Map" } as any;
    const result = deserializeSnapshot(serialized);
    expect(result).toBeUndefined();
  });
});

describe("deserializeSnapshot - Set", () => {
  it("should deserialize empty Set", () => {
    const serialized: SerializedValue = { __type: "Set", values: [] };
    const result = deserializeSnapshot(serialized);
    expect(result).toBeInstanceOf(Set);
    expect((result as Set<any>).size).toBe(0);
  });

  it("should deserialize Set with values", () => {
    const serialized: SerializedValue = {
      __type: "Set",
      values: [1, 2, 3],
    };
    const result = deserializeSnapshot(serialized);
    expect(result).toBeInstanceOf(Set);
    const set = result as Set<number>;
    expect(set.has(1)).toBe(true);
    expect(set.has(2)).toBe(true);
    expect(set.has(3)).toBe(true);
  });

  it("should deserialize Set with undefined values", () => {
    const serialized: SerializedValue = { __type: "Set" } as any;
    const result = deserializeSnapshot(serialized);
    expect(result).toBeUndefined();
  });
});

describe("deserializeSnapshot - Array", () => {
  it("should deserialize empty array", () => {
    const serialized: SerializedValue = [];
    const result = deserializeSnapshot(serialized);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  it("should deserialize array with primitives", () => {
    const serialized: SerializedValue = [1, "two", true, null];
    const result = deserializeSnapshot(serialized);
    expect(result).toEqual([1, "two", true, null]);
  });

  it("should deserialize nested arrays", () => {
    const serialized: SerializedValue = [
      [1, 2],
      [3, 4],
    ];
    const result = deserializeSnapshot(serialized);
    expect(result).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("should deserialize array with __type Array", () => {
    const serialized: SerializedValue = {
      __type: "Array",
      __id: "arr_0",
      0: 1,
      1: 2,
      2: 3,
    };
    const result = deserializeSnapshot(serialized);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([1, 2, 3]);
  });
});

describe("deserializeSnapshot - objects", () => {
  it("should deserialize plain object", () => {
    const serialized: SerializedValue = { a: 1, b: "test" };
    const result = deserializeSnapshot(serialized);
    expect(result).toEqual({ a: 1, b: "test" });
  });

  it("should deserialize object with __id", () => {
    const serialized: SerializedValue = {
      __id: "obj_0",
      __type: "Object",
      key: "value",
    };
    const result = deserializeSnapshot(serialized);
    expect(result).toEqual({ key: "value" });
  });

  it("should deserialize nested objects", () => {
    const serialized: SerializedValue = {
      outer: {
        inner: 42,
      },
    };
    const result = deserializeSnapshot(serialized);
    expect(result).toEqual({ outer: { inner: 42 } });
  });
});

describe("deserializeSnapshot - circular references", () => {
  it("should handle circular reference marker", () => {
    const serialized: SerializedValue = {
      __ref: "obj_0",
    };
    const result = deserializeSnapshot(serialized);
    expect(result).toEqual({});
  });

  it("should resolve circular references", () => {
    const serialized: SerializedValue = {
      __id: "obj_0",
      __type: "Object",
      self: { __ref: "obj_0" },
    };
    const result = deserializeSnapshot(serialized);
    const obj = result as any;
    expect(obj.self).toBe(obj);
  });
});

describe("deserializeSnapshot - options", () => {
  it("should not restore special types when restoreSpecialTypes is false", () => {
    const serialized: SerializedValue = {
      __type: "Date",
      value: "2023-01-01T00:00:00.000Z",
    };
    const result = deserializeSnapshot(serialized, {
      restoreSpecialTypes: false,
    });
    expect(result).toEqual(serialized);
  });

  it("should apply custom reviver", () => {
    const serialized: SerializedValue = {
      __type: "CustomType",
      value: "data",
    };
    const result = deserializeSnapshot(serialized, {
      customRevivers: new Map([
        [
          "CustomType",
          (val: any) => `revived:${val.value}`,
        ],
      ]),
    });
    expect(result).toBe("revived:data");
  });
});

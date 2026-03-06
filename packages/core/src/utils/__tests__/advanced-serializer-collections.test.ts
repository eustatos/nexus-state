import { describe, it, expect } from "vitest";
import { AdvancedSerializer } from "../snapshot-serialization/advanced/advanced-serializer";

describe("AdvancedSerializer - Map", () => {
  it("should serialize empty Map", () => {
    const serializer = new AdvancedSerializer();
    const map = new Map();
    const result = serializer.serialize(map);
    expect(result.__serializedType).toBe("map");
    expect(result.entries).toEqual([]);
  });

  it("should serialize Map with primitives", () => {
    const serializer = new AdvancedSerializer();
    const map = new Map([
      ["key1", "value1"],
      ["key2", 42],
    ]);
    const result = serializer.serialize(map);
    expect(result.__serializedType).toBe("map");
    expect(result.entries).toHaveLength(2);
  });

  it("should deserialize Map", () => {
    const serializer = new AdvancedSerializer();
    const map = new Map([["key", "value"]]);
    const serialized = serializer.serialize(map);
    const result = serializer.deserialize(serialized);
    expect(result).toBeInstanceOf(Map);
    expect((result as Map<any, any>).get("key")).toBe("value");
  });
});

describe("AdvancedSerializer - Set", () => {
  it("should serialize empty Set", () => {
    const serializer = new AdvancedSerializer();
    const set = new Set();
    const result = serializer.serialize(set);
    expect(result.__serializedType).toBe("set");
    expect(result.values).toEqual([]);
  });

  it("should serialize Set with values", () => {
    const serializer = new AdvancedSerializer();
    const set = new Set([1, 2, 3]);
    const result = serializer.serialize(set);
    expect(result.__serializedType).toBe("set");
    expect(result.values).toHaveLength(3);
  });

  it("should deserialize Set", () => {
    const serializer = new AdvancedSerializer();
    const set = new Set([1, 2, 3]);
    const serialized = serializer.serialize(set);
    const result = serializer.deserialize(serialized);
    expect(result).toBeInstanceOf(Set);
    expect((result as Set<any>).has(2)).toBe(true);
  });
});

describe("AdvancedSerializer - Array", () => {
  it("should serialize empty array", () => {
    const serializer = new AdvancedSerializer();
    const result = serializer.serialize([]);
    expect(result.__serializedType).toBe("array");
    expect(result.values).toEqual([]);
  });

  it("should serialize array with primitives", () => {
    const serializer = new AdvancedSerializer();
    const result = serializer.serialize([1, "two", true]);
    expect(result.__serializedType).toBe("array");
    expect(result.values).toEqual([1, "two", true]);
  });

  it("should deserialize array", () => {
    const serializer = new AdvancedSerializer();
    const arr = [1, 2, 3];
    const serialized = serializer.serialize(arr);
    const result = serializer.deserialize(serialized);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([1, 2, 3]);
  });
});

describe("AdvancedSerializer - circular references", () => {
  it("should handle circular reference in object", () => {
    const serializer = new AdvancedSerializer();
    const obj: any = { name: "test" };
    obj.self = obj;
    const result = serializer.serialize(obj);
    expect(result.__serializedType).toBe("object");
    expect((result as any).properties.self.value.__serializedType).toBe(
      "reference"
    );
  });

  it("should resolve circular reference on deserialize", () => {
    const serializer = new AdvancedSerializer({ detectCircular: true });
    const obj: any = { name: "test" };
    obj.self = obj;
    const serialized = serializer.serialize(obj);
    const result = serializer.deserialize(serialized);
    const deserializedObj = result as any;
    expect(deserializedObj.self).toBe(deserializedObj);
  });

  it("should handle circular reference in array", () => {
    const serializer = new AdvancedSerializer();
    const arr: any[] = [1, 2];
    arr.push(arr);
    const result = serializer.serialize(arr);
    expect(result.__serializedType).toBe("array");
  });
});

describe("AdvancedSerializer - max depth", () => {
  it("should handle max depth exceeded", () => {
    const serializer = new AdvancedSerializer({ maxDepth: 2 });
    const deepObj = { a: { b: { c: { d: "deep" } } } };
    const result = serializer.serialize(deepObj);
    expect(result.__serializedType).toBe("object");
  });

  it("should serialize within depth limit", () => {
    const serializer = new AdvancedSerializer({ maxDepth: 10 });
    const deepObj = { a: { b: { c: "ok" } } };
    const result = serializer.serialize(deepObj);
    expect(result).toBeDefined();
  });
});

describe("AdvancedSerializer - objects", () => {
  it("should serialize plain object", () => {
    const serializer = new AdvancedSerializer();
    const obj = { a: 1, b: "test" };
    const result = serializer.serialize(obj);
    expect(result.__serializedType).toBe("object");
    expect(result.properties).toBeDefined();
  });

  it("should deserialize plain object", () => {
    const serializer = new AdvancedSerializer();
    const obj = { a: 1, b: "test" };
    const serialized = serializer.serialize(obj);
    const result = serializer.deserialize(serialized);
    expect(result).toEqual({ a: 1, b: "test" });
  });

  it("should serialize nested objects", () => {
    const serializer = new AdvancedSerializer();
    const obj = { outer: { inner: 42 } };
    const result = serializer.serialize(obj);
    expect(result.__serializedType).toBe("object");
  });
});

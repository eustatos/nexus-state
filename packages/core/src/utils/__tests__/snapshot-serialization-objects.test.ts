import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../snapshot-serialization/serialize";

describe("snapshotSerialization - arrays", () => {
  it("should serialize empty array", () => {
    const result = snapshotSerialization([]);
    expect(result).toEqual([]);
  });

  it("should serialize array with primitives", () => {
    const result = snapshotSerialization([1, "two", true, null]);
    expect(result).toEqual([1, "two", true, null]);
  });

  it("should serialize nested arrays", () => {
    const result = snapshotSerialization([[1, 2], [3, 4]]);
    expect(result).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("should serialize array with objects", () => {
    const result = snapshotSerialization([{ a: 1 }, { b: 2 }]);
    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBe(2);
  });
});

describe("snapshotSerialization - objects", () => {
  it("should serialize empty object", () => {
    const result = snapshotSerialization({});
    expect(result).toEqual({
      __id: expect.any(String),
      __type: "Object",
    });
  });

  it("should serialize object with primitives", () => {
    const result = snapshotSerialization({ a: 1, b: "test", c: true });
    expect(result).toEqual({
      __id: expect.any(String),
      __type: "Object",
      a: 1,
      b: "test",
      c: true,
    });
  });

  it("should serialize nested objects", () => {
    const result = snapshotSerialization({ outer: { inner: 42 } });
    expect(result).toEqual({
      __id: expect.any(String),
      __type: "Object",
      outer: {
        __id: expect.any(String),
        __type: "Object",
        inner: 42,
      },
    });
  });

  it("should serialize object with array", () => {
    const result = snapshotSerialization({ arr: [1, 2, 3] });
    expect(result).toEqual({
      __id: expect.any(String),
      __type: "Object",
      arr: [1, 2, 3],
    });
  });
});

describe("snapshotSerialization - circular references", () => {
  it("should handle circular reference in object", () => {
    const obj: any = { name: "test" };
    obj.self = obj;
    const result = snapshotSerialization(obj);
    expect(result.__type).toBe("Object");
    expect((result as any).self).toEqual({ __ref: expect.any(String) });
  });

  it("should handle circular reference in array", () => {
    const arr: any[] = [1, 2];
    arr.push(arr);
    const result = snapshotSerialization(arr);
    expect(Array.isArray(result)).toBe(true);
    expect((result as any[])[2]).toEqual({ __ref: expect.any(String) });
  });

  it("should handle mutual circular references", () => {
    const obj1: any = { name: "obj1" };
    const obj2: any = { name: "obj2" };
    obj1.ref = obj2;
    obj2.ref = obj1;
    const result = snapshotSerialization(obj1);
    expect(result.__type).toBe("Object");
  });
});

describe("snapshotSerialization - max depth", () => {
  it("should respect maxDepth option", () => {
    const deepObj = { level1: { level2: { level3: "deep" } } };
    const result = snapshotSerialization(deepObj, { maxDepth: 2 });
    expect(result.__type).toBe("Object");
  });

  it("should handle maxDepth of 0", () => {
    const obj = { key: "value" };
    const result = snapshotSerialization(obj, { maxDepth: 0 });
    expect(result.__type).toBe("Object");
  });

  it("should serialize deeply with high maxDepth", () => {
    const deepObj = { a: { b: { c: { d: "deep" } } } };
    const result = snapshotSerialization(deepObj, { maxDepth: 10 });
    expect(result).toBeDefined();
  });
});

describe("snapshotSerialization - special keys", () => {
  it("should skip keys in skipKeys option", () => {
    const obj = { visible: "yes", secret: "no" };
    const result = snapshotSerialization(obj, { skipKeys: ["secret"] });
    expect(result).toEqual({
      __id: expect.any(String),
      __type: "Object",
      visible: "yes",
    });
  });

  it("should escape keys starting with __", () => {
    const obj = { __private: "value" };
    const result = snapshotSerialization(obj);
    expect(result).toEqual({
      __id: expect.any(String),
      __type: "Object",
      __esc___private: "value",
    });
  });

  it("should preserve type when option enabled", () => {
    class CustomClass {
      constructor(public value: number) {}
    }
    const instance = new CustomClass(42);
    const result = snapshotSerialization(instance, { preserveType: true });
    expect(result.__type).toBe("CustomClass");
  });
});

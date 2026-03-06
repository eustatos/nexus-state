import { describe, it, expect } from "vitest";
import { isFunction, isObject, createId, safeGet } from "../atom-helpers";

describe("isFunction - edge cases", () => {
  it("should handle class constructors", () => {
    class TestClass {}
    expect(isFunction(TestClass)).toBe(true);
  });

  it("should handle arrow functions with no name", () => {
    const anon = () => 42;
    expect(isFunction(anon)).toBe(true);
  });

  it("should handle bound functions", () => {
    const fn = function () {}.bind({});
    expect(isFunction(fn)).toBe(true);
  });
});

describe("isObject - edge cases", () => {
  it("should handle object created with Object.create", () => {
    const obj = Object.create(null);
    expect(isObject(obj)).toBe(true);
  });

  it("should return true for RegExp objects", () => {
    // isObject returns true for any non-null object that's not an array
    expect(isObject(/test/)).toBe(true);
  });

  it("should return true for Date objects", () => {
    // isObject returns true for any non-null object that's not an array
    expect(isObject(new Date())).toBe(true);
  });

  it("should handle Symbol", () => {
    expect(isObject(Symbol("test"))).toBe(false);
  });
});

describe("createId - edge cases", () => {
  it("should handle empty string prefix", () => {
    const id = createId("");
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate IDs with different timestamps", () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(createId());
    }
    expect(ids.size).toBe(100);
  });
});

describe("safeGet - edge cases", () => {
  it("should handle empty objects", () => {
    const obj = {} as { key?: string };
    expect(safeGet(obj, "key" as any, "default")).toBe("default");
  });

  it("should handle objects with inherited properties", () => {
    const proto = { inherited: "value" };
    const obj = Object.create(proto);
    // safeGet uses ?? operator, so inherited properties are accessible
    expect(safeGet(obj, "inherited" as any, "default")).toBe("value");
  });

  it("should handle numeric keys", () => {
    const obj = { 0: "first", 1: "second" };
    expect(safeGet(obj, 0 as any, "default")).toBe("first");
  });
});

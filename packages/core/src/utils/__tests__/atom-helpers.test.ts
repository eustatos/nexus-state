import { describe, it, expect } from "vitest";
import {
  isFunction,
  isObject,
  createId,
  safeGet,
} from "../atom-helpers";

describe("isFunction", () => {
  it("should return true for functions", () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction(function () {})).toBe(true);
    expect(isFunction(async () => {})).toBe(true);
  });

  it("should return false for non-functions", () => {
    expect(isFunction(42)).toBe(false);
    expect(isFunction("string")).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isFunction([])).toBe(false);
    expect(isFunction(null)).toBe(false);
    expect(isFunction(undefined)).toBe(false);
  });
});

describe("isObject", () => {
  it("should return true for plain objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ key: "value" })).toBe(true);
  });

  it("should return false for arrays", () => {
    expect(isObject([])).toBe(false);
    expect(isObject([1, 2, 3])).toBe(false);
  });

  it("should return false for null", () => {
    expect(isObject(null)).toBe(false);
  });

  it("should return false for primitives", () => {
    expect(isObject(42)).toBe(false);
    expect(isObject("string")).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(undefined)).toBe(false);
  });
});

describe("createId", () => {
  it("should create unique IDs", () => {
    const id1 = createId();
    const id2 = createId();
    expect(id1).not.toBe(id2);
  });

  it("should include prefix when provided", () => {
    const id = createId("test-");
    expect(id.startsWith("test-")).toBe(true);
  });

  it("should create IDs without prefix", () => {
    const id = createId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("safeGet", () => {
  it("should return value when key exists", () => {
    const obj = { key: "value", count: 42 };
    expect(safeGet(obj, "key", "default")).toBe("value");
    expect(safeGet(obj, "count", 0)).toBe(42);
  });

  it("should return default when key is undefined", () => {
    const obj = { key: undefined, count: 42 };
    expect(safeGet(obj, "key", "default")).toBe("default");
  });

  it("should return default when key is null", () => {
    const obj = { key: null, count: 42 };
    expect(safeGet(obj, "key", "default")).toBe("default");
  });

  it("should return default for missing keys", () => {
    const obj = { existing: "value" };
    expect(safeGet(obj, "missing" as any, "default")).toBe("default");
  });
});

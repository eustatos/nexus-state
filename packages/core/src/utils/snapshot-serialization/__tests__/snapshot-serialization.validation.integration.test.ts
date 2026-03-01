import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";
import { validateSerializedStructure } from "./helpers";

describe("snapshotSerialization - Structure Validation [Integration]", () => {
  it("should produce valid structure for simple object", () => {
    const input = { name: "test", value: 42 };
    const result = snapshotSerialization(input);

    expect(validateSerializedStructure(result)).toBe(true);
  });

  it("should produce valid structure for nested objects", () => {
    const input = { a: { b: { c: "deep" } } };
    const result = snapshotSerialization(input);

    expect(validateSerializedStructure(result)).toBe(true);
  });

  it("should produce valid structure with circular references", () => {
    const obj: any = { name: "root" };
    obj.self = obj;

    const result = snapshotSerialization(obj);

    expect(validateSerializedStructure(result, { allowRefs: true })).toBe(true);
  });

  it("should produce valid structure for all special types", () => {
    const input = {
      date: new Date(),
      regex: /test/,
      map: new Map([["k", "v"]]),
      set: new Set([1, 2]),
      bigint: BigInt(123),
      error: new Error("test"),
      fn: () => {},
    };

    const result = snapshotSerialization(input);
    expect(validateSerializedStructure(result)).toBe(true);
  });
});

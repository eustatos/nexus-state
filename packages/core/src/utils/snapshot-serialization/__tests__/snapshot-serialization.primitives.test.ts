import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";

describe("snapshotSerialization - Primitive Types", () => {
  it("should return number unchanged", () => {
    expect(snapshotSerialization(42)).toBe(42);
    expect(snapshotSerialization(3.14159)).toBe(3.14159);
    expect(snapshotSerialization(-100)).toBe(-100);
    expect(snapshotSerialization(NaN)).toBe(NaN);
    expect(snapshotSerialization(Infinity)).toBe(Infinity);
    expect(snapshotSerialization(-Infinity)).toBe(-Infinity);
  });

  it("should return string unchanged", () => {
    expect(snapshotSerialization("hello")).toBe("hello");
    expect(snapshotSerialization("")).toBe("");
    expect(snapshotSerialization("special chars: \n\t\r")).toBe(
      "special chars: \n\t\r",
    );
    expect(snapshotSerialization("unicode: 🚀")).toBe("unicode: 🚀");
  });

  it("should return boolean unchanged", () => {
    expect(snapshotSerialization(true)).toBe(true);
    expect(snapshotSerialization(false)).toBe(false);
  });

  it("should return null unchanged", () => {
    expect(snapshotSerialization(null)).toBe(null);
  });

  it("should return undefined unchanged", () => {
    expect(snapshotSerialization(undefined)).toBe(undefined);
  });

  it("should serialize bigint to marker object", () => {
    const result = snapshotSerialization(BigInt(9007199254740991));
    expect(result).toEqual({
      __type: "BigInt",
      value: "9007199254740991",
    });
  });

  it("should serialize negative bigint", () => {
    const result = snapshotSerialization(BigInt(-123));
    expect(result).toEqual({
      __type: "BigInt",
      value: "-123",
    });
  });
});

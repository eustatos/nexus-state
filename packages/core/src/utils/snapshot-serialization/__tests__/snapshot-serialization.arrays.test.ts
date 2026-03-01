import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";

describe("snapshotSerialization - Arrays", () => {
  it("should serialize array of primitives", () => {
    const input = [1, "two", true, null, undefined];
    const result = snapshotSerialization(input);
    expect(result).toEqual(input);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should serialize nested arrays", () => {
    const input = [[1, 2], [3, [4, 5]], [[6]]];
    const result = snapshotSerialization(input);
    expect(result).toEqual(input);
  });

  it("should serialize array with special types", () => {
    const input = [
      new Date("2023-01-01"),
      /regex/g,
      BigInt(123),
      new Error("test"),
    ];
    const result = snapshotSerialization(input);

    expect(Array.isArray(result)).toBe(true);
    expect((result as any)[0]).toMatchObject({ __type: "Date" });
    expect((result as any)[1]).toMatchObject({ __type: "RegExp" });
    expect((result as any)[2]).toMatchObject({ __type: "BigInt" });
    expect((result as any)[3]).toMatchObject({ __type: "Error" });
  });

  it("should serialize sparse arrays", () => {
    const input: any[] = new Array(3);
    input[0] = 1;
    input[2] = 3;
    const result = snapshotSerialization(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
  });

  it("should serialize empty array", () => {
    const result = snapshotSerialization([]);
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should preserve array order", () => {
    const input = [5, 3, 1, 4, 2];
    const result = snapshotSerialization(input);
    expect(result).toEqual([5, 3, 1, 4, 2]);
  });
});

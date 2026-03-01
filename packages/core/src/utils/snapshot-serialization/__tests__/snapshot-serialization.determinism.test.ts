import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";
import { normalizeSerializedOutput, getObjectId } from "./helpers";

describe("snapshotSerialization - Determinism", () => {
  it("should produce consistent output for primitives", () => {
    const primitives = [42, "text", true, null, undefined, BigInt(123)];

    for (const p of primitives) {
      const r1 = snapshotSerialization(p);
      const r2 = snapshotSerialization(p);
      expect(r1).toStrictEqual(r2);
    }
  });

  it("should produce consistent special type markers", () => {
    const date = new Date("2023-06-15T10:00:00.000Z");
    const regex = /test/gi;

    const d1 = snapshotSerialization(date);
    const d2 = snapshotSerialization(date);
    expect(d1).toEqual(d2);

    const r1 = snapshotSerialization(regex);
    const r2 = snapshotSerialization(regex);
    expect(r1).toEqual(r2);
  });

  it("should produce consistent structure for same object", () => {
    const obj = { a: 1, b: "test", c: { d: true } };

    const r1 = normalizeSerializedOutput(snapshotSerialization(obj));
    const r2 = normalizeSerializedOutput(snapshotSerialization(obj));

    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it("should maintain consistent reference IDs within call", () => {
    const obj: any = { name: "test" };
    obj.ref1 = obj;
    obj.ref2 = obj;

    const result = snapshotSerialization(obj);
    const objId = getObjectId(result);

    expect((result as any).ref1.__ref).toBe(objId);
    expect((result as any).ref2.__ref).toBe(objId);
  });
});

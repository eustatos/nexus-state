import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";

describe("snapshotSerialization - Error Handling", () => {
  it("should handle object with getter that throws", () => {
    const problematic = {
      normal: "ok",
      get bad() {
        throw new Error("Cannot access");
      },
    };

    const result = snapshotSerialization(problematic);

    expect(result).toMatchObject({
      __type: "Object",
      normal: "ok",
    });

    const badValue = (result as any).bad;
    expect(badValue).toMatchObject({
      __error: expect.any(String),
    });
  });

  it("should handle object with setter only", () => {
    const obj = {
      _value: "test",
      set value(v: string) {
        this._value = v;
      },
    };

    const result = snapshotSerialization(obj);
    expect(result).toBeDefined();
  });

  it("should handle very large objects", () => {
    const large = Object.fromEntries(
      Array.from({ length: 1000 }, (_, i) => [`key_${i}`, i]),
    );

    const result = snapshotSerialization(large);

    expect(result).toMatchObject({
      __type: "Object",
    });
    expect(Object.keys(result).filter((k) => !k.startsWith("__"))).toHaveLength(
      1000,
    );
  });

  it("should handle objects with prototype chain", () => {
    const proto = { inherited: "value" };
    const obj = Object.create(proto);
    obj.own = "property";

    const result = snapshotSerialization(obj);

    expect(result).toMatchObject({
      __type: "Object",
      own: "property",
    });
    expect(result).not.toHaveProperty("inherited");
  });
});

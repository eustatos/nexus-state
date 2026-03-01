import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";

describe("snapshotSerialization - Metadata Collision Protection [Integration]", () => {
  it("should escape keys starting with __", () => {
    const input = {
      __type: "User",
      __id: "123",
      __ref: "should-be-escaped",
      normal: "value",
    };

    const result = snapshotSerialization(input);

    const escapedKeys = Object.keys(result).filter((k) =>
      k.startsWith("__esc_"),
    );
    expect(escapedKeys).toHaveLength(3);

    expect((result as any)["__esc___type"]).toBe("User");
    expect((result as any)["__esc___id"]).toBe("123");
    expect((result as any)["__esc___ref"]).toBe("should-be-escaped");
    expect((result as any).normal).toBe("value");

    expect(result).toHaveProperty("__type", "Object");
    expect(result).toHaveProperty("__id");
  });

  it("should escape keys with custom escape prefix", () => {
    const input = { __meta: "test" };
    const result = snapshotSerialization(input, { escapePrefix: "@@" });

    expect(result).toMatchObject({
      "@@__meta": "test",
    });
  });

  it("should handle multiple underscore prefixes", () => {
    const input = {
      ___private: "value",
      ____system: "data",
    };
    const result = snapshotSerialization(input);

    const escapedKeys = Object.keys(result).filter((k) =>
      k.startsWith("__esc_"),
    );
    expect(escapedKeys).toHaveLength(2);

    expect((result as any)["__esc____private"]).toBe("value");
    expect((result as any)["__esc_____system"]).toBe("data");

    expect(result).toHaveProperty("__type", "Object");
    expect(result).toHaveProperty("__id");
  });

  it("should not escape keys without __ prefix", () => {
    const input = { _single: "value", normal: "data" };
    const result = snapshotSerialization(input);

    expect(result).toMatchObject({
      __type: "Object",
      _single: "value",
      normal: "data",
    });
  });

  it("should handle object with only metadata-like keys", () => {
    const input = { __type: "Custom", __id: "456", __ref: "ref123" };
    const result = snapshotSerialization(input);

    const escapedKeys = Object.keys(result).filter((k) =>
      k.startsWith("__esc_"),
    );
    expect(escapedKeys).toHaveLength(3);

    expect((result as any)["__esc___type"]).toBe("Custom");
    expect((result as any)["__esc___id"]).toBe("456");
    expect((result as any)["__esc___ref"]).toBe("ref123");

    expect(result).toHaveProperty("__type", "Object");
    expect(result).toHaveProperty("__id");
  });
});

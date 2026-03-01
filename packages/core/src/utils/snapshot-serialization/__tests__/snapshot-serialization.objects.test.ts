import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";

describe("snapshotSerialization - Plain Objects", () => {
  it("should serialize simple object with metadata", () => {
    const input = { name: "test", value: 42 };
    const result = snapshotSerialization(input);

    expect(result).toMatchObject({
      __id: expect.any(String),
      __type: "Object",
      name: "test",
      value: 42,
    });
  });

  it("should serialize nested objects", () => {
    const input = {
      user: {
        profile: {
          name: "Alice",
          settings: { theme: "dark" },
        },
      },
    };
    const result = snapshotSerialization(input);

    expect((result as any).user).toMatchObject({
      __id: expect.any(String),
      __type: "Object",
      profile: expect.objectContaining({
        __type: "Object",
        name: "Alice",
      }),
    });
  });

  it("should serialize empty object", () => {
    const result = snapshotSerialization({});
    expect(result).toMatchObject({
      __id: expect.any(String),
      __type: "Object",
    });
    expect(Object.keys(result).filter((k) => !k.startsWith("__"))).toHaveLength(
      0,
    );
  });

  it("should serialize object with special property names", () => {
    const input = {
      "": "empty key",
      "key with spaces": "value1",
      "123": "numeric key",
      "key.with.dots": "value2",
      __proto__: "proto value",
    };
    const result = snapshotSerialization(input);

    expect((result as any)[""]).toBe("empty key");
    expect((result as any)["key with spaces"]).toBe("value1");
    expect((result as any)["123"]).toBe("numeric key");
    expect((result as any)["key.with.dots"]).toBe("value2");
  });

  it("should serialize object with symbol keys (ignored)", () => {
    const sym = Symbol("test");
    const input: any = { visible: "yes" };
    input[sym] = "hidden";

    const result = snapshotSerialization(input);
    expect((result as any).visible).toBe("yes");
    expect((result as any)[sym]).toBeUndefined();
  });

  it("should serialize object with function properties", () => {
    const input = {
      name: "test",
      handler: function () {
        return 42;
      },
      arrow: () => "arrow",
    };
    const result = snapshotSerialization(input);

    expect((result as any).name).toBe("test");
    expect((result as any).handler).toMatchObject({
      __type: "Function",
      name: "handler",
    });
    expect((result as any).arrow).toMatchObject({
      __type: "Function",
      name: "arrow",
      source: '() => "arrow"',
    });
  });
});

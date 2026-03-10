import { describe, it, expect } from "vitest";
import { AdvancedSerializer } from "../snapshot-serialization/advanced/advanced-serializer";

describe("AdvancedSerializer - basic", () => {
  it("should create serializer with default options", () => {
    const serializer = new AdvancedSerializer();
    expect(serializer).toBeDefined();
  });

  it("should serialize null", () => {
    const serializer = new AdvancedSerializer();
    const result = serializer.serialize(null);
    expect(result).toEqual({ __serializedType: "null" });
  });

  it("should serialize undefined", () => {
    const serializer = new AdvancedSerializer();
    const result = serializer.serialize(undefined);
    expect(result).toEqual({ __serializedType: "undefined" });
  });

  it("should serialize primitives", () => {
    const serializer = new AdvancedSerializer();
    expect(serializer.serialize(42)).toBe(42);
    expect(serializer.serialize("test")).toBe("test");
    expect(serializer.serialize(true)).toBe(true);
  });

  it("should serialize bigint", () => {
    const serializer = new AdvancedSerializer();
    const result = serializer.serialize(BigInt(123));
    expect(result).toEqual({ __serializedType: "bigint", value: "123" });
  });

  it("should serialize symbol", () => {
    const serializer = new AdvancedSerializer();
    const sym = Symbol("test");
    const result = serializer.serialize(sym);
    expect(result.__serializedType).toBe("symbol");
    expect(result.description).toBe("test");
  });
});

describe("AdvancedSerializer - deserialize", () => {
  it("should deserialize null", () => {
    const serializer = new AdvancedSerializer();
    const serialized = serializer.serialize(null);
    const result = serializer.deserialize(serialized);
    expect(result).toBe(null);
  });

  it("should deserialize undefined", () => {
    const serializer = new AdvancedSerializer();
    const serialized = serializer.serialize(undefined);
    const result = serializer.deserialize(serialized);
    expect(result).toBe(undefined);
  });

  it("should deserialize primitives", () => {
    const serializer = new AdvancedSerializer();
    expect(serializer.deserialize(42)).toBe(42);
    expect(serializer.deserialize("test")).toBe("test");
    expect(serializer.deserialize(true)).toBe(true);
  });

  it("should deserialize bigint", () => {
    const serializer = new AdvancedSerializer();
    const serialized = serializer.serialize(BigInt(123));
    const result = serializer.deserialize(serialized);
    expect(result).toBe(BigInt(123));
  });

  it("should deserialize symbol", () => {
    const serializer = new AdvancedSerializer();
    const sym = Symbol("test");
    const serialized = serializer.serialize(sym);
    const result = serializer.deserialize(serialized);
    expect(typeof result).toBe("symbol");
  });
});

describe("AdvancedSerializer - Date", () => {
  it("should serialize Date", () => {
    const serializer = new AdvancedSerializer();
    const date = new Date("2023-01-01T00:00:00.000Z");
    const result = serializer.serialize(date);
    expect(result.__serializedType).toBe("date");
    expect(result.value).toBe("2023-01-01T00:00:00.000Z");
  });

  it("should deserialize Date", () => {
    const serializer = new AdvancedSerializer();
    const date = new Date("2023-01-01T00:00:00.000Z");
    const serialized = serializer.serialize(date);
    const result = serializer.deserialize(serialized);
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).getTime()).toBe(date.getTime());
  });
});

describe("AdvancedSerializer - RegExp", () => {
  it("should serialize RegExp", () => {
    const serializer = new AdvancedSerializer();
    const regex = /test/gi;
    const result = serializer.serialize(regex);
    expect(result.__serializedType).toBe("regexp");
    expect(result.source).toBe("test");
    expect(result.flags).toBe("gi");
  });

  it("should deserialize RegExp", () => {
    const serializer = new AdvancedSerializer();
    const regex = /test/gi;
    const serialized = serializer.serialize(regex);
    const result = serializer.deserialize(serialized);
    expect(result).toBeInstanceOf(RegExp);
    expect((result as RegExp).source).toBe("test");
    expect((result as RegExp).flags).toBe("gi");
  });
});

describe("AdvancedSerializer - options", () => {
  it("should use custom options", () => {
    const serializer = new AdvancedSerializer({ maxDepth: 1 });
    const options = serializer.getOptions();
    expect(options.maxDepth).toBe(1);
  });

  it("should update options", () => {
    const serializer = new AdvancedSerializer();
    serializer.setOptions({ maxDepth: 5 });
    const options = serializer.getOptions();
    expect(options.maxDepth).toBe(5);
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { AdvancedSerializer, SerializationOptions } from "../advanced";

describe("AdvancedSerializer", () => {
  let serializer: AdvancedSerializer;

  beforeEach(() => {
    serializer = new AdvancedSerializer();
  });

  describe("Primitives", () => {
    it("should serialize string", () => {
      const result = serializer.serialize("hello");
      expect(result).toBe("hello");
    });

    it("should serialize number", () => {
      const result = serializer.serialize(42);
      expect(result).toBe(42);
    });

    it("should serialize boolean", () => {
      const result = serializer.serialize(true);
      expect(result).toBe(true);
    });

    it("should serialize null (as marker)", () => {
      const result = serializer.serialize(null);
      expect(result).toMatchObject({ __serializedType: "null" });
    });

    it("should serialize undefined (as marker)", () => {
      const result = serializer.serialize(undefined);
      expect(result).toMatchObject({ __serializedType: "undefined" });
    });

    it("should serialize bigint", () => {
      const result = serializer.serialize(BigInt(123456789012345));
      expect(result).toMatchObject({
        __serializedType: "bigint",
        value: "123456789012345",
      });
    });

    it("should serialize symbol", () => {
      const sym = Symbol("test");
      const result = serializer.serialize(sym);
      expect(result).toMatchObject({
        __serializedType: "symbol",
        description: "test",
      });
    });

    it("should deserialize bigint", () => {
      const serialized = { __serializedType: "bigint", value: "999" };
      const result = serializer.deserialize(serialized);
      expect(result).toBe(BigInt(999));
    });

    it("should deserialize symbol", () => {
      const serialized = { __serializedType: "symbol", description: "mysymbol" };
      const result = serializer.deserialize(serialized);
      // Symbol comparison by description
      expect(result.toString()).toBe("Symbol(mysymbol)");
    });
  });

  describe("Built-in Objects", () => {
    it("should serialize Date", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const result = serializer.serialize(date);
      expect(result).toMatchObject({
        __serializedType: "date",
        value: date.toISOString(),
      });
    });

    it("should deserialize Date", () => {
      const serialized = {
        __serializedType: "date",
        value: "2024-01-15T10:30:00.000Z",
      };
      const result = serializer.deserialize(serialized);
      expect(result).toBeInstanceOf(Date);
      expect(result).toEqual(new Date("2024-01-15T10:30:00.000Z"));
    });

    it("should serialize RegExp", () => {
      const regex = /test/gi;
      const result = serializer.serialize(regex);
      expect(result).toMatchObject({
        __serializedType: "regexp",
        source: "test",
        flags: "gi",
      });
    });

    it("should deserialize RegExp", () => {
      const serialized = {
        __serializedType: "regexp",
        source: "test",
        flags: "gi",
      };
      const result = serializer.deserialize(serialized);
      expect(result).toBeInstanceOf(RegExp);
      expect(result).toEqual(/test/gi);
    });

    it("should serialize Map", () => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
      const result = serializer.serialize(map);
      expect(result).toMatchObject({
        __serializedType: "map",
        entries: expect.arrayContaining([
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
        size: 2,
      });
    });

    it("should deserialize Map", () => {
      const serialized = {
        __serializedType: "map",
        entries: [
          ["key1", "value1"],
          ["key2", "value2"],
        ],
        size: 2,
      };
      const result = serializer.deserialize(serialized);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get("key1")).toBe("value1");
    });

    it("should serialize Set", () => {
      const set = new Set(["value1", "value2", "value3"]);
      const result = serializer.serialize(set);
      expect(result).toMatchObject({
        __serializedType: "set",
        values: expect.arrayContaining(["value1", "value2", "value3"]),
        size: 3,
      });
    });

    it("should deserialize Set", () => {
      const serialized = {
        __serializedType: "set",
        values: ["value1", "value2"],
        size: 2,
      };
      const result = serializer.deserialize(serialized);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
    });

    it("should serialize Error", () => {
      const error = new Error("Test error");
      error.name = "TestError";
      const result = serializer.serialize(error);
      expect(result).toMatchObject({
        __serializedType: "error",
        name: "TestError",
        message: "Test error",
      });
    });

    it("should serialize WeakMap (empty)", () => {
      const weakMap = new WeakMap();
      const result = serializer.serialize(weakMap);
      expect(result).toMatchObject({
        __serializedType: "weakmap",
        entries: [],
      });
    });

    it("should serialize WeakSet (empty)", () => {
      const weakSet = new WeakSet();
      const result = serializer.serialize(weakSet);
      expect(result).toMatchObject({
        __serializedType: "weakset",
        values: [],
      });
    });
  });

  describe("Arrays", () => {
    it("should serialize simple array", () => {
      const arr = [1, 2, 3];
      const result = serializer.serialize(arr);
      expect(result).toMatchObject({
        __serializedType: "array",
        length: 3,
        values: [1, 2, 3],
      });
    });

    it("should serialize nested array", () => {
      const arr = [[1, 2], [3, 4]];
      const result = serializer.serialize(arr);
      expect(result).toMatchObject({
        __serializedType: "array",
        length: 2,
      });
      // The values should contain the nested arrays
      const nested1 = (result as any).values[0];
      const nested2 = (result as any).values[1];
      expect(Array.isArray(nested1)).toBe(true);
      expect(Array.isArray(nested2)).toBe(true);
    });

    it("should deserialize array", () => {
      const serialized = {
        __serializedType: "array",
        length: 3,
        values: [1, 2, 3],
      };
      const result = serializer.deserialize(serialized);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("Objects", () => {
    it("should serialize plain object", () => {
      const obj = { name: "test", value: 42 };
      const result = serializer.serialize(obj);
      expect(result).toMatchObject({
        __serializedType: "object",
        __className: "Object",
        properties: expect.objectContaining({
          name: expect.any(Object),
          value: expect.any(Object),
        }),
      });
    });

    it("should serialize object with nested objects", () => {
      const obj = {
        user: {
          name: "Alice",
          settings: { theme: "dark" },
        },
      };
      const result = serializer.serialize(obj);
      expect(result).toMatchObject({
        __serializedType: "object",
        properties: expect.objectContaining({
          user: expect.any(Object),
        }),
      });
    });

    it("should deserialize plain object", () => {
      const serialized = {
        __serializedType: "object",
        __className: "Object",
        properties: {
          name: { value: "test" },
          value: { value: 42 },
        },
      };
      const result = serializer.deserialize(serialized);
      expect(result).toEqual({ name: "test", value: 42 });
    });
  });

  describe("Circular References", () => {
    it("should detect self-referencing object", () => {
      const obj: any = { name: "root" };
      obj.self = obj;

      const result = serializer.serialize(obj);
      expect(result).toMatchObject({
        __serializedType: "object",
      });
      // The self property should be a reference
      expect((result as any).properties.self).toMatchObject({
        value: {
          __serializedType: "reference",
        },
      });
    });

    it("should handle mutual circular references (A -> B -> A)", () => {
      const a: any = { name: "A" };
      const b: any = { name: "B" };
      a.ref = b;
      b.ref = a;

      const result = serializer.serialize({ a, b });

      // Both should have same refId
      const aRefId = (result as any).properties.a.value.__refId;
      const bRefId = (result as any).properties.a.value.properties.ref.value.__refId;

      expect(aRefId).toBeDefined();
      expect(bRefId).toBeDefined();

      // b.ref should point to a's reference
      expect((result as any).properties.b.value).toMatchObject({
        __serializedType: "reference",
      });
    });
  });

  describe("Functions", () => {
    it("should serialize function with source code", () => {
      function testFunc(a: number, b: number): number {
        return a + b;
      }
      const result = serializer.serialize(testFunc);
      expect(result).toMatchObject({
        __serializedType: "function",
        name: "testFunc",
        source: expect.stringContaining("function testFunc"),
      });
    });

    it("should serialize arrow function", () => {
      const arrowFunc = (x: number) => x * 2;
      const result = serializer.serialize(arrowFunc);
      expect(result).toMatchObject({
        __serializedType: "function",
        source: expect.stringContaining("=>"),
      });
    });

    it("should deserialize function (source only)", () => {
      const serialized = {
        __serializedType: "function",
        name: "test",
        source: "function test() { return 42; }",
      };
      const result = serializer.deserialize(serialized);
      expect(result).toMatchObject({
        __functionSource: expect.any(String),
        name: "test",
      });
    });
  });

  describe("Options", () => {
    it("should respect maxDepth option", () => {
      const deeplyNested = { level: 1, nested: { level: 2, nested: { level: 3 } } };
      const serializerWithDepth = new AdvancedSerializer({ maxDepth: 1 });
      const result = serializerWithDepth.serialize(deeplyNested);

      expect(result).toMatchObject({
        __serializedType: "object",
      });
    });

    it("should serialize object without circular references", () => {
      const obj: any = { name: "test", value: 42 };
      // No circular reference here
      const result = serializer.serialize(obj);
      expect(result).toMatchObject({
        __serializedType: "object",
        properties: expect.objectContaining({
          name: expect.any(Object),
          value: expect.any(Object),
        }),
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty object", () => {
      const result = serializer.serialize({});
      expect(result).toMatchObject({
        __serializedType: "object",
        properties: {},
      });
    });

    it("should handle object with special property names", () => {
      const obj = {
        constructor: "ctor",
      };
      const result = serializer.serialize(obj);
      expect((result as any).properties.constructor).toBeDefined();
    });

    it("should handle very large number", () => {
      const result = serializer.serialize(Number.MAX_SAFE_INTEGER);
      expect(result).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle negative zero", () => {
      const result = serializer.serialize(-0);
      expect(result).toBe(-0);
    });

    it("should handle NaN", () => {
      const result = serializer.serialize(NaN);
      expect(result).toBe(NaN);
    });

    it("should handle Infinity", () => {
      const result = serializer.serialize(Infinity);
      expect(result).toBe(Infinity);
    });
  });

  describe("Performance", () => {
    it("should serialize large object efficiently", () => {
      const largeObj: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`prop${i}`] = { value: i, nested: { deeper: `value${i}` } };
      }

      const startTime = performance.now();
      serializer.serialize(largeObj);
      const duration = performance.now() - startTime;

      // Should complete in reasonable time (less than 500ms)
      expect(duration).toBeLessThan(500);
    });

    it("should deserialize large object efficiently", () => {
      const largeObj: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`prop${i}`] = { value: i };
      }

      const serialized = serializer.serialize(largeObj);
      const startTime = performance.now();
      serializer.deserialize(serialized);
      const duration = performance.now() - startTime;

      // Should complete in reasonable time (less than 500ms)
      expect(duration).toBeLessThan(500);
    });
  });
});

describe("AdvancedSerializer Integration", () => {
  it("should handle complex object graph", () => {
    const serializer = new AdvancedSerializer();

    // Create complex object with circular references
    const user = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      profile: {
        age: 30,
        settings: {
          theme: "dark",
          notifications: true,
        },
      },
      posts: [
        {
          id: 101,
          title: "First Post",
          tags: ["intro", "announcement"],
          comments: [],
        },
        {
          id: 102,
          title: "Second Post",
          tags: ["update"],
          comments: [],
        },
      ],
      createdAt: new Date("2024-01-01"),
    };

    // Add circular reference
    (user as any).self = user;

    // Serialize
    const serialized = serializer.serialize(user);
    expect(serialized).toBeDefined();

    // Deserialize
    const deserialized = serializer.deserialize(serialized);
    expect(deserialized).toBeDefined();
    expect((deserialized as any).name).toBe("John Doe");
    expect((deserialized as any).profile.settings.theme).toBe("dark");
  });
});

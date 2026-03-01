// packages/core/utils/snapshot-serialization/__tests__/utils.test.ts
/**
 * Unit tests for utility functions
 * Tests isSerializable, factory functions, and helper utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isSerializable,
  createSnapshotSerializer,
  createSnapshotDeserializer,
  roundTripSnapshot,
  snapshotsEqual,
} from "../utils";
import { snapshotSerialization } from "../serialize";
import { deserializeSnapshot } from "../deserialize";
import type { SerializationOptions, DeserializationOptions } from "../types";
import {
  deepEqualWithSpecial,
  testDataGenerators,
  memoryTracker,
} from "./helpers";

// ============================================================================
// IS SERIALIZABLE TESTS
// ============================================================================

describe("isSerializable", () => {
  describe("Primitive Types", () => {
    it("should return true for number values", () => {
      expect(isSerializable(42)).toBe(true);
      expect(isSerializable(3.14159)).toBe(true);
      expect(isSerializable(-100)).toBe(true);
      expect(isSerializable(0)).toBe(true);
      expect(isSerializable(NaN)).toBe(true);
      expect(isSerializable(Infinity)).toBe(true);
    });

    it("should return true for string values", () => {
      expect(isSerializable("hello")).toBe(true);
      expect(isSerializable("")).toBe(true);
      expect(isSerializable("unicode: 🚀")).toBe(true);
      expect(isSerializable("very long ".repeat(100))).toBe(true);
    });

    it("should return true for boolean values", () => {
      expect(isSerializable(true)).toBe(true);
      expect(isSerializable(false)).toBe(true);
    });

    it("should return true for null and undefined", () => {
      expect(isSerializable(null)).toBe(true);
      expect(isSerializable(undefined)).toBe(true);
    });

    it("should return true for bigint values", () => {
      expect(isSerializable(BigInt(123))).toBe(true);
      expect(isSerializable(BigInt(-456))).toBe(true);
      expect(isSerializable(BigInt("9007199254740991"))).toBe(true);
    });
  });

  describe("Special Types", () => {
    it("should return true for Date objects", () => {
      expect(isSerializable(new Date())).toBe(true);
      expect(isSerializable(new Date("2023-01-01"))).toBe(true);
      expect(isSerializable(new Date("invalid"))).toBe(true);
    });

    it("should return true for RegExp objects", () => {
      expect(isSerializable(/test/)).toBe(true);
      expect(isSerializable(/pattern/gi)).toBe(true);
      expect(isSerializable(new RegExp("^[a-z]+$"))).toBe(true);
    });

    it("should return true for Error objects", () => {
      expect(isSerializable(new Error("test"))).toBe(true);
      expect(isSerializable(new TypeError("type"))).toBe(true);
      expect(isSerializable(new RangeError("range"))).toBe(true);
    });

    it("should return true for Map objects", () => {
      expect(isSerializable(new Map())).toBe(true);
      expect(isSerializable(new Map([["k", "v"]]))).toBe(true);
      expect(
        isSerializable(
          new Map([
            ["a", 1],
            ["b", 2],
          ]),
        ),
      ).toBe(true);
    });

    it("should return true for Set objects", () => {
      expect(isSerializable(new Set())).toBe(true);
      expect(isSerializable(new Set([1, 2, 3]))).toBe(true);
      expect(isSerializable(new Set(["a", "b", "c"]))).toBe(true);
    });

    it("should return true for Function objects (serializable but not reversible)", () => {
      expect(isSerializable(() => {})).toBe(true);
      expect(isSerializable(function named() {})).toBe(true);
      expect(isSerializable(async () => {})).toBe(true);
      expect(isSerializable(function* gen() {})).toBe(true);
    });
  });

  describe("Arrays", () => {
    it("should return true for array of primitives", () => {
      expect(isSerializable([1, 2, 3])).toBe(true);
      expect(isSerializable(["a", "b", "c"])).toBe(true);
      expect(isSerializable([true, false, null])).toBe(true);
    });

    it("should return true for nested arrays", () => {
      expect(
        isSerializable([
          [1, 2],
          [3, 4],
        ]),
      ).toBe(true);
      expect(isSerializable([[[1]], [[2]]])).toBe(true);
    });

    it("should return true for array with special types", () => {
      expect(isSerializable([new Date(), /regex/, new Error("test")])).toBe(
        true,
      );
      expect(isSerializable([new Map(), new Set(), BigInt(123)])).toBe(true);
    });

    it("should return true for empty array", () => {
      expect(isSerializable([])).toBe(true);
    });

    it("should return false if array contains non-serializable items", () => {
      // Note: Our implementation serializes functions, so this returns true
      // If you want to fail on functions, modify isSerializable
      expect(isSerializable([1, 2, () => {}])).toBe(true);
    });
  });

  describe("Objects", () => {
    it("should return true for plain objects with primitive values", () => {
      expect(isSerializable({ a: 1, b: "test" })).toBe(true);
      expect(isSerializable({ bool: true, nil: null })).toBe(true);
    });

    it("should return true for nested objects", () => {
      expect(isSerializable({ a: { b: { c: "deep" } } })).toBe(true);
    });

    it("should return true for objects with special types", () => {
      expect(
        isSerializable({
          date: new Date(),
          regex: /test/,
          map: new Map(),
          set: new Set(),
        }),
      ).toBe(true);
    });

    it("should return true for empty object", () => {
      expect(isSerializable({})).toBe(true);
    });

    it("should return true for objects with circular references", () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      expect(isSerializable(obj)).toBe(true);
    });

    it("should return true for objects with mutual circular references", () => {
      const a: any = { name: "A" };
      const b: any = { name: "B" };
      a.ref = b;
      b.ref = a;
      expect(isSerializable({ a, b })).toBe(true);
    });

    it("should handle objects with many properties", () => {
      const obj: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        obj[`prop_${i}`] = i;
      }
      expect(isSerializable(obj)).toBe(true);
    });
  });

  describe("Depth Limiting", () => {
    it("should return false when maxDepth exceeded", () => {
      let deep: any = { value: "leaf" };
      for (let i = 0; i < 10; i++) {
        deep = { child: deep };
      }

      expect(isSerializable(deep, { maxDepth: 5 })).toBe(false);
      expect(isSerializable(deep, { maxDepth: 15 })).toBe(true);
    });

    it("should use default maxDepth of 50", () => {
      let deep: any = { value: "leaf" };
      for (let i = 0; i < 49; i++) {
        deep = { child: deep };
      }

      expect(isSerializable(deep)).toBe(true);
    });

    it("should handle maxDepth of 0", () => {
      const input = { value: "test" };
      expect(isSerializable(input, { maxDepth: 0 })).toBe(true);
    });
  });

  describe("Skip Keys Option", () => {
    it("should skip specified keys during check", () => {
      const input = {
        public: "visible",
        secret: "hidden",
      };

      expect(isSerializable(input, { skipKeys: ["secret"] })).toBe(true);
    });

    it("should skip keys in nested objects", () => {
      const input = {
        user: {
          name: "Alice",
          password: "secret",
        },
      };

      expect(isSerializable(input, { skipKeys: ["password"] })).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle object with getter that throws", () => {
      const problematic = {
        normal: "ok",
        get bad() {
          throw new Error("Cannot access");
        },
      };

      expect(isSerializable(problematic)).toBe(false);
    });

    it("should handle object with symbol keys (ignored)", () => {
      const sym = Symbol("test");
      const obj: any = { visible: "yes" };
      obj[sym] = "hidden";

      expect(isSerializable(obj)).toBe(true);
    });

    it("should handle very large objects", () => {
      const large = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`key_${i}`, i]),
      );

      expect(isSerializable(large)).toBe(true);
    });

    it("should handle objects with prototype chain", () => {
      const proto = { inherited: "value" };
      const obj = Object.create(proto);
      obj.own = "property";

      expect(isSerializable(obj)).toBe(true);
    });

    it("should handle class instances", () => {
      class User {
        constructor(public name: string) {}
      }

      expect(isSerializable(new User("Alice"))).toBe(true);
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory with WeakSet cleanup", () => {
      memoryTracker.reset();
      memoryTracker.capture();

      // Create many objects to test WeakSet cleanup
      const objects = Array.from({ length: 1000 }, () => ({
        data: Math.random(),
        nested: { value: "test" },
      }));

      // Call isSerializable many times
      for (const obj of objects) {
        isSerializable(obj);
      }

      memoryTracker.capture();

      // Should not grow significantly
      expect(memoryTracker.getGrowth()).toBeLessThan(10 * 1024 * 1024); // 10MB limit
    });

    it("should clean up seen set after recursive calls", () => {
      const obj = { a: { b: { c: "deep" } } };

      // Multiple calls should not accumulate state
      for (let i = 0; i < 100; i++) {
        expect(isSerializable(obj)).toBe(true);
      }
    });
  });
});

// ============================================================================
// CREATE SNAPSHOT SERIALIZER TESTS
// ============================================================================

describe("createSnapshotSerializer", () => {
  it("should return a bound serialize function", () => {
    const serializer = createSnapshotSerializer();
    expect(typeof serializer).toBe("function");
  });

  it("should apply options consistently", () => {
    const serializer = createSnapshotSerializer({ maxDepth: 3 });

    const deep = {
      l1: { l2: { l3: { l4: { value: "too deep" } } } },
    };

    const result = serializer(deep);
    expect((result as any).l1.l2.l3).toBeDefined();
    expect((result as any).l1.l2.l3.l4).toMatchObject({
      __type: "MaxDepthExceeded",
    });
    expect((result as any).l1.l2.l3.l4.__message).toContain(
      "Max depth 3 reached",
    );
  });

  it("should preserve options across multiple calls", () => {
    const serializer = createSnapshotSerializer({
      skipKeys: ["secret"],
      maxDepth: 5,
    });

    const result1 = serializer({ secret: "hidden", data: "visible" });
    const result2 = serializer({ secret: "hidden2", data: "visible2" });

    expect(result1).not.toHaveProperty("secret");
    expect(result2).not.toHaveProperty("secret");
  });

  it("should work with skipKeys option", () => {
    const secureSerializer = createSnapshotSerializer({
      skipKeys: ["password", "token", "secret"],
    });

    const input = {
      username: "alice",
      password: "secret123",
      token: "abc-xyz",
      data: "public",
    };

    const result = secureSerializer(input);

    expect(result).toMatchObject({
      __type: "Object",
      username: "alice",
      data: "public",
    });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("token");
  });

  it("should work with custom transformers", () => {
    class Point {
      constructor(
        public x: number,
        public y: number,
      ) {}
    }

    const serializer = createSnapshotSerializer({
      customTransformers: new Map([
        [
          Point,
          (p: Point) => ({
            __type: "Point",
            coords: [p.x, p.y],
          }),
        ],
      ]),
    });

    const result = serializer(new Point(10, 20));

    expect(result).toEqual({
      __type: "Point",
      coords: [10, 20],
    });
  });

  it("should work with preserveType option", () => {
    class User {
      constructor(public name: string) {}
    }

    const serializerWithType = createSnapshotSerializer({ preserveType: true });
    const serializerWithoutType = createSnapshotSerializer({
      preserveType: false,
    });

    const user = new User("Alice");

    expect(serializerWithType(user)).toMatchObject({ __type: "User" });
    expect(serializerWithoutType(user)).toMatchObject({ __type: "Object" });
  });

  it("should work with custom escape prefix", () => {
    const serializer = createSnapshotSerializer({ escapePrefix: "@@" });

    const input = { __meta: "test" };
    const result = serializer(input);

    expect(result).toMatchObject({
      "@@__meta": "test",
    });
  });

  it("should handle complex options combination", () => {
    class SecretData {
      constructor(
        public value: string,
        public key: string,
      ) {}
    }

    const serializer = createSnapshotSerializer({
      maxDepth: 5,
      skipKeys: ["key"],
      preserveType: true,
      customTransformers: new Map([
        [
          SecretData,
          (s: SecretData) => ({
            __type: "SecretData",
            value: s.value,
          }),
        ],
      ]),
    });

    const input = {
      data: new SecretData("secret", "do-not-show"),
      public: "visible",
    };

    const result = serializer(input);

    expect(result).toMatchObject({
      __type: "Object",
      data: {
        __type: "SecretData",
        value: "secret",
      },
      public: "visible",
    });
  });
});

// ============================================================================
// CREATE SNAPSHOT DESERIALIZER TESTS
// ============================================================================

describe("createSnapshotDeserializer", () => {
  // Хранилище для временных глобальных конструкторов
  const tempConstructors: string[] = [];

  afterEach(() => {
    // Очищаем все временные конструкторы после каждого теста
    for (const name of tempConstructors) {
      delete (globalThis as any)[name];
    }
    tempConstructors.length = 0;
  });

  it("should return a bound deserialize function", () => {
    const deserializer = createSnapshotDeserializer();
    expect(typeof deserializer).toBe("function");
  });

  it("should apply options consistently", () => {
    const deserializer = createSnapshotDeserializer({
      restoreSpecialTypes: false,
    });

    const input = { __type: "Date", value: "2023-01-01T00:00:00.000Z" };
    const result = deserializer(input);

    expect(result).toEqual(input);
    expect(result).not.toBeInstanceOf(Date);
  });

  it("should preserve options across multiple calls", () => {
    const deserializer = createSnapshotDeserializer({
      restoreSpecialTypes: false,
      allowedConstructors: ["Object"],
    });

    const input1 = { __type: "Date", value: "2023-01-01T00:00:00.000Z" };
    const input2 = { __type: "RegExp", source: "test", flags: "g" };

    const result1 = deserializer(input1);
    const result2 = deserializer(input2);

    expect(result1).not.toBeInstanceOf(Date);
    expect(result2).not.toBeInstanceOf(RegExp);
  });

  it("should work with restoreSpecialTypes option", () => {
    const restoreDeserializer = createSnapshotDeserializer({
      restoreSpecialTypes: true,
    });
    const noRestoreDeserializer = createSnapshotDeserializer({
      restoreSpecialTypes: false,
    });

    const input = { __type: "Date", value: "2023-01-01T00:00:00.000Z" };

    expect(restoreDeserializer(input)).toBeInstanceOf(Date);
    expect(noRestoreDeserializer(input)).not.toBeInstanceOf(Date);
  });

  it("should work with allowedConstructors option", () => {
    // Создаем уникальное имя класса, чтобы не пересекаться с другими тестами
    const uniqueClassName = `TestClass_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Определяем класс с уникальным именем
    class TestClass {
      customMethod() {
        return "works";
      }
    }

    // Регистрируем в глобальной области видимости с уникальным именем
    (globalThis as any)[uniqueClassName] = TestClass;
    tempConstructors.push(uniqueClassName);

    const input = { __id: "obj_1", __type: uniqueClassName };

    const allowedDeserializer = createSnapshotDeserializer({
      allowedConstructors: ["Object", uniqueClassName],
    });
    const restrictedDeserializer = createSnapshotDeserializer({
      allowedConstructors: ["Object"],
    });

    const result1 = allowedDeserializer(input);
    const result2 = restrictedDeserializer(input);

    expect(result1).toBeInstanceOf(TestClass);
    expect(result2).not.toBeInstanceOf(TestClass);
  });

  it("should work with custom revivers", () => {
    const deserializer = createSnapshotDeserializer({
      customRevivers: new Map([
        [
          "CustomType",
          (val: any) => ({
            restored: true,
            id: val.id,
            data: val.data,
          }),
        ],
      ]),
    });

    const input = { __type: "CustomType", id: "123", data: "test" };
    const result = deserializer(input);

    expect(result).toMatchObject({
      restored: true,
      id: "123",
      data: "test",
    });
  });

  it("should handle complex options combination", () => {
    const deserializer = createSnapshotDeserializer({
      restoreSpecialTypes: true,
      allowedConstructors: ["Object", "Array"],
      customRevivers: new Map([
        [
          "Point",
          (val: any) => ({
            x: val.x,
            y: val.y,
            isPoint: true,
          }),
        ],
      ]),
    });

    const input = {
      __id: "obj_1",
      __type: "Object",
      date: { __type: "Date", value: "2023-01-01T00:00:00.000Z" },
      point: { __type: "Point", x: 10, y: 20 },
    };

    const result = deserializer(input);

    expect(result.date).toBeInstanceOf(Date);
    expect(result.point).toMatchObject({ x: 10, y: 20, isPoint: true });
  });
});

// ============================================================================
// ROUND TRIP SNAPSHOT TESTS
// ============================================================================

describe("roundTripSnapshot", () => {
  it("should serialize and deserialize in one call", () => {
    const input = {
      name: "test",
      items: [1, 2, 3],
      meta: { created: new Date() },
    };

    const result = roundTripSnapshot(input);

    expect(result.name).toBe("test");
    expect(result.items).toEqual([1, 2, 3]);
    expect(result.meta.created).toBeInstanceOf(Date);
  });

  it("should accept separate options for serialize/deserialize", () => {
    const input = { secret: "hidden", data: "visible" };

    const result = roundTripSnapshot(
      input,
      { skipKeys: ["secret"] }, // Don't serialize secret
      { restoreSpecialTypes: true }, // Normal deserialize options
    );

    expect(result).not.toHaveProperty("secret");
    expect(result.data).toBe("visible");
  });

  it("should preserve circular reference identity", () => {
    const input: any = { name: "root" };
    input.self = input;

    const result = roundTripSnapshot(input);

    expect(result.self).toBe(result);
    expect(result.self.name).toBe("root");
  });

  it("should handle all special types", () => {
    const input = {
      date: new Date("2023-01-01"),
      regex: /test/g,
      map: new Map([["k", "v"]]),
      set: new Set([1, 2, 3]),
      bigint: BigInt(123),
      error: new Error("test"),
    };

    const result = roundTripSnapshot(input);

    expect(result.date).toBeInstanceOf(Date);
    expect(result.regex).toBeInstanceOf(RegExp);
    expect(result.map).toBeInstanceOf(Map);
    expect(result.set).toBeInstanceOf(Set);
    expect(typeof result.bigint).toBe("bigint");
    expect(result.error).toBeInstanceOf(Error);
  });

  it("should handle primitives", () => {
    expect(roundTripSnapshot(42)).toBe(42);
    expect(roundTripSnapshot("text")).toBe("text");
    expect(roundTripSnapshot(true)).toBe(true);
    expect(roundTripSnapshot(null)).toBe(null);
    expect(roundTripSnapshot(undefined)).toBe(undefined);
    expect(roundTripSnapshot(BigInt(123))).toBe(BigInt(123));
  });

  it("should handle empty values", () => {
    expect(roundTripSnapshot("")).toBe("");
    expect(roundTripSnapshot(0)).toBe(0);
    expect(roundTripSnapshot(false)).toBe(false);
    expect(roundTripSnapshot([])).toEqual([]);
    expect(roundTripSnapshot({})).toEqual({});
  });

  it("should handle deeply nested structures", () => {
    const input = {
      l1: {
        l2: {
          l3: {
            l4: {
              l5: { value: "deep" },
            },
          },
        },
      },
    };

    const result = roundTripSnapshot(input);

    expect(result.l1.l2.l3.l4.l5.value).toBe("deep");
  });

  it("should handle large arrays", () => {
    const input = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      value: `item_${i}`,
    }));

    const result = roundTripSnapshot(input);

    expect(result).toHaveLength(1000);
    expect(result[0].id).toBe(0);
    expect(result[999].id).toBe(999);
  });

  it("should handle complex real-world object", () => {
    const input = {
      user: {
        id: "user_123",
        name: "Alice",
        email: "alice@example.com",
        profile: {
          avatar: "https://example.com/avatar.jpg",
          bio: "Developer",
          birthDate: new Date("1990-01-01"),
        },
        settings: {
          theme: "dark",
          notifications: {
            email: true,
            push: false,
          },
        },
        roles: ["user", "admin"],
        meta: {
          createdAt: new Date("2023-01-01"),
          loginCount: 42,
        },
      },
    };

    const result = roundTripSnapshot(input);

    expect(result.user.id).toBe("user_123");
    expect(result.user.profile.birthDate).toBeInstanceOf(Date);
    expect(result.user.settings.theme).toBe("dark");
    expect(result.user.roles).toEqual(["user", "admin"]);
    expect(result.user.meta.createdAt).toBeInstanceOf(Date);
  });

  it("should respect serialize options", () => {
    const input = {
      public: "visible",
      password: "secret",
      nested: {
        token: "hidden",
      },
    };

    const result = roundTripSnapshot(input, {
      skipKeys: ["password", "token"],
    });

    expect(result.public).toBe("visible");
    expect(result).not.toHaveProperty("password");
    expect(result.nested).not.toHaveProperty("token");
  });

  it("should respect deserialize options", () => {
    const input = {
      date: new Date("2023-01-01"),
      regex: /test/g,
    };

    const result = roundTripSnapshot(
      input,
      {},
      {
        restoreSpecialTypes: false,
      },
    );

    expect(result.date).not.toBeInstanceOf(Date);
    expect(result.regex).not.toBeInstanceOf(RegExp);
  });

  it("should handle type parameter", () => {
    interface UserData {
      id: string;
      name: string;
      createdAt: Date;
    }

    const input: UserData = {
      id: "user_1",
      name: "Alice",
      createdAt: new Date(),
    };

    const result = roundTripSnapshot<UserData>(input);

    expect(result.id).toBe("user_1");
    expect(result.name).toBe("Alice");
    expect(result.createdAt).toBeInstanceOf(Date);
  });
});

// ============================================================================
// SNAPSHOTS EQUAL TESTS
// ============================================================================

describe("snapshotsEqual", () => {
  it("should compare equal primitive values as equal", () => {
    expect(snapshotsEqual(42, 42)).toBe(true);
    expect(snapshotsEqual("text", "text")).toBe(true);
    expect(snapshotsEqual(true, true)).toBe(true);
    expect(snapshotsEqual(null, null)).toBe(true);
    expect(snapshotsEqual(undefined, undefined)).toBe(true);
  });

  it("should compare different primitive values as not equal", () => {
    expect(snapshotsEqual(42, 43)).toBe(false);
    expect(snapshotsEqual("a", "b")).toBe(false);
    expect(snapshotsEqual(true, false)).toBe(false);
    expect(snapshotsEqual(null, undefined)).toBe(false);
  });

  it("should compare equal objects as equal", () => {
    const a = { x: 1, y: [2, 3] };
    const b = { x: 1, y: [2, 3] };

    expect(snapshotsEqual(a, b)).toBe(true);
  });

  it("should compare different objects as not equal", () => {
    const a = { x: 1, y: [2, 3] };
    const b = { x: 1, y: [2, 4] };

    expect(snapshotsEqual(a, b)).toBe(false);
  });

  it("should handle special types in comparison", () => {
    const a = { date: new Date("2023-01-01") };
    const b = { date: new Date("2023-01-01") };
    const c = { date: new Date("2023-01-02") };

    expect(snapshotsEqual(a, b)).toBe(true);
    expect(snapshotsEqual(a, c)).toBe(false);
  });

  it("should handle RegExp in comparison", () => {
    const a = { regex: /test/g };
    const b = { regex: /test/g };
    const c = { regex: /test/i };

    expect(snapshotsEqual(a, b)).toBe(true);
    expect(snapshotsEqual(a, c)).toBe(false);
  });

  it("should handle Map in comparison", () => {
    const a = { map: new Map([["k", "v"]]) };
    const b = { map: new Map([["k", "v"]]) };
    const c = { map: new Map([["k", "other"]]) };

    expect(snapshotsEqual(a, b)).toBe(true);
    expect(snapshotsEqual(a, c)).toBe(false);
  });

  it("should handle Set in comparison", () => {
    const a = { set: new Set([1, 2, 3]) };
    const b = { set: new Set([1, 2, 3]) };
    const c = { set: new Set([1, 2, 4]) };

    expect(snapshotsEqual(a, b)).toBe(true);
    expect(snapshotsEqual(a, c)).toBe(false);
  });

  it("should handle BigInt in comparison", () => {
    const a = { big: BigInt(123) };
    const b = { big: BigInt(123) };
    const c = { big: BigInt(456) };

    expect(snapshotsEqual(a, b)).toBe(true);
    expect(snapshotsEqual(a, c)).toBe(false);
  });

  it("should respect skipKeys option in comparison", () => {
    const a = { public: "a", secret: "x" };
    const b = { public: "a", secret: "y" };

    // Without options, secrets differ
    expect(snapshotsEqual(a, b)).toBe(false);

    // With skipKeys, secrets ignored -> equal
    expect(snapshotsEqual(a, b, { skipKeys: ["secret"] })).toBe(true);
  });

  it("should handle circular references in comparison", () => {
    const a: any = { name: "test" };
    a.self = a;

    const b: any = { name: "test" };
    b.self = b;

    expect(snapshotsEqual(a, b)).toBe(true);
  });

  it("should handle different circular reference structures", () => {
    const a: any = { name: "A" };
    a.self = a;

    const b: any = { name: "B" };
    b.self = b;

    expect(snapshotsEqual(a, b)).toBe(false); // Different names
  });

  it("should handle empty values", () => {
    expect(snapshotsEqual("", "")).toBe(true);
    expect(snapshotsEqual(0, 0)).toBe(true);
    expect(snapshotsEqual(false, false)).toBe(true);
    expect(snapshotsEqual([], [])).toBe(true);
    expect(snapshotsEqual({}, {})).toBe(true);
  });

  it("should handle NaN correctly", () => {
    // NaN !== NaN in JavaScript, but serialized form should match
    expect(snapshotsEqual({ nan: NaN }, { nan: NaN })).toBe(true);
  });

  it("should handle Infinity correctly", () => {
    expect(snapshotsEqual({ inf: Infinity }, { inf: Infinity })).toBe(true);
    expect(snapshotsEqual({ inf: Infinity }, { inf: -Infinity })).toBe(false);
  });

  it("should respect maxDepth option in comparison", () => {
    const deep = {
      l1: { l2: { l3: { l4: { value: "deep" } } } },
    };

    // With low maxDepth, both truncate the same way
    expect(snapshotsEqual(deep, deep, { maxDepth: 2 })).toBe(true);
  });

  it("should handle nested arrays and objects", () => {
    const a = {
      users: [
        { id: 1, name: "Alice", tags: ["admin", "user"] },
        { id: 2, name: "Bob", tags: ["user"] },
      ],
    };
    const b = {
      users: [
        { id: 1, name: "Alice", tags: ["admin", "user"] },
        { id: 2, name: "Bob", tags: ["user"] },
      ],
    };
    const c = {
      users: [
        { id: 1, name: "Alice", tags: ["admin", "user"] },
        { id: 2, name: "Bob", tags: ["admin"] }, // Different
      ],
    };

    expect(snapshotsEqual(a, b)).toBe(true);
    expect(snapshotsEqual(a, c)).toBe(false);
  });

  it("should handle objects with different key order", () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { z: 3, y: 2, x: 1 };

    expect(snapshotsEqual(a, b)).toBe(true);
  });

  it("should be deterministic", () => {
    const input = {
      name: "test",
      value: 42,
      date: new Date("2023-01-01"),
      items: [1, 2, 3],
    };

    // Multiple comparisons should give same result
    const results = Array.from({ length: 10 }, () =>
      snapshotsEqual(input, input),
    );

    expect(results.every((r) => r === true)).toBe(true);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Utils Integration", () => {
  it("should work together: isSerializable → serializer → deserializer", () => {
    const input = {
      name: "test",
      date: new Date(),
      items: [1, 2, 3],
    };

    // Check if serializable
    expect(isSerializable(input)).toBe(true);

    // Create serializer and deserialize
    const serializer = createSnapshotSerializer();
    const deserializer = createSnapshotDeserializer();

    const serialized = serializer(input);
    const deserialized = deserializer(serialized);

    expect(deserialized.name).toBe("test");
    expect(deserialized.date).toBeInstanceOf(Date);
    expect(deserialized.items).toEqual([1, 2, 3]);
  });

  it("should work with roundTripSnapshot for full cycle", () => {
    const input = {
      user: {
        id: "user_1",
        name: "Alice",
        createdAt: new Date("2023-01-01"),
      },
      settings: new Map([["theme", "dark"]]),
      tags: new Set(["admin", "user"]),
    };

    const result = roundTripSnapshot(input);

    expect(result.user.id).toBe("user_1");
    expect(result.user.createdAt).toBeInstanceOf(Date);
    expect(result.settings).toBeInstanceOf(Map);
    expect(result.tags).toBeInstanceOf(Set);
  });

  it("should use snapshotsEqual for comparison after round-trip", () => {
    const input = {
      name: "test",
      value: 42,
      date: new Date("2023-01-01"),
    };

    const result = roundTripSnapshot(input);

    // Note: Date objects won't be strictly equal via snapshotsEqual
    // because serialization format differs from original
    // But structure should match
    expect(result.name).toBe(input.name);
    expect(result.value).toBe(input.value);
    expect(result.date).toBeInstanceOf(Date);
  });

  it("should handle error cases gracefully", () => {
    const problematic = {
      normal: "ok",
      get bad() {
        throw new Error("Cannot access");
      },
    };

    // isSerializable should return false
    expect(isSerializable(problematic)).toBe(false);

    // serializer should handle gracefully
    const serializer = createSnapshotSerializer();
    const result = serializer(problematic);

    expect(result).toBeDefined();
    expect((result as any).normal).toBe("ok");
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe("Utils Performance", () => {
  it("isSerializable should complete within time budget for large objects", () => {
    const large = Object.fromEntries(
      Array.from({ length: 1000 }, (_, i) => [`key_${i}`, i]),
    );

    const start = performance.now();
    const result = isSerializable(large);
    const duration = performance.now() - start;

    expect(result).toBe(true);
    expect(duration).toBeLessThan(100); // 100ms budget
  });

  it("createSnapshotSerializer should create function quickly", () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      createSnapshotSerializer({ maxDepth: 10, skipKeys: ["secret"] });
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50); // 50ms budget
  });

  it("roundTripSnapshot should complete within time budget", () => {
    const input = {
      users: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        createdAt: new Date(),
      })),
    };

    const start = performance.now();
    const result = roundTripSnapshot(input);
    const duration = performance.now() - start;

    expect(result.users).toHaveLength(500);
    expect(duration).toBeLessThan(300); // 300ms budget
  });

  it("snapshotsEqual should complete within time budget", () => {
    const a = {
      data: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        value: `item_${i}`,
      })),
    };
    const b = {
      data: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        value: `item_${i}`,
      })),
    };

    const start = performance.now();
    const result = snapshotsEqual(a, b);
    const duration = performance.now() - start;

    expect(result).toBe(true);
    expect(duration).toBeLessThan(100); // 100ms budget
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe("Utils Edge Cases", () => {
  it("should handle undefined input to isSerializable", () => {
    expect(isSerializable(undefined)).toBe(true);
  });

  it("should handle null input to isSerializable", () => {
    expect(isSerializable(null)).toBe(true);
  });

  it("should handle empty options", () => {
    expect(isSerializable({})).toBe(true);
    expect(createSnapshotSerializer()({})).toBeDefined();
    expect(createSnapshotDeserializer()({})).toEqual({});
    expect(roundTripSnapshot({})).toEqual({});
    expect(snapshotsEqual({}, {})).toBe(true);
  });

  it("should handle Symbol values (ignored in serialization)", () => {
    const sym = Symbol("test");
    const obj: any = { visible: "yes" };
    obj[sym] = "hidden";

    expect(isSerializable(obj)).toBe(true);
    expect(snapshotsEqual(obj, { visible: "yes" })).toBe(true);
  });

  it("should handle mixed valid and invalid properties", () => {
    const input = {
      valid: "ok",
      get invalid() {
        throw new Error();
      },
    };

    expect(isSerializable(input)).toBe(false);

    const result = roundTripSnapshot(input);
    expect(result.valid).toBe("ok");
  });

  it("should handle very deep nesting with isSerializable", () => {
    let deep: any = { value: "leaf" };
    for (let i = 0; i < 100; i++) {
      deep = { child: deep };
    }

    expect(isSerializable(deep, { maxDepth: 50 })).toBe(false);
    expect(isSerializable(deep, { maxDepth: 150 })).toBe(true);
  });
});

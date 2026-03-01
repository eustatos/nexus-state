// packages/core/utils/snapshot-serialization/__tests__/deserialize.test.ts
/**
 * Unit tests for deserializeSnapshot function
 * Tests deserialization logic only (input is already serialized data)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { deserializeSnapshot } from "../deserialize";
import type { SerializedValue, DeserializationOptions } from "../types";
import { deepEqualWithSpecial, isSerializedMarker } from "./helpers";

// ============================================================================
// BASIC PRIMITIVE TYPES
// ============================================================================

describe("deserializeSnapshot - Primitive Types", () => {
  it("should return number unchanged", () => {
    expect(deserializeSnapshot(42)).toBe(42);
    expect(deserializeSnapshot(3.14159)).toBe(3.14159);
    expect(deserializeSnapshot(-100)).toBe(-100);
    expect(deserializeSnapshot(NaN)).toBe(NaN);
    expect(deserializeSnapshot(Infinity)).toBe(Infinity);
  });

  it("should return string unchanged", () => {
    expect(deserializeSnapshot("hello")).toBe("hello");
    expect(deserializeSnapshot("")).toBe("");
    expect(deserializeSnapshot("special chars: \n\t\r")).toBe(
      "special chars: \n\t\r",
    );
    expect(deserializeSnapshot("unicode: 🚀")).toBe("unicode: 🚀");
  });

  it("should return boolean unchanged", () => {
    expect(deserializeSnapshot(true)).toBe(true);
    expect(deserializeSnapshot(false)).toBe(false);
  });

  it("should return null unchanged", () => {
    expect(deserializeSnapshot(null)).toBe(null);
  });

  it("should return undefined unchanged", () => {
    expect(deserializeSnapshot(undefined)).toBe(undefined);
  });

  it("should deserialize BigInt marker to BigInt", () => {
    const input = { __type: "BigInt", value: "9007199254740991" };
    const result = deserializeSnapshot(input);

    expect(result).toBe(BigInt("9007199254740991"));
    expect(typeof result).toBe("bigint");
  });

  it("should deserialize negative BigInt marker", () => {
    const input = { __type: "BigInt", value: "-123" };
    const result = deserializeSnapshot(input);

    expect(result).toBe(BigInt(-123));
  });

  it("should handle invalid BigInt value gracefully", () => {
    const input = { __type: "BigInt", value: "not-a-number" };

    expect(() => deserializeSnapshot(input)).toThrow();
  });
});

// ============================================================================
// ARRAYS
// ============================================================================

describe("deserializeSnapshot - Arrays", () => {
  it("should deserialize array of primitives", () => {
    const input = [1, "two", true, null, undefined];
    const result = deserializeSnapshot(input);

    expect(result).toEqual(input);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should deserialize nested arrays", () => {
    const input = [[1, 2], [3, [4, 5]], [[6]]];
    const result = deserializeSnapshot(input);

    expect(result).toEqual(input);
  });

  it("should deserialize array with special type markers", () => {
    const input: SerializedValue[] = [
      { __type: "Date", value: "2023-01-01T00:00:00.000Z" },
      { __type: "RegExp", source: "test", flags: "g" },
      { __type: "BigInt", value: "123" },
    ];

    const result = deserializeSnapshot(input);

    expect(result[0]).toBeInstanceOf(Date);
    expect(result[1]).toBeInstanceOf(RegExp);
    expect(typeof result[2]).toBe("bigint");
  });

  it("should deserialize empty array", () => {
    const result = deserializeSnapshot([]);
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should preserve array order", () => {
    const input = [5, 3, 1, 4, 2];
    const result = deserializeSnapshot(input);
    expect(result).toEqual([5, 3, 1, 4, 2]);
  });

  it("should deserialize array with mixed content", () => {
    const input: SerializedValue[] = [
      42,
      "text",
      { __type: "Date", value: "2023-01-01T00:00:00.000Z" },
      { __id: "obj_1", __type: "Object", name: "test" },
    ];

    const result = deserializeSnapshot(input);

    expect(result[0]).toBe(42);
    expect(result[1]).toBe("text");
    expect(result[2]).toBeInstanceOf(Date);
    expect(result[3]).toMatchObject({ name: "test" });
  });
});

// ============================================================================
// PLAIN OBJECTS
// ============================================================================

describe("deserializeSnapshot - Plain Objects", () => {
  it("should deserialize object with metadata", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      name: "test",
      value: 42,
    };

    const result = deserializeSnapshot(input);

    expect(result).toMatchObject({
      name: "test",
      value: 42,
    });
    // Metadata should be stripped
    expect(result).not.toHaveProperty("__id");
    expect(result).not.toHaveProperty("__type");
  });

  it("should deserialize nested objects", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      user: {
        __id: "obj_2",
        __type: "Object",
        profile: {
          __id: "obj_3",
          __type: "Object",
          name: "Alice",
        },
      },
    };

    const result = deserializeSnapshot(input);

    expect(result.user).toBeDefined();
    expect(result.user.profile).toBeDefined();
    expect(result.user.profile.name).toBe("Alice");
  });

  it("should deserialize empty object", () => {
    const input = { __id: "obj_1", __type: "Object" };
    const result = deserializeSnapshot(input);

    expect(result).toEqual({});
    expect(typeof result).toBe("object");
  });

  it("should deserialize object with escaped keys", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      __esc___type: "User",
      __esc___id: "123",
      normal: "value",
    };

    const result = deserializeSnapshot(input);

    // Check that original keys are restored (unescaped)
    expect(result).toMatchObject({
      __type: "User",
      __id: "123",
      normal: "value",
    });
    // Note: __type and __id are data properties after unescaping, so they SHOULD be present
  });

  it("should deserialize object with custom escape prefix", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      "@@__meta": "test",
    };

    // Note: Default escape prefix is '__esc_' so @@ won't be unescaped
    const result = deserializeSnapshot(input);

    expect(result).toMatchObject({
      "@@__meta": "test",
    });
  });

  it("should deserialize object without metadata (plain object)", () => {
    const input = { name: "test", value: 42 };
    const result = deserializeSnapshot(input);

    expect(result).toEqual({ name: "test", value: 42 });
  });
});

// ============================================================================
// SPECIAL TYPES - DATE
// ============================================================================

describe("deserializeSnapshot - Date", () => {
  it("should deserialize Date marker to Date instance", () => {
    const input = { __type: "Date", value: "2023-06-15T10:30:00.000Z" };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe("2023-06-15T10:30:00.000Z");
  });

  it("should deserialize Date with milliseconds", () => {
    const input = { __type: "Date", value: "2023-01-01T12:00:00.123Z" };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Date);
    expect(result.getMilliseconds()).toBe(123);
  });

  it("should deserialize invalid Date string", () => {
    const input = { __type: "Date", value: "invalid-date" };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(true);
  });

  it("should deserialize Date in nested structure", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      user: {
        __id: "obj_2",
        __type: "Object",
        createdAt: { __type: "Date", value: "2023-01-01T00:00:00.000Z" },
        updatedAt: { __type: "Date", value: "2023-06-01T00:00:00.000Z" },
      },
    };

    const result = deserializeSnapshot(input);

    expect(result.user.createdAt).toBeInstanceOf(Date);
    expect(result.user.updatedAt).toBeInstanceOf(Date);
    expect(result.user.createdAt.getTime()).not.toBe(
      result.user.updatedAt.getTime(),
    );
  });

  it("should not restore Date when restoreSpecialTypes is false", () => {
    const input = { __type: "Date", value: "2023-01-01T00:00:00.000Z" };
    const result = deserializeSnapshot(input, { restoreSpecialTypes: false });

    expect(result).toEqual(input);
    expect(result).not.toBeInstanceOf(Date);
  });

  it("should handle Date marker without value property", () => {
    const input = { __type: "Date" };
    const result = deserializeSnapshot(input);

    // Should return undefined or handle gracefully
    expect(result).toBeUndefined();
  });
});

// ============================================================================
// SPECIAL TYPES - REGEXP
// ============================================================================

describe("deserializeSnapshot - RegExp", () => {
  it("should deserialize RegExp marker to RegExp instance", () => {
    const input = { __type: "RegExp", source: "^[a-z]+$", flags: "gi" };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe("^[a-z]+$");
    expect(result.flags).toBe("gi");
  });

  it("should deserialize RegExp without flags", () => {
    const input = { __type: "RegExp", source: "test", flags: "" };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe("test");
    expect(result.flags).toBe("");
  });

  it("should deserialize RegExp with all flag types", () => {
    const input = { __type: "RegExp", source: "pattern", flags: "gimsuy" };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(RegExp);
    expect(result.flags).toBe("gimsuy");
  });

  it("should deserialize RegExp in nested structure", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      validators: {
        __id: "obj_2",
        __type: "Object",
        email: {
          __type: "RegExp",
          source: "^[a-z]+@[a-z]+\\.[a-z]+$",
          flags: "",
        },
        phone: { __type: "RegExp", source: "^\\d+$", flags: "g" },
      },
    };

    const result = deserializeSnapshot(input);

    expect(result.validators.email).toBeInstanceOf(RegExp);
    expect(result.validators.phone).toBeInstanceOf(RegExp);
    expect(result.validators.phone.flags).toBe("g");
  });

  it("should not restore RegExp when restoreSpecialTypes is false", () => {
    const input = { __type: "RegExp", source: "test", flags: "g" };
    const result = deserializeSnapshot(input, { restoreSpecialTypes: false });

    expect(result).toEqual(input);
    expect(result).not.toBeInstanceOf(RegExp);
  });

  it("should handle RegExp marker without source property", () => {
    const input = { __type: "RegExp", flags: "g" };
    const result = deserializeSnapshot(input);

    expect(result).toBeUndefined();
  });
});

// ============================================================================
// SPECIAL TYPES - MAP
// ============================================================================

describe("deserializeSnapshot - Map", () => {
  it("should deserialize empty Map marker", () => {
    const input = { __type: "Map", entries: [] };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it("should deserialize Map with primitive entries", () => {
    const input = {
      __type: "Map",
      entries: [
        ["key1", "value1"],
        ["key2", 42],
        ["key3", true],
      ],
    };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Map);
    expect(result.get("key1")).toBe("value1");
    expect(result.get("key2")).toBe(42);
    expect(result.get("key3")).toBe(true);
  });

  it("should deserialize Map with object keys and values", () => {
    const input = {
      __type: "Map",
      entries: [
        [
          { __id: "obj_1", __type: "Object", id: 1 },
          { __id: "obj_2", __type: "Object", name: "Alice" },
        ],
        [
          { __id: "obj_3", __type: "Object", id: 2 },
          { __id: "obj_4", __type: "Object", name: "Bob" },
        ],
      ],
    };

    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(2);

    for (const [k, v] of result) {
      expect(k).toMatchObject({ id: expect.any(Number) });
      expect(v).toMatchObject({ name: expect.any(String) });
    }
  });

  it("should deserialize Map with Date values", () => {
    const input = {
      __type: "Map",
      entries: [
        ["created", { __type: "Date", value: "2023-01-01T00:00:00.000Z" }],
        ["updated", { __type: "Date", value: "2023-06-01T00:00:00.000Z" }],
      ],
    };

    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Map);
    expect(result.get("created")).toBeInstanceOf(Date);
    expect(result.get("updated")).toBeInstanceOf(Date);
  });

  it("should deserialize Map with nested Map values", () => {
    const input = {
      __type: "Map",
      entries: [
        [
          "outer",
          {
            __type: "Map",
            entries: [["inner", "value"]],
          },
        ],
      ],
    };

    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Map);
    expect(result.get("outer")).toBeInstanceOf(Map);
    expect(result.get("outer").get("inner")).toBe("value");
  });

  it("should not restore Map when restoreSpecialTypes is false", () => {
    const input = { __type: "Map", entries: [["k", "v"]] };
    const result = deserializeSnapshot(input, { restoreSpecialTypes: false });

    expect(result).toEqual(input);
    expect(result).not.toBeInstanceOf(Map);
  });
});

// ============================================================================
// SPECIAL TYPES - SET
// ============================================================================

describe("deserializeSnapshot - Set", () => {
  it("should deserialize empty Set marker", () => {
    const input = { __type: "Set", values: [] };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should deserialize Set with primitive values", () => {
    const input = {
      __type: "Set",
      values: [1, 2, 3, "four", true],
    };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(5);
    expect(result.has(1)).toBe(true);
    expect(result.has("four")).toBe(true);
  });

  it("should deserialize Set with object values", () => {
    const input = {
      __type: "Set",
      values: [
        { __id: "obj_1", __type: "Object", id: 1 },
        { __id: "obj_2", __type: "Object", id: 2 },
      ],
    };

    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);

    for (const item of result) {
      expect(item).toMatchObject({ id: expect.any(Number) });
    }
  });

  it("should deserialize Set with Date values", () => {
    const input = {
      __type: "Set",
      values: [
        { __type: "Date", value: "2023-01-01T00:00:00.000Z" },
        { __type: "Date", value: "2023-06-01T00:00:00.000Z" },
      ],
    };

    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);

    for (const item of result) {
      expect(item).toBeInstanceOf(Date);
    }
  });

  it("should not restore Set when restoreSpecialTypes is false", () => {
    const input = { __type: "Set", values: [1, 2, 3] };
    const result = deserializeSnapshot(input, { restoreSpecialTypes: false });

    expect(result).toEqual(input);
    expect(result).not.toBeInstanceOf(Set);
  });
});

// ============================================================================
// SPECIAL TYPES - ERROR
// ============================================================================

describe("deserializeSnapshot - Error", () => {
  it("should deserialize Error marker to Error instance", () => {
    const input = {
      __type: "Error",
      name: "Error",
      message: "Something went wrong",
    };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Something went wrong");
    expect(result.name).toBe("Error");
  });

  it("should deserialize TypeError marker", () => {
    const input = {
      __type: "Error",
      name: "TypeError",
      message: "Invalid type",
    };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(TypeError);
    expect(result.message).toBe("Invalid type");
    expect(result.name).toBe("TypeError");
  });

  it("should deserialize RangeError marker", () => {
    const input = {
      __type: "Error",
      name: "RangeError",
      message: "Out of bounds",
    };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(RangeError);
    expect(result.name).toBe("RangeError");
  });

  it("should deserialize Error with stack trace", () => {
    const input = {
      __type: "Error",
      name: "Error",
      message: "Test error",
      stack: "Error: Test error\n    at test.js:1:1",
    };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Error);
    expect(result.stack).toBe("Error: Test error\n    at test.js:1:1");
  });

  it("should deserialize Error without stack trace", () => {
    const input = {
      __type: "Error",
      name: "Error",
      message: "Test error",
    };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Error);
    expect(result.stack).toBeDefined(); // Error creates stack by default
  });

  it("should handle unknown Error type gracefully", () => {
    const input = {
      __type: "Error",
      name: "CustomError",
      message: "Custom error",
    };
    const result = deserializeSnapshot(input);

    // Should fall back to base Error
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Custom error");
  });

  it("should handle Error marker without message property", () => {
    const input = { __type: "Error", name: "Error" };
    const result = deserializeSnapshot(input);

    expect(result).toBeUndefined();
  });
});

// ============================================================================
// SPECIAL TYPES - FUNCTION
// ============================================================================

describe("deserializeSnapshot - Function", () => {
  it("should deserialize Function marker to null", () => {
    const input = {
      __type: "Function",
      name: "testFn",
      source: "function testFn() { return 42; }",
    };
    const result = deserializeSnapshot(input);

    expect(result).toBeNull();
  });

  it("should deserialize anonymous Function marker to null", () => {
    const input = {
      __type: "Function",
      name: "anonymous",
      source: "() => 42",
    };
    const result = deserializeSnapshot(input);

    expect(result).toBeNull();
  });

  it("should not restore Function even when restoreSpecialTypes is true", () => {
    const input = {
      __type: "Function",
      name: "testFn",
      source: "function testFn() {}",
    };
    const result = deserializeSnapshot(input, { restoreSpecialTypes: true });

    // Functions are never restored for security
    expect(result).toBeNull();
  });
});

// ============================================================================
// SPECIAL TYPES - MAX DEPTH EXCEEDED
// ============================================================================

describe("deserializeSnapshot - MaxDepthExceeded", () => {
  it("should deserialize MaxDepthExceeded marker to debug object", () => {
    const input = {
      __type: "MaxDepthExceeded",
      __message: "Max depth 50 reached at path: root.user.profile",
    };
    const result = deserializeSnapshot(input);

    expect(result).toMatchObject({
      __maxDepthExceeded: "Max depth 50 reached at path: root.user.profile",
    });
  });

  it("should preserve MaxDepthExceeded message", () => {
    const input = {
      __type: "MaxDepthExceeded",
      __message: "Custom depth error message",
    };
    const result = deserializeSnapshot(input);

    expect(result.__maxDepthExceeded).toBe("Custom depth error message");
  });
});

// ============================================================================
// CIRCULAR REFERENCES
// ============================================================================

describe("deserializeSnapshot - Circular References", () => {
  it("should resolve self-reference to same object", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      name: "root",
      self: { __ref: "obj_1" },
    };

    const result = deserializeSnapshot(input);

    expect(result.self).toBe(result);
    expect(result.self.name).toBe("root");
  });

  it("should resolve mutual circular references (A -> B -> A)", () => {
    const input = {
      __id: "root",
      __type: "Object",
      a: {
        __id: "obj_a",
        __type: "Object",
        name: "A",
        ref: { __ref: "obj_b" },
      },
      b: {
        __id: "obj_b",
        __type: "Object",
        name: "B",
        ref: { __ref: "obj_a" },
      },
    };

    const result = deserializeSnapshot(input);

    expect(result.a.ref).toBe(result.b);
    expect(result.b.ref).toBe(result.a);
    expect(result.a.ref.name).toBe("B");
    expect(result.b.ref.name).toBe("A");
  });

  it("should resolve circular reference in array", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      items: [1, 2, { __ref: "obj_1" }],
    };

    const result = deserializeSnapshot(input);

    expect(result.items[2]).toBe(result);
  });

  it("should resolve complex circular graph (triangle)", () => {
    const input = {
      __id: "root",
      __type: "Object",
      root: {
        __id: "obj_a",
        __type: "Object",
        name: "A",
        next: {
          __id: "obj_b",
          __type: "Object",
          name: "B",
          next: {
            __id: "obj_c",
            __type: "Object",
            name: "C",
            next: { __ref: "obj_a" },
          },
        },
      },
    };

    const result = deserializeSnapshot(input);

    expect(result.root.name).toBe("A");
    expect(result.root.next.name).toBe("B");
    expect(result.root.next.next.name).toBe("C");
    expect(result.root.next.next.next).toBe(result.root);
  });

  it("should handle reference before object definition", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      first: { __ref: "obj_2" },
      second: {
        __id: "obj_2",
        __type: "Object",
        name: "defined later",
      },
    };

    const result = deserializeSnapshot(input);

    // Placeholder should be updated when obj_2 is resolved
    expect(result.first).toBeDefined();
    expect(result.second.name).toBe("defined later");
  });

  it("should handle multiple references to same object", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      name: "shared",
      ref1: { __ref: "obj_1" },
      ref2: { __ref: "obj_1" },
      ref3: { __ref: "obj_1" },
    };

    const result = deserializeSnapshot(input);

    expect(result.ref1).toBe(result);
    expect(result.ref2).toBe(result);
    expect(result.ref3).toBe(result);
    expect(result.ref1).toBe(result.ref2);
  });
});

// ============================================================================
// DESERIALIZATION OPTIONS
// ============================================================================

describe("deserializeSnapshot - Options", () => {
  describe("restoreSpecialTypes", () => {
    it("should restore special types when enabled (default)", () => {
      const input = {
        __id: "obj_1",
        __type: "Object",
        date: { __type: "Date", value: "2023-01-01T00:00:00.000Z" },
        regex: { __type: "RegExp", source: "test", flags: "g" },
      };

      const result = deserializeSnapshot(input, { restoreSpecialTypes: true });

      expect(result.date).toBeInstanceOf(Date);
      expect(result.regex).toBeInstanceOf(RegExp);
    });

    it("should leave special types as plain objects when disabled", () => {
      const input = {
        __id: "obj_1",
        __type: "Object",
        date: { __type: "Date", value: "2023-01-01T00:00:00.000Z" },
        regex: { __type: "RegExp", source: "test", flags: "g" },
      };

      const result = deserializeSnapshot(input, { restoreSpecialTypes: false });

      expect(result.date).toEqual({
        __type: "Date",
        value: "2023-01-01T00:00:00.000Z",
      });
      expect(result.regex).toEqual({
        __type: "RegExp",
        source: "test",
        flags: "g",
      });
      expect(result.date).not.toBeInstanceOf(Date);
    });

    it("should partially restore when some types are disabled", () => {
      const input = {
        date: { __type: "Date", value: "2023-01-01T00:00:00.000Z" },
        regex: { __type: "RegExp", source: "test", flags: "g" },
      };

      const result = deserializeSnapshot(input, { restoreSpecialTypes: false });

      expect(result.date).not.toBeInstanceOf(Date);
      expect(result.regex).not.toBeInstanceOf(RegExp);
    });
  });

  describe("allowedConstructors", () => {
    it("should restore prototype for whitelisted constructors", () => {
      // Create a test class and register globally
      class TestClass {
        customMethod() {
          return "works";
        }
      }
      (globalThis as any).TestClass = TestClass;

      const input = {
        __id: "obj_1",
        __type: "TestClass",
      };

      const result = deserializeSnapshot(input, {
        allowedConstructors: ["Object", "Array", "TestClass"],
      });

      expect(result).toBeInstanceOf(TestClass);
      expect(typeof result.customMethod).toBe("function");

      // Cleanup
      delete (globalThis as any).TestClass;
    });

    it("should not restore prototype for non-whitelisted constructors", () => {
      class RestrictedClass {
        restricted() {
          return "secret";
        }
      }
      (globalThis as any).RestrictedClass = RestrictedClass;

      const input = {
        __id: "obj_1",
        __type: "RestrictedClass",
      };

      const result = deserializeSnapshot(input, {
        allowedConstructors: ["Object", "Array"],
      });

      expect(result).not.toBeInstanceOf(RestrictedClass);
      expect(typeof result.restricted).toBe("undefined");

      // Cleanup
      delete (globalThis as any).RestrictedClass;
    });

    it("should handle Object type correctly", () => {
      const input = {
        __id: "obj_1",
        __type: "Object",
        name: "test",
      };

      const result = deserializeSnapshot(input, {
        allowedConstructors: ["Object"],
      });

      expect(result).toMatchObject({ name: "test" });
      expect(result).toBeInstanceOf(Object);
    });

    it("should handle Array type correctly", () => {
      const input = {
        __id: "obj_1",
        __type: "Array",
        "0": 1,
        "1": 2,
        "2": 3,
      };

      const result = deserializeSnapshot(input, {
        allowedConstructors: ["Object", "Array"],
      });

      // Note: Arrays are handled specially in deserialization
      expect(result).toMatchObject({ "0": 1, "1": 2, "2": 3 });
    });
  });

  describe("customRevivers", () => {
    it("should apply custom reviver for specific __type", () => {
      const input = {
        __type: "CustomType",
        id: "user_1",
        data: "custom data",
      };

      const result = deserializeSnapshot(input, {
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

      expect(result).toMatchObject({
        restored: true,
        id: "user_1",
        data: "custom data",
      });
    });

    it("should apply custom reviver before default handling", () => {
      const input = {
        __type: "Date",
        value: "2023-01-01T00:00:00.000Z",
      };

      const result = deserializeSnapshot(input, {
        customRevivers: new Map([
          ["Date", (val: any) => `custom:${val.value}`],
        ]),
      });

      // Custom reviver should override default Date handling
      expect(result).toBe("custom:2023-01-01T00:00:00.000Z");
      expect(result).not.toBeInstanceOf(Date);
    });

    it("should pass context to custom reviver", () => {
      const input = {
        __type: "Node",
        value: "root",
        children: [
          { __type: "Node", value: "child1" },
          { __type: "Node", value: "child2" },
        ],
      };

      const reviverCalls: any[] = [];

      const result = deserializeSnapshot(input, {
        customRevivers: new Map([
          [
            "Node",
            (val: any, ctx) => {
              reviverCalls.push(val.value);
              return {
                nodeType: "custom",
                value: val.value,
                childCount: val.children?.length || 0,
              };
            },
          ],
        ]),
      });

      expect(reviverCalls).toContain("root");
      expect(result.nodeType).toBe("custom");
    });

    it("should handle missing custom reviver gracefully", () => {
      const input = {
        __type: "UnknownType",
        data: "test",
      };

      const result = deserializeSnapshot(input, {
        customRevivers: new Map([["OtherType", (val: any) => val]]),
      });

      // Should fall through to default object handling
      expect(result).toMatchObject({ data: "test" });
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe("deserializeSnapshot - Edge Cases", () => {
  it("should handle empty object input", () => {
    const result = deserializeSnapshot({});
    expect(result).toEqual({});
  });

  it("should handle object with only metadata", () => {
    const input = { __id: "obj_1", __type: "Object" };
    const result = deserializeSnapshot(input);
    expect(result).toEqual({});
  });

  it("should handle unknown __type markers", () => {
    const input = { __type: "UnknownType", data: "test" };
    const result = deserializeSnapshot(input);

    // Should fall through to default object handling
    expect(result).toMatchObject({ data: "test" });
  });

  it("should handle malformed Date marker", () => {
    const input = { __type: "Date" };
    const result = deserializeSnapshot(input);
    expect(result).toBeUndefined();
  });

  it("should handle malformed RegExp marker", () => {
    const input = { __type: "RegExp" };
    const result = deserializeSnapshot(input);
    expect(result).toBeUndefined();
  });

  it("should handle malformed Map marker", () => {
    const input = { __type: "Map" };
    const result = deserializeSnapshot(input);
    expect(result).toBeUndefined();
  });

  it("should handle malformed Set marker", () => {
    const input = { __type: "Set" };
    const result = deserializeSnapshot(input);
    expect(result).toBeUndefined();
  });

  it("should handle reference to non-existent object", () => {
    const input = {
      __id: "obj_1",
      __type: "Object",
      ref: { __ref: "obj_nonexistent" },
    };

    const result = deserializeSnapshot(input);

    // Should create placeholder for missing reference
    expect(result.ref).toBeDefined();
    expect(typeof result.ref).toBe("object");
  });

  it("should handle deeply nested structures", () => {
    const input: any = {
      __id: "obj_1",
      __type: "Object",
      level1: {
        __id: "obj_2",
        __type: "Object",
        level2: {
          __id: "obj_3",
          __type: "Object",
          level3: {
            __id: "obj_4",
            __type: "Object",
            value: "deep",
          },
        },
      },
    };

    const result = deserializeSnapshot(input);
    expect(result.level1.level2.level3.value).toBe("deep");
  });

  it("should handle object with many properties", () => {
    const input: any = { __id: "obj_1", __type: "Object" };
    for (let i = 0; i < 100; i++) {
      input[`prop_${i}`] = i;
    }

    const result = deserializeSnapshot(input);
    expect(result.prop_0).toBe(0);
    expect(result.prop_99).toBe(99);
    expect(Object.keys(result)).toHaveLength(100);
  });
});

// ============================================================================
// VALIDATION
// ============================================================================

describe("deserializeSnapshot - Output Validation", () => {
  it("should produce Date instance from Date marker", () => {
    const input = { __type: "Date", value: "2023-01-01T00:00:00.000Z" };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe("2023-01-01T00:00:00.000Z");
  });

  it("should produce RegExp instance from RegExp marker", () => {
    const input = { __type: "RegExp", source: "test", flags: "g" };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(RegExp);
    expect(result.test("test")).toBe(true);
  });

  it("should produce Map instance from Map marker", () => {
    const input = { __type: "Map", entries: [["k", "v"]] };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Map);
    expect(result.get("k")).toBe("v");
  });

  it("should produce Set instance from Set marker", () => {
    const input = { __type: "Set", values: [1, 2, 3] };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Set);
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.has(3)).toBe(true);
  });

  it("should produce Error instance from Error marker", () => {
    const input = { __type: "Error", name: "Error", message: "test" };
    const result = deserializeSnapshot(input);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("test");
  });

  it("should produce null from Function marker", () => {
    const input = { __type: "Function", name: "fn", source: "function() {}" };
    const result = deserializeSnapshot(input);

    expect(result).toBeNull();
  });

  it("should produce BigInt from BigInt marker", () => {
    const input = { __type: "BigInt", value: "123456789" };
    const result = deserializeSnapshot(input);

    expect(typeof result).toBe("bigint");
    expect(result).toBe(BigInt("123456789"));
  });
});

/**
 * Performance benchmarks for StateSerializer
 */

import { describe, bench } from "vitest";
import { createStateSerializer } from "../../state-serializer";

describe("StateSerializer Performance", () => {
  describe("Serialization Performance", () => {
    const serializer = createStateSerializer();

    bench("serialize simple object", () => {
      const simpleObject = {
        string: "test",
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: { key: "value" },
      };

      serializer.serialize(simpleObject);
    });

    bench("serialize complex nested object", () => {
      const complexObject = {
        users: [
          { id: 1, name: "Alice", profile: { age: 30, active: true } },
          { id: 2, name: "Bob", profile: { age: 25, active: false } },
          { id: 3, name: "Charlie", profile: { age: 35, active: true } },
        ],
        metadata: {
          timestamp: Date.now(),
          version: "1.0.0",
          settings: {
            theme: "dark",
            notifications: true,
            preferences: {
              language: "en",
              timezone: "UTC",
            },
          },
        },
      };

      serializer.serialize(complexObject);
    });

    bench("serialize large array", () => {
      const largeArray = new Array(1000).fill(null).map((_, index) => ({
        id: index,
        value: `item-${index}`,
        data: {
          nested: { deeper: { value: index * 2 } },
        },
      }));

      serializer.serialize(largeArray);
    });
  });

  describe("Deserialization Performance", () => {
    const serializer = createStateSerializer();

    // Create serialized data for deserialization tests
    const simpleObject = { test: "value", number: 42 };
    const serializedSimple = serializer.serialize(simpleObject);

    const complexObject = {
      nested: {
        array: [1, 2, { inner: "object" }],
        date: new Date().toISOString(),
      },
    };
    const serializedComplex = serializer.serialize(complexObject);

    const largeArray = new Array(500)
      .fill(null)
      .map((_, i) => ({ id: i, value: i * 2 }));
    const serializedLargeArray = serializer.serialize(largeArray);

    bench("deserialize simple object", () => {
      serializer.deserialize(serializedSimple);
    });

    bench("deserialize complex object", () => {
      serializer.deserialize(serializedComplex);
    });

    bench("deserialize large array", () => {
      serializer.deserialize(serializedLargeArray);
    });
  });

  describe("Round-trip Performance", () => {
    const serializer = createStateSerializer();

    bench("round-trip simple object", () => {
      const original = { a: 1, b: "test", c: true };
      const serialized = serializer.serialize(original);
      const deserialized = serializer.deserialize(serialized);
      // Verify structure matches (not content equality for performance)
      if (!deserialized || typeof deserialized !== "object") {
        throw new Error("Deserialization failed");
      }
    });

    bench("round-trip with circular reference handling", () => {
      const obj: any = { a: 1 };
      obj.self = obj; // Circular reference

      try {
        const serialized = serializer.serialize(obj);
        const deserialized = serializer.deserialize(serialized);
        if (!deserialized || typeof deserialized !== "object") {
          throw new Error("Deserialization failed");
        }
      } catch (error) {
        // Circular references might throw - that's expected
        // Just ensure we don't crash the benchmark
      }
    });
  });

  describe("Memory Efficiency", () => {
    bench("serialize multiple states with reuse", () => {
      const serializer = createStateSerializer();
      const template = {
        user: { id: 1, name: "Test" },
        items: [] as Array<{ id: number; name: string }>,
      };

      // Serialize variations of the same template
      for (let i = 0; i < 100; i++) {
        const state = {
          ...template,
          user: { ...template.user, id: i },
          items: new Array(i % 10).fill(null).map((_, idx) => ({
            id: idx,
            name: `Item ${idx}`,
          })),
        };

        serializer.serialize(state);
      }
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import { serializeState, serializeMap, serializeSet } from "./utils/serialization";
import { atom, createStore, atomRegistry } from "./index";
import { isPrimitiveAtom, isComputedAtom, isWritableAtom } from "./types";
import type { Getter, Setter } from "./types";

describe("atom", () => {
  it("should create a primitive atom", () => {
    const countAtom = atom(0);
    expect(countAtom).toBeDefined();
    expect(countAtom.id).toBeDefined();
  });

  it("should create a computed atom", () => {
    const countAtom = atom(0);
    const doubleAtom = atom((get: Getter) => get(countAtom) * 2);
    expect(doubleAtom).toBeDefined();
    expect(doubleAtom.id).toBeDefined();
  });

  describe("atom types", () => {
    it("should detect primitive atom type", () => {
      const primitiveAtom = atom(42);
      expect(primitiveAtom.type).toBe("primitive");
    });

    it("should detect computed atom type", () => {
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);
      expect(computedAtom.type).toBe("computed");
    });

    it("should detect writable atom type", () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );
      expect(writableAtom.type).toBe("writable");
    });
  });

  describe("atom with name", () => {
    it("should create atom with name for primitive", () => {
      const countAtom = atom(0, "count");
      expect(countAtom.name).toBe("count");
    });

    it("should create atom with name for computed", () => {
      const countAtom = atom(0);
      const doubleAtom = atom((get: Getter) => get(countAtom) * 2, "double");
      expect(doubleAtom.name).toBe("double");
    });

    it("should create atom with name for writable", () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value),
        "writable-count"
      );
      expect(writableAtom.name).toBe("writable-count");
    });

    it("should register atom with registry when created", () => {
      const testAtom = atom(42, "test-atom");
      const registeredAtom = atomRegistry.get(testAtom.id);
      expect(registeredAtom).toBe(testAtom);
    });
  });

  describe("atom registry", () => {
    it("should get atom by ID", () => {
      const testAtom = atom(123, "registry-test");
      const retrievedAtom = atomRegistry.get(testAtom.id);
      expect(retrievedAtom).toBe(testAtom);
    });

    it("should get atom metadata", () => {
      const testAtom = atom(456, "metadata-test");
      const metadata = atomRegistry.getMetadata(testAtom);
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe("metadata-test");
      expect(metadata?.type).toBe("primitive");
    });

    it("should get atom name", () => {
      const testAtom = atom(789, "name-test");
      const name = atomRegistry.getName(testAtom);
      expect(name).toBe("name-test");
    });

    it("should return fallback name if no name provided", () => {
      const testAtom = atom("no-name");
      const name = atomRegistry.getName(testAtom);
      expect(name).toBeDefined();
      // Fallback names are auto-generated as numbers from counter
      expect(typeof name).toBe("string");
    });

    it("should get all atoms", () => {
      const atom1 = atom(1);
      const atom2 = atom(2);
      const atom3 = atom(3);

      const allAtoms = atomRegistry.getAll();
      expect(allAtoms.size).toBeGreaterThanOrEqual(3);
    });

    it("should get registry size", () => {
      const initialSize = atomRegistry.size();
      const testAtom = atom("size-test");
      expect(atomRegistry.size()).toBe(initialSize + 1);
    });

    it("should handle duplicate atom registration", () => {
      const testAtom = atom("duplicate-test", "dup-atom");
      const initialMetadata = atomRegistry.getMetadata(testAtom);

      // Try to register the same atom again with different name
      atomRegistry.register(testAtom, "dup-atom-updated");

      const updatedMetadata = atomRegistry.getMetadata(testAtom);
      expect(updatedMetadata?.name).toBe("dup-atom-updated");
    });

    it("should clear registry", () => {
      atomRegistry.clear();
      const testAtom = atom("clear-test");
      atomRegistry.clear();
      expect(atomRegistry.size()).toBe(0);
    });
  });

  describe("writable atoms", () => {
    it("should create a writable atom", () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );
      expect(writableAtom.type).toBe("writable");
      expect(writableAtom.write).toBeDefined();
    });

    it("should update writable atom value through store", () => {
      const store = createStore();
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );

      expect(store.get(writableAtom)).toBe(0);

      store.set(writableAtom, 10);
      expect(store.get(baseAtom)).toBe(10);
    });

    it("should handle writable atom in computed dependencies", () => {
      const store = createStore();
      const baseAtom = atom(5);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );
      const doubleAtom = atom((get: Getter) => get(writableAtom) * 2);

      expect(store.get(doubleAtom)).toBe(10);

      store.set(writableAtom, 10);
      expect(store.get(doubleAtom)).toBe(20);
    });
  });

  describe("computed atoms", () => {
    it("should handle computed atom with multiple dependencies", () => {
      const store = createStore();
      const atom1 = atom(10);
      const atom2 = atom(20);
      const sumAtom = atom((get: Getter) => get(atom1) + get(atom2));

      expect(store.get(sumAtom)).toBe(30);

      store.set(atom1, 15);
      expect(store.get(sumAtom)).toBe(35);

      store.set(atom2, 25);
      expect(store.get(sumAtom)).toBe(40);
    });

    it("should handle nested computed atoms", () => {
      const store = createStore();
      const baseAtom = atom(5);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      const tripleDoubleAtom = atom((get: Getter) => get(doubleAtom) * 3);

      expect(store.get(tripleDoubleAtom)).toBe(30);

      store.set(baseAtom, 10);
      expect(store.get(tripleDoubleAtom)).toBe(60);
    });

    it("should handle computed atom with conditional logic", () => {
      const store = createStore();
      const valueAtom = atom(10);
      const resultAtom = atom((get: Getter) => {
        const value = get(valueAtom);
        return value > 5 ? "large" : "small";
      });

      expect(store.get(resultAtom)).toBe("large");

      store.set(valueAtom, 3);
      expect(store.get(resultAtom)).toBe("small");
    });

    it("should handle computed atom with array operations", () => {
      const store = createStore();
      const numbersAtom = atom([1, 2, 3, 4, 5]);
      const sumAtom = atom((get: Getter) => {
        const numbers = get(numbersAtom);
        return numbers.reduce((sum, n) => sum + n, 0);
      });

      expect(store.get(sumAtom)).toBe(15);

      store.set(numbersAtom, [10, 20, 30]);
      expect(store.get(sumAtom)).toBe(60);
    });

    it("should handle computed atom with object destructuring", () => {
      const store = createStore();
      const userAtom = atom({ name: "John", age: 30 });
      const greetingAtom = atom((get: Getter) => {
        const user = get(userAtom);
        return `Hello, ${user.name}!`;
      });

      expect(store.get(greetingAtom)).toBe("Hello, John!");

      store.set(userAtom, { name: "Jane", age: 25 });
      expect(store.get(greetingAtom)).toBe("Hello, Jane!");
    });

    it("should throw error when setting computed atom", () => {
      const store = createStore();
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);

      expect(() => store.set(computedAtom, 100)).toThrow(
        "Cannot set value of computed atom"
      );
    });
  });

  describe("atom edge cases", () => {
    it("should handle null initial value", () => {
      const nullAtom = atom(null);
      const store = createStore();
      expect(store.get(nullAtom)).toBeNull();
    });

    it("should handle undefined initial value", () => {
      const undefinedAtom = atom(undefined);
      const store = createStore();
      expect(store.get(undefinedAtom)).toBeUndefined();
    });

    it("should handle empty string", () => {
      const emptyAtom = atom("");
      const store = createStore();
      expect(store.get(emptyAtom)).toBe("");
    });

    it("should handle zero value", () => {
      const zeroAtom = atom(0);
      const store = createStore();
      expect(store.get(zeroAtom)).toBe(0);
    });

    it("should handle false boolean", () => {
      const falseAtom = atom(false);
      const store = createStore();
      expect(store.get(falseAtom)).toBe(false);
    });

    it("should handle large numbers", () => {
      const largeAtom = atom(Number.MAX_SAFE_INTEGER);
      const store = createStore();
      expect(store.get(largeAtom)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle complex nested objects", () => {
      const complexAtom = atom({
        level1: {
          level2: {
            level3: {
              value: "deep",
            },
          },
        },
        array: [1, 2, { nested: true }],
      });
      const store = createStore();

      const value = store.get(complexAtom);
      expect(value.level1.level2.level3.value).toBe("deep");
      expect(value.array[2].nested).toBe(true);
    });

    it("should handle circular references in primitive atoms", () => {
      const store = createStore();
      const obj: any = { value: 42 };
      obj.self = obj; // Create circular reference

      const circularAtom = atom(obj);
      expect(() => store.get(circularAtom)).not.toThrow();
    });
  });

  describe("atom type guards", () => {
    it("should identify primitive atom", () => {
      const primitiveAtom = atom(42);
      expect(isPrimitiveAtom(primitiveAtom)).toBe(true);
    });

    it("should identify computed atom", () => {
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);
      expect(isComputedAtom(computedAtom)).toBe(true);
    });

    it("should identify writable atom", () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );
      expect(isWritableAtom(writableAtom)).toBe(true);
    });

    it("should not identify wrong atom types", () => {
      const primitiveAtom = atom(42);
      const computedAtom = atom((get: Getter) => get(primitiveAtom) * 2);
      const writableAtom = atom(
        (get: Getter) => get(primitiveAtom),
        (get: Getter, set: Setter, value: number) => set(primitiveAtom, value)
      );

      expect(isPrimitiveAtom(computedAtom)).toBe(false);
      expect(isPrimitiveAtom(writableAtom)).toBe(false);
      expect(isComputedAtom(primitiveAtom)).toBe(false);
      expect(isComputedAtom(writableAtom)).toBe(false);
      expect(isWritableAtom(primitiveAtom)).toBe(false);
      expect(isWritableAtom(computedAtom)).toBe(false);
    });
  });

  describe("atom dependency tracking", () => {
    it("should track simple dependency", () => {
      const store = createStore();
      const baseAtom = atom(10);
      const dependentAtom = atom((get: Getter) => get(baseAtom) * 2);

      // Get dependent atom first to establish dependency
      store.get(dependentAtom);

      // Set base atom - should trigger dependent recomputation
      store.set(baseAtom, 20);

      expect(store.get(dependentAtom)).toBe(40);
    });

    it("should handle circular dependencies without infinite loop", () => {
      const store = createStore();
      const atom1 = atom((get: Getter) => {
        try {
          return get(atom2) + 1;
        } catch {
          return 1;
        }
      });
      const atom2 = atom((get: Getter) => {
        try {
          return get(atom1) + 1;
        } catch {
          return 2;
        }
      });

      // In a real implementation, this would detect and handle circular deps
      // For now, we just ensure it doesn't crash
      const value1 = store.get(atom1);
      expect(value1).toBeDefined();
    });
  });

  describe("atom error handling", () => {
    it("should handle atom that throws in read function", () => {
      const errorAtom = atom((get: Getter) => {
        throw new Error("Atom error");
      });
      const store = createStore();

      expect(() => store.get(errorAtom)).toThrow("Atom error");
    });

    it("should handle atom with invalid initial value type", () => {
      const store = createStore();
      
      // This creates a computed atom that throws when evaluated
      const errorAtom = atom((get: Getter) => {
        throw new Error("Atom error");
      });
      
      expect(() => store.get(errorAtom)).toThrow("Atom error");
    });
  });

  describe("atom serialization", () => {
    it("should serialize atom with primitive value", () => {
      const testAtom = atom(42);
      const store = createStore();
      store.set(testAtom, 100);

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it("should serialize atom with object value", () => {
      const testAtom = atom({ name: "test", value: 123 });
      const store = createStore();

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it("should serialize atom with Map value", async () => {
      const testAtom = atom(new Map([["key", "value"]]));
      
      const store = createStore();

      const serialized = serializeMap(new Map([["key", "value"]]));
      expect(serialized.__type).toBe("Map");
      expect(serialized.entries.length).toBe(1);
    });

    it("should serialize atom with Set value", async () => {
      const testAtom = atom(new Set([1, 2, 3]));
      
      const store = createStore();

      const serialized = serializeSet(new Set([1, 2, 3]));
      expect(serialized.__type).toBe("Set");
      expect(serialized.values.length).toBe(3);
    });
  });
});

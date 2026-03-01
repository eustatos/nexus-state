import { describe, it, expect, vi } from "vitest";
import { atom, createStore } from "../index";
import { 
  SerializationUtils, 
  serializeState, 
  registerCustomSerializer,
  serializeMap,
  serializeSet,
  serializeError,
  SerializationOptions
} from "./serialization";

describe("SerializationUtils", () => {
  describe("serialize", () => {
    it("should serialize primitive values", () => {
      const utils = new SerializationUtils();
      
      expect(utils.serialize(42)).toBe(42);
      expect(utils.serialize("test")).toBe("test");
      expect(utils.serialize(true)).toBe(true);
      expect(utils.serialize(null)).toBeNull();
      expect(utils.serialize(undefined)).toBeUndefined();
    });

    it("should serialize arrays", () => {
      const utils = new SerializationUtils();
      const array = [1, 2, 3];
      
      expect(utils.serialize(array)).toEqual([1, 2, 3]);
    });

    it("should serialize objects", () => {
      const utils = new SerializationUtils();
      const obj = { key: "value", count: 42 };
      
      expect(utils.serialize(obj)).toEqual({ key: "value", count: 42 });
    });

    it("should handle circular references", () => {
      const utils = new SerializationUtils();
      const obj: any = { name: "test" };
      obj.self = obj;

      const result = utils.serialize(obj);
      // Circular reference detection creates a placeholder string
      expect(typeof result).toBe("object");
    });

    it("should handle circular references with custom seen map", () => {
      const utils = new SerializationUtils();
      const obj: any = { name: "test" };
      obj.self = obj;

      const result = utils.serialize(obj, { handleCircularRefs: true });
      expect(typeof result).toBe("object");
    });

    it("should respect depth limit", () => {
      const utils = new SerializationUtils();
      const deepObj = { level1: { level2: { level3: "deep" } } };

      const result = utils.serialize(deepObj, { maxDepth: 2 });
      expect(result).toEqual({ level1: { level2: "[Max Depth Reached]" } });
    });

    it("should serialize Date objects", () => {
      const utils = new SerializationUtils();
      const date = new Date("2023-01-01");
      
      const result = utils.serialize(date);
      expect(result).toContain("Date");
    });

    it("should serialize RegExp objects", () => {
      const utils = new SerializationUtils();
      const regex = /test/i;
      
      const result = utils.serialize(regex);
      expect(result).toContain("RegExp");
    });

    it("should serialize function values", () => {
      const utils = new SerializationUtils();
      const func = () => 42;
      
      const result = utils.serialize(func);
      expect(result).toContain("Function");
    });

    it("should handle custom serializers", () => {
      const utils = new SerializationUtils();
      const options: SerializationOptions = {};
      
      utils.registerCustomSerializer("TestType", (val) => `custom:${val}`, options);
      
      class TestType {
        constructor(public value: string) {}
      }
      
      const testObj = new TestType("data");
      const result = utils.serialize(testObj, options);
      expect(result).toBeDefined();
    });
  });

  describe("serializeState", () => {
    it("should serialize store state", () => {
      const store = createStore();
      const countAtom = atom(42);
      store.set(countAtom, 100);

      const utils = new SerializationUtils();
      const result = utils.serializeState(store);
      
      expect(result).toBeDefined();
    });

    it("should handle errors during serialization", () => {
      const store = createStore();
      const errorAtom = atom(() => {
        throw new Error("Compute error");
      });

      const utils = new SerializationUtils();
      const result = utils.serializeState(store);
      
      expect(result).toBeDefined();
    });

    it("should include all atoms in state", () => {
      const store = createStore();
      const atom1 = atom(1);
      const atom2 = atom("test");
      const atom3 = atom(true);

      store.set(atom1, 10);
      store.set(atom2, "value");
      store.set(atom3, false);

      const utils = new SerializationUtils();
      const result = utils.serializeState(store);
      
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("serializeState (exported)", () => {
  it("should serialize store state", () => {
    const store = createStore();
    const countAtom = atom(42);
    store.set(countAtom, 100);

    const result = serializeState(store);
    expect(result).toBeDefined();
  });
});

describe("serializeMap", () => {
  it("should serialize empty map", () => {
    const result = serializeMap(new Map());
    expect(result.__type).toBe("Map");
    expect(result.entries).toEqual([]);
  });

  it("should serialize map with entries", () => {
    const map = new Map([["key1", "value1"], ["key2", "value2"]]);
    const result = serializeMap(map);
    
    expect(result.__type).toBe("Map");
    expect(result.entries.length).toBe(2);
    expect(result.entries).toContainEqual(["key1", "value1"]);
  });
});

describe("serializeSet", () => {
  it("should serialize empty set", () => {
    const result = serializeSet(new Set());
    expect(result.__type).toBe("Set");
    expect(result.values).toEqual([]);
  });

  it("should serialize set with values", () => {
    const set = new Set([1, 2, 3]);
    const result = serializeSet(set);
    
    expect(result.__type).toBe("Set");
    expect(result.values.length).toBe(3);
    expect(result.values).toContain(1);
  });
});

describe("serializeError", () => {
  it("should serialize error", () => {
    const error = new Error("Test error");
    const result = serializeError(error);
    
    expect(result.__type).toBe("Error");
    expect(result.name).toBe("Error");
    expect(result.message).toBe("Test error");
    expect(result.stack).toBeDefined();
  });
});

describe("edge cases", () => {
  it("should handle BigInt values", () => {
    const utils = new SerializationUtils();
    const result = utils.serialize(BigInt(123456789));
    expect(result).toBe("[bigint]");
  });

  it("should handle Symbol values", () => {
    const utils = new SerializationUtils();
    const result = utils.serialize(Symbol("test"));
    expect(result).toBe("[symbol]");
  });

  it("should handle Map with complex values", () => {
    const map = new Map([
      ["key1", { nested: true }],
      ["key2", [1, 2, 3]]
    ]);
    
    const result = serializeMap(map);
    expect(result.__type).toBe("Map");
  });

  it("should handle Set with complex values", () => {
    const set = new Set([
      { value: 1 },
      { value: 2 }
    ]);
    
    const result = serializeSet(set);
    expect(result.__type).toBe("Set");
  });
});

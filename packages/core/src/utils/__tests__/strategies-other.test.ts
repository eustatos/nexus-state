import { describe, it, expect } from "vitest";
import { FunctionsStrategy } from "../snapshot-serialization/advanced/strategies/functions-strategy";
import { CustomClassesStrategy } from "../snapshot-serialization/advanced/strategies/custom-classes-strategy";

describe("FunctionsStrategy - canHandle", () => {
  const strategy = new FunctionsStrategy();

  it("should handle regular function", () => {
    expect(strategy.canHandle(function () {})).toBe(true);
  });

  it("should handle arrow function", () => {
    expect(strategy.canHandle(() => {})).toBe(true);
  });

  it("should handle async function", () => {
    expect(strategy.canHandle(async () => {})).toBe(true);
  });

  it("should handle generator function", () => {
    expect(strategy.canHandle(function* () {})).toBe(true);
  });

  it("should not handle non-function", () => {
    expect(strategy.canHandle(42)).toBe(false);
    expect(strategy.canHandle({})).toBe(false);
    expect(strategy.canHandle("string")).toBe(false);
  });
});

describe("FunctionsStrategy - serialize", () => {
  const strategy = new FunctionsStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: { maxDepth: 100, functionHandling: "source" },
    refCounter: 0,
  };

  it("should serialize named function", () => {
    function test() {
      return 42;
    }
    const result = strategy.serialize(test, context);
    expect(result.__serializedType).toBe("function");
    expect(result.name).toBe("test");
    expect(result.source).toBeDefined();
  });

  it("should serialize arrow function", () => {
    const fn = (x: number) => x * 2;
    const result = strategy.serialize(fn, context);
    expect(result.__serializedType).toBe("function");
    expect(result.source).toContain("=>");
  });

  it("should serialize function with name", () => {
    function named() {
      return 1;
    }
    const result = strategy.serialize(named, context);
    expect(result.__serializedType).toBe("function");
    expect(result.name).toBeDefined();
  });

  it("should omit function when functionHandling is ignore", () => {
    const contextIgnore = {
      ...context,
      options: { ...context.options, functionHandling: "ignore" as const },
    };
    const fn = () => 42;
    const result = strategy.serialize(fn, contextIgnore);
    expect(result.__omitted).toBe(true);
  });
});

describe("FunctionsStrategy - deserialize", () => {
  const strategy = new FunctionsStrategy();

  it("should deserialize function from source", () => {
    const serialized = {
      __serializedType: "function",
      name: "test",
      source: "function test() { return 42; }",
    };
    const result = strategy.deserialize?.(serialized);
    expect(typeof result).toBe("function");
  });

  it("should deserialize arrow function", () => {
    const serialized = {
      __serializedType: "function",
      name: "anonymous",
      source: "(x) => x * 2",
    };
    const result = strategy.deserialize?.(serialized);
    expect(typeof result).toBe("function");
  });
});

describe("CustomClassesStrategy - canHandle", () => {
  const strategy = new CustomClassesStrategy();

  it("should handle custom class instance", () => {
    class CustomClass {
      constructor(public value: number) {}
    }
    expect(strategy.canHandle(new CustomClass(42))).toBe(true);
  });

  it("should not handle plain object", () => {
    expect(strategy.canHandle({})).toBe(false);
  });

  it("should not handle array", () => {
    expect(strategy.canHandle([])).toBe(false);
  });

  it("should not handle Date", () => {
    expect(strategy.canHandle(new Date())).toBe(false);
  });

  it("should not handle Map", () => {
    expect(strategy.canHandle(new Map())).toBe(false);
  });

  it("should not handle null", () => {
    expect(strategy.canHandle(null)).toBe(false);
  });
});

describe("CustomClassesStrategy - serialize", () => {
  const strategy = new CustomClassesStrategy();
  const context = {
    seen: new WeakMap(),
    path: [],
    options: {
      maxDepth: 100,
      includeGetters: false,
      includeNonEnumerable: false,
      includeSymbols: false,
      errorHandling: "replace" as const,
    },
    refCounter: 0,
  };

  it("should serialize custom class", () => {
    class CustomClass {
      constructor(public value: number) {}
    }
    const instance = new CustomClass(42);
    const result = strategy.serialize(instance, context);
    expect(result.__serializedType).toBe("object");
    expect(result.__className).toBe("CustomClass");
  });

  it("should serialize custom class with properties", () => {
    class Person {
      constructor(public name: string, public age: number) {}
    }
    const person = new Person("John", 30);
    const result = strategy.serialize(person, context);
    expect(result.properties).toBeDefined();
  });
});

describe("CustomClassesStrategy - registerClass", () => {
  const strategy = new CustomClassesStrategy();

  it("should register custom class", () => {
    class CustomClass {
      constructor(public value: number) {}
    }
    strategy.registerClass("CustomClass", CustomClass);
    expect(strategy.getClass("CustomClass")).toBe(CustomClass);
  });

  it("should unregister class", () => {
    class CustomClass {
      constructor(public value: number) {}
    }
    strategy.registerClass("CustomClass", CustomClass);
    strategy.unregisterClass("CustomClass");
    expect(strategy.getClass("CustomClass")).toBeUndefined();
  });
});

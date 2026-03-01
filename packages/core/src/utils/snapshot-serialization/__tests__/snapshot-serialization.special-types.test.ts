import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";

// Date
describe("snapshotSerialization - Date", () => {
  it("should serialize Date to ISO string marker", () => {
    const date = new Date("2023-06-15T10:30:00.000Z");
    const result = snapshotSerialization(date);

    expect(result).toEqual({
      __type: "Date",
      value: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should serialize Date with milliseconds", () => {
    const date = new Date("2023-01-01T12:00:00.123Z");
    const result = snapshotSerialization(date);

    expect(result).toEqual({
      __type: "Date",
      value: "2023-01-01T12:00:00.123Z",
    });
  });

  it("should serialize invalid Date", () => {
    const date = new Date("invalid");
    const result = snapshotSerialization(date);

    expect(result).toMatchObject({
      __type: "Date",
      value: expect.any(String),
    });
  });

  it("should serialize Date in nested structure", () => {
    const input = {
      user: {
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-06-01"),
      },
    };
    const result = snapshotSerialization(input);

    expect((result as any).user.createdAt).toMatchObject({
      __type: "Date",
      value: "2023-01-01T00:00:00.000Z",
    });
    expect((result as any).user.updatedAt).toMatchObject({
      __type: "Date",
      value: "2023-06-01T00:00:00.000Z",
    });
  });

  it("should serialize multiple Date instances independently", () => {
    const date1 = new Date("2023-01-01");
    const date2 = new Date("2023-12-31");
    const result = snapshotSerialization({ d1: date1, d2: date2 });

    expect((result as any).d1.value).not.toBe((result as any).d2.value);
  });
});

// RegExp
describe("snapshotSerialization - RegExp", () => {
  it("should serialize RegExp with source and flags", () => {
    const regex = /^[a-z]+$/gi;
    const result = snapshotSerialization(regex);

    expect(result).toEqual({
      __type: "RegExp",
      source: "^[a-z]+$",
      flags: "gi",
    });
  });

  it("should serialize RegExp without flags", () => {
    const regex = /test/;
    const result = snapshotSerialization(regex);

    expect(result).toEqual({
      __type: "RegExp",
      source: "test",
      flags: "",
    });
  });

  it("should serialize RegExp with all flag types", () => {
    const regex = /pattern/gimsuy;
    const result = snapshotSerialization(regex);

    expect(result).toEqual({
      __type: "RegExp",
      source: "pattern",
      flags: "gimsuy",
    });
  });

  it("should serialize RegExp in nested structure", () => {
    const input = {
      validators: {
        email: /^[a-z]+@[a-z]+\.[a-z]+$/,
        phone: /^\d+$/g,
      },
    };
    const result = snapshotSerialization(input);

    expect((result as any).validators.email).toMatchObject({
      __type: "RegExp",
      source: expect.any(String),
    });
    expect((result as any).validators.phone).toMatchObject({
      __type: "RegExp",
      flags: "g",
    });
  });
});

// Map
describe("snapshotSerialization - Map", () => {
  it("should serialize empty Map", () => {
    const map = new Map();
    const result = snapshotSerialization(map);

    expect(result).toEqual({
      __type: "Map",
      entries: [],
    });
  });

  it("should serialize Map with primitive entries", () => {
    const map = new Map([
      ["key1", "value1"],
      ["key2", 42],
      ["key3", true],
    ]);
    const result = snapshotSerialization(map);

    expect(result).toMatchObject({
      __type: "Map",
      entries: [
        ["key1", "value1"],
        ["key2", 42],
        ["key3", true],
      ],
    });
  });

  it("should serialize Map with object keys and values", () => {
    const map = new Map([
      [{ id: 1 }, { name: "Alice" }],
      [{ id: 2 }, { name: "Bob" }],
    ]);
    const result = snapshotSerialization(map);

    expect(result).toMatchObject({
      __type: "Map",
      entries: expect.arrayContaining([
        expect.arrayContaining([
          expect.objectContaining({ __type: "Object" }),
          expect.objectContaining({ __type: "Object" }),
        ]),
      ]),
    });
  });

  it("should serialize Map with Date values", () => {
    const map = new Map([
      ["created", new Date("2023-01-01")],
      ["updated", new Date("2023-06-01")],
    ]);
    const result = snapshotSerialization(map);

    expect((result as any).entries[0][1]).toMatchObject({
      __type: "Date",
      value: "2023-01-01T00:00:00.000Z",
    });
  });

  it("should serialize Map with nested Map values", () => {
    const innerMap = new Map([["inner", "value"]]);
    const outerMap = new Map([["outer", innerMap]]);
    const result = snapshotSerialization(outerMap);

    expect((result as any).entries[0][1]).toMatchObject({
      __type: "Map",
      entries: [["inner", "value"]],
    });
  });
});

// Set
describe("snapshotSerialization - Set", () => {
  it("should serialize empty Set", () => {
    const set = new Set();
    const result = snapshotSerialization(set);

    expect(result).toEqual({
      __type: "Set",
      values: [],
    });
  });

  it("should serialize Set with primitive values", () => {
    const set = new Set([1, 2, 3, "four", true]);
    const result = snapshotSerialization(set);

    expect(result).toMatchObject({
      __type: "Set",
      values: [1, 2, 3, "four", true],
    });
  });

  it("should serialize Set with duplicate removal", () => {
    const set = new Set([1, 2, 2, 3, 3, 3]);
    const result = snapshotSerialization(set);

    expect(result).toMatchObject({
      __type: "Set",
      values: [1, 2, 3],
    });
  });

  it("should serialize Set with object values", () => {
    const set = new Set([{ id: 1 }, { id: 2 }]);
    const result = snapshotSerialization(set);

    expect(result).toMatchObject({
      __type: "Set",
      values: expect.arrayContaining([
        expect.objectContaining({ __type: "Object" }),
      ]),
    });
  });

  it("should serialize Set with Date values", () => {
    const set = new Set([new Date("2023-01-01"), new Date("2023-06-01")]);
    const result = snapshotSerialization(set);

    expect((result as any).values).toHaveLength(2);
    expect((result as any).values[0]).toMatchObject({ __type: "Date" });
  });
});

// Error
describe("snapshotSerialization - Error", () => {
  it("should serialize Error with name and message", () => {
    const error = new Error("Something went wrong");
    const result = snapshotSerialization(error);

    expect(result).toMatchObject({
      __type: "Error",
      name: "Error",
      message: "Something went wrong",
      stack: expect.any(String),
    });
  });

  it("should serialize TypeError", () => {
    const error = new TypeError("Invalid type");
    const result = snapshotSerialization(error);

    expect(result).toMatchObject({
      __type: "Error",
      name: "TypeError",
      message: "Invalid type",
    });
  });

  it("should serialize RangeError", () => {
    const error = new RangeError("Out of bounds");
    const result = snapshotSerialization(error);

    expect(result).toMatchObject({
      __type: "Error",
      name: "RangeError",
    });
  });

  it("should serialize ReferenceError", () => {
    const error = new ReferenceError("Not defined");
    const result = snapshotSerialization(error);

    expect(result).toMatchObject({
      __type: "Error",
      name: "ReferenceError",
    });
  });

  it("should serialize Error without stack when depth is 0", () => {
    const error = new Error("Test");
    const result = snapshotSerialization(error, {}, undefined, 0);

    expect(result).toMatchObject({
      __type: "Error",
      stack: expect.any(String),
    });
  });

  it("should serialize Error in nested structure", () => {
    const input = {
      error: new Error("Nested error"),
      errors: [new TypeError("Type"), new RangeError("Range")],
    };
    const result = snapshotSerialization(input);

    expect((result as any).error).toMatchObject({
      __type: "Error",
      message: "Nested error",
    });
    expect((result as any).errors).toHaveLength(2);
  });
});

// Function
describe("snapshotSerialization - Function", () => {
  it("should serialize named function", () => {
    function testFn(a: number) {
      return a * 2;
    }
    const result = snapshotSerialization(testFn);

    expect(result).toMatchObject({
      __type: "Function",
      name: "testFn",
      source: expect.stringContaining("return a * 2"),
    });
  });

  it("should serialize anonymous function", () => {
    const fn = (x: string) => x.toUpperCase();
    const result = snapshotSerialization(fn);

    expect(result).toMatchObject({
      __type: "Function",
      name: "fn",
      source: expect.any(String),
    });
  });

  it("should serialize arrow function", () => {
    const fn = (a: number, b: number) => a + b;
    const result = snapshotSerialization(fn);

    expect(result).toMatchObject({
      __type: "Function",
      source: expect.stringContaining("=>"),
    });
  });

  it("should serialize async function", () => {
    const fn = async () => {
      return "async";
    };
    const result = snapshotSerialization(fn);

    expect(result).toMatchObject({
      __type: "Function",
      source: expect.stringContaining("async"),
    });
  });

  it("should serialize generator function", () => {
    function* gen() {
      yield 1;
    }
    const result = snapshotSerialization(gen);

    expect(result).toMatchObject({
      __type: "Function",
      source: expect.stringContaining("*"),
    });
  });

  it("should serialize method in object", () => {
    const obj = {
      name: "test",
      method() {
        return this.name;
      },
    };
    const result = snapshotSerialization(obj);

    expect((result as any).method).toMatchObject({
      __type: "Function",
      name: "method",
    });
  });
});

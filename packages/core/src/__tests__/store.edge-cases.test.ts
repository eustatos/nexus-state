import { describe, it, expect } from "vitest";
import { createStore, atom } from "../index";
import type { Getter } from "../types";

describe("store - edge cases", () => {
  it("should handle atom with function value", () => {
    const store = createStore();
    // Wrap function in an object to store it as a primitive value
    const funcAtom = atom({ fn: () => 42 });

    const value = store.get(funcAtom);
    expect(typeof value.fn).toBe("function");
    expect(value.fn()).toBe(42);
  });

  it("should handle atom with Symbol value", () => {
    const store = createStore();
    const symbolAtom = atom(Symbol.for("test"));

    const value = store.get(symbolAtom);
    expect(value).toBe(Symbol.for("test"));
  });

  it("should handle atom with BigInt value", () => {
    const store = createStore();
    const bigintAtom = atom(BigInt(123456789));

    const value = store.get(bigintAtom);
    expect(value).toBe(BigInt(123456789));
  });

  it("should handle atom with Date value", () => {
    const store = createStore();
    const dateAtom = atom(new Date("2023-01-01"));

    const value = store.get(dateAtom);
    expect(value).toBeInstanceOf(Date);
    expect(value.toISOString()).toBe(new Date("2023-01-01").toISOString());
  });

  it("should handle atom with RegExp value", () => {
    const store = createStore();
    const regexpAtom = atom(/test/i);

    const value = store.get(regexpAtom);
    expect(value).toBeInstanceOf(RegExp);
    expect(value.source).toBe("test");
    expect(value.flags).toBe("i");
  });

  it("should handle atom with undefined value", () => {
    const store = createStore();
    const undefinedAtom = atom(undefined);

    const value = store.get(undefinedAtom);
    expect(value).toBeUndefined();
  });

  it("should handle atom with null value", () => {
    const store = createStore();
    const nullAtom = atom(null);

    const value = store.get(nullAtom);
    expect(value).toBeNull();
  });

  it("should handle circular dependencies in computed atoms", () => {
    const store = createStore();

    const atom1 = atom((get: Getter) => {
      return get(atom2) + 1;
    });
    const atom2 = atom((get: Getter) => {
      return get(atom1) + 1;
    });

    // Circular dependencies should throw a RangeError (stack overflow)
    expect(() => store.get(atom1)).toThrow(RangeError);
  });
});

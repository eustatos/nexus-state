import { describe, it, expect } from "vitest";
import { createStore, atom } from "../index";
import type { Getter, Setter } from "../types";

describe("store - set", () => {
  it("should set atom value", () => {
    const store = createStore();
    const countAtom = atom(0);
    store.set(countAtom, 10);
    expect(store.get(countAtom)).toBe(10);
  });

  it("should set atom value with update function", () => {
    const store = createStore();
    const countAtom = atom(0);
    store.set(countAtom, (prev) => prev + 5);
    expect(store.get(countAtom)).toBe(5);
  });

  it("should set computed atom value indirectly through writable atom", () => {
    const store = createStore();
    const baseAtom = atom(10);
    const writableAtom = atom(
      (get: Getter) => get(baseAtom),
      (get: Getter, set: Setter, value: number) => set(baseAtom, value),
    );
    store.set(writableAtom, 20);
    expect(store.get(baseAtom)).toBe(20);
  });

  it("should throw error when setting computed atom directly", () => {
    const store = createStore();
    const baseAtom = atom(10);
    const computedAtom = atom((get: Getter) => get(baseAtom) * 2);

    expect(() => store.set(computedAtom, 100)).toThrow(
      "Cannot set value of computed atom",
    );
  });

  it("should handle multiple sets in sequence", () => {
    const store = createStore();
    const countAtom = atom(0);

    store.set(countAtom, 1);
    expect(store.get(countAtom)).toBe(1);

    store.set(countAtom, 2);
    expect(store.get(countAtom)).toBe(2);

    store.set(countAtom, 3);
    expect(store.get(countAtom)).toBe(3);
  });

  it("should handle setting to same value", () => {
    const store = createStore();
    const countAtom = atom(0);
    store.set(countAtom, 0);
    expect(store.get(countAtom)).toBe(0);
  });

  it("should handle set with function returning same value", () => {
    const store = createStore();
    const countAtom = atom(5);
    store.set(countAtom, (prev) => prev);
    expect(store.get(countAtom)).toBe(5);
  });
});

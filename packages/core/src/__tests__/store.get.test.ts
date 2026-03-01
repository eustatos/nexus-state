import { describe, it, expect } from "vitest";
import { createStore, atom } from "../index";
import type { Getter } from "../types";

describe("store - get", () => {
  it("should get atom value", () => {
    const store = createStore();
    const countAtom = atom(0);
    expect(store.get(countAtom)).toBe(0);
  });

  it("should get computed atom value", () => {
    const store = createStore();
    const baseAtom = atom(10);
    const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
    expect(store.get(doubleAtom)).toBe(20);
  });

  it("should return cached value on repeated get", () => {
    const store = createStore();
    const countAtom = atom(0);
    store.get(countAtom);
    store.get(countAtom);
    expect(store.get(countAtom)).toBe(0);
  });

  it("should handle atom not in store initially", () => {
    const store = createStore();
    const atom1 = atom(42);
    expect(store.get(atom1)).toBe(42);
  });

  it("should get multiple atoms in sequence", () => {
    const store = createStore();
    const atom1 = atom(1);
    const atom2 = atom(2);
    const atom3 = atom(3);

    expect(store.get(atom1)).toBe(1);
    expect(store.get(atom2)).toBe(2);
    expect(store.get(atom3)).toBe(3);
  });
});

import { describe, it, expect } from "vitest";
import { createStore, atom } from "../index";
import type { Getter } from "../types";

describe("store - computed atoms", () => {
  it("should recompute when dependency changes", () => {
    const store = createStore();
    const baseAtom = atom(5);
    const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);

    expect(store.get(doubleAtom)).toBe(10);

    store.set(baseAtom, 10);
    expect(store.get(doubleAtom)).toBe(20);
  });

  it("should recompute chain of computed atoms", () => {
    const store = createStore();
    const baseAtom = atom(2);
    const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
    const quadrupleAtom = atom((get: Getter) => get(doubleAtom) * 2);

    expect(store.get(quadrupleAtom)).toBe(8);

    store.set(baseAtom, 3);
    expect(store.get(quadrupleAtom)).toBe(12);
  });

  it("should not recompute if dependency unchanged", () => {
    const store = createStore();
    const baseAtom = atom(10);
    const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);

    const firstValue = store.get(doubleAtom);

    const unrelatedAtom = atom(0);
    store.set(unrelatedAtom, 5);

    expect(store.get(doubleAtom)).toBe(firstValue);
  });

  it("should handle multiple dependencies", () => {
    const store = createStore();
    const a = atom(1);
    const b = atom(2);
    const sumAtom = atom((get: Getter) => get(a) + get(b));

    expect(store.get(sumAtom)).toBe(3);

    store.set(a, 5);
    expect(store.get(sumAtom)).toBe(7);

    store.set(b, 10);
    expect(store.get(sumAtom)).toBe(15);
  });

  it("should handle nested computed atoms", () => {
    const store = createStore();
    const a = atom(1);
    const b = atom((get: Getter) => get(a) * 2);
    const c = atom((get: Getter) => get(b) + 3);
    const d = atom((get: Getter) => get(c) * 2);

    expect(store.get(d)).toBe(10);

    store.set(a, 3);
    expect(store.get(d)).toBe(18);
  });
});

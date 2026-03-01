import { describe, it, expect } from "vitest";
import { createStore, atom } from "../index";
import type { Getter, Setter } from "../types";

describe("store - writable atoms", () => {
  it("should create and use writable atom", () => {
    const store = createStore();
    const baseAtom = atom(0);
    const writableAtom = atom(
      (get: Getter) => get(baseAtom),
      (get: Getter, set: Setter, value: number) => {
        set(baseAtom, value);
      },
    );

    expect(store.get(writableAtom)).toBe(0);

    store.set(writableAtom, 10);
    expect(store.get(baseAtom)).toBe(10);
    expect(store.get(writableAtom)).toBe(10);
  });

  it("should handle writable atom with transformation", () => {
    const store = createStore();
    const baseAtom = atom(0);
    const doubleAtom = atom(
      (get: Getter) => get(baseAtom) * 2,
      (get: Getter, set: Setter, value: number) => {
        set(baseAtom, value / 2);
      },
    );

    store.set(doubleAtom, 10);
    expect(store.get(baseAtom)).toBe(5);
    expect(store.get(doubleAtom)).toBe(10);
  });

  it("should handle writable atom with multiple dependencies", () => {
    const store = createStore();
    const a = atom(1);
    const b = atom(2);
    const sumAtom = atom(
      (get: Getter) => get(a) + get(b),
      (get: Getter, set: Setter, value: number) => {
        const currentA = get(a);
        const diff = value - (currentA + get(b));
        set(a, currentA + diff);
      },
    );

    store.set(sumAtom, 10);
    expect(store.get(a)).toBe(8);
    expect(store.get(b)).toBe(2);
    expect(store.get(sumAtom)).toBe(10);
  });
});

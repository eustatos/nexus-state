import { describe, it, expect } from "vitest";
import { atom, createStore } from "./index";
import type { Getter } from "./types";

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
});

describe("store", () => {
  it("should create a store", () => {
    const store = createStore();
    expect(store).toBeDefined();
    expect(typeof store.get).toBe("function");
    expect(typeof store.set).toBe("function");
    expect(typeof store.subscribe).toBe("function");
  });

  it("should get and set atom values", () => {
    const store = createStore();
    const countAtom = atom(0);

    expect(store.get(countAtom)).toBe(0);

    store.set(countAtom, 5);
    expect(store.get(countAtom)).toBe(5);
  });

  it("should subscribe to atom changes", () => {
    const store = createStore();
    const countAtom = atom(0);
    let lastValue = 0;

    const unsubscribe = store.subscribe(countAtom, (value) => {
      lastValue = value;
    });

    store.set(countAtom, 5);
    expect(lastValue).toBe(5);

    unsubscribe();
    store.set(countAtom, 10);
    expect(lastValue).toBe(5); // Should not change after unsubscribe
  });

  it("should compute derived values", () => {
    const store = createStore();
    const countAtom = atom(0);
    const doubleAtom = atom((get: Getter) => get(countAtom) * 2);

    expect(store.get(doubleAtom)).toBe(0);

    store.set(countAtom, 5);
    expect(store.get(doubleAtom)).toBe(10);
  });
});

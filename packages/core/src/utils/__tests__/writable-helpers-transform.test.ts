import { describe, it, expect } from "vitest";
import {
  createTransformedAtom,
  createTransformedWritableAtom,
} from "../writable-helpers";
import { atom, createStore } from "../../index";

describe("createTransformedAtom - basic", () => {
  it("should transform value", () => {
    const celsiusAtom = atom(0);
    const fahrenheitAtom = createTransformedAtom({
      source: celsiusAtom,
      transform: (c) => (c * 9) / 5 + 32,
    });
    const store = createStore();
    store.set(celsiusAtom, 100);
    expect(store.get(fahrenheitAtom)).toBe(212);
  });

  it("should update when source changes", () => {
    const celsiusAtom = atom(0);
    const fahrenheitAtom = createTransformedAtom({
      source: celsiusAtom,
      transform: (c) => (c * 9) / 5 + 32,
    });
    const store = createStore();
    expect(store.get(fahrenheitAtom)).toBe(32);
    store.set(celsiusAtom, 100);
    expect(store.get(fahrenheitAtom)).toBe(212);
    store.set(celsiusAtom, -40);
    expect(store.get(fahrenheitAtom)).toBe(-40);
  });

  it("should handle string transformations", () => {
    const nameAtom = atom("");
    const upperAtom = createTransformedAtom({
      source: nameAtom,
      transform: (s) => s.toUpperCase(),
    });
    const store = createStore();
    store.set(nameAtom, "hello");
    expect(store.get(upperAtom)).toBe("HELLO");
  });
});

describe("createTransformedWritableAtom - basic", () => {
  it("should create source and transformed atoms", () => {
    const { source, transformed } = createTransformedWritableAtom({
      initial: 0,
      transform: (c) => (c * 9) / 5 + 32,
      inverse: (f) => ((f - 32) * 5) / 9,
    });
    const store = createStore();
    expect(store.get(source)).toBe(0);
    expect(store.get(transformed)).toBe(32);
  });

  it("should set transformed value", () => {
    const { source, transformed } = createTransformedWritableAtom({
      initial: 0,
      transform: (c) => (c * 9) / 5 + 32,
      inverse: (f) => ((f - 32) * 5) / 9,
    });
    const store = createStore();
    store.set(transformed, 212);
    expect(store.get(source)).toBe(100);
    expect(store.get(transformed)).toBe(212);
  });

  it("should set source value", () => {
    const { source, transformed } = createTransformedWritableAtom({
      initial: 0,
      transform: (c) => (c * 9) / 5 + 32,
      inverse: (f) => ((f - 32) * 5) / 9,
    });
    const store = createStore();
    store.set(source, 100);
    expect(store.get(source)).toBe(100);
    expect(store.get(transformed)).toBe(212);
  });
});

describe("createTransformedWritableAtom - string transform", () => {
  it("should transform and inverse transform strings", () => {
    const { source, transformed } = createTransformedWritableAtom({
      initial: "",
      transform: (s) => s.trim(),
      inverse: (s) => s,
    });
    const store = createStore();
    store.set(source, "  hello  ");
    expect(store.get(transformed)).toBe("hello");
  });
});

describe("createTransformedAtom - edge cases", () => {
  it("should handle null values", () => {
    const sourceAtom = atom<string | null>(null);
    const transformedAtom = createTransformedAtom({
      source: sourceAtom,
      transform: (s) => (s ?? "").toUpperCase(),
    });
    const store = createStore();
    expect(store.get(transformedAtom)).toBe("");
    store.set(sourceAtom, "hello");
    expect(store.get(transformedAtom)).toBe("HELLO");
  });

  it("should handle complex transformations", () => {
    interface User {
      name: string;
      age: number;
    }
    const userAtom = atom<User>({ name: "John", age: 30 });
    const summaryAtom = createTransformedAtom({
      source: userAtom,
      transform: (u) => `${u.name} (${u.age})`,
    });
    const store = createStore();
    expect(store.get(summaryAtom)).toBe("John (30)");
    store.set(userAtom, { name: "Jane", age: 25 });
    expect(store.get(summaryAtom)).toBe("Jane (25)");
  });
});

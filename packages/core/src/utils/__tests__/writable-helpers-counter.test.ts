import { describe, it, expect } from "vitest";
import { createCounter } from "../writable-helpers";
import { createStore } from "../../index";

describe("createCounter - basic", () => {
  it("should create counter with default options", () => {
    const counter = createCounter();
    const store = createStore();
    expect(store.get(counter)).toBe(0);
  });

  it("should create counter with custom initial value", () => {
    const counter = createCounter({ initial: 10 });
    const store = createStore();
    expect(store.get(counter)).toBe(10);
  });

  it("should set counter value", () => {
    const counter = createCounter({ initial: 0 });
    const store = createStore();
    store.set(counter, 5);
    expect(store.get(counter)).toBe(5);
  });

  it("should handle min option", () => {
    const counter = createCounter({ initial: 5, min: 0 });
    const store = createStore();
    expect(store.get(counter)).toBe(5);
  });

  it("should handle max option", () => {
    const counter = createCounter({ initial: 5, max: 10 });
    const store = createStore();
    expect(store.get(counter)).toBe(5);
  });
});

describe("createCounter - min/max bounds", () => {
  it("should handle min option", () => {
    const counter = createCounter({ initial: 0, min: -5 });
    const store = createStore();
    expect(store.get(counter)).toBe(0);
  });

  it("should handle max option", () => {
    const counter = createCounter({ initial: 0, max: 5 });
    const store = createStore();
    expect(store.get(counter)).toBe(0);
  });

  it("should handle both min and max options", () => {
    const counter = createCounter({ initial: 0, min: -3, max: 3 });
    const store = createStore();
    expect(store.get(counter)).toBe(0);
  });
});

describe("createCounter - set value", () => {
  it("should set value", () => {
    const counter = createCounter({ initial: 0 });
    const store = createStore();
    store.set(counter, 42);
    expect(store.get(counter)).toBe(42);
  });

  it("should set value within bounds", () => {
    const counter = createCounter({ initial: 0, min: 0, max: 10 });
    const store = createStore();
    store.set(counter, 5);
    expect(store.get(counter)).toBe(5);
  });
});

describe("createCounter - step option", () => {
  it("should accept step option", () => {
    const counter = createCounter({ initial: 0, step: 5 });
    const store = createStore();
    expect(store.get(counter)).toBe(0);
  });
});

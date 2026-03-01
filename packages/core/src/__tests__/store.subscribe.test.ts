import { describe, it, expect, vi } from "vitest";
import { createStore, atom } from "../index";

describe("store - subscribe", () => {
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
    expect(lastValue).toBe(5);
  });

  it("should handle multiple subscribers", () => {
    const store = createStore();
    const countAtom = atom(0);

    const callback1 = vi.fn();
    const callback2 = vi.fn();

    store.subscribe(countAtom, callback1);
    store.subscribe(countAtom, callback2);

    store.set(countAtom, 5);

    expect(callback1).toHaveBeenCalledWith(5);
    expect(callback2).toHaveBeenCalledWith(5);
  });

  it("should unsubscribe correctly", () => {
    const store = createStore();
    const countAtom = atom(0);

    const callback = vi.fn();
    const unsubscribe = store.subscribe(countAtom, callback);

    unsubscribe();
    store.set(countAtom, 5);

    expect(callback).not.toHaveBeenCalled();
  });

  it("should handle double unsubscribe without error", () => {
    const store = createStore();
    const countAtom = atom(0);

    const unsubscribe = store.subscribe(countAtom, vi.fn());
    unsubscribe();

    expect(() => unsubscribe()).not.toThrow();
  });

  it("should handle unsubscribing and resubscribing", () => {
    const store = createStore();
    const countAtom = atom(0);
    let callCount = 0;

    const unsubscribe = store.subscribe(countAtom, () => {
      callCount++;
    });

    store.set(countAtom, 1);
    expect(callCount).toBe(1);

    unsubscribe();
    store.set(countAtom, 2);
    expect(callCount).toBe(1);

    const unsubscribe2 = store.subscribe(countAtom, () => {
      callCount++;
    });

    store.set(countAtom, 3);
    expect(callCount).toBe(2);

    unsubscribe2();
  });

  it("should handle subscriber that throws", () => {
    const store = createStore();
    const countAtom = atom(0);

    store.subscribe(countAtom, () => {
      throw new Error("Subscriber error");
    });

    // Subscriber errors are propagated to the caller
    expect(() => store.set(countAtom, 1)).toThrow("Subscriber error");
  });

  it("should handle atom with complex state in subscription", () => {
    const store = createStore();
    const complexAtom = atom({ name: "test", count: 0 });
    let receivedValue: any = null;

    store.subscribe(complexAtom, (value) => {
      receivedValue = value;
    });

    store.set(complexAtom, { name: "updated", count: 1 });
    expect(receivedValue).toEqual({ name: "updated", count: 1 });
  });
});

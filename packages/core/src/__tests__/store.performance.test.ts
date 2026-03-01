import { describe, it, expect } from "vitest";
import { createStore, atom } from "../index";

describe("store - performance", () => {
  it("should handle 100+ atoms efficiently", () => {
    const store = createStore();
    const atoms = Array.from({ length: 100 }, (_, i) => atom(i));

    const start = performance.now();
    atoms.forEach((a) => store.get(a));
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it("should handle rapid updates", () => {
    const store = createStore();
    const testAtom = atom(0);

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      store.set(testAtom, i);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it("should handle subscription to many atoms", () => {
    const store = createStore();
    const atoms = Array.from({ length: 50 }, (_, i) => atom(i));

    const start = performance.now();
    atoms.forEach((a) => store.subscribe(a, () => {}));
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
  });

  it("should handle concurrent subscriptions and updates", () => {
    const store = createStore();
    const atom1 = atom(0);
    const atom2 = atom(0);

    const subscribers = Array.from({ length: 10 }, () => vi.fn());
    subscribers.forEach((fn) => store.subscribe(atom1, fn));

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      store.set(atom1, i);
      store.set(atom2, i);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(200);
  });
});

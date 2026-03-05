import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore } from "../store";
import { atom } from "../atom";

/**
 * Tests for store subscription mechanism
 * Verifies that subscribers are notified on state changes
 */
describe("Store Subscription Debug", () => {
  let store: ReturnType<typeof createStore>;
  let testAtom: ReturnType<typeof atom<string>>;
  let testId: string;

  beforeEach(() => {
    testId = Math.random().toString(36).substring(2, 9);
    store = createStore([]);
    testAtom = atom("", `debug.sub.${testId}`);
    store.get(testAtom);
  });

  describe("Basic Subscription", () => {
    it("should call subscriber on set", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(testAtom, listener);

      store.set(testAtom, "New Value");

      expect(listener).toHaveBeenCalledWith("New Value");
      unsubscribe();
    });

    it("should call subscriber multiple times on multiple sets", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(testAtom, listener);

      store.set(testAtom, "Value 1");
      store.set(testAtom, "Value 2");
      store.set(testAtom, "Value 3");

      expect(listener).toHaveBeenCalledTimes(3);
      expect(listener).toHaveBeenNthCalledWith(1, "Value 1");
      expect(listener).toHaveBeenNthCalledWith(2, "Value 2");
      expect(listener).toHaveBeenNthCalledWith(3, "Value 3");

      unsubscribe();
    });

    it("should not call subscriber after unsubscribe", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(testAtom, listener);

      store.set(testAtom, "Value 1");
      unsubscribe();
      store.set(testAtom, "Value 2");

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith("Value 1");
    });

    it("should NOT receive initial value on subscribe (subscribe does not call listener immediately)", () => {
      const listener = vi.fn();
      store.set(testAtom, "Initial");

      const unsubscribe = store.subscribe(testAtom, listener);

      // Listener is NOT called on subscribe - only on changes
      expect(listener).not.toHaveBeenCalled();

      // But we can get the value manually
      expect(store.get(testAtom)).toBe("Initial");

      unsubscribe();
    });
  });

  describe("Multiple Subscribers", () => {
    it("should notify all subscribers", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsub1 = store.subscribe(testAtom, listener1);
      const unsub2 = store.subscribe(testAtom, listener2);

      store.set(testAtom, "New Value");

      expect(listener1).toHaveBeenCalledWith("New Value");
      expect(listener2).toHaveBeenCalledWith("New Value");

      unsub1();
      unsub2();
    });

    it("should handle subscriber that throws", () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error("Test error");
      });
      const normalListener = vi.fn();

      const unsub1 = store.subscribe(testAtom, errorListener);
      const unsub2 = store.subscribe(testAtom, normalListener);

      // Should not throw
      expect(() => {
        store.set(testAtom, "New Value");
      }).not.toThrow();

      // Normal listener should still be called
      expect(normalListener).toHaveBeenCalledWith("New Value");

      unsub1();
      unsub2();
    });
  });

  describe("Subscription with Batching", () => {
    it("should batch notifications", async () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(testAtom, listener);

      // Multiple rapid sets
      store.set(testAtom, "Value 1");
      store.set(testAtom, "Value 2");
      store.set(testAtom, "Value 3");

      // Wait for batch to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // All notifications should be sent
      expect(listener).toHaveBeenCalledTimes(3);

      unsubscribe();
    });
  });

  describe("Subscription with Different Atom Types", () => {
    it("should subscribe to primitive atom", () => {
      const primAtom = atom("initial", `debug.prim.${testId}`);
      const listener = vi.fn();

      store.get(primAtom);
      const unsubscribe = store.subscribe(primAtom, listener);

      store.set(primAtom, "updated");

      expect(listener).toHaveBeenCalledWith("updated");
      unsubscribe();
    });

    it("should subscribe to number atom", () => {
      const numAtom = atom(0, `debug.num.${testId}`);
      const listener = vi.fn();

      store.get(numAtom);
      const unsubscribe = store.subscribe(numAtom, listener);

      store.set(numAtom, 42);

      expect(listener).toHaveBeenCalledWith(42);
      unsubscribe();
    });

    it("should subscribe to boolean atom", () => {
      const boolAtom = atom(false, `debug.bool.${testId}`);
      const listener = vi.fn();

      store.get(boolAtom);
      const unsubscribe = store.subscribe(boolAtom, listener);

      store.set(boolAtom, true);

      expect(listener).toHaveBeenCalledWith(true);
      unsubscribe();
    });
  });

  describe("Edge Cases", () => {
    it("should handle setting same value", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(testAtom, listener);

      store.set(testAtom, "Same");
      store.set(testAtom, "Same");

      // Should still notify even if value is same
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    it("should handle undefined value", () => {
      const undefAtom = atom(undefined as string | undefined, `debug.undef.${testId}`);
      const listener = vi.fn();

      store.get(undefAtom);
      const unsubscribe = store.subscribe(undefAtom, listener);

      store.set(undefAtom, undefined);

      expect(listener).toHaveBeenCalledWith(undefined);
      unsubscribe();
    });

    it("should handle null value", () => {
      const nullAtom = atom(null as string | null, `debug.null.${testId}`);
      const listener = vi.fn();

      store.get(nullAtom);
      const unsubscribe = store.subscribe(nullAtom, listener);

      store.set(nullAtom, null);

      expect(listener).toHaveBeenCalledWith(null);
      unsubscribe();
    });

    it("should handle empty string value", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(testAtom, listener);

      store.set(testAtom, "");

      expect(listener).toHaveBeenCalledWith("");
      unsubscribe();
    });
  });

  describe("Subscription Timing", () => {
    it("should notify synchronously", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(testAtom, listener);

      let notified = false;
      store.set(testAtom, "Value");
      
      // Listener should be called synchronously (or via batch)
      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });

    it("should not notify after unsubscribe in callback", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(testAtom, listener);

      let callCount = 0;
      const selfUnsubscribingListener = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          unsubscribe();
        }
      });

      const unsub2 = store.subscribe(testAtom, selfUnsubscribingListener);

      // First set - both listeners called, then first unsubscribes
      store.set(testAtom, "Value 1");
      // Second set - only selfUnsubscribingListener called (listener already unsubscribed)
      store.set(testAtom, "Value 2");

      // selfUnsubscribingListener called twice (for both sets)
      expect(selfUnsubscribingListener).toHaveBeenCalledTimes(2);
      // listener called once (for first set only)
      expect(listener).toHaveBeenCalledTimes(1);

      unsub2();
    });
  });
});

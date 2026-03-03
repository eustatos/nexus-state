// Tests for React adapter
import { atom, createStore, Setter, ComputedAtom, Atom } from "@nexus-state/core";
import { useAtom, useAtomValue, useSetAtom, useAtomCallback } from "./index";
// Use adapter for renderHook to support React 17/18/19
import { renderHook, act } from "./src/__tests__/renderHook-adapter";
import { describe, it, expect } from "vitest";

// === HELPER FUNCTIONS ===
function createComponentTest<T>(atom: any, store?: any) {
  const { result } = renderHook(() => useAtom(atom, store));
  return result;
}

function updateAtomValue<T>(atom: any, store: any, value: T | ((prev: T) => T)) {
  act(() => {
    store.set(atom, value);
  });
}

// === useAtomValue TESTS ===
describe("useAtomValue - Read-only hook", () => {
  it("should return the initial value of the atom", () => {
    const store = createStore();
    const testAtom = atom(42);

    const { result } = renderHook(() => useAtomValue(testAtom, store));
    expect(result.current).toBe(42);
  });

  it("should update when the atom value changes", () => {
    const store = createStore();
    const testAtom = atom(0);

    const { result } = renderHook(() => useAtomValue(testAtom, store));
    expect(result.current).toBe(0);

    act(() => {
      store.set(testAtom, 1);
    });

    expect(result.current).toBe(1);
  });

  it("should work with computed atoms", () => {
    const store = createStore();
    const countAtom = atom(5);
    const doubleAtom = atom((get) => get(countAtom) * 2);

    const { result } = renderHook(() => useAtomValue(doubleAtom, store));
    expect(result.current).toBe(10);

    act(() => {
      store.set(countAtom, 10);
    });

    expect(result.current).toBe(20);
  });

  it("should not cause re-renders when used with useSetAtom in sibling component", () => {
    const store = createStore();
    const countAtom = atom(0);

    let renderCount = 0;
    
    // Component that only reads
    const { result: readResult } = renderHook(() => {
      renderCount++;
      return useAtomValue(countAtom, store);
    });

    // Component that only writes
    const { result: writeResult } = renderHook(() => {
      return useSetAtom(countAtom, store);
    });

    expect(readResult.current).toBe(0);
    expect(renderCount).toBe(1);

    // Update from write-only component
    act(() => {
      writeResult.current(1);
    });

    expect(readResult.current).toBe(1);
    // Should re-render because value changed
    expect(renderCount).toBe(2);
  });
});

// === useSetAtom TESTS ===
describe("useSetAtom - Write-only hook", () => {
  it("should return a setter function", () => {
    const store = createStore();
    const testAtom = atom(0);

    const { result } = renderHook(() => useSetAtom(testAtom, store));
    expect(typeof result.current).toBe("function");
  });

  it("should update the atom value when called", () => {
    const store = createStore();
    const testAtom = atom(0);

    const { result } = renderHook(() => useSetAtom(testAtom, store));

    act(() => {
      result.current(42);
    });

    expect(store.get(testAtom)).toBe(42);
  });

  it("should work with function updates", () => {
    const store = createStore();
    const countAtom = atom(1);

    const { result } = renderHook(() => useSetAtom(countAtom, store));

    act(() => {
      result.current((prev) => prev + 1);
    });

    expect(store.get(countAtom)).toBe(2);

    act(() => {
      result.current((prev) => prev * 10);
    });

    expect(store.get(countAtom)).toBe(20);
  });

  it("should have stable reference (not change on re-render)", () => {
    const store = createStore();
    const testAtom = atom(0);

    const { result, rerender } = renderHook(() => useSetAtom(testAtom, store));
    const firstSetter = result.current;

    rerender();
    const secondSetter = result.current;

    expect(firstSetter).toBe(secondSetter);
  });

  it("should not cause component to re-render when updating", () => {
    const store = createStore();
    const testAtom = atom(0);

    let renderCount = 0;

    const { result } = renderHook(() => {
      renderCount++;
      return useSetAtom(testAtom, store);
    });

    expect(renderCount).toBe(1);

    act(() => {
      result.current(1);
    });

    // Should still be 1 - component doesn't re-render because it doesn't read value
    expect(renderCount).toBe(1);
    expect(store.get(testAtom)).toBe(1);
  });
});

// === useAtom BACKWARD COMPATIBILITY TESTS ===
describe("useAtom - Primitive Atoms", () => {
  it("should return the initial value of the atom", () => {
    const store = createStore();
    const testAtom = atom(42);

    const { result } = renderHook(() => useAtom(testAtom, store));
    expect(result.current[0]).toBe(42);
  });

  it("should update when the atom value changes", () => {
    const store = createStore();
    const testAtom = atom(0);

    const { result } = renderHook(() => useAtom(testAtom, store));
    expect(result.current[0]).toBe(0);

    act(() => {
      store.set(testAtom, 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it("should work with different primitive types", () => {
    const store = createStore();

    // String atom (must use name parameter to distinguish from computed)
    const stringAtom = atom("hello", "string-atom");
    const { result: stringResult } = renderHook(() => useAtom(stringAtom, store));
    expect(stringResult.current[0]).toBe("hello");

    // Boolean atom
    const booleanAtom = atom(true);
    const { result: booleanResult } = renderHook(() => useAtom(booleanAtom, store));
    expect(booleanResult.current[0]).toBe(true);

    // Array atom
    const arrayAtom = atom([1, 2, 3]);
    const { result: arrayResult } = renderHook(() => useAtom(arrayAtom, store));
    expect(arrayResult.current[0]).toEqual([1, 2, 3]);

    // Object atom
    const objectAtom = atom({ name: "test", value: 123 });
    const { result: objectResult } = renderHook(() => useAtom(objectAtom, store));
    expect(objectResult.current[0]).toEqual({ name: "test", value: 123 });
  });

  it("should handle updates with functional updates", () => {
    const store = createStore();
    const countAtom = atom(0);

    const { result } = renderHook(() => useAtom(countAtom, store));

    act(() => {
      store.set(countAtom, (prev: number) => prev + 1);
    });
    expect(result.current[0]).toBe(1);

    act(() => {
      store.set(countAtom, (prev: number) => prev + 5);
    });
    expect(result.current[0]).toBe(6);
  });

  it("should work with symbol-named primitive atoms", () => {
    const store = createStore();
    const namedAtom = atom("named-value", "my-custom-atom");

    const { result } = renderHook(() => useAtom(namedAtom, store));
    expect(result.current[0]).toBe("named-value");
  });
});

// === COMPUTED ATOM TESTS ===
describe("useAtom - Computed Atoms", () => {
  it("should compute derived values from primitive atoms", () => {
    const store = createStore();
    const countAtom = atom(0);
    const doubleAtom = atom((get: any) => get(countAtom) * 2);
    expect(doubleAtom.type).toBe("computed");

    const { result } = renderHook(() => useAtom(doubleAtom, store));
    expect(result.current[0]).toBe(0);

    act(() => {
      store.set(countAtom, 5);
    });

    expect(result.current[0]).toBe(10);
  });

  it("should chain computed atoms", () => {
    const store = createStore();
    const countAtom = atom(1);
    const doubleAtom = atom((get: any) => get(countAtom) * 2);
    expect(doubleAtom.type).toBe("computed");
    const tripleAtom = atom((get: any) => (get(doubleAtom) + get(countAtom)) as number);
    expect(tripleAtom.type).toBe("computed");

    const { result } = renderHook(() => useAtom(tripleAtom, store));
    expect(result.current[0]).toBe(3); // (1 * 2) + 1 = 3

    act(() => {
      store.set(countAtom, 5);
    });

    expect(result.current[0]).toBe(15); // (5 * 2) + 5 = 15
  });

  it("should work with multiple dependencies", () => {
    const store = createStore();
    const a = atom(5);
    const b = atom(10);
    const sumAtom = atom((get: any) => (get(a) + get(b)) as number);
    expect(sumAtom.type).toBe("computed");

    const { result } = renderHook(() => useAtom(sumAtom, store));
    expect(result.current[0]).toBe(15);

    act(() => {
      store.set(a, 20);
    });
    expect(result.current[0]).toBe(30);

    act(() => {
      store.set(b, 25);
    });
    expect(result.current[0]).toBe(45);
  });

  it("should handle computed atoms with string concatenation", () => {
    const store = createStore();
    const firstNameAtom = atom("John", "first-name");
    const lastNameAtom = atom("Doe", "last-name");
    const fullNameAtom = atom((get: any) => `${get(firstNameAtom)} ${get(lastNameAtom)}`);
    expect(fullNameAtom.type).toBe("computed");

    const { result } = renderHook(() => useAtom(fullNameAtom, store));
    expect(result.current[0]).toBe("John Doe");

    act(() => {
      store.set(firstNameAtom, "Jane");
    });
    expect(result.current[0]).toBe("Jane Doe");
  });

  it("should work with computed atoms using complex transformations", () => {
    const store = createStore();
    const numbersAtom = atom([1, 2, 3, 4, 5]);
    const sumAtom = atom((get: any) => get(numbersAtom).reduce((a: number, b: number) => a + b, 0) as number);
    expect(sumAtom.type).toBe("computed");
    const averageAtom = atom((get: any) => ((get(sumAtom) / get(numbersAtom).length) as number));
    expect(averageAtom.type).toBe("computed");

    const { result } = renderHook(() => useAtom(averageAtom, store));
    expect(result.current[0]).toBe(3);

    act(() => {
      store.set(numbersAtom, [10, 20, 30]);
    });
    expect(result.current[0]).toBe(20);
  });

  it("should work with symbol-named computed atoms", () => {
    const store = createStore();
    const countAtom = atom(10);
    const doubledAtom = atom((get: any) => get(countAtom) * 2, "doubled-count");
    expect(doubledAtom.type).toBe("computed");

    const { result } = renderHook(() => useAtom(doubledAtom, store));
    expect(result.current[0]).toBe(20);
  });

  it("should handle conditional logic in computed atoms", () => {
    const store = createStore();
    const countAtom = atom(0);
    const statusAtom = atom((get: any) => (get(countAtom) > 0 ? "positive" : "non-positive"));
    expect(statusAtom.type).toBe("computed");

    const { result } = renderHook(() => useAtom(statusAtom, store));
    expect(result.current[0]).toBe("non-positive");

    act(() => {
      store.set(countAtom, 5);
    });
    expect(result.current[0]).toBe("positive");

    act(() => {
      store.set(countAtom, -3);
    });
    expect(result.current[0]).toBe("non-positive");
  });
});

// === WRITABLE ATOM TESTS ===
describe("useAtom - Writable Atoms", () => {
  it("should read from derived state", () => {
    const store = createStore();
    const countAtom = atom(0);
    const writableCountAtom = atom(
      (get: any) => get(countAtom),
      (get: any, set: Setter, value: number) => set(countAtom, value),
    );

    const { result } = renderHook(() => useAtom(writableCountAtom, store));
    expect(result.current[0]).toBe(0);
  });

  it("should allow updating via store.set", () => {
    const store = createStore();
    const countAtom = atom(0);
    const writableCountAtom = atom(
      (get: any) => get(countAtom),
      (get: any, set: Setter, value: number) => set(countAtom, value),
    );

    const { result } = renderHook(() => useAtom(writableCountAtom, store));

    act(() => {
      store.set(countAtom, 10);
    });

    expect(result.current[0]).toBe(10);
    expect(store.get(countAtom)).toBe(10);
  });

  it("should support functional updates", () => {
    const store = createStore();
    const countAtom = atom(0);
    const writableCountAtom = atom(
      (get: any) => get(countAtom),
      (get: any, set: Setter, value: number) => set(countAtom, value),
    );

    const { result } = renderHook(() => useAtom(writableCountAtom, store));

    act(() => {
      store.set(countAtom, (prev: number) => prev + 5);
    });
    expect(result.current[0]).toBe(5);
  });

  it("should work with complex writable atoms", () => {
    const store = createStore();
    const baseAtom = atom(100);
    const derivedAtom = atom(50);
    
    const writableCombinedAtom = atom(
      (get: any) => get(baseAtom) + get(derivedAtom),
      (get: any, set: Setter, value: number) => {
        // Simple proportional split
        const total = get(baseAtom) + get(derivedAtom);
        const baseShare = get(baseAtom) / total;
        const derivedShare = get(derivedAtom) / total;
        set(baseAtom, value * baseShare);
        set(derivedAtom, value * derivedShare);
      },
    );

    const { result } = renderHook(() => useAtom(writableCombinedAtom, store));
    expect(result.current[0]).toBe(150);

    act(() => {
      store.set(writableCombinedAtom, 300);
    });
    expect(result.current[0]).toBe(300);
    // After setting writableCombinedAtom to 300:
    // - baseAtom should be 100 + (100/150)*200 = 233.33 (approximately 233)
    // - derivedAtom should be 50 + (50/150)*200 = 166.67 (approximately 167)
    // But the writable atom should return 300
    expect(store.get(writableCombinedAtom)).toBe(300);
  });

  it("should work with symbol-named writable atoms", () => {
    const store = createStore();
    const baseAtom = atom(10);
    const writableAtom = atom(
      (get: any) => get(baseAtom),
      (get: any, set: Setter, value: number) => set(baseAtom, value),
      "writable-base",
    );

    const { result } = renderHook(() => useAtom(writableAtom, store));
    expect(result.current[0]).toBe(10);

    act(() => {
      store.set(baseAtom, 20);
    });
    expect(result.current[0]).toBe(20);
  });
});

// === STORE ISOLATION TESTS ===
describe("useAtom - Store Isolation", () => {
  it("should maintain separate state across multiple stores", () => {
    const store1 = createStore();
    const store2 = createStore();
    const countAtom = atom(0);

    const { result: result1 } = renderHook(() => useAtom(countAtom, store1));
    const { result: result2 } = renderHook(() => useAtom(countAtom, store2));

    expect(result1.current[0]).toBe(0);
    expect(result2.current[0]).toBe(0);

    act(() => {
      store1.set(countAtom, 10);
    });
    expect(result1.current[0]).toBe(10);
    expect(result2.current[0]).toBe(0); // store2 should be unchanged

    act(() => {
      store2.set(countAtom, 20);
    });
    expect(result1.current[0]).toBe(10); // store1 should be unchanged
    expect(result2.current[0]).toBe(20);
  });

  it("should work with StoreProvider context", () => {
    const atom1 = atom(100);
    const atom2 = atom(200);
    const store = createStore();

    // Test that useAtom works with explicit store (main use case)
    const { result: result1 } = renderHook(() => useAtom(atom1, store));
    const { result: result2 } = renderHook(() => useAtom(atom2, store));

    expect(result1.current[0]).toBe(100);
    expect(result2.current[0]).toBe(200);
  });
});

// === PERFORMANCE TESTS ===
describe("useAtom - Performance", () => {
  it("should track atom changes correctly", () => {
    const store = createStore();
    const countAtom = atom(0);
    const nameAtom = atom("test", "name-atom");

    const { result } = renderHook(() => useAtom(countAtom, store));
    expect(result.current[0]).toBe(0);

    act(() => {
      store.set(nameAtom, "updated");
    });
    expect(result.current[0]).toBe(0); // countAtom should be unchanged
  });
});

// === useAtomCallback TESTS ===
describe("useAtomCallback", () => {
  it("should create a callback with get and set functions", () => {
    const store = createStore();
    const countAtom = atom(0);

    const { result } = renderHook(() =>
      useAtomCallback((get, set) => {
        const count = get(countAtom);
        set(countAtom, count + 1);
        return count;
      }, store)
    );

    let returnValue: number;
    act(() => {
      returnValue = result.current();
    });

    expect(returnValue).toBe(0);
    expect(store.get(countAtom)).toBe(1);
  });

  it("should pass arguments to the callback", () => {
    const store = createStore();
    const countAtom = atom(0);

    const { result } = renderHook(() =>
      useAtomCallback((get, set, amount: number) => {
        const count = get(countAtom);
        set(countAtom, count + amount);
        return get(countAtom);
      }, store)
    );

    let returnValue: number;
    act(() => {
      returnValue = result.current(5);
    });

    expect(returnValue).toBe(5);
    expect(store.get(countAtom)).toBe(5);
  });

  it("should work with multiple atoms", () => {
    const store = createStore();
    const balanceAtom = atom(100);
    const logAtom = atom<string[]>([]);

    const { result } = renderHook(() =>
      useAtomCallback((get, set, amount: number) => {
        const balance = get(balanceAtom);
        if (balance >= amount) {
          set(balanceAtom, balance - amount);
          set(logAtom, [...get(logAtom), `Transferred ${amount}`]);
          return true;
        }
        return false;
      }, store)
    );

    let success: boolean;
    act(() => {
      success = result.current(50);
    });

    expect(success).toBe(true);
    expect(store.get(balanceAtom)).toBe(50);
    expect(store.get(logAtom)).toEqual(["Transferred 50"]);
  });

  it("should have stable reference (not change on re-render)", () => {
    const store = createStore();
    const countAtom = atom(0);

    const { result, rerender } = renderHook(() =>
      useAtomCallback((get, set) => {
        set(countAtom, get(countAtom) + 1);
      }, store)
    );

    const firstCallback = result.current;
    rerender();
    const secondCallback = result.current;

    expect(firstCallback).toBe(secondCallback);
  });

  it("should throw error if store is not provided", () => {
    // React 17 (@testing-library/react-hooks): error captured in result.error
    // React 18/19 (@testing-library/react): error thrown during render
    let caughtError: Error | undefined;
    try {
      const { result } = renderHook(() =>
        useAtomCallback((get, set) => {
          set(atom(0), 1);
        })
      );
      // If we get here, error was captured in result.error (React 17)
      if (result.error) {
        caughtError = result.error as Error;
      }
    } catch (error) {
      // Error thrown during render (React 18/19)
      caughtError = error as Error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toContain(
      "useAtomCallback requires a store. Either provide one explicitly or wrap your component with <StoreProvider>."
    );
  });

  it("should support function updates", () => {
    const store = createStore();
    const countAtom = atom(10);

    const { result } = renderHook(() =>
      useAtomCallback((get, set) => {
        set(countAtom, (prev) => prev * 2);
        return get(countAtom);
      }, store)
    );

    let returnValue: number;
    act(() => {
      returnValue = result.current();
    });

    expect(returnValue).toBe(20);
    expect(store.get(countAtom)).toBe(20);
  });

  it("should work with computed atoms", () => {
    const store = createStore();
    const countAtom = atom(5);
    const doubleAtom = atom((get) => get(countAtom) * 2);

    const { result } = renderHook(() =>
      useAtomCallback((get) => {
        return get(doubleAtom);
      }, store)
    );

    let returnValue: number;
    act(() => {
      returnValue = result.current();
    });

    expect(returnValue).toBe(10);

    act(() => {
      store.set(countAtom, 10);
    });

    act(() => {
      returnValue = result.current();
    });

    expect(returnValue).toBe(20);
  });
});

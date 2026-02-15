// Tests for React adapter
import { atom, createStore, Setter, ComputedAtom, Atom } from "@nexus-state/core";
import { useAtom } from "./index";
import { renderHook, act } from "@testing-library/react";
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

// === PRIMITIVE ATOM TESTS ===
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

  it("should use default store when none is provided", () => {
    const atom1 = atom(100);
    const atom2 = atom(200);

    const { result: result1 } = renderHook(() => useAtom(atom1));
    const { result: result2 } = renderHook(() => useAtom(atom2));

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

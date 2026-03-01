// Tests for Svelte adapter
import { atom, createStore } from "@nexus-state/core";
import { useAtom } from "./index";
import type { Readable } from "svelte/store";

describe("useAtom", () => {
  it("should return a readable store with the initial value of the atom", () => {
    const store = createStore();
    const testAtom = atom(42);

    const result = useAtom(testAtom, store);

    // Subscribe to get the initial value
    let receivedValue: number | undefined = undefined;
    (result as Readable<number>).subscribe((value: number) => {
      receivedValue = value;
    })();

    expect(receivedValue).toBe(42);
  });

  it("should update when the atom value changes", () => {
    const store = createStore();
    const testAtom = atom(0);

    const result = useAtom(testAtom, store);

    // Subscribe to track updates
    const values: number[] = [];
    const unsubscribe = (result as Readable<number>).subscribe((value: number) => {
      values.push(value);
    });
    
    expect(values[0]).toBe(0);

    // Change atom value
    store.set(testAtom, 1);

    // The readable should have updated
    expect(values[1]).toBe(1);

    // Unsubscribe
    unsubscribe();
  });
});

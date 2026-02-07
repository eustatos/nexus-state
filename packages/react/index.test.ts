// Tests for React adapter
import { atom, createStore, Getter } from "@nexus-state/core";
import { useAtom } from "./index";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("useAtom", () => {
  it("should return the initial value of the atom", () => {
    const store = createStore();
    const testAtom = atom(42);

    const { result } = renderHook(() => useAtom(testAtom, store));
    expect(result.current).toBe(42);
  });

  it("should update when the atom value changes", () => {
    const store = createStore();
    const testAtom = atom(0);

    const { result } = renderHook(() => useAtom(testAtom, store));
    expect(result.current).toBe(0);

    act(() => {
      store.set(testAtom, 1);
    });

    expect(result.current).toBe(1);
  });

  it("should work with computed atoms", () => {
    const store = createStore();
    const countAtom = atom(0);
    const doubleAtom = atom((get: Getter) => get(countAtom) * 2);

    const { result } = renderHook(() => useAtom(doubleAtom, store));
    expect(result.current).toBe(0);

    act(() => {
      store.set(countAtom, 5);
    });

    expect(result.current).toBe(10);
  });

  it("should create a new store when none is provided", () => {
    const testAtom = atom(100);

    const { result } = renderHook(() => useAtom(testAtom));
    expect(result.current).toBe(100);
  });
});

// Tests for React adapter
import { atom, createStore } from "@nexus-state/core";
import { useAtom } from "./index";
import { renderHook, act } from "@testing-library/react";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import * as React from "react";

// Types for mocks
type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);
type DependencyList = readonly any[] | undefined;

// Mock react for testing the hook
jest.mock("react", () => {
  const actualReact = jest.requireActual("react") as typeof React;
  return {
    ...actualReact,
    useState: jest.fn(),
    useEffect: jest.fn(),
    useMemo: jest.fn(),
  };
});

describe("useAtom", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it("should return the initial value of the atom", () => {
    const store = createStore();
    const testAtom = atom(42);

    // Mock useState and useMemo to control return values
    const useStateMock = jest.spyOn(React, "useState") as jest.MockedFunction<
      <T>(
        initialState: T | (() => T)
      ) => [T, Dispatch<SetStateAction<T>>]
    >;
    useStateMock.mockImplementation(<T>(initialState: T | (() => T)) => {
      const state = typeof initialState === 'function' ? (initialState as () => T)() : initialState;
      return [state, jest.fn() as Dispatch<SetStateAction<T>>];
    });

    const useMemoMock = jest.spyOn(React, "useMemo") as jest.MockedFunction<
      <T>(factory: () => T, deps?: DependencyList) => T
    >;
    useMemoMock.mockImplementation(<T>(factory: () => T) => factory());

    const useEffectMock = jest.spyOn(React, "useEffect") as jest.MockedFunction<
      (effect: React.EffectCallback, deps?: DependencyList) => void
    >;
    useEffectMock.mockImplementation((fn) => {
      const cleanup = fn();
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    });

    const { result } = renderHook(() => useAtom(testAtom, store));

    expect(result.current).toBe(42);
  });

  it("should update when the atom value changes", () => {
    const store = createStore();
    const testAtom = atom(0);

    // Mock useState and useMemo to control return values
    const setState = jest.fn();
    const useStateMock = jest.spyOn(React, "useState") as jest.MockedFunction<
      <T>(
        initialState: T | (() => T)
      ) => [T, Dispatch<SetStateAction<T>>]
    >;
    useStateMock.mockImplementation(<T>(initialState: T | (() => T)) => {
      const state = typeof initialState === 'function' ? (initialState as () => T)() : initialState;
      return [state, setState as Dispatch<SetStateAction<T>>];
    });

    const useMemoMock = jest.spyOn(React, "useMemo") as jest.MockedFunction<
      <T>(factory: () => T, deps?: DependencyList) => T
    >;
    useMemoMock.mockImplementation(<T>(factory: () => T) => factory());

    const useEffectMock = jest.spyOn(React, "useEffect") as jest.MockedFunction<
      (effect: React.EffectCallback, deps?: DependencyList) => void
    >;
    useEffectMock.mockImplementation((fn) => {
      const cleanup = fn();
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    });

    const { result } = renderHook(() => useAtom(testAtom, store));

    expect(result.current).toBe(0);

    // Change the atom value
    act(() => {
      store.set(testAtom, 1);
    });

    // Check that the value was updated
    // Since we mock useState, we need to manually call setState
    expect(setState).toHaveBeenCalledWith(1);
  });
});
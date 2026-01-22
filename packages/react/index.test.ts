// Тесты для React адаптера
import { atom, createStore } from "@nexus-state/core";
import { useAtom } from "./index";
import { renderHook, act } from "@testing-library/react";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import * as React from "react";

// Мокаем react для тестирования хука
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
    // Сброс моков перед каждым тестом
    jest.clearAllMocks();
  });

  it("should return the initial value of the atom", () => {
    const store = createStore();
    const testAtom = atom(42);

    // Мокаем useState и useMemo для контроля возвращаемых значений
    const useStateMock = jest.spyOn(React, "useState");
    useStateMock.mockImplementation((initialState: unknown) => [initialState, jest.fn()]);

    const useMemoMock = jest.spyOn(React, "useMemo");
    useMemoMock.mockImplementation(() => store);

    const useEffectMock = jest.spyOn(React, "useEffect");
    useEffectMock.mockImplementation((fn) => fn());

    const { result } = renderHook(() => useAtom(testAtom, store));

    expect(result.current).toBe(42);
  });

  it("should update when the atom value changes", () => {
    const store = createStore();
    const testAtom = atom(0);

    // Мокаем useState и useMemo для контроля возвращаемых значений
    const setState = jest.fn();
    const useStateMock = jest.spyOn(React, "useState");
    useStateMock.mockImplementation((initialState: unknown) => [initialState, setState]);

    const useMemoMock = jest.spyOn(React, "useMemo");
    useMemoMock.mockImplementation(() => store);

    const useEffectMock = jest.spyOn(React, "useEffect");
    useEffectMock.mockImplementation(<T>(fn: () => T) => fn());

    const { result } = renderHook(() => useAtom(testAtom, store));

    expect(result.current).toBe(0);

    // Изменяем значение атома
    act(() => {
      store.set(testAtom, 1);
    });

    // Проверяем, что значение обновилось
    // Поскольку мы мокаем useState, нам нужно вручную вызвать setState
    expect(setState).toHaveBeenCalledWith(1);
  });
});
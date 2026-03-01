// Базовые тесты функциональности атомов
// Используем реальные импорты из пакетов

/* global describe, test, expect */
/* eslint-disable @typescript-eslint/no-var-requires */
// Импортируем из CommonJS сборки
const { atom, createStore } = require("@nexus-state/core");

describe("Basic atom functionality", () => {
  test("creates primitive atom", () => {
    const countAtom = atom(0, "count");
    expect(countAtom).toBeDefined();
    expect(countAtom.id).toBeDefined();

    const store = createStore();
    expect(store.get(countAtom)).toBe(0);
  });

  test("creates computed atom", () => {
    const baseAtom = atom(5, "base");
    const doubleAtom = atom((get) => get(baseAtom) * 2, "double");

    expect(doubleAtom).toBeDefined();
    expect(doubleAtom.id).toBeDefined();

    const store = createStore();
    expect(store.get(baseAtom)).toBe(5);
    expect(store.get(doubleAtom)).toBe(10);
  });

  test("computed atom updates when dependency changes", () => {
    const baseAtom = atom(5, "base");
    const doubleAtom = atom((get) => get(baseAtom) * 2, "double");

    const store = createStore();
    expect(store.get(doubleAtom)).toBe(10);

    store.set(baseAtom, 10);
    expect(store.get(doubleAtom)).toBe(20);
  });
});

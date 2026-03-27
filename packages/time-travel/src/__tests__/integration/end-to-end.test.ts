/**
 * End-to-End Integration Tests for TimeTravelController
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { TimeTravelController } from '../../TimeTravelController';
import { atomRegistry } from '@nexus-state/core';

describe('End-to-End Integration Tests', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('should handle complete user workflow', () => {
    // 1. Создание атомов
    const userAtom = atom(null, 'user');
    const countAtom = atom(0, 'count');
    const themeAtom = atom('light', 'theme');

    // 2. Создание store и controller
    const store = createStore();
    const controller = new TimeTravelController(store);

    // 3. Инициализация атомов (явный доступ перед capture)
    store.get(userAtom);
    store.get(countAtom);
    store.get(themeAtom);

    // Первый snapshot
    controller.capture('app-init');

    let snapshot = controller.getHistory()[0];
    expect(snapshot.state.user.value).toBe(null);
    expect(snapshot.state.count.value).toBe(0);
    expect(snapshot.state.theme.value).toBe('light');

    // 4. Изменения состояния
    store.set(userAtom, { name: 'Alice', id: 1 });
    store.set(countAtom, 5);
    controller.capture('user-login');

    snapshot = controller.getHistory()[1];
    expect(snapshot.state.user.value).toEqual({ name: 'Alice', id: 1 });
    expect(snapshot.state.count.value).toBe(5);
    expect(snapshot.state.theme.value).toBe('light');

    // 5. Ещё изменения
    store.set(themeAtom, 'dark');
    store.set(countAtom, 10);
    controller.capture('theme-change');

    // 6. Time travel назад
    controller.undo();
    expect(store.get(themeAtom)).toBe('light');
    expect(store.get(countAtom)).toBe(5);

    controller.undo();
    expect(store.get(userAtom)).toBe(null);
    expect(store.get(countAtom)).toBe(0);

    // 7. Time travel вперёд
    controller.redo();
    expect(store.get(userAtom)).toEqual({ name: 'Alice', id: 1 });

    controller.redo();
    expect(store.get(themeAtom)).toBe('dark');
    expect(store.get(countAtom)).toBe(10);
  });

  it('should handle complex computed atoms workflow', () => {
    const priceAtom = atom(100, 'price');
    const quantityAtom = atom(2, 'quantity');
    const taxRateAtom = atom(0.1, 'taxRate');

    const subtotalAtom = atom(
      (get) => get(priceAtom) * get(quantityAtom),
      'subtotal'
    );

    const taxAtom = atom(
      (get) => get(subtotalAtom) * get(taxRateAtom),
      'tax'
    );

    const totalAtom = atom(
      (get) => get(subtotalAtom) + get(taxAtom),
      'total'
    );

    const store = createStore();
    const controller = new TimeTravelController(store);

    // Инициализация атомов (явный доступ перед capture)
    store.get(priceAtom);
    store.get(quantityAtom);
    store.get(taxRateAtom);
    store.get(subtotalAtom);
    store.get(taxAtom);
    store.get(totalAtom);

    // Первый snapshot
    controller.capture('init');

    let snapshot = controller.getHistory()[0];
    expect(snapshot.state.price.value).toBe(100);
    expect(snapshot.state.quantity.value).toBe(2);
    expect(snapshot.state.taxRate.value).toBe(0.1);
    expect(snapshot.state.subtotal.value).toBe(200);
    expect(snapshot.state.tax.value).toBe(20);
    expect(snapshot.state.total.value).toBe(220);

    // Изменяем цену
    store.set(priceAtom, 150);
    controller.capture('price-change');

    snapshot = controller.getHistory()[1];
    expect(snapshot.state.subtotal.value).toBe(300);
    expect(snapshot.state.tax.value).toBe(30);
    expect(snapshot.state.total.value).toBe(330);

    // Undo
    controller.undo();
    expect(store.get(totalAtom)).toBe(220);
  });

  it('should handle multiple controllers on same store', () => {
    const atom1 = atom('initial', 'atom1');

    const store = createStore();
    const controller1 = new TimeTravelController(store, { maxHistory: 5 });
    const controller2 = new TimeTravelController(store, { maxHistory: 10 });

    // Инициализация атома перед capture
    store.get(atom1);

    controller1.capture('c1-init');
    controller2.capture('c2-init');

    store.set(atom1, 'changed');

    controller1.capture('c1-change');
    controller2.capture('c2-change');

    // Оба контроллера должны видеть изменения
    expect(controller1.getHistory()).toHaveLength(2);
    expect(controller2.getHistory()).toHaveLength(2);

    // Undo через controller1
    controller1.undo();
    expect(store.get(atom1)).toBe('initial');

    // controller2 тоже видит изменение
    expect(store.get(atom1)).toBe('initial');
  });

  it('should handle atom with duplicate names in workflow', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

    // Создаём атомы с дублирующимися именами
    const atom1 = atom('value1', 'shared');
    const atom2 = atom('value2', 'shared');

    const store = createStore();
    const controller = new TimeTravelController(store);

    // Инициализация атомов (оба будут зарегистрированы)
    store.get(atom1);
    store.get(atom2);

    controller.capture('init');

    // Проверяем, что оба атома зарегистрированы (по id)
    expect(atomRegistry.size()).toBe(2);

    // getByName вернёт первый атом
    expect(atomRegistry.getByName('shared')).toBe(atom1);

    consoleWarnSpy.mockRestore();
  });

  it('should handle state restoration with computed atoms', () => {
    const baseAtom = atom(10, 'base');
    const doubleAtom = atom((get) => get(baseAtom) * 2, 'double');

    const store = createStore();
    const controller = new TimeTravelController(store);

    // Инициализация атомов перед capture
    store.get(baseAtom);
    store.get(doubleAtom);

    controller.capture('init');
    store.set(baseAtom, 20);
    controller.capture('modified');

    // Restore to init
    controller.jumpTo(0);
    expect(store.get(baseAtom)).toBe(10);
    expect(store.get(doubleAtom)).toBe(20);
  });

  it('should handle clearHistory and new captures', () => {
    const atom1 = atom('initial', 'atom1');

    const store = createStore();
    const controller = new TimeTravelController(store);

    // Инициализация атома
    store.get(atom1);

    controller.capture('init');
    store.set(atom1, 'changed');
    controller.capture('changed');

    expect(controller.getHistory()).toHaveLength(2);

    controller.clearHistory();

    expect(controller.getHistory()).toHaveLength(0);

    // Новые captures должны работать после clear
    // Store сохраняет текущее значение 'changed', поэтому snapshot будет с этим значением
    controller.capture('new-init');
    expect(controller.getHistory()).toHaveLength(1);
    expect(controller.getHistory()[0].state.atom1.value).toBe('changed');
  });

  it('should handle jumpTo with complex state', () => {
    const atom1 = atom(0, 'atom1');
    const atom2 = atom('initial', 'atom2');

    const store = createStore();
    const controller = new TimeTravelController(store);

    // Инициализация атомов
    store.get(atom1);
    store.get(atom2);

    controller.capture('step-0');
    store.set(atom1, 1);
    controller.capture('step-1');
    store.set(atom1, 2);
    store.set(atom2, 'modified');
    controller.capture('step-2');

    // Jump to step-1
    controller.jumpTo(1);
    expect(store.get(atom1)).toBe(1);
    expect(store.get(atom2)).toBe('initial');

    // Jump to step-2
    controller.jumpTo(2);
    expect(store.get(atom1)).toBe(2);
    expect(store.get(atom2)).toBe('modified');
  });

  it('should handle undo/redo with multiple stores', () => {
    const sharedAtom = atom('initial', 'shared');

    const store1 = createStore();
    const controller1 = new TimeTravelController(store1);

    const store2 = createStore();
    const controller2 = new TimeTravelController(store2);

    // Инициализация атома в каждом сторе
    store1.get(sharedAtom);
    store2.get(sharedAtom);

    controller1.capture('init');
    controller2.capture('init');

    store1.set(sharedAtom, 'store1-changed');
    controller1.capture('store1-modified');

    store2.set(sharedAtom, 'store2-changed');
    controller2.capture('store2-modified');

    // Undo в store1 не влияет на store2
    controller1.undo();
    expect(store1.get(sharedAtom)).toBe('initial');
    expect(store2.get(sharedAtom)).toBe('store2-changed');

    // Undo в store2 не влияет на store1
    controller2.undo();
    expect(store1.get(sharedAtom)).toBe('initial');
    expect(store2.get(sharedAtom)).toBe('initial');
  });
});

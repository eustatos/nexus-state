# Task 04: Интеграционные тесты

## Описание

Создать комплексный набор интеграционных тестов для проверки взаимодействия между `TimeTravelController`, `atomRegistry`, и `Store` после внедрения авто-инициализации и warning при дубликатах.

## Цели

1. Проверить корректность авто-инициализации в `capture()`
2. Проверить работу warning при дублировании имён
3. Проверить обратную совместимость с существующим кодом
4. Проверить edge cases и граничные условия
5. Проверить производительность для больших приложений

## Структура тестов

### Файл: `packages/time-travel/src/__tests__/integration/capture-auto-init.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { TimeTravelController } from '../../TimeTravelController';
import { atomRegistry } from '@nexus-state/core';

describe('TimeTravelController - Auto-initialization', () => {
  let store: ReturnType<typeof createStore>;
  let controller: TimeTravelController;

  beforeEach(() => {
    store = createStore();
    controller = new TimeTravelController(store);
    // Очистка registry между тестами
    atomRegistry.clear();
  });

  describe('Basic auto-initialization', () => {
    it('should auto-initialize primitive atoms on first capture', () => {
      const testAtom = atom('initial', 'testAtom');
      
      controller.capture('init');
      
      const snapshots = controller.getSnapshots();
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].state).toEqual({ testAtom: 'initial' });
    });

    it('should auto-initialize multiple primitive atoms', () => {
      const atom1 = atom('value1', 'atom1');
      const atom2 = atom(42, 'atom2');
      const atom3 = atom(true, 'atom3');
      const atom4 = atom(null, 'atom4');
      
      controller.capture('init');
      
      const snapshot = controller.getSnapshots()[0];
      expect(snapshot.state).toEqual({
        atom1: 'value1',
        atom2: 42,
        atom3: true,
        atom4: null
      });
    });

    it('should auto-initialize atoms with complex objects', () => {
      const objAtom = atom({ key: 'value', nested: { data: 123 } }, 'objAtom');
      const arrAtom = atom([1, 2, 3], 'arrAtom');
      
      controller.capture('init');
      
      const snapshot = controller.getSnapshots()[0];
      expect(snapshot.state).toEqual({
        objAtom: { key: 'value', nested: { data: 123 } },
        arrAtom: [1, 2, 3]
      });
    });
  });

  describe('Computed atoms auto-initialization', () => {
    it('should auto-initialize computed atoms', () => {
      const baseAtom = atom(10, 'base');
      const computedAtom = atom((get) => get(baseAtom) * 2, 'computed');
      
      controller.capture('init');
      
      const snapshot = controller.getSnapshots()[0];
      expect(snapshot.state).toEqual({
        base: 10,
        computed: 20
      });
    });

    it('should handle computed atoms with multiple dependencies', () => {
      const atom1 = atom(5, 'atom1');
      const atom2 = atom(10, 'atom2');
      const sumAtom = atom((get) => get(atom1) + get(atom2), 'sum');
      const productAtom = atom((get) => get(atom1) * get(atom2), 'product');
      
      controller.capture('init');
      
      const snapshot = controller.getSnapshots()[0];
      expect(snapshot.state).toEqual({
        atom1: 5,
        atom2: 10,
        sum: 15,
        product: 50
      });
    });

    it('should handle nested computed atoms', () => {
      const baseAtom = atom(2, 'base');
      const doubleAtom = atom((get) => get(baseAtom) * 2, 'double');
      const quadAtom = atom((get) => get(doubleAtom) * 2, 'quad');
      
      controller.capture('init');
      
      const snapshot = controller.getSnapshots()[0];
      expect(snapshot.state).toEqual({
        base: 2,
        double: 4,
        quad: 8
      });
    });
  });

  describe('Error handling', () => {
    it('should continue capture if some atoms fail to initialize', () => {
      const goodAtom = atom('good', 'goodAtom');
      const badAtom = atom((get) => {
        throw new Error('Initialization error');
      }, 'badAtom');
      const anotherGoodAtom = atom('also-good', 'anotherGoodAtom');
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
      
      expect(() => controller.capture('init')).not.toThrow();
      
      const snapshot = controller.getSnapshots()[0];
      expect(snapshot.state).toEqual({
        goodAtom: 'good',
        anotherGoodAtom: 'also-good'
        // badAtom отсутствует
      });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize atom'),
        expect.any(Error)
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle circular dependencies gracefully', () => {
      // Создаём циклическую зависимость через writable atoms
      const atom1 = atom(0, 'atom1');
      const atom2 = atom(
        (get) => get(atom1) + 1,
        (get, set, value: number) => set(atom1, value),
        'atom2'
      );
      
      // Store должен обработать это корректно
      expect(() => controller.capture('init')).not.toThrow();
    });
  });

  describe('Backward compatibility', () => {
    it('should work with explicitly initialized atoms', () => {
      const testAtom = atom('initial', 'testAtom');
      
      // Явная инициализация (старый способ)
      store.set(testAtom, 'changed');
      
      controller.capture('snapshot');
      
      const snapshot = controller.getSnapshots()[0];
      expect(snapshot.state).toEqual({
        testAtom: 'changed'  // Использует значение из store
      });
    });

    it('should preserve store state over initialValue', () => {
      const atom1 = atom('initial1', 'atom1');
      const atom2 = atom('initial2', 'atom2');
      
      // Изменяем только atom1
      store.set(atom1, 'modified');
      
      controller.capture('snapshot');
      
      const snapshot = controller.getSnapshots()[0];
      expect(snapshot.state).toEqual({
        atom1: 'modified',  // Из store
        atom2: 'initial2'   // Авто-инициализирован
      });
    });

    it('should work with existing time-travel workflow', () => {
      const countAtom = atom(0, 'count');
      
      controller.capture('init');
      
      store.set(countAtom, 5);
      controller.capture('increment');
      
      store.set(countAtom, 10);
      controller.capture('increment-again');
      
      // Undo
      controller.undo();
      expect(store.get(countAtom)).toBe(5);
      
      controller.undo();
      expect(store.get(countAtom)).toBe(0);
      
      // Redo
      controller.redo();
      expect(store.get(countAtom)).toBe(5);
    });
  });

  describe('Multiple stores', () => {
    it('should auto-initialize atoms independently in different stores', () => {
      const sharedAtom = atom('initial', 'shared');
      
      const store1 = createStore();
      const controller1 = new TimeTravelController(store1);
      
      const store2 = createStore();
      const controller2 = new TimeTravelController(store2);
      
      // Изменяем только в store1
      store1.set(sharedAtom, 'store1-value');
      
      controller1.capture('store1-snapshot');
      controller2.capture('store2-snapshot');
      
      expect(controller1.getSnapshots()[0].state).toEqual({
        shared: 'store1-value'
      });
      
      expect(controller2.getSnapshots()[0].state).toEqual({
        shared: 'initial'  // Авто-инициализирован с initialValue
      });
    });
  });

  describe('Performance', () => {
    it('should handle large number of atoms efficiently', () => {
      // Создаём 100 атомов
      const atoms = Array.from({ length: 100 }, (_, i) => 
        atom(`value-${i}`, `atom-${i}`)
      );
      
      const startTime = performance.now();
      controller.capture('large-snapshot');
      const endTime = performance.now();
      
      const snapshot = controller.getSnapshots()[0];
      expect(Object.keys(snapshot.state)).toHaveLength(100);
      
      // Должно выполниться быстро (< 1 секунды)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle deeply nested computed atoms', () => {
      let currentAtom = atom(1, 'base');
      
      // Создаём цепочку из 20 computed атомов
      for (let i = 1; i <= 20; i++) {
        const prevAtom = currentAtom;
        currentAtom = atom(
          (get) => get(prevAtom) + 1,
          `computed-${i}`
        );
      }
      
      expect(() => controller.capture('deep-chain')).not.toThrow();
      
      const snapshot = controller.getSnapshots()[0];
      expect(snapshot.state['computed-20']).toBe(21);
    });
  });
});
```

---

### Файл: `packages/core/src/__tests__/integration/duplicate-names.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom } from '../../atom';
import { atomRegistry } from '../../atom-registry';

describe('AtomRegistry - Duplicate name warnings', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('should warn when registering atom with duplicate name', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    
    const atom1 = atom('value1', 'duplicateName');
    const atom2 = atom('value2', 'duplicateName');
    
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Atom with name "duplicateName" already exists')
    );
    
    consoleWarnSpy.mockRestore();
  });

  it('should not warn for unique names', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    
    const atom1 = atom('value1', 'uniqueName1');
    const atom2 = atom('value2', 'uniqueName2');
    const atom3 = atom('value3', 'uniqueName3');
    
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    
    consoleWarnSpy.mockRestore();
  });

  it('should not warn for atoms without explicit names', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    
    const atom1 = atom('value1');  // auto-generated name
    const atom2 = atom('value2');  // auto-generated name
    
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    
    consoleWarnSpy.mockRestore();
  });

  it('should warn multiple times for multiple duplicates', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    
    const atom1 = atom('v1', 'name1');
    const atom2 = atom('v2', 'name1');  // Warning 1
    const atom3 = atom('v3', 'name1');  // Warning 2
    
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    
    consoleWarnSpy.mockRestore();
  });

  it('should still register atoms with duplicate names', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    
    const atom1 = atom('value1', 'shared');
    const atom2 = atom('value2', 'shared');
    
    // Оба атома должны быть зарегистрированы
    expect(atomRegistry.get(atom1.id)).toBe(atom1);
    expect(atomRegistry.get(atom2.id)).toBe(atom2);
    
    consoleWarnSpy.mockRestore();
  });

  it('should return first atom with getByName() when duplicates exist', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    
    const atom1 = atom('value1', 'shared');
    const atom2 = atom('value2', 'shared');
    
    const found = atomRegistry.getByName('shared');
    
    expect(found).toBe(atom1);
    expect(found).not.toBe(atom2);
    
    consoleWarnSpy.mockRestore();
  });
});
```

---

### Файл: `packages/time-travel/src/__tests__/integration/end-to-end.test.ts`

```typescript
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
    
    // 3. Первый snapshot (авто-инициализация)
    controller.capture('app-init');
    
    let snapshot = controller.getSnapshots()[0];
    expect(snapshot.state).toEqual({
      user: null,
      count: 0,
      theme: 'light'
    });
    
    // 4. Изменения состояния
    store.set(userAtom, { name: 'Alice', id: 1 });
    store.set(countAtom, 5);
    controller.capture('user-login');
    
    snapshot = controller.getSnapshots()[1];
    expect(snapshot.state).toEqual({
      user: { name: 'Alice', id: 1 },
      count: 5,
      theme: 'light'
    });
    
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
    
    // Первый snapshot
    controller.capture('init');
    
    let snapshot = controller.getSnapshots()[0];
    expect(snapshot.state).toEqual({
      price: 100,
      quantity: 2,
      taxRate: 0.1,
      subtotal: 200,
      tax: 20,
      total: 220
    });
    
    // Изменяем цену
    store.set(priceAtom, 150);
    controller.capture('price-change');
    
    snapshot = controller.getSnapshots()[1];
    expect(snapshot.state.subtotal).toBe(300);
    expect(snapshot.state.tax).toBe(30);
    expect(snapshot.state.total).toBe(330);
    
    // Undo
    controller.undo();
    expect(store.get(totalAtom)).toBe(220);
  });

  it('should handle multiple controllers on same store', () => {
    const atom1 = atom('initial', 'atom1');
    
    const store = createStore();
    const controller1 = new TimeTravelController(store, { maxHistory: 5 });
    const controller2 = new TimeTravelController(store, { maxHistory: 10 });
    
    controller1.capture('c1-init');
    controller2.capture('c2-init');
    
    store.set(atom1, 'changed');
    
    controller1.capture('c1-change');
    controller2.capture('c2-change');
    
    // Оба контроллера должны видеть изменения
    expect(controller1.getSnapshots()).toHaveLength(2);
    expect(controller2.getSnapshots()).toHaveLength(2);
    
    // Undo через controller1
    controller1.undo();
    expect(store.get(atom1)).toBe('initial');
    
    // controller2 тоже видит изменение
    expect(store.get(atom1)).toBe('initial');
  });
});
```

## Критерии приёмки

- ✅ Все тесты проходят успешно
- ✅ Покрытие кода >90% для изменённых файлов
- ✅ Тесты проверяют все основные сценарии использования
- ✅ Тесты проверяют edge cases и ошибки
- ✅ Тесты проверяют обратную совместимость
- ✅ Тесты проверяют производительность
- ✅ Тесты документируют ожидаемое поведение

## Команды для запуска

```bash
# Запуск всех тестов
pnpm test

# Запуск только интеграционных тестов
pnpm test integration

# Запуск с покрытием
pnpm test --coverage

# Запуск в watch mode
pnpm test --watch
```

## Связанные задачи

- `task-01-capture-auto-init.md` - Реализация авто-инициализации
- `task-02-duplicate-warning.md` - Реализация warning
- `task-03-documentation.md` - Документация

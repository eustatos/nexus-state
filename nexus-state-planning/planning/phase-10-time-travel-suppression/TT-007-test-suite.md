# TT-007: Write Comprehensive Test Suite for Suppression

## 🎯 Task Overview

**Priority:** 🟡 HIGH (P1)  
**Estimated Time:** 4-6 hours  
**Status:** ⬜ Not Started  
**Assignee:** Unassigned

---

## 📋 Description

Создать comprehensive тест suite, покрывающий все аспекты time-travel suppression функциональности, включая edge cases и integration scenarios.

---

## 🎯 Acceptance Criteria

- [ ] Unit тесты для `isTimeTraveling` флага (TT-001)
- [ ] Integration тесты для `restoreSnapshot` с `setSilently()` (TT-005)
- [ ] Edge case тесты (computed атомы, multiple atoms, rapid changes)
- [ ] End-to-end тесты для полного time-travel flow
- [ ] Test coverage report showing 90%+ для нового кода
- [ ] Все тесты проходят в CI

---

## 📝 Test Categories

### 1. Unit Tests

| Test File | Description | Status |
|-----------|-------------|--------|
| `isTimeTraveling-flag.test.ts` | Флаг state management (TT-001) | ⬜ To Create |
| `restoreSnapshot-silent.test.ts` | Silent update integration (TT-005) | ⬜ To Create |

### 2. Integration Tests

| Test File | Description | Status |
|-----------|-------------|--------|
| `time-travel-suppression-integration.test.ts` | End-to-end flow | ⬜ To Create |
| `computed-atoms-during-travel.test.ts` | Computed re-evaluation | ⬜ To Create |

### 3. Edge Cases

| Test File | Description | Status |
|-----------|-------------|--------|
| `edge-cases.test.ts` | Nested atoms, rapid changes, error recovery | ⬜ To Create |

---

## 🧪 Test Templates

### 1. isTimeTraveling Flag Tests (TT-001)

**File:** `packages/time-travel/src/__tests__/suppression/isTimeTraveling-flag.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '../../SimpleTimeTravel';

describe('TT-001: isTimeTraveling flag', () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;
  let testAtom: ReturnType<typeof atom>;

  beforeEach(() => {
    store = createStore();
    testAtom = atom(0, 'test');
    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
  });

  it('should return false when not traveling', () => {
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should reset flag after jumpTo completes', () => {
    store.set(testAtom, 1);
    timeTravel.capture('step1');

    store.set(testAtom, 2);
    timeTravel.capture('step2');

    timeTravel.jumpTo(0);
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should reset flag even if restore fails', () => {
    timeTravel.capture('initial');

    expect(() => {
      timeTravel.jumpTo(-1);
    }).toThrow();

    expect(timeTravel.isTraveling()).toBe(false);
  });
});
```

---

### 2. restoreSnapshot Silent Tests (TT-005)

**File:** `packages/time-travel/src/__tests__/suppression/restoreSnapshot-silent.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '../../SimpleTimeTravel';

describe('TT-005: restoreSnapshot silent updates', () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;

  beforeEach(() => {
    store = createStore();
  });

  it('should NOT notify subscribers during undo', () => {
    const testAtom = atom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);
    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    store.set(testAtom, 10);
    timeTravel.capture('step1');

    timeTravel.undo();
    expect(subscriber).toHaveBeenCalledTimes(1); // Still 1, not 2
    expect(store.get(testAtom)).toBe(0);
  });

  it('should NOT notify subscribers during redo', () => {
    const testAtom = atom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);
    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    store.set(testAtom, 10);
    timeTravel.capture('step1');
    store.set(testAtom, 20);
    timeTravel.capture('step2');

    timeTravel.undo();
    timeTravel.redo();
    expect(subscriber).toHaveBeenCalledTimes(2); // No new calls
  });

  it('should properly restore computed atoms', () => {
    const countAtom = atom(0, 'count');
    const doubleAtom = atom((get) => get(countAtom) * 2, 'double');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    store.set(countAtom, 5);
    timeTravel.capture('step1');
    store.set(countAtom, 10);
    timeTravel.capture('step2');

    timeTravel.undo();
    expect(store.get(countAtom)).toBe(5);
    expect(store.get(doubleAtom)).toBe(10);
  });

  it('should handle multiple atoms silently', () => {
    const atom1 = atom(0, 'atom1');
    const atom2 = atom('', 'atom2');
    const atom3 = atom(false, 'atom3');

    const sub1 = vi.fn();
    const sub2 = vi.fn();
    const sub3 = vi.fn();

    store.subscribe(atom1, sub1);
    store.subscribe(atom2, sub2);
    store.subscribe(atom3, sub3);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    store.set(atom1, 10);
    store.set(atom2, 'hello');
    store.set(atom3, true);
    timeTravel.capture('step1');

    timeTravel.undo();

    expect(sub1).toHaveBeenCalledTimes(1);
    expect(sub2).toHaveBeenCalledTimes(1);
    expect(sub3).toHaveBeenCalledTimes(1);
  });
});
```

---

### 3. Integration Tests

**File:** `packages/time-travel/src/__tests__/suppression/time-travel-suppression-integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '../../SimpleTimeTravel';

describe('Time Travel Suppression Integration', () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;

  beforeEach(() => {
    store = createStore();
  });

  it('should handle e-commerce cart scenario', () => {
    const cartAtom = atom<any[]>([], 'cart');
    const totalAtom = atom((get) => {
      const cart = get(cartAtom);
      return cart.reduce((sum: number, item: any) => sum + item.price, 0);
    }, 'total');

    const notifications: string[] = [];

    // Subscribe to cart changes (simulating effect)
    store.subscribe(cartAtom, (cart) => {
      if (cart.length === 0) {
        notifications.push('Cart is empty');
      }
    });

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    expect(notifications).toHaveLength(0);

    store.set(cartAtom, [{ id: 1, name: 'Laptop', price: 999 }]);
    timeTravel.capture('add-item');
    expect(notifications).toHaveLength(0);

    store.set(cartAtom, []);
    timeTravel.capture('remove-item');
    expect(notifications).toHaveLength(1); // "Cart is empty"

    // Undo - should NOT trigger notification
    timeTravel.undo();
    expect(notifications).toHaveLength(1); // Still 1, not 2
    expect(store.get(cartAtom)).toHaveLength(1);
  });

  it('should handle rapid undo/redo without notification spam', () => {
    const testAtom = atom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);
    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('s0');
    store.set(testAtom, 1);
    timeTravel.capture('s1');
    store.set(testAtom, 2);
    timeTravel.capture('s2');
    store.set(testAtom, 3);
    timeTravel.capture('s3');

    expect(subscriber).toHaveBeenCalledTimes(3);

    // Rapid undo/redo
    timeTravel.undo();
    timeTravel.undo();
    timeTravel.redo();
    timeTravel.redo();
    timeTravel.undo();

    // Should NOT have additional notifications
    expect(subscriber).toHaveBeenCalledTimes(3);
  });

  it('should preserve isTraveling flag during nested operations', () => {
    const testAtom = atom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    expect(timeTravel.isTraveling()).toBe(false);

    store.set(testAtom, 10);
    timeTravel.capture('step1');

    // Manually trigger nested undo
    let travelingDuringNested = false;
    const originalUndo = timeTravel.undo.bind(timeTravel);
    timeTravel.undo = () => {
      const result = originalUndo();
      travelingDuringNested = timeTravel.isTraveling();
      return result;
    };

    originalUndo();

    // Flag should be reset
    expect(timeTravel.isTraveling()).toBe(false);
    expect(travelingDuringNested).toBe(false);
  });
});
```

---

### 4. Edge Cases Tests

**File:** `packages/time-travel/src/__tests__/suppression/edge-cases.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '../../SimpleTimeTravel';

describe('Time Travel Suppression Edge Cases', () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;

  beforeEach(() => {
    store = createStore();
  });

  it('should handle error during restore and reset flag', () => {
    const testAtom = atom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    // Try to jump to invalid index
    expect(() => {
      timeTravel.jumpTo(999);
    }).not.toThrow(); // Should handle gracefully

    // Flag should still be reset
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should handle atoms not found in registry', () => {
    const testAtom = atom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    store.set(testAtom, 10);
    timeTravel.capture('step1');

    // Manually modify snapshot to include non-existent atom
    const snapshots = timeTravel.getHistory();
    snapshots[0].state['non-existent-atom'] = {
      value: 42,
      type: 'primitive',
      name: 'non-existent-atom'
    };

    // Should handle gracefully
    expect(() => {
      timeTravel.jumpTo(0);
    }).not.toThrow();
  });

  it('should handle circular dependency in computed atoms', () => {
    // This test ensures no infinite loops during restore
    const atom1 = atom(0, 'atom1');
    const atom2 = atom((get) => get(atom1) + 1, 'atom2');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    store.set(atom1, 10);
    timeTravel.capture('step1');

    expect(() => {
      timeTravel.undo();
      timeTravel.redo();
    }).not.toThrow();
  });

  it('should handle very large state snapshots', () => {
    const atoms = Array.from({ length: 100 }, (_, i) =>
      atom(i, `atom-${i}`)
    );

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    // Update all atoms
    atoms.forEach((atom, i) => {
      store.set(atom, i * 2);
    });
    timeTravel.capture('updated');

    // Undo should complete in reasonable time
    const start = Date.now();
    timeTravel.undo();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000); // Should complete in < 1s
    expect(store.get(atoms[0])).toBe(0);
  });
});
```

---

## 🔗 Dependencies

- **Зависит от:**
  - TT-001 (isTimeTraveling flag)
  - TT-005 (restoreSnapshot with setSilently)

---

## 📚 Files to Create

1. `packages/time-travel/src/__tests__/suppression/isTimeTraveling-flag.test.ts`
2. `packages/time-travel/src/__tests__/suppression/restoreSnapshot-silent.test.ts`
3. `packages/time-travel/src/__tests__/suppression/time-travel-suppression-integration.test.ts`
4. `packages/time-travel/src/__tests__/suppression/edge-cases.test.ts`

---

## ✅ Verification Checklist

- [ ] Все тест-файлы созданы
- [ ] 90%+ code coverage для нового кода
- [ ] Все тесты проходят
- [ ] CI pipeline обновлён
- [ ] Нет memory leaks
- [ ] Edge cases покрыты

---

## 📝 Notes

- Использовать vi.fn() для mock subscribers
- Проверять flag state до/после операций
- Тестировать с computed атомами
- Добавить performance benchmarks для больших snapshots

---

**Created:** 2026-03-24  
**Last Updated:** 2026-03-24 (Revised v2 - сфокусировано на suppression tests)  
**Task Owner:** Unassigned  
**Related Issue:** Time Travel Suppression Analysis

# TT-005: Update `restoreSnapshot()` to Use `setSilently()`

## 🎯 Task Overview

**Priority:** 🔴 CRITICAL (P0)  
**Estimated Time:** 1-2 hours  
**Status:** ⬜ Not Started  
**Assignee:** Unassigned

---

## 📋 Description

Обновить метод `TimeTravelController.restoreSnapshot()` для использования `setSilently()` вместо обычного `set()`. Это гарантирует, что восстановление состояния во время time-travel не вызывает side effects.

**Note:** Метод `setSilently()` уже реализован в Phase 11 (SR-006). Эта задача — интеграция в TimeTravelController.

---

## 🎯 Acceptance Criteria

- [ ] `restoreSnapshot()` использует `setSilently()` вместо `set()`
- [ ] `restoreSnapshot()` устанавливает флаг `isTimeTraveling` в начале (TT-001)
- [ ] `restoreSnapshot()` сбрасывает флаг в блоке `finally` (TT-001)
- [ ] Computed атомы корректно re-evaluate после восстановления
- [ ] Все существующие time-travel тесты проходят
- [ ] Новый integration тест добавлен для проверки end-to-end suppression

---

## 📝 Implementation Guide

### Step 1: Обновить TimeTravelController

```typescript
// packages/time-travel/src/TimeTravelController.ts

export class TimeTravelController implements TimeTravelAPI {
  private isTimeTraveling = false;

  // ... existing code ...

  undo(): boolean {
    if (this.currentIndex <= 0) {
      return false;
    }

    this.currentIndex--;
    const snapshot = this.history[this.currentIndex];
    this.restoreSnapshot(snapshot);
    this.notify('undo');
    return true;
  }

  redo(): boolean {
    if (this.currentIndex >= this.history.length - 1) {
      return false;
    }

    this.currentIndex++;
    const snapshot = this.history[this.currentIndex];
    this.restoreSnapshot(snapshot);
    this.notify('redo');
    return true;
  }

  jumpTo(index: number): boolean {
    if (index < 0 || index >= this.history.length) {
      return false;
    }

    this.currentIndex = index;
    const snapshot = this.history[this.currentIndex];
    this.restoreSnapshot(snapshot);
    this.notify('jump');
    return true;
  }

  /**
   * Restore state from snapshot without triggering effects
   */
  private restoreSnapshot(snapshot: Snapshot): void {
    // Set traveling flag at start (TT-001)
    this.isTimeTraveling = true;

    try {
      // Auto-initialize all atoms from registry if enabled
      if (this.autoInitializeAtoms) {
        const allAtoms = atomRegistry.getAll();
        for (const atom of allAtoms.values()) {
          try {
            this.store.get(atom as any);
          } catch (error) {
            console.warn(
              `[TimeTravelController] Failed to initialize atom during capture:`,
              error
            );
          }
        }
      }

      // Restore each atom value SILENTLY (TT-005)
      Object.entries(snapshot.state).forEach(([key, entry]) => {
        const atom = atomRegistry.getByName(key);
        if (atom) {
          try {
            // ✅ USE setSilently INSTEAD OF set
            if (typeof (this.store as any).setSilently === 'function') {
              (this.store as any).setSilently(atom as never, entry.value as never);
            } else {
              // Fallback to normal set if setSilently not available
              console.warn(
                `[TimeTravelController] setSilently not available, using set() for atom ${key}`
              );
              (this.store as any).set(atom as never, entry.value as never);
            }
          } catch (error) {
            console.warn(
              `[TimeTravelController] Failed to restore atom ${key}:`,
              error
            );
          }
        } else {
          console.warn(
            `[TimeTravelController] Atom ${key} not found in registry`
          );
        }
      });

      // Force re-evaluation of computed atoms
      this.flushComputed();

    } finally {
      // Reset traveling flag at end (TT-001)
      this.isTimeTraveling = false;
    }
  }

  /**
   * Force re-evaluation of computed atoms
   */
  private flushComputed(): void {
    // Get all computed atoms and force re-evaluation
    const allAtoms = atomRegistry.getAll();
    for (const atom of allAtoms.values()) {
      if (atom.type === 'computed') {
        try {
          // Force re-evaluation by getting the value
          this.store.get(atom as any);
        } catch (error) {
          // Ignore errors for computed atoms with missing dependencies
          console.warn(
            `[TimeTravelController] Failed to flush computed atom:`,
            error
          );
        }
      }
    }
  }

  // ... rest of class ...
}
```

### Step 2: Обновить SimpleTimeTravel (опционально)

```typescript
// packages/time-travel/src/SimpleTimeTravel.ts

export class SimpleTimeTravel {
  private controller: TimeTravelController;

  // ... existing methods ...

  /**
   * Проверить, выполняется ли операция time-travel (TT-001)
   */
  isTraveling(): boolean {
    return this.controller.getIsTimeTraveling();
  }

  /**
   * Get debug context for advanced usage
   */
  getDebugContext(): { isTimeTraveling: boolean } {
    return {
      get isTimeTraveling() {
        return this.controller.getIsTimeTraveling();
      }
    };
  }
}
```

---

## 🧪 Test Requirements

### Новый тест-файл

Создать `packages/time-travel/src/__tests__/suppression/restoreSnapshot-silent.test.ts`:

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

    // Capture initial state (value: 0)
    timeTravel.capture('initial');
    expect(subscriber).toHaveBeenCalledTimes(0);

    // Change value (value: 10)
    store.set(testAtom, 10);
    expect(subscriber).toHaveBeenCalledTimes(1);

    // Capture new state
    timeTravel.capture('step1');

    // Undo - should NOT notify subscriber
    timeTravel.undo();
    expect(subscriber).toHaveBeenCalledTimes(1); // Still 1, not 2

    // Verify value was restored
    expect(store.get(testAtom)).toBe(0);
  });

  it('should NOT notify subscribers during redo', () => {
    const testAtom = atom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Setup: initial -> 10 -> 20
    timeTravel.capture('initial');
    store.set(testAtom, 10);
    timeTravel.capture('step1');
    store.set(testAtom, 20);
    timeTravel.capture('step2');

    expect(subscriber).toHaveBeenCalledTimes(2);

    // Undo twice
    timeTravel.undo(); // back to 10
    timeTravel.undo(); // back to 0
    expect(subscriber).toHaveBeenCalledTimes(2); // No new calls

    // Redo - should NOT notify subscriber
    timeTravel.redo(); // to 10
    expect(subscriber).toHaveBeenCalledTimes(2); // Still 2

    // Verify value was restored
    expect(store.get(testAtom)).toBe(10);
  });

  it('should NOT notify subscribers during jumpTo', () => {
    const testAtom = atom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Setup: 0 -> 10 -> 20 -> 30
    timeTravel.capture('initial');
    store.set(testAtom, 10);
    timeTravel.capture('step1');
    store.set(testAtom, 20);
    timeTravel.capture('step2');
    store.set(testAtom, 30);
    timeTravel.capture('step3');

    expect(subscriber).toHaveBeenCalledTimes(3);

    // Jump to middle - should NOT notify subscriber
    timeTravel.jumpTo(1); // Jump to step1 (value: 10)
    expect(subscriber).toHaveBeenCalledTimes(3); // Still 3

    // Verify value was restored
    expect(store.get(testAtom)).toBe(10);
  });

  it('should properly restore computed atoms', () => {
    const countAtom = atom(0, 'count');
    const doubleAtom = atom((get) => get(countAtom) * 2, 'double');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    expect(store.get(doubleAtom)).toBe(0);

    store.set(countAtom, 5);
    timeTravel.capture('step1');
    expect(store.get(doubleAtom)).toBe(10);

    store.set(countAtom, 10);
    timeTravel.capture('step2');
    expect(store.get(doubleAtom)).toBe(20);

    // Undo - should restore both count and double
    timeTravel.undo();
    expect(store.get(countAtom)).toBe(5);
    expect(store.get(doubleAtom)).toBe(10); // Computed should be re-evaluated
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

    expect(sub1).toHaveBeenCalledTimes(1);
    expect(sub2).toHaveBeenCalledTimes(1);
    expect(sub3).toHaveBeenCalledTimes(1);

    // Undo
    timeTravel.undo();

    // No new notifications
    expect(sub1).toHaveBeenCalledTimes(1);
    expect(sub2).toHaveBeenCalledTimes(1);
    expect(sub3).toHaveBeenCalledTimes(1);

    // Values restored
    expect(store.get(atom1)).toBe(0);
    expect(store.get(atom2)).toBe('');
    expect(store.get(atom3)).toBe(false);
  });

  it('should reset isTraveling flag after undo', () => {
    const testAtom = atom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    expect(timeTravel.isTraveling()).toBe(false);

    store.set(testAtom, 10);
    timeTravel.capture('step1');

    timeTravel.undo();

    // Flag should be reset after undo completes
    expect(timeTravel.isTraveling()).toBe(false);
  });
});
```

---

## 🔗 Dependencies

- **Зависит от:**
  - TT-001 (isTimeTraveling flag)
  - Phase 11 SR-006 (setSilently method)

---

## 📚 Files to Modify

1. `packages/time-travel/src/TimeTravelController.ts`
   - Обновить метод `restoreSnapshot()`
   - Добавить метод `flushComputed()`

2. `packages/time-travel/src/SimpleTimeTravel.ts`
   - Добавить метод `isTraveling()` (если не добавлен в TT-001)
   - Добавить метод `getDebugContext()` (опционально)

3. `packages/time-travel/src/__tests__/suppression/restoreSnapshot-silent.test.ts`
   - Создать новый тест-файл

---

## ✅ Verification Checklist

- [ ] Код компилируется без ошибок
- [ ] Все существующие time-travel тесты проходят
- [ ] Новый тест добавлен и проходит
- [ ] Subscribers не уведомляются во время undo/redo/jumpTo
- [ ] Computed атомы корректно re-evaluate
- [ ] isTimeTraveling флаг корректно управляется
- [ ] End-to-end integration проверен

---

## 📝 Notes

- Это **ключевая задача** которая объединяет TT-001 с существующим `setSilently()` из Phase 11
- `setSilently()` уже реализован в `StoreImpl.ts` (строка 245)
- Протестировать thoroughly с real-world scenarios
- Добавить fallback для старых версий Store (без `setSilently()`)

---

**Created:** 2026-03-24  
**Last Updated:** 2026-03-24 (Revised v2 - использует существующий setSilently из Phase 11)  
**Task Owner:** Unassigned  
**Related Issue:** Time Travel Suppression Analysis

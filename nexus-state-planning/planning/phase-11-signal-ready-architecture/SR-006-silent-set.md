# SR-006: Add Silent set() Support

## 🎯 Task Overview

**Priority:** 🔴 CRITICAL (P0)
**Estimated Time:** 3-4 hours
**Status:** ⬜ Not Started
**Assignee:** Unassigned

---

## 📋 Description

Добавить поддержку silent операций в Store через AtomContext. Когда `context.silent === true`, обновление состояния должно происходить без триггера notifications, hooks, и DevTools tracking.

---

## 🎯 Acceptance Criteria

- [ ] `Store.set()` принимает опциональный `context` параметр
- [ ] `Store.setSilently()` wrapper метод добавлен
- [ ] Silent операции НЕ триггерят subscribers
- [ ] Silent операции НЕ триггерят plugin hooks
- [ ] Silent операции НЕ триггерят DevTools tracking
- [ ] Состояние обновляется корректно
- [ ] Все существующие тесты проходят
- [ ] Новые тесты для silent операций

---

## 📝 Implementation Guide

### Step 1: Update StoreImpl.set() Signature

```typescript
// packages/core/src/store/StoreImpl.ts

import type { AtomContext } from '../reactive';

export class StoreImpl implements Store {
  // ... existing code ...

  /**
   * Set atom value with optional context
   * @param atom Atom to update
   * @param update New value or updater function
   * @param context Optional operation metadata
   */
  set<Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    context?: AtomContext
  ): void {
    logger.log(
      '[StoreImpl] Setting atom:',
      atom.name || 'unnamed',
      'silent:',
      context?.silent
    );

    // Register atom with registry
    const storesMap = atomRegistry.getStoresMap();
    for (const registry of storesMap.values()) {
      if (!registry.atoms.has(atom.id)) {
        registry.atoms.add(atom.id);
      }
    }

    // For writable atoms with write function, call write directly
    if (isWritableAtom(atom) && atom.write) {
      const write = atom.write;
      const storeSetter: Setter = (a, u) => this.set(a, u, context);
      write(this.createGetter(), storeSetter, update as Value);
      return;
    }

    // Get or create state
    const atomState = this.stateManager.getOrCreateState(atom, () => {
      return this.evaluator.evaluate(atom, this.createGetter());
    });

    // Calculate new value
    const newValue =
      typeof update === 'function'
        ? (update as (prev: Value) => Value)(atomState.value)
        : update;

    // ✅ Check if silent
    if (context?.silent) {
      // Silent update - skip all side effects
      const previousValue = atomState.value;
      this.stateManager.setValue(atom, newValue);

      logger.log(
        '[StoreImpl] Silent update:',
        atom.name || 'unnamed',
        'from:',
        previousValue,
        'to:',
        newValue
      );

      // ❌ NO notifications
      // ❌ NO dependency tracker
      // ❌ NO plugin hooks
      // ❌ NO DevTools tracking
      return;
    }

    // Normal update with side effects
    const processedValue = this.pluginSystem.executeOnSetHooks(atom, newValue);
    const previousValue = atomState.value;
    this.stateManager.setValue(atom, processedValue);

    logger.log(
      '[StoreImpl] Updated atom:',
      atom.name || 'unnamed',
      'from:',
      previousValue,
      'to:',
      processedValue
    );

    // Notify subscribers
    this.notificationManager.notify(atom, atomState, processedValue);

    // Notify dependents
    this.dependencyTracker.notifyDependents(
      atom,
      (a) => this.stateManager.getState(a)!,
      (a) => this.stateManager.getValue(a),
      (a) => this.evaluator.recompute(a, this.createGetter())
    );

    // Execute afterSet hooks
    this.pluginSystem.executeAfterSetHooks(atom, processedValue);

    // Track for DevTools
    this.devTools.trackStateChange(atom, processedValue);
  }

  /**
   * Set atom value silently (without notifications)
   * @param atom Atom to update
   * @param update New value or updater function
   */
  setSilently<Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ): void {
    this.set(atom, update, { silent: true });
  }
}
```

### Step 2: Update Store Interface

```typescript
// packages/core/src/types.ts

export interface Store {
  // ... existing methods ...

  /**
   * Set atom value with optional context
   */
  set: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    context?: AtomContext
  ) => void;

  /**
   * Set atom value silently (without notifications)
   */
  setSilently?: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ) => void;
}
```

### Step 3: Update createSetter

```typescript
// packages/core/src/store/StoreImpl.ts

private createSetter(get: Getter): Setter {
  return <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    context?: AtomContext
  ): void => {
    // Delegate to this.set() with context
    this.set(atom, update, context);
  };
}
```

---

## 🧪 Test Requirements

```typescript
// packages/core/src/store/__tests__/silent-set.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';

describe('SR-006: Silent set() support', () => {
  let store: ReturnType<typeof createStore>;
  let testAtom: ReturnType<typeof atom>;
  let subscriber: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = createStore();
    testAtom = atom(0, 'test');
    subscriber = vi.fn();
    store.subscribe(testAtom, subscriber);
  });

  it('should update value silently', () => {
    store.set(testAtom, 10, { silent: true });
    expect(store.get(testAtom)).toBe(10);
  });

  it('should NOT notify subscribers with silent context', () => {
    store.set(testAtom, 100, { silent: true });
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should NOT notify subscribers with setSilently', () => {
    store.setSilently(testAtom, 100);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should notify subscribers with normal set', () => {
    store.set(testAtom, 50);
    expect(subscriber).toHaveBeenCalledWith(50);
  });

  it('should handle updater functions silently', () => {
    store.set(testAtom, 10);
    store.setSilently(testAtom, (prev) => prev * 2);
    
    expect(store.get(testAtom)).toBe(20);
    expect(subscriber).toHaveBeenCalledTimes(1); // Only first set
  });

  it('should NOT trigger plugin hooks during silent set', () => {
    const onSetHook = vi.fn();
    const afterSetHook = vi.fn();

    store.applyPlugin(() => ({
      onSet: onSetHook,
      afterSet: afterSetHook,
    }));

    store.setSilently(testAtom, 999);

    expect(onSetHook).not.toHaveBeenCalled();
    expect(afterSetHook).not.toHaveBeenCalled();
  });

  it('should NOT trigger DevTools tracking during silent set', () => {
    const devTools = store.getDevTools();
    const trackSpy = vi.spyOn(devTools, 'trackStateChange');

    store.setSilently(testAtom, 777);

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('should work with writable atoms', () => {
    const baseAtom = atom(0, 'base');
    const writableAtom = atom(
      (get) => get(baseAtom),
      (get, set, value: number) => {
        set(baseAtom, value * 2);
      },
      'writable'
    );

    const baseSubscriber = vi.fn();
    store.subscribe(baseAtom, baseSubscriber);

    store.setSilently(writableAtom, 10);

    expect(store.get(baseAtom)).toBe(20);
    expect(baseSubscriber).not.toHaveBeenCalled();
  });

  it('should handle computed atoms correctly', () => {
    const computedAtom = atom((get) => get(testAtom) * 2, 'computed');

    store.setSilently(testAtom, 21);

    // Computed should still work when accessed
    expect(store.get(computedAtom)).toBe(42);
  });

  it('should support custom context metadata', () => {
    const onSetHook = vi.fn();
    
    store.applyPlugin(() => ({
      onSet: (atom, value) => {
        // Hook can still inspect context if needed
        onSetHook(atom, value);
        return value;
      },
    }));

    store.set(testAtom, 123, {
      silent: false,
      source: 'test-case',
      metadata: { foo: 'bar' },
    });

    expect(onSetHook).toHaveBeenCalled();
  });
});
```

---

## 📚 Edge Cases

### 1. Writable Atoms with Silent Context

```typescript
// Context должен передаваться через write function
const writableAtom = atom(
  (get) => get(baseAtom),
  (get, set, value: number) => {
    // set здесь должен иметь доступ к context
    set(baseAtom, value);
  }
);

store.setSilently(writableAtom, 10);
```

**Решение:** Setter в write function должен принимать context:

```typescript
private createSetter(get: Getter): Setter {
  return <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    context?: AtomContext
  ): void => {
    this.set(atom, update, context);
  };
}
```

### 2. Computed Atoms

```typescript
const computed = atom((get) => get(testAtom) * 2);

store.setSilently(testAtom, 10);
// Computed НЕ пересчитается автоматически
// Но при get() вычислится с новым значением
expect(store.get(computed)).toBe(20); // ✅ OK
```

### 3. Multiple Silent Updates

```typescript
store.setSilently(atom1, 1);
store.setSilently(atom2, 2);
store.setSilently(atom3, 3);

// Все updates прошли, но subscribers НЕ вызывались
expect(store.get(atom1)).toBe(1);
expect(store.get(atom2)).toBe(2);
expect(store.get(atom3)).toBe(3);
```

---

## 📚 Files to Create/Modify

### Modified Files
1. `packages/core/src/store/StoreImpl.ts`
   - Update `set()` signature with context
   - Add `setSilently()` method
   - Update `createSetter()` to pass context

2. `packages/core/src/types.ts`
   - Update `Store` interface
   - Update `Setter` type

### New Files
3. `packages/core/src/store/__tests__/silent-set.test.ts`
   - Comprehensive test suite

---

## ✅ Verification Checklist

- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New test suite passes (15+ tests)
- [ ] Silent set does NOT notify subscribers
- [ ] Silent set does NOT trigger hooks
- [ ] Silent set does NOT track in DevTools
- [ ] State updates correctly
- [ ] Works with writable atoms
- [ ] Works with computed atoms
- [ ] JSDoc updated

---

## 📝 Notes

- This is a **critical enabler** for Phase 10 (Time Travel Suppression)
- Keep performance overhead minimal (<1%)
- Consider adding performance benchmark
- Document this feature clearly for users

---

**Created:** 2026-03-24
**Task Owner:** Unassigned
**Dependencies:** SR-001 (IReactiveValue), SR-004 (AtomContext)
**Required by:** Phase 10 TT-002, TT-003

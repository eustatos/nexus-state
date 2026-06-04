# SR-002: Implement StoreBasedReactive

## 🎯 Task Overview

**Priority:** 🔴 CRITICAL (P0)
**Estimated Time:** 4-6 hours
**Status:** ⬜ Not Started
**Assignee:** Unassigned

---

## 📋 Description

Реализовать `StoreBasedReactive` класс, который предоставляет `IReactiveValue` интерфейс поверх существующего Store. Это текущая реализация reactive backend (2026-2027) до миграции на Signals.

---

## 🎯 Acceptance Criteria

- [ ] `StoreBasedReactive` класс создан
- [ ] Реализует `IReactiveValue<T>` интерфейс
- [ ] `getValue()` делегирует в `store.get()`
- [ ] `setValue()` корректно обрабатывает `AtomContext`
- [ ] `subscribe()` работает через `store.subscribe()`
- [ ] Поддерживает writable atoms
- [ ] Unit tests покрывают все методы (90%+)
- [ ] Integration tests с Store

---

## 📝 Implementation Guide

### Step 1: Create StoreBasedReactive Class

```typescript
// packages/core/src/reactive/StoreBasedReactive.ts

import type { Atom, Store } from '../types';
import type { IReactiveValue, AtomContext, Unsubscribe } from './types';
import { BaseReactive } from './BaseReactive';

/**
 * Store-based reactive implementation
 * 
 * Provides IReactiveValue interface over existing Store infrastructure.
 * This is the current implementation (2026-2027) before TC39 Signals migration.
 * 
 * @template T The type of value
 * 
 * @example
 * ```typescript
 * const store = createStore();
 * const atom = atom(0, 'count');
 * const reactive = new StoreBasedReactive(store, atom);
 * 
 * reactive.setValue(10);
 * console.log(reactive.getValue()); // 10
 * ```
 */
export class StoreBasedReactive<T> extends BaseReactive<T> {
  constructor(
    private store: Store,
    private atom: Atom<T>
  ) {
    super();
  }

  /**
   * Get current value from store
   * @returns Current atom value
   */
  getValue(): T {
    return this.store.get(this.atom);
  }

  /**
   * Set new value with optional context
   * @param value New value
   * @param context Optional operation metadata
   */
  setValue(value: T, context?: AtomContext): void {
    // Check if store supports context parameter
    if (typeof (this.store as any).set === 'function') {
      const setMethod = (this.store as any).set;
      
      // Try to pass context (Phase 11 SR-006 feature)
      try {
        setMethod.call(this.store, this.atom, value, context);
      } catch (error) {
        // Fallback: call without context for older Store versions
        if (context?.silent) {
          console.warn(
            '[StoreBasedReactive] Store does not support silent context, falling back to normal set'
          );
        }
        this.store.set(this.atom, value);
      }
    } else {
      this.store.set(this.atom, value);
    }
  }

  /**
   * Subscribe to value changes
   * @param fn Callback invoked on changes
   * @returns Unsubscribe function
   */
  subscribe(fn: (value: T) => void): Unsubscribe {
    return this.store.subscribe(this.atom, fn);
  }

  /**
   * Get the underlying store
   * @internal For testing and debugging
   */
  getStore(): Store {
    return this.store;
  }

  /**
   * Get the underlying atom
   * @internal For testing and debugging
   */
  getAtom(): Atom<T> {
    return this.atom;
  }
}
```

### Step 2: Create Factory Function

```typescript
// packages/core/src/reactive/factory.ts

import type { Atom, Store } from '../types';
import type { IReactiveValue } from './types';
import { StoreBasedReactive } from './StoreBasedReactive';
import { REACTIVE_CONFIG } from './config';

/**
 * Create reactive value for an atom
 * 
 * Factory function that chooses backend based on configuration.
 * Currently always returns StoreBasedReactive (Signals not ready yet).
 * 
 * @param store Store instance
 * @param atom Atom to wrap
 * @returns Reactive value implementation
 * 
 * @example
 * ```typescript
 * const store = createStore();
 * const atom = atom(0, 'count');
 * const reactive = createReactiveValue(store, atom);
 * ```
 */
export function createReactiveValue<T>(
  store: Store,
  atom: Atom<T>
): IReactiveValue<T> {
  // Future: Check REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND
  // For now, always use Store-based implementation
  
  if (REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND) {
    // TODO: SignalBasedReactive (SR-003)
    console.warn(
      '[createReactiveValue] Signal backend not implemented yet, falling back to Store'
    );
  }

  return new StoreBasedReactive(store, atom);
}
```

### Step 3: Create Config

```typescript
// packages/core/src/reactive/config.ts

/**
 * Reactive backend configuration
 */
export const REACTIVE_CONFIG = {
  /**
   * Enable TC39 Signal-based backend
   * @default false (not implemented yet)
   */
  ENABLE_SIGNAL_BACKEND: false,

  /**
   * Percentage of users to enable Signal backend (A/B testing)
   * @default 0 (disabled)
   */
  SIGNAL_BACKEND_PERCENTAGE: 0,

  /**
   * Fallback to Store if Signal backend fails
   * @default true
   */
  FALLBACK_TO_STORE: true,
};
```

### Step 4: Export from Index

```typescript
// packages/core/src/reactive/index.ts

export type { IReactiveValue, AtomContext, Unsubscribe } from './types';
export { BaseReactive } from './BaseReactive';
export { StoreBasedReactive } from './StoreBasedReactive';
export { createReactiveValue } from './factory';
export { REACTIVE_CONFIG } from './config';
```

---

## 🧪 Test Requirements

```typescript
// packages/core/src/reactive/__tests__/StoreBasedReactive.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { StoreBasedReactive } from '../StoreBasedReactive';

describe('SR-002: StoreBasedReactive', () => {
  let store: ReturnType<typeof createStore>;
  let testAtom: ReturnType<typeof atom>;
  let reactive: StoreBasedReactive<number>;

  beforeEach(() => {
    store = createStore();
    testAtom = atom(42, 'test');
    reactive = new StoreBasedReactive(store, testAtom);
  });

  describe('getValue()', () => {
    it('should get value from store', () => {
      expect(reactive.getValue()).toBe(42);
    });

    it('should reflect store changes', () => {
      store.set(testAtom, 100);
      expect(reactive.getValue()).toBe(100);
    });

    it('should work with computed atoms', () => {
      const baseAtom = atom(10, 'base');
      const computedAtom = atom((get) => get(baseAtom) * 2, 'computed');
      const computedReactive = new StoreBasedReactive(store, computedAtom);

      expect(computedReactive.getValue()).toBe(20);

      store.set(baseAtom, 20);
      expect(computedReactive.getValue()).toBe(40);
    });
  });

  describe('setValue()', () => {
    it('should set value in store', () => {
      reactive.setValue(999);
      expect(store.get(testAtom)).toBe(999);
    });

    it('should notify subscribers', () => {
      const subscriber = vi.fn();
      reactive.subscribe(subscriber);

      reactive.setValue(123);
      expect(subscriber).toHaveBeenCalledWith(123);
    });

    it('should handle silent context if store supports it', () => {
      const subscriber = vi.fn();
      reactive.subscribe(subscriber);

      // Mock setSilently support
      (store as any).setSilently = vi.fn((atom, value) => {
        (store as any).getStateManager().setValue(atom, value);
      });

      reactive.setValue(456, { silent: true });

      // Subscriber should NOT be called (if store supports silent)
      if (typeof (store as any).setSilently === 'function') {
        expect(subscriber).not.toHaveBeenCalled();
      }

      expect(store.get(testAtom)).toBe(456);
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

      const writableReactive = new StoreBasedReactive(store, writableAtom);
      writableReactive.setValue(10);

      expect(store.get(baseAtom)).toBe(20);
    });
  });

  describe('subscribe()', () => {
    it('should subscribe to store changes', () => {
      const subscriber = vi.fn();
      const unsubscribe = reactive.subscribe(subscriber);

      reactive.setValue(777);
      expect(subscriber).toHaveBeenCalledWith(777);

      unsubscribe();
      reactive.setValue(888);
      expect(subscriber).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle multiple subscribers', () => {
      const sub1 = vi.fn();
      const sub2 = vi.fn();
      const sub3 = vi.fn();

      reactive.subscribe(sub1);
      reactive.subscribe(sub2);
      reactive.subscribe(sub3);

      reactive.setValue(111);

      expect(sub1).toHaveBeenCalledWith(111);
      expect(sub2).toHaveBeenCalledWith(111);
      expect(sub3).toHaveBeenCalledWith(111);
    });

    it('should return working unsubscribe function', () => {
      const subscriber = vi.fn();
      const unsubscribe = reactive.subscribe(subscriber);

      expect(typeof unsubscribe).toBe('function');

      reactive.setValue(1);
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();

      reactive.setValue(2);
      expect(subscriber).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('integration with Store', () => {
    it('should work seamlessly with direct store access', () => {
      // Set via reactive
      reactive.setValue(100);
      expect(store.get(testAtom)).toBe(100);

      // Set via store
      store.set(testAtom, 200);
      expect(reactive.getValue()).toBe(200);
    });

    it('should share subscribers with store', () => {
      const reactiveSubscriber = vi.fn();
      const storeSubscriber = vi.fn();

      reactive.subscribe(reactiveSubscriber);
      store.subscribe(testAtom, storeSubscriber);

      reactive.setValue(333);

      expect(reactiveSubscriber).toHaveBeenCalledWith(333);
      expect(storeSubscriber).toHaveBeenCalledWith(333);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid updates', () => {
      for (let i = 0; i < 100; i++) {
        reactive.setValue(i);
      }
      expect(reactive.getValue()).toBe(99);
    });

    it('should handle same value updates', () => {
      const subscriber = vi.fn();
      reactive.subscribe(subscriber);

      reactive.setValue(42); // Same as initial
      reactive.setValue(42);
      reactive.setValue(42);

      // Should still notify (Store behavior)
      expect(subscriber).toHaveBeenCalledTimes(3);
    });

    it('should handle undefined values', () => {
      const undefinedAtom = atom<number | undefined>(undefined, 'undefined');
      const undefinedReactive = new StoreBasedReactive(store, undefinedAtom);

      expect(undefinedReactive.getValue()).toBeUndefined();

      undefinedReactive.setValue(42);
      expect(undefinedReactive.getValue()).toBe(42);

      undefinedReactive.setValue(undefined);
      expect(undefinedReactive.getValue()).toBeUndefined();
    });
  });
});
```

---

## 📚 Files to Create

1. `packages/core/src/reactive/StoreBasedReactive.ts`
2. `packages/core/src/reactive/factory.ts`
3. `packages/core/src/reactive/config.ts`
4. `packages/core/src/reactive/__tests__/StoreBasedReactive.test.ts`

## 📚 Files to Modify

1. `packages/core/src/reactive/index.ts` - Add exports

---

## ✅ Verification Checklist

- [ ] Code compiles without errors
- [ ] All tests pass (20+ tests)
- [ ] 90%+ code coverage
- [ ] Works with primitive atoms
- [ ] Works with computed atoms
- [ ] Works with writable atoms
- [ ] subscribe() works correctly
- [ ] Integration with Store verified
- [ ] JSDoc documentation complete

---

## 📝 Notes

- This is the **current implementation** (2026-2027)
- Will be replaced by SignalBasedReactive in future
- Must maintain backward compatibility with Store
- Performance should match direct Store access

---

**Created:** 2026-03-24
**Task Owner:** Unassigned
**Dependencies:** SR-001 (IReactiveValue)
**Blocks:** SR-007 (Refactor Store)

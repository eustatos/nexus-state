# SR-004: Add AtomContext for Metadata

## 🎯 Task Overview

**Priority:** 🔴 CRITICAL (P0)
**Estimated Time:** 4-5 hours
**Status:** ⬜ Not Started
**Assignee:** Unassigned

---

## 📋 Description

Интегрировать `AtomContext` (определён в SR-001) во все layers Store, чтобы metadata (silent, timeTravel, source) могла передаваться через цепочку вызовов: user code → Store → StateManager → plugins.

---

## 🎯 Acceptance Criteria

- [ ] `AtomContext` определён в SR-001 ✅
- [ ] Store.set() принимает опциональный `context`
- [ ] Setter type обновлён с `context` параметром
- [ ] Context передаётся через writable atoms
- [ ] Context доступен в plugin hooks
- [ ] Backward compatibility сохранена (context опционален)
- [ ] Tests покрывают передачу context

---

## 📝 Implementation Guide

### Step 1: Update Setter Type

```typescript
// packages/core/src/types.ts

import type { AtomContext } from './reactive';

/**
 * Function to set the value of an atom
 * @template Value The type of value the atom holds
 * @param atom The atom to set the value for
 * @param update The new value or a function to compute the new value
 * @param context Optional operation metadata
 */
export type Setter = <Value>(
  atom: Atom<Value>,
  update: Value | ((prev: Value) => Value),
  context?: AtomContext
) => void;
```

### Step 2: Update Store Interface

```typescript
// packages/core/src/types.ts

export interface Store {
  // ... existing methods ...

  /**
   * Set the value of an atom with optional context
   */
  set: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    context?: AtomContext
  ) => void;

  /**
   * Set atom value with metadata for DevTools
   */
  setWithMetadata?: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    metadata?: ActionMetadata
  ) => void;
}
```

### Step 3: Update WritableAtom Type

```typescript
// packages/core/src/types.ts

/**
 * Writable atom that can both read and write values
 * @template Value The type of value the atom holds
 */
export interface WritableAtom<Value> extends BaseAtom<Value> {
  readonly type: 'writable';
  
  /**
   * Function to compute the atom's value based on other atoms
   */
  read: (get: Getter) => Value;
  
  /**
   * Function to write to the atom
   * @param get Getter to read other atoms
   * @param set Setter to update atoms (now with context support)
   * @param value New value to write
   */
  write: (get: Getter, set: Setter, value: Value) => void;
}
```

### Step 4: Update Plugin Hooks Interface

```typescript
// packages/core/src/types.ts

export interface PluginHooks {
  /**
   * Hook called before a value is set
   * @param atom The atom being set
   * @param value The new value
   * @param context Optional operation metadata
   * @returns Modified value or void
   */
  onSet?: <T>(atom: Atom<T>, value: T, context?: AtomContext) => T | void;

  /**
   * Hook called after a value is set
   * @param atom The atom that was set
   * @param value The final value
   * @param context Optional operation metadata
   */
  afterSet?: <T>(atom: Atom<T>, value: T, context?: AtomContext) => void;

  /**
   * Hook called when a value is read
   * @param atom The atom being read
   * @param value The current value
   * @returns Modified value or original
   */
  onGet?: <T>(atom: Atom<T>, value: T) => T;
}
```

### Step 5: Update StoreImpl.set()

```typescript
// packages/core/src/store/StoreImpl.ts

set<Value>(
  atom: Atom<Value>,
  update: Value | ((prev: Value) => Value),
  context?: AtomContext
): void {
  logger.log(
    '[StoreImpl] Setting atom:',
    atom.name || 'unnamed',
    'context:',
    context
  );

  // Register atom
  const storesMap = atomRegistry.getStoresMap();
  for (const registry of storesMap.values()) {
    if (!registry.atoms.has(atom.id)) {
      registry.atoms.add(atom.id);
    }
  }

  // For writable atoms, pass context through
  if (isWritableAtom(atom) && atom.write) {
    const write = atom.write;
    const storeSetter: Setter = <V>(
      a: Atom<V>,
      u: V | ((prev: V) => V),
      ctx?: AtomContext
    ) => {
      // Merge contexts (child context takes precedence)
      const mergedContext = ctx ? { ...context, ...ctx } : context;
      this.set(a, u, mergedContext);
    };
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

  // Check if silent (from SR-006)
  if (context?.silent) {
    // Silent update - no side effects
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
    return;
  }

  // Normal update with side effects
  // Pass context to plugin hooks
  const processedValue = this.pluginSystem.executeOnSetHooks(
    atom,
    newValue,
    context
  );

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

  // Execute afterSet hooks with context
  this.pluginSystem.executeAfterSetHooks(atom, processedValue, context);

  // Track for DevTools (pass source from context if available)
  if (context?.source) {
    this.devTools.trackStateChange(atom, processedValue, {
      type: 'set',
      source: context.source,
      timestamp: Date.now(),
    });
  } else {
    this.devTools.trackStateChange(atom, processedValue);
  }
}
```

### Step 6: Update createSetter

```typescript
// packages/core/src/store/StoreImpl.ts

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

### Step 7: Update PluginSystem

```typescript
// packages/core/src/store/PluginSystem.ts

executeOnSetHooks<Value>(
  atom: Atom<Value>,
  value: Value,
  context?: AtomContext
): Value {
  let processedValue = value;

  for (const hook of this.onSetHooks) {
    const result = hook(atom, processedValue, context);
    if (result !== undefined) {
      processedValue = result;
    }
  }

  return processedValue;
}

executeAfterSetHooks<Value>(
  atom: Atom<Value>,
  value: Value,
  context?: AtomContext
): void {
  for (const hook of this.afterSetHooks) {
    hook(atom, value, context);
  }
}
```

---

## 🧪 Test Requirements

```typescript
// packages/core/src/store/__tests__/atom-context.test.ts

import { describe, it, expect, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import type { AtomContext } from '@nexus-state/core';

describe('SR-004: AtomContext propagation', () => {
  it('should pass context through set()', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');

    const context: AtomContext = {
      silent: false,
      source: 'test-case',
      metadata: { userId: 123 },
    };

    // Context should not throw
    expect(() => {
      store.set(testAtom, 10, context);
    }).not.toThrow();
  });

  it('should make context available in plugin hooks', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');

    let capturedContext: AtomContext | undefined;

    store.applyPlugin(() => ({
      onSet: (atom, value, context) => {
        capturedContext = context;
        return value;
      },
    }));

    const myContext: AtomContext = {
      source: 'user-action',
      metadata: { action: 'increment' },
    };

    store.set(testAtom, 10, myContext);

    expect(capturedContext).toBeDefined();
    expect(capturedContext?.source).toBe('user-action');
    expect(capturedContext?.metadata?.action).toBe('increment');
  });

  it('should propagate context through writable atoms', () => {
    const store = createStore();
    const baseAtom = atom(0, 'base');

    let writableContext: AtomContext | undefined;

    const writableAtom = atom(
      (get) => get(baseAtom),
      (get, set, value: number) => {
        // Capture context in write function
        // Note: context is passed through set()
        set(baseAtom, value * 2);
      },
      'writable'
    );

    const context: AtomContext = {
      source: 'writable-test',
    };

    store.set(writableAtom, 10, context);

    expect(store.get(baseAtom)).toBe(20);
  });

  it('should support context merging in nested writes', () => {
    const store = createStore();
    const atom1 = atom(0, 'atom1');
    const atom2 = atom(0, 'atom2');

    const contexts: AtomContext[] = [];

    store.applyPlugin(() => ({
      onSet: (atom, value, context) => {
        if (context) {
          contexts.push(context);
        }
        return value;
      },
    }));

    const writableAtom = atom(
      (get) => get(atom1) + get(atom2),
      (get, set, value: number) => {
        set(atom1, value, { source: 'nested-write' });
        set(atom2, value * 2);
      },
      'writable'
    );

    store.set(writableAtom, 10, { source: 'parent-write' });

    expect(contexts.length).toBeGreaterThan(0);
    expect(contexts.some((c) => c.source === 'nested-write')).toBe(true);
  });

  it('should handle silent context', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);

    store.set(testAtom, 10, { silent: true });

    expect(subscriber).not.toHaveBeenCalled();
    expect(store.get(testAtom)).toBe(10);
  });

  it('should handle timeTravel flag in context', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');

    let timeTravelFlag: boolean | undefined;

    store.applyPlugin(() => ({
      onSet: (atom, value, context) => {
        timeTravelFlag = context?.timeTravel;
        return value;
      },
    }));

    store.set(testAtom, 10, { timeTravel: true });

    expect(timeTravelFlag).toBe(true);
  });

  it('should maintain backward compatibility without context', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');

    // Old API still works
    expect(() => {
      store.set(testAtom, 10);
    }).not.toThrow();

    expect(store.get(testAtom)).toBe(10);
  });
});
```

---

## 📚 Files to Create

1. `packages/core/src/store/__tests__/atom-context.test.ts`

## 📚 Files to Modify

1. `packages/core/src/types.ts`
   - Update `Setter` type
   - Update `Store` interface
   - Update `WritableAtom` interface
   - Update `PluginHooks` interface

2. `packages/core/src/store/StoreImpl.ts`
   - Update `set()` method
   - Update `createSetter()` method

3. `packages/core/src/store/PluginSystem.ts`
   - Update `executeOnSetHooks()`
   - Update `executeAfterSetHooks()`

---

## ✅ Verification Checklist

- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New context tests pass
- [ ] Context propagates through writable atoms
- [ ] Context available in plugin hooks
- [ ] Silent context works
- [ ] Backward compatibility maintained
- [ ] TypeScript types correct

---

## 📝 Notes

- This enables **SR-006 (setSilently)**
- Critical for **Phase 10 (time-travel suppression)**
- Context is **optional** for backward compatibility
- Plugin authors can use context for advanced features

---

**Created:** 2026-03-24
**Task Owner:** Unassigned
**Dependencies:** SR-001 (IReactiveValue types)
**Blocks:** SR-006 (Silent set), Phase 10

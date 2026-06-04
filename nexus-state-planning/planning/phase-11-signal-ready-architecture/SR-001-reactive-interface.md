# SR-001: Create IReactiveValue Abstraction

## 🎯 Task Overview

**Priority:** 🔴 CRITICAL (P0)
**Estimated Time:** 3-4 hours
**Status:** ⬜ Not Started
**Assignee:** Unassigned

---

## 📋 Description

Создать core интерфейс `IReactiveValue<T>`, который абстрагирует reactive state независимо от backend реализации (Store или Signal). Этот интерфейс позволит плавно мигрировать на TC39 Native Signals в будущем без breaking changes.

---

## 🎯 Acceptance Criteria

- [ ] `IReactiveValue<T>` интерфейс создан
- [ ] `AtomContext` тип для metadata определён
- [ ] `Unsubscribe` тип экспортирован
- [ ] TypeScript строгие типы работают корректно
- [ ] JSDoc документация добавлена
- [ ] Файлы экспортируются из `@nexus-state/core`
- [ ] Компилируется без ошибок

---

## 📝 Implementation Guide

### Step 1: Create Types File

```typescript
// packages/core/src/reactive/types.ts

/**
 * Unsubscribe function returned from subscribe
 */
export type Unsubscribe = () => void;

/**
 * Context metadata for reactive operations
 */
export interface AtomContext {
  /**
   * Suppress notifications/effects during update
   * Used for time-travel, undo/redo, silent operations
   */
  silent?: boolean;

  /**
   * Indicates this is a time-travel operation
   * Effects with suppressDuringTravel will be skipped
   */
  timeTravel?: boolean;

  /**
   * Source of the change (for debugging)
   * @example 'user-action', 'api-response', 'time-travel'
   */
  source?: string;

  /**
   * Additional custom metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Core reactive value abstraction
 * 
 * This interface allows switching between Store-based and Signal-based
 * implementations without breaking changes.
 * 
 * @template T The type of value held by this reactive
 * 
 * @example
 * ```typescript
 * const reactive: IReactiveValue<number> = createReactiveValue(store, atom);
 * 
 * // Get value
 * const value = reactive.getValue();
 * 
 * // Set value with context
 * reactive.setValue(10, { silent: true });
 * 
 * // Subscribe to changes
 * const unsubscribe = reactive.subscribe((value) => {
 *   console.log('Value changed:', value);
 * });
 * ```
 */
export interface IReactiveValue<T> {
  /**
   * Get current value
   * @returns Current value of the reactive
   */
  getValue(): T;

  /**
   * Set new value with optional context
   * @param value New value or updater function
   * @param context Optional metadata for the operation
   */
  setValue(value: T, context?: AtomContext): void;

  /**
   * Subscribe to value changes
   * @param fn Callback invoked when value changes
   * @returns Unsubscribe function
   */
  subscribe(fn: (value: T) => void): Unsubscribe;
}
```

### Step 2: Create Base Reactive Class (Optional)

```typescript
// packages/core/src/reactive/BaseReactive.ts

import type { IReactiveValue, Unsubscribe, AtomContext } from './types';

/**
 * Abstract base class for reactive implementations
 * Provides common utilities and structure
 */
export abstract class BaseReactive<T> implements IReactiveValue<T> {
  /**
   * Get current value (must be implemented by subclasses)
   */
  abstract getValue(): T;

  /**
   * Set new value (must be implemented by subclasses)
   */
  abstract setValue(value: T, context?: AtomContext): void;

  /**
   * Subscribe to changes (must be implemented by subclasses)
   */
  abstract subscribe(fn: (value: T) => void): Unsubscribe;

  /**
   * Helper: Check if context has silent flag
   */
  protected isSilent(context?: AtomContext): boolean {
    return context?.silent === true;
  }

  /**
   * Helper: Check if context is time-travel operation
   */
  protected isTimeTravel(context?: AtomContext): boolean {
    return context?.timeTravel === true;
  }
}
```

### Step 3: Export from Core

```typescript
// packages/core/src/reactive/index.ts

export type { IReactiveValue, AtomContext, Unsubscribe } from './types';
export { BaseReactive } from './BaseReactive';
```

```typescript
// packages/core/src/index.ts (add to existing exports)

// Reactive abstractions
export type {
  IReactiveValue,
  AtomContext,
  Unsubscribe,
} from './reactive';
export { BaseReactive } from './reactive';
```

### Step 4: Update Core Types

```typescript
// packages/core/src/types.ts (add to existing types)

import type { AtomContext } from './reactive';

export interface Store {
  // ... existing methods ...

  /**
   * Set atom value with context metadata
   * @param atom Atom to update
   * @param update New value or updater function
   * @param context Optional operation metadata
   */
  set: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    context?: AtomContext
  ) => void;

  /**
   * Set atom value silently (without notifications)
   * @param atom Atom to update
   * @param update New value or updater function
   */
  setSilently?: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ) => void;
}
```

---

## 🧪 Test Requirements

```typescript
// packages/core/src/reactive/__tests__/types.test.ts

import { describe, it, expect } from 'vitest';
import type { IReactiveValue, AtomContext } from '../types';

describe('SR-001: IReactiveValue types', () => {
  it('should accept valid reactive implementation', () => {
    const mockReactive: IReactiveValue<number> = {
      getValue: () => 0,
      setValue: (value: number, context?: AtomContext) => {},
      subscribe: (fn: (value: number) => void) => () => {},
    };

    expect(mockReactive.getValue()).toBe(0);
  });

  it('should enforce type safety', () => {
    const reactive: IReactiveValue<string> = {
      getValue: () => 'test',
      setValue: (value: string) => {},
      subscribe: (fn) => () => {},
    };

    // @ts-expect-error - Wrong type
    // reactive.setValue(123);
  });

  it('should handle AtomContext correctly', () => {
    const context: AtomContext = {
      silent: true,
      timeTravel: false,
      source: 'test',
      metadata: { foo: 'bar' },
    };

    expect(context.silent).toBe(true);
    expect(context.metadata?.foo).toBe('bar');
  });
});
```

---

## 📚 Files to Create

1. `packages/core/src/reactive/types.ts`
2. `packages/core/src/reactive/BaseReactive.ts`
3. `packages/core/src/reactive/index.ts`
4. `packages/core/src/reactive/__tests__/types.test.ts`

## 📚 Files to Modify

1. `packages/core/src/index.ts` - Add exports
2. `packages/core/src/types.ts` - Update Store interface

---

## ✅ Verification Checklist

- [ ] TypeScript compiles without errors
- [ ] All types exported correctly
- [ ] JSDoc comments complete
- [ ] Test coverage for type checking
- [ ] No breaking changes to public API
- [ ] Documentation updated

---

**Created:** 2026-03-24
**Task Owner:** Unassigned
**Blocks:** SR-002, SR-003, SR-004

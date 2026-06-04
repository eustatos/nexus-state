# SR-003: Create SignalBasedReactive Stub

## 🎯 Task Overview

**Priority:** 🟡 HIGH (P1)
**Estimated Time:** 2-3 hours
**Status:** ⬜ Not Started
**Assignee:** Unassigned

---

## 📋 Description

Создать заглушку (stub) для `SignalBasedReactive` класса, который будет реализован позже при миграции на TC39 Native Signals (2027-2028). Заглушка должна выбрасывать ошибки с понятными сообщениями и содержать TODO комментарии для будущей реализации.

---

## 🎯 Acceptance Criteria

- [ ] `SignalBasedReactive` класс создан
- [ ] Реализует `IReactiveValue<T>` интерфейс
- [ ] Все методы выбрасывают `NotImplementedError`
- [ ] Конструктор проверяет наличие `Signal` API
- [ ] TODO комментарии для будущей реализации
- [ ] JSDoc с планами миграции
- [ ] Компилируется без ошибок

---

## 📝 Implementation Guide

### Step 1: Create SignalBasedReactive Stub

```typescript
// packages/core/src/reactive/SignalBasedReactive.ts

import type { IReactiveValue, AtomContext, Unsubscribe } from './types';
import { BaseReactive } from './BaseReactive';

/**
 * Signal-based reactive implementation (STUB)
 * 
 * This is a placeholder for future TC39 Native Signals implementation.
 * Will be fully implemented when Signals reach Stage 3-4 (estimated 2027-2028).
 * 
 * @see https://github.com/tc39/proposal-signals
 * 
 * @template T The type of value
 * 
 * @example Future usage (not yet implemented):
 * ```typescript
 * const reactive = new SignalBasedReactive(0);
 * reactive.setValue(10);
 * console.log(reactive.getValue()); // 10
 * ```
 */
export class SignalBasedReactive<T> extends BaseReactive<T> {
  // @ts-expect-error - Will be implemented later
  private signal: any; // Signal.State<T> when available

  // @ts-expect-error - Will be implemented later
  private watcher?: any; // Signal.subtle.Watcher when available

  /**
   * Create Signal-based reactive value
   * 
   * @param initialValue Initial value
   * @throws {NotImplementedError} Signals not available yet
   */
  constructor(initialValue: T) {
    super();

    // Check if native Signals are available
    if (typeof (globalThis as any).Signal === 'undefined') {
      throw new NotImplementedError(
        'TC39 Native Signals not available. SignalBasedReactive will be implemented when Signals reach Stage 3-4 (estimated 2027-2028).'
      );
    }

    // TODO (Phase 11 → Signals Migration):
    // this.signal = new Signal.State(initialValue);

    throw new NotImplementedError('SignalBasedReactive not implemented yet');
  }

  /**
   * Get current value
   * @throws {NotImplementedError}
   */
  getValue(): T {
    // TODO (Phase 11 → Signals Migration):
    // return this.signal.get();

    throw new NotImplementedError('SignalBasedReactive.getValue not implemented');
  }

  /**
   * Set new value with optional context
   * @param value New value
   * @param context Optional operation metadata
   * @throws {NotImplementedError}
   */
  setValue(value: T, context?: AtomContext): void {
    // TODO (Phase 11 → Signals Migration):
    // Handle silent context:
    // if (context?.silent) {
    //   // Mechanism for silent updates with Signals
    //   // May require Signal.subtle.Watcher pause/resume
    //   // or custom batching mechanism
    // }
    // this.signal.set(value);

    throw new NotImplementedError('SignalBasedReactive.setValue not implemented');
  }

  /**
   * Subscribe to value changes
   * @param fn Callback invoked on changes
   * @returns Unsubscribe function
   * @throws {NotImplementedError}
   */
  subscribe(fn: (value: T) => void): Unsubscribe {
    // TODO (Phase 11 → Signals Migration):
    // this.watcher = new Signal.subtle.Watcher(() => {
    //   fn(this.getValue());
    // });
    // this.watcher.watch(this.signal);
    // return () => this.watcher!.unwatch(this.signal);

    throw new NotImplementedError('SignalBasedReactive.subscribe not implemented');
  }
}

/**
 * Error thrown when trying to use unimplemented Signal features
 */
export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}
```

### Step 2: Add to Factory (with Feature Flag)

```typescript
// packages/core/src/reactive/factory.ts (update)

import { SignalBasedReactive, NotImplementedError } from './SignalBasedReactive';

export function createReactiveValue<T>(
  store: Store,
  atom: Atom<T>
): IReactiveValue<T> {
  // Check feature flag
  if (REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND) {
    try {
      // Check if Signals are available
      if (typeof (globalThis as any).Signal !== 'undefined') {
        // A/B testing percentage
        const shouldUseSignals =
          Math.random() * 100 < REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE;

        if (shouldUseSignals) {
          const initialValue = store.get(atom);
          return new SignalBasedReactive(initialValue);
        }
      }
    } catch (error) {
      if (error instanceof NotImplementedError) {
        console.warn('[createReactiveValue]', error.message);
      }

      if (REACTIVE_CONFIG.FALLBACK_TO_STORE) {
        console.warn('[createReactiveValue] Falling back to StoreBasedReactive');
      } else {
        throw error;
      }
    }
  }

  // Default: Store-based implementation
  return new StoreBasedReactive(store, atom);
}
```

### Step 3: Export

```typescript
// packages/core/src/reactive/index.ts (add)

export { SignalBasedReactive, NotImplementedError } from './SignalBasedReactive';
```

---

## 🧪 Test Requirements

```typescript
// packages/core/src/reactive/__tests__/SignalBasedReactive.test.ts

import { describe, it, expect } from 'vitest';
import { SignalBasedReactive, NotImplementedError } from '../SignalBasedReactive';

describe('SR-003: SignalBasedReactive stub', () => {
  it('should throw NotImplementedError on construction', () => {
    expect(() => new SignalBasedReactive(0)).toThrow(NotImplementedError);
    expect(() => new SignalBasedReactive(0)).toThrow(/not available/);
  });

  it('should have correct error message', () => {
    try {
      new SignalBasedReactive(42);
    } catch (error) {
      expect(error).toBeInstanceOf(NotImplementedError);
      expect((error as Error).message).toContain('TC39 Native Signals');
      expect((error as Error).message).toContain('2027-2028');
    }
  });

  it('should be properly typed', () => {
    // Type checking only - won't run
    if (false) {
      const reactive: SignalBasedReactive<number> = new SignalBasedReactive(0);
      const value: number = reactive.getValue();
      reactive.setValue(10);
      const unsubscribe = reactive.subscribe((v) => console.log(v));
    }
  });

  describe('when Signals are available (future)', () => {
    it('should eventually construct without error', () => {
      // This test is for the future when Signals are implemented
      // For now, just document the expected behavior

      // TODO (2027-2028 Migration):
      // const reactive = new SignalBasedReactive(42);
      // expect(reactive.getValue()).toBe(42);
    });
  });
});
```

---

## 📚 Files to Create

1. `packages/core/src/reactive/SignalBasedReactive.ts`
2. `packages/core/src/reactive/__tests__/SignalBasedReactive.test.ts`

## 📚 Files to Modify

1. `packages/core/src/reactive/factory.ts` - Add Signal backend logic
2. `packages/core/src/reactive/index.ts` - Export SignalBasedReactive

---

## 📝 Future Implementation Checklist

When TC39 Signals reach Stage 3-4 (2027-2028), implement:

- [ ] Replace stub with real `Signal.State` usage
- [ ] Implement `getValue()` with `signal.get()`
- [ ] Implement `setValue()` with `signal.set()`
- [ ] Implement `subscribe()` with `Signal.subtle.Watcher`
- [ ] Handle `context.silent` with Watcher pause/resume
- [ ] Add comprehensive tests
- [ ] Performance benchmarks vs StoreBasedReactive
- [ ] Update documentation

---

## ✅ Verification Checklist

- [ ] Code compiles without errors
- [ ] Stub throws NotImplementedError
- [ ] Error messages are clear and helpful
- [ ] TODO comments for future implementation
- [ ] JSDoc with migration timeline
- [ ] Tests verify stub behavior
- [ ] Exported from reactive module

---

## 📝 Notes

- This is a **placeholder** for future implementation
- Real implementation when Signals reach Stage 3-4
- Keep monitoring [TC39 proposal](https://github.com/tc39/proposal-signals)
- Update stub as Signal API evolves

---

**Created:** 2026-03-24
**Task Owner:** Unassigned
**Dependencies:** SR-001 (IReactiveValue)
**Implements:** Future (2027-2028)

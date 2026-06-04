# STAB-013: Add @nexus-state/middleware Tests

## 📋 Task Overview

**Priority:** 🔴 Critical (blocks npm publishing)  
**Estimated Time:** 3-4 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Write comprehensive tests for @nexus-state/middleware package to achieve ≥90% coverage and ensure middleware functionality works correctly with proper type safety.

---

## 📦 Affected Components

**Package:** `@nexus-state/middleware`  
**Files:**
- `packages/middleware/src/index.test.ts` (to create)
- `packages/middleware/index.ts` (may need fixes)
- `packages/middleware/package.json` (update test script)

---

## 🔍 Current State Analysis

```bash
cd packages/middleware
cat package.json | grep test
cat index.ts
```

**Findings:**
- ❌ Test file does not exist
- ❌ Test script shows: `"test": "echo \"No tests yet - TODO: add tests for middleware\""`
- ⚠️ Current implementation modifies `store.set` globally
- ⚠️ Type safety issues in current implementation
- ⚠️ Only works for single atom per store

**Current Implementation Issues:**
```typescript
export function middleware<T>(atom: Atom<T>, config: MiddlewareConfig<T>) {
  return (store: Store) => {
    const originalSet = store.set.bind(store);
    
    // ISSUE: This overwrites set globally for ALL atoms!
    store.set = <Value>(a: Atom<Value>, update: Value | ((prev: Value) => Value)) => {
      if (a.id === (atom as unknown as Atom<Value>).id) {
        // Only for THIS atom
      } else {
        // For other atoms
      }
    };
  };
}
```

---

## ✅ Acceptance Criteria

- [ ] Test file created at `packages/middleware/src/index.test.ts`
- [ ] Tests cover `beforeSet` middleware
- [ ] Tests cover `afterSet` middleware  
- [ ] Tests cover both middlewares together
- [ ] Tests verify middleware only affects target atom
- [ ] Tests verify other atoms unaffected
- [ ] Tests verify type safety
- [ ] Tests verify error handling
- [ ] Implementation fixed if needed
- [ ] Test coverage ≥90%
- [ ] All tests passing
- [ ] package.json test script updated

---

## 📝 Implementation Steps

### Step 1: Analyze and Fix Implementation

**Current problems:**
1. Modifying store.set globally affects all atoms
2. Type casting with `as unknown` loses type safety
3. No way to remove middleware
4. Multiple middlewares will conflict

**Proposed better implementation:**

```typescript
// packages/middleware/index.ts
import { Atom, Store, Plugin } from '@nexus-state/core';

export type MiddlewareConfig<T> = {
  beforeSet?: (atom: Atom<T>, newValue: T, oldValue: T) => T | void;
  afterSet?: (atom: Atom<T>, newValue: T, oldValue: T) => void;
};

export type MiddlewareMap = Map<symbol, MiddlewareConfig<any>>;

/**
 * Create a middleware plugin for specific atoms
 */
export function createMiddleware(): Plugin {
  const middlewares: MiddlewareMap = new Map();

  return {
    apply: (store: Store) => {
      const originalSet = store.set.bind(store);

      store.set = <T>(
        atom: Atom<T>,
        update: T | ((prev: T) => T)
      ) => {
        const config = middlewares.get(atom.id);

        if (!config) {
          // No middleware for this atom, use original
          return originalSet(atom, update);
        }

        // Get current and new values
        const oldValue = store.get(atom);
        let newValue: T;

        if (typeof update === 'function') {
          newValue = (update as (prev: T) => T)(oldValue);
        } else {
          newValue = update;
        }

        // beforeSet middleware
        if (config.beforeSet) {
          const result = config.beforeSet(atom, newValue, oldValue);
          if (result !== undefined) {
            newValue = result;
          }
        }

        // Set the value
        originalSet(atom, newValue);

        // afterSet middleware
        if (config.afterSet) {
          config.afterSet(atom, newValue, oldValue);
        }
      };

      // Return cleanup function
      return () => {
        store.set = originalSet;
      };
    }
  };
}

/**
 * Add middleware for a specific atom
 */
export function withMiddleware<T>(
  atom: Atom<T>,
  config: MiddlewareConfig<T>
): (middlewareMap: MiddlewareMap) => void {
  return (middlewareMap: MiddlewareMap) => {
    middlewareMap.set(atom.id, config);
  };
}
```

**Better approach - return configured plugin:**

```typescript
export function middleware<T>(
  atom: Atom<T>,
  config: MiddlewareConfig<T>
): Plugin {
  return {
    apply: (store: Store) => {
      const originalSet = store.set.bind(store);

      store.set = <Value>(
        a: Atom<Value>,
        update: Value | ((prev: Value) => Value)
      ) => {
        // Check if this is our atom
        if (a.id !== atom.id) {
          return originalSet(a, update);
        }

        // This is our atom, apply middleware
        const oldValue = store.get(a) as T;
        let newValue: Value;

        if (typeof update === 'function') {
          newValue = (update as (prev: Value) => Value)(oldValue as Value);
        } else {
          newValue = update;
        }

        // beforeSet
        if (config.beforeSet) {
          const result = config.beforeSet(
            atom,
            newValue as T,
            oldValue
          );
          if (result !== undefined) {
            newValue = result as Value;
          }
        }

        // Set value
        originalSet(a, newValue);

        // afterSet
        if (config.afterSet) {
          config.afterSet(atom, newValue as T, oldValue);
        }
      };
    }
  };
}
```

### Step 2: Create comprehensive test file

**File:** `packages/middleware/src/index.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { middleware, MiddlewareConfig } from '../index';

describe('@nexus-state/middleware', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('beforeSet middleware', () => {
    it('should execute before value is set', () => {
      const testAtom = atom(0);
      const calls: string[] = [];

      const plugin = middleware(testAtom, {
        beforeSet: () => {
          calls.push('before');
        }
      });

      store.use(plugin);

      store.subscribe(testAtom, () => {
        calls.push('subscriber');
      });

      store.set(testAtom, 5);

      expect(calls).toEqual(['before', 'subscriber']);
    });

    it('should allow transforming the value', () => {
      const testAtom = atom(0);

      const plugin = middleware(testAtom, {
        beforeSet: (atom, newValue) => {
          return newValue * 2;
        }
      });

      store.use(plugin);
      store.set(testAtom, 5);

      expect(store.get(testAtom)).toBe(10);
    });

    it('should receive old and new values', () => {
      const testAtom = atom(10);
      let receivedOld: number | undefined;
      let receivedNew: number | undefined;

      const plugin = middleware(testAtom, {
        beforeSet: (atom, newValue, oldValue) => {
          receivedOld = oldValue;
          receivedNew = newValue;
        }
      });

      store.use(plugin);
      store.set(testAtom, 20);

      expect(receivedOld).toBe(10);
      expect(receivedNew).toBe(20);
    });

    it('should work with function updates', () => {
      const testAtom = atom(5);

      const plugin = middleware(testAtom, {
        beforeSet: (atom, newValue) => {
          return newValue + 1;
        }
      });

      store.use(plugin);
      store.set(testAtom, (prev) => prev * 2);

      // (5 * 2) + 1 = 11
      expect(store.get(testAtom)).toBe(11);
    });

    it('should handle validation', () => {
      const testAtom = atom(0);

      const plugin = middleware(testAtom, {
        beforeSet: (atom, newValue) => {
          // Clamp value between 0 and 100
          return Math.max(0, Math.min(100, newValue));
        }
      });

      store.use(plugin);

      store.set(testAtom, -10);
      expect(store.get(testAtom)).toBe(0);

      store.set(testAtom, 150);
      expect(store.get(testAtom)).toBe(100);

      store.set(testAtom, 50);
      expect(store.get(testAtom)).toBe(50);
    });
  });

  describe('afterSet middleware', () => {
    it('should execute after value is set', () => {
      const testAtom = atom(0);
      const calls: string[] = [];

      const plugin = middleware(testAtom, {
        afterSet: () => {
          calls.push('after');
        }
      });

      store.use(plugin);

      store.subscribe(testAtom, () => {
        calls.push('subscriber');
      });

      store.set(testAtom, 5);

      expect(calls).toEqual(['subscriber', 'after']);
    });

    it('should receive old and new values', () => {
      const testAtom = atom(10);
      let receivedOld: number | undefined;
      let receivedNew: number | undefined;

      const plugin = middleware(testAtom, {
        afterSet: (atom, newValue, oldValue) => {
          receivedOld = oldValue;
          receivedNew = newValue;
        }
      });

      store.use(plugin);
      store.set(testAtom, 20);

      expect(receivedOld).toBe(10);
      expect(receivedNew).toBe(20);
    });

    it('should be able to trigger side effects', () => {
      const testAtom = atom(0);
      const logAtom = atom<string[]>([]);

      const plugin = middleware(testAtom, {
        afterSet: (atom, newValue) => {
          const logs = store.get(logAtom);
          store.set(logAtom, [...logs, `Set to ${newValue}`]);
        }
      });

      store.use(plugin);

      store.set(testAtom, 5);
      store.set(testAtom, 10);

      expect(store.get(logAtom)).toEqual(['Set to 5', 'Set to 10']);
    });
  });

  describe('combined beforeSet and afterSet', () => {
    it('should execute both middlewares in order', () => {
      const testAtom = atom(0);
      const calls: string[] = [];

      const plugin = middleware(testAtom, {
        beforeSet: () => {
          calls.push('before');
        },
        afterSet: () => {
          calls.push('after');
        }
      });

      store.use(plugin);
      store.set(testAtom, 5);

      expect(calls).toEqual(['before', 'after']);
    });

    it('should use transformed value in afterSet', () => {
      const testAtom = atom(0);
      let afterValue: number | undefined;

      const plugin = middleware(testAtom, {
        beforeSet: (atom, newValue) => newValue * 2,
        afterSet: (atom, newValue) => {
          afterValue = newValue;
        }
      });

      store.use(plugin);
      store.set(testAtom, 5);

      expect(afterValue).toBe(10);
      expect(store.get(testAtom)).toBe(10);
    });
  });

  describe('multiple atoms', () => {
    it('should only affect the target atom', () => {
      const atom1 = atom(0);
      const atom2 = atom(0);

      const plugin = middleware(atom1, {
        beforeSet: (atom, newValue) => newValue * 2
      });

      store.use(plugin);

      store.set(atom1, 5);
      store.set(atom2, 5);

      expect(store.get(atom1)).toBe(10); // Affected by middleware
      expect(store.get(atom2)).toBe(5);  // Not affected
    });

    it('should handle multiple middleware plugins', () => {
      const atom1 = atom(0);
      const atom2 = atom(0);

      const plugin1 = middleware(atom1, {
        beforeSet: (atom, newValue) => newValue * 2
      });

      const plugin2 = middleware(atom2, {
        beforeSet: (atom, newValue) => newValue + 10
      });

      store.use(plugin1);
      store.use(plugin2);

      store.set(atom1, 5);
      store.set(atom2, 5);

      expect(store.get(atom1)).toBe(10);
      expect(store.get(atom2)).toBe(15);
    });
  });

  describe('TypeScript types', () => {
    it('should infer correct types', () => {
      type State = { count: number; name: string };
      const testAtom = atom<State>({ count: 0, name: 'test' });

      const plugin = middleware(testAtom, {
        beforeSet: (atom, newValue, oldValue) => {
          // newValue and oldValue should be typed as State
          expect(typeof newValue.count).toBe('number');
          expect(typeof newValue.name).toBe('string');
          
          return {
            count: newValue.count + 1,
            name: newValue.name.toUpperCase()
          };
        }
      });

      store.use(plugin);
      store.set(testAtom, { count: 5, name: 'hello' });

      const result = store.get(testAtom);
      expect(result.count).toBe(6);
      expect(result.name).toBe('HELLO');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined return from beforeSet', () => {
      const testAtom = atom(5);

      const plugin = middleware(testAtom, {
        beforeSet: () => {
          // Return undefined - should not transform
        }
      });

      store.use(plugin);
      store.set(testAtom, 10);

      expect(store.get(testAtom)).toBe(10);
    });

    it('should handle null values', () => {
      const testAtom = atom<number | null>(5);

      const plugin = middleware(testAtom, {
        beforeSet: (atom, newValue) => {
          return newValue === null ? 0 : newValue;
        }
      });

      store.use(plugin);
      store.set(testAtom, null);

      expect(store.get(testAtom)).toBe(0);
    });

    it('should handle errors in beforeSet', () => {
      const testAtom = atom(0);

      const plugin = middleware(testAtom, {
        beforeSet: () => {
          throw new Error('Validation failed');
        }
      });

      store.use(plugin);

      expect(() => {
        store.set(testAtom, 5);
      }).toThrow('Validation failed');
    });

    it('should handle errors in afterSet', () => {
      const testAtom = atom(0);

      const plugin = middleware(testAtom, {
        afterSet: () => {
          throw new Error('Side effect failed');
        }
      });

      store.use(plugin);

      expect(() => {
        store.set(testAtom, 5);
      }).toThrow('Side effect failed');
      
      // Value should still be set despite error
      expect(store.get(testAtom)).toBe(5);
    });
  });

  describe('Real-world use cases', () => {
    it('should implement logging middleware', () => {
      const testAtom = atom(0);
      const logs: string[] = [];

      const loggingMiddleware = middleware(testAtom, {
        beforeSet: (atom, newValue, oldValue) => {
          logs.push(`Changing from ${oldValue} to ${newValue}`);
          return newValue;
        }
      });

      store.use(loggingMiddleware);

      store.set(testAtom, 5);
      store.set(testAtom, 10);

      expect(logs).toEqual([
        'Changing from 0 to 5',
        'Changing from 5 to 10'
      ]);
    });

    it('should implement persistence middleware', () => {
      const testAtom = atom({ name: 'John', age: 30 });
      const storage: Record<string, any> = {};

      const persistenceMiddleware = middleware(testAtom, {
        afterSet: (atom, newValue) => {
          storage['user'] = JSON.stringify(newValue);
        }
      });

      store.use(persistenceMiddleware);

      store.set(testAtom, { name: 'Jane', age: 25 });

      expect(JSON.parse(storage['user'])).toEqual({
        name: 'Jane',
        age: 25
      });
    });

    it('should implement analytics middleware', () => {
      const testAtom = atom(0);
      const analytics: Array<{ event: string; value: number }> = [];

      const analyticsMiddleware = middleware(testAtom, {
        afterSet: (atom, newValue, oldValue) => {
          analytics.push({
            event: 'value_changed',
            value: newValue
          });
        }
      });

      store.use(analyticsMiddleware);

      store.set(testAtom, 5);
      store.set(testAtom, 10);

      expect(analytics).toHaveLength(2);
      expect(analytics[0].value).toBe(5);
      expect(analytics[1].value).toBe(10);
    });
  });
});
```

### Step 3: Update package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 🧪 Validation Commands

```bash
cd packages/middleware

# Run tests
pnpm test

# Coverage
pnpm test:coverage

# Watch
pnpm test:watch

# Build
pnpm build

# Full validation
pnpm build && pnpm test:coverage
```

**Expected Output:**
```
✓ packages/middleware/src/index.test.ts (XX tests)
  ✓ beforeSet middleware (5 tests)
  ✓ afterSet middleware (3 tests)
  ✓ combined beforeSet and afterSet (2 tests)
  ✓ multiple atoms (2 tests)
  ✓ TypeScript types (1 test)
  ✓ Edge cases (5 tests)
  ✓ Real-world use cases (3 tests)

Test Files  1 passed (1)
Tests  21 passed (21)
Coverage: 95%+
```

---

## 📚 Context & Background

### Why This Matters

Middleware pattern is essential for:
- Logging state changes
- Validation before updates
- Side effects after updates
- Analytics tracking
- Persistence
- Debugging

Current implementation has issues that need fixing before tests can be written properly.

---

## 🔗 Related Tasks

- **Depends On:** STAB-011 (fix package.json)
- **Blocks:** npm publishing
- **Related:** STAB-012 (immer tests)

---

## 📊 Definition of Done

- [ ] Implementation fixed (plugin-based approach)
- [ ] Test file created with 21+ tests
- [ ] All tests passing
- [ ] Coverage ≥90%
- [ ] Type safety validated
- [ ] README updated with correct API
- [ ] package.json updated
- [ ] Build successful

---

**Created:** 2026-03-01  
**Estimated Completion:** 2026-03-02

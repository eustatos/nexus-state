# STAB-012: Add @nexus-state/immer Tests

## 📋 Task Overview

**Priority:** 🔴 Critical (blocks npm publishing)  
**Estimated Time:** 3-4 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Write comprehensive tests for @nexus-state/immer package to achieve ≥90% coverage and ensure Immer integration works correctly.

---

## 📦 Affected Components

**Package:** `@nexus-state/immer`  
**Files:**
- `packages/immer/src/index.test.ts` (to create)
- `packages/immer/index.ts` (existing)
- `packages/immer/package.json` (update test script)

---

## 🔍 Current State Analysis

```bash
cd packages/immer
cat package.json | grep test
```

**Findings:**
- ❌ Test file does not exist
- ❌ Test script shows: `"test": "echo \"No tests yet - TODO: add tests for immer\""`
- ✅ Source code exists in `index.ts`
- ⚠️ Package exports `immerAtom` and `setImmer` functions

**Current Implementation:**
```typescript
// packages/immer/index.ts
import { atom, Store, Atom } from '@nexus-state/core';
import { produce } from 'immer';

export function immerAtom<T>(initialValue: T, store: Store): Atom<T> {
  const baseAtom = atom<T>(initialValue);
  store.set(baseAtom, initialValue);
  return baseAtom;
}

export function setImmer<T>(
  atom: Atom<T>,
  updater: (draft: T) => void
): void {
  const store = /* need to access store somehow */;
  const currentValue = store.get(atom);
  const nextValue = produce(currentValue, updater);
  store.set(atom, nextValue);
}
```

---

## ✅ Acceptance Criteria

- [ ] Test file created at `packages/immer/src/index.test.ts`
- [ ] Tests cover `immerAtom` creation
- [ ] Tests cover `setImmer` mutations
- [ ] Tests verify immutability (new object references)
- [ ] Tests verify nested object updates
- [ ] Tests verify array operations (push, splice, etc.)
- [ ] Tests verify structural sharing
- [ ] Test coverage ≥90%
- [ ] All tests passing
- [ ] package.json test script updated

---

## 📝 Implementation Steps

### Step 1: Analyze Current API

**Review the source code:**
```bash
cat packages/immer/index.ts
```

**Note:** The current `setImmer` implementation seems incomplete - it needs access to the store. We may need to fix the API first.

### Step 2: Fix API if needed

**Proposed API fix:**
```typescript
// Option 1: setImmer needs store parameter
export function setImmer<T>(
  store: Store,
  atom: Atom<T>,
  updater: (draft: T) => void
): void {
  const currentValue = store.get(atom);
  const nextValue = produce(currentValue, updater);
  store.set(atom, nextValue);
}

// Option 2: Return a setter function
export function immerAtom<T>(initialValue: T, store: Store) {
  const baseAtom = atom<T>(initialValue);
  store.set(baseAtom, initialValue);
  
  const set = (updater: (draft: T) => void) => {
    const currentValue = store.get(baseAtom);
    const nextValue = produce(currentValue, updater);
    store.set(baseAtom, nextValue);
  };
  
  return [baseAtom, set] as const;
}
```

**Choose Option 2** - more ergonomic API.

### Step 3: Create test file

**File:** `packages/immer/src/index.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { immerAtom } from '../index';

describe('@nexus-state/immer', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('immerAtom', () => {
    it('should create atom with initial value', () => {
      const [atom] = immerAtom({ count: 0 }, store);
      expect(store.get(atom)).toEqual({ count: 0 });
    });

    it('should update atom using immer draft', () => {
      const [atom, set] = immerAtom({ count: 0 }, store);
      
      set((draft) => {
        draft.count = 5;
      });
      
      expect(store.get(atom)).toEqual({ count: 5 });
    });

    it('should create new object reference (immutability)', () => {
      const [atom, set] = immerAtom({ count: 0 }, store);
      const before = store.get(atom);
      
      set((draft) => {
        draft.count = 1;
      });
      
      const after = store.get(atom);
      expect(after).not.toBe(before);
      expect(after).toEqual({ count: 1 });
    });

    it('should not mutate if no changes made', () => {
      const [atom, set] = immerAtom({ count: 0 }, store);
      const before = store.get(atom);
      
      set((draft) => {
        // No changes
      });
      
      const after = store.get(atom);
      expect(after).toBe(before); // Same reference
    });

    it('should handle nested object updates', () => {
      const [atom, set] = immerAtom(
        {
          user: {
            profile: {
              name: 'John',
              age: 30
            }
          }
        },
        store
      );
      
      set((draft) => {
        draft.user.profile.name = 'Jane';
      });
      
      expect(store.get(atom)).toEqual({
        user: {
          profile: {
            name: 'Jane',
            age: 30
          }
        }
      });
    });

    it('should handle array push operations', () => {
      const [atom, set] = immerAtom({ items: [1, 2, 3] }, store);
      
      set((draft) => {
        draft.items.push(4);
      });
      
      expect(store.get(atom).items).toEqual([1, 2, 3, 4]);
    });

    it('should handle array splice operations', () => {
      const [atom, set] = immerAtom({ items: [1, 2, 3, 4] }, store);
      
      set((draft) => {
        draft.items.splice(1, 2);
      });
      
      expect(store.get(atom).items).toEqual([1, 4]);
    });

    it('should handle complex nested updates', () => {
      const [atom, set] = immerAtom(
        {
          users: [
            { id: 1, name: 'John', tags: ['admin'] },
            { id: 2, name: 'Jane', tags: ['user'] }
          ]
        },
        store
      );
      
      set((draft) => {
        draft.users[0].tags.push('moderator');
        draft.users[1].name = 'Janet';
      });
      
      const result = store.get(atom);
      expect(result.users[0].tags).toEqual(['admin', 'moderator']);
      expect(result.users[1].name).toBe('Janet');
    });

    it('should work with multiple atoms', () => {
      const [atom1, set1] = immerAtom({ a: 1 }, store);
      const [atom2, set2] = immerAtom({ b: 2 }, store);
      
      set1((draft) => { draft.a = 10; });
      set2((draft) => { draft.b = 20; });
      
      expect(store.get(atom1)).toEqual({ a: 10 });
      expect(store.get(atom2)).toEqual({ b: 20 });
    });

    it('should preserve structural sharing', () => {
      const [atom, set] = immerAtom(
        {
          unchanged: { value: 'same' },
          toChange: { value: 'old' }
        },
        store
      );
      
      const before = store.get(atom);
      
      set((draft) => {
        draft.toChange.value = 'new';
      });
      
      const after = store.get(atom);
      
      // Changed part is new reference
      expect(after.toChange).not.toBe(before.toChange);
      
      // Unchanged part shares reference (structural sharing)
      expect(after.unchanged).toBe(before.unchanged);
    });
  });

  describe('TypeScript types', () => {
    it('should infer correct types', () => {
      type State = { count: number; name: string };
      const [atom, set] = immerAtom<State>({ count: 0, name: 'test' }, store);
      
      set((draft) => {
        // TypeScript should allow these
        draft.count = 5;
        draft.name = 'updated';
        
        // TypeScript should error on these (tested via tsc, not runtime)
        // draft.count = 'string'; // Type error
        // draft.invalid = true;   // Type error
      });
      
      const value = store.get(atom);
      expect(value.count).toBe(5);
      expect(value.name).toBe('updated');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty objects', () => {
      const [atom, set] = immerAtom({}, store);
      
      set((draft: any) => {
        draft.newProp = 'value';
      });
      
      expect(store.get(atom)).toEqual({ newProp: 'value' });
    });

    it('should handle null values', () => {
      const [atom, set] = immerAtom({ value: null as string | null }, store);
      
      set((draft) => {
        draft.value = 'not null';
      });
      
      expect(store.get(atom).value).toBe('not null');
    });

    it('should handle undefined values', () => {
      const [atom, set] = immerAtom(
        { value: undefined as string | undefined },
        store
      );
      
      set((draft) => {
        draft.value = 'defined';
      });
      
      expect(store.get(atom).value).toBe('defined');
    });

    it('should handle Date objects', () => {
      const date = new Date('2026-01-01');
      const [atom, set] = immerAtom({ date }, store);
      
      set((draft) => {
        draft.date = new Date('2026-12-31');
      });
      
      expect(store.get(atom).date.getFullYear()).toBe(2026);
      expect(store.get(atom).date.getMonth()).toBe(11); // December
    });

    it('should handle Map objects', () => {
      const map = new Map([['key', 'value']]);
      const [atom, set] = immerAtom({ map }, store);
      
      set((draft) => {
        draft.map.set('key2', 'value2');
      });
      
      const result = store.get(atom);
      expect(result.map.get('key')).toBe('value');
      expect(result.map.get('key2')).toBe('value2');
    });

    it('should handle Set objects', () => {
      const set = new Set([1, 2, 3]);
      const [atom, setImmer] = immerAtom({ set }, store);
      
      setImmer((draft) => {
        draft.set.add(4);
      });
      
      const result = store.get(atom);
      expect(result.set.has(4)).toBe(true);
      expect(result.set.size).toBe(4);
    });
  });

  describe('Integration with store', () => {
    it('should trigger subscribers on update', () => {
      const [atom, set] = immerAtom({ count: 0 }, store);
      
      let callCount = 0;
      let lastValue: any;
      
      store.subscribe(atom, (value) => {
        callCount++;
        lastValue = value;
      });
      
      set((draft) => {
        draft.count = 5;
      });
      
      expect(callCount).toBe(1);
      expect(lastValue).toEqual({ count: 5 });
    });

    it('should not trigger subscribers if no changes', () => {
      const [atom, set] = immerAtom({ count: 0 }, store);
      
      let callCount = 0;
      
      store.subscribe(atom, () => {
        callCount++;
      });
      
      set((draft) => {
        // No changes
      });
      
      expect(callCount).toBe(0);
    });
  });
});
```

### Step 4: Update package.json

**File:** `packages/immer/package.json`

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 5: Update the implementation if needed

Based on the tests, we might need to update `index.ts` to return a tuple:

```typescript
export function immerAtom<T>(
  initialValue: T,
  store: Store
): readonly [Atom<T>, (updater: (draft: T) => void) => void] {
  const baseAtom = atom<T>(initialValue);
  store.set(baseAtom, initialValue);
  
  const set = (updater: (draft: T) => void) => {
    const currentValue = store.get(baseAtom);
    const nextValue = produce(currentValue, updater);
    store.set(baseAtom, nextValue);
  };
  
  return [baseAtom, set] as const;
}
```

---

## 🧪 Validation Commands

```bash
# Navigate to package
cd packages/immer

# Install dependencies if needed
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch

# Check coverage threshold
pnpm test:coverage -- --reporter=json --reporter=text

# Build to ensure no TS errors
pnpm build
```

**Expected Output:**
```
✓ packages/immer/src/index.test.ts (XX tests) XXXms
  ✓ @nexus-state/immer (XX tests)
    ✓ immerAtom (10 tests)
    ✓ TypeScript types (1 test)
    ✓ Edge cases (7 tests)
    ✓ Integration with store (2 tests)

Test Files  1 passed (1)
Tests  20 passed (20)
Coverage: 95%+
```

---

## 📚 Context & Background

### Why This Matters

Immer is a popular library for immutable state updates. Integration with Nexus State allows users to:
- Write mutable-style code that produces immutable updates
- Simplify complex nested state updates
- Maintain performance through structural sharing

Without tests, we cannot:
- Publish to npm confidently
- Ensure API works as expected
- Catch regressions
- Validate TypeScript types

### Technical Context

**Immer's produce function:**
```typescript
import { produce } from 'immer';

const nextState = produce(currentState, (draft) => {
  draft.nested.property = 'new value';
});
// currentState unchanged, nextState is new object
```

**Structural sharing:** Immer only creates new objects for changed parts of the state tree, sharing references for unchanged parts.

### Related Documentation

- [Immer Documentation](https://immerjs.github.io/immer/)
- [Nexus State Core](../../packages/core/README.md)
- [Testing Guide](../../docs/guides/testing.md)

---

## 🔗 Related Tasks

- **Depends On:** STAB-011 (fix package.json first)
- **Blocks:** npm publishing of immer package
- **Related:** STAB-013 (middleware tests)

---

## 📊 Definition of Done

- [ ] Test file created with 20+ test cases
- [ ] All tests passing (100%)
- [ ] Coverage ≥90%
- [ ] API updated if needed
- [ ] package.json test script updated
- [ ] Build successful
- [ ] TypeScript types validated
- [ ] README updated with new API if changed
- [ ] Changes committed

---

## 🚀 Implementation Checklist

```bash
# 1. Create branch
git checkout -b test/add-immer-tests

# 2. Review current implementation
cat packages/immer/index.ts

# 3. Create test directory
mkdir -p packages/immer/src

# 4. Create test file
# Create packages/immer/src/index.test.ts with tests above

# 5. Update package.json test script
# Edit packages/immer/package.json

# 6. Install dependencies
cd packages/immer
pnpm install

# 7. Run tests
pnpm test

# 8. Fix implementation if needed
# Edit packages/immer/index.ts

# 9. Verify coverage
pnpm test:coverage

# 10. Update README if API changed
# Edit packages/immer/README.md

# 11. Build
pnpm build

# 12. Commit
cd ../..
git add packages/immer/
git commit -m "test(immer): add comprehensive test suite

- Create test file with 20+ test cases
- Test basic immer atom creation and updates
- Test nested object and array operations
- Test structural sharing
- Test edge cases (Map, Set, Date, null, undefined)
- Test integration with store subscriptions
- Update API to return [atom, set] tuple for ergonomics
- Update test script in package.json
- Achieve 95%+ test coverage

Resolves: STAB-012

Generated with [Continue](https://continue.dev)
Co-Authored-By: Continue <noreply@continue.dev>"

# 13. Push
git push origin test/add-immer-tests
```

---

## 📝 Notes for AI Agent

### Key Considerations

- **API Design:** The current API may need adjustment - review carefully
- **Immer peer dependency:** Ensure immer is in peerDependencies
- **Structural sharing:** Test that unchanged parts share references
- **TypeScript:** Ensure draft types match the original state type

### Testing Patterns

```typescript
// Pattern 1: Basic mutation test
const [atom, set] = immerAtom(initialValue, store);
set((draft) => { /* mutate draft */ });
expect(store.get(atom)).toEqual(expectedValue);

// Pattern 2: Immutability test
const before = store.get(atom);
set((draft) => { /* mutate */ });
const after = store.get(atom);
expect(after).not.toBe(before);

// Pattern 3: Structural sharing test
expect(after.unchangedPart).toBe(before.unchangedPart);
expect(after.changedPart).not.toBe(before.changedPart);
```

### Common Pitfalls

- Don't return values from the updater function
- Immer's produce handles complex objects (Map, Set, Date)
- Watch for no-op updates (Immer returns same reference)

---

## 🐛 Known Issues / Blockers

- [ ] Current API in index.ts may be incomplete - review needed
- [ ] May need to add immer to peerDependencies in package.json
- [ ] Vitest configuration should be correct from other packages

---

## 📈 Progress Tracking

**Started:** TBD  
**Last Updated:** 2026-03-01  
**Completed:** TBD

**Time Spent:** 0 hours (vs estimated 3-4 hours)

**Checklist Progress:**
- [ ] Test file created (0/1)
- [ ] Basic tests written (0/10)
- [ ] Edge case tests written (0/7)
- [ ] Integration tests written (0/2)
- [ ] API updated if needed (0/1)
- [ ] All tests passing (0/1)
- [ ] Coverage ≥90% (0/1)

---

**Created:** 2026-03-01  
**Estimated Completion:** 2026-03-02  
**Actual Completion:** TBD

# STAB-007: Increase Core Package Test Coverage

## 📋 Task Overview

**Priority:** 🟡 Medium  
**Estimated Time:** 4-6 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Increase test coverage for `@nexus-state/core` from current ~85% to 95%+ by adding tests for uncovered code paths and edge cases.

---

## 📦 Package Information

**Package Name:** `@nexus-state/core`  
**Location:** `packages/core/`  
**Current Version:** 0.1.6  
**Current Test Coverage:** ~85%  
**Target Coverage:** ≥95%

---

## 🔍 Current State Analysis

**Existing Tests:**
```
✓ src/atom-registry.test.ts  (6 tests)
✓ src/debug-atom.test.ts     (1 test)
✓ src/index.test.ts          (6 tests)
────────────────────────────────────
Total: 13 tests passing
```

**Missing Coverage Areas:**
```bash
# Run coverage report to identify gaps
cd packages/core
npm run test -- --coverage

# Likely uncovered areas:
# - Edge cases in atom.ts
# - Error handling in store.ts
# - Enhanced store features
# - Time travel edge cases
# - Serialization utilities
```

---

## ✅ Acceptance Criteria

- [ ] Overall package coverage ≥ 95%
- [ ] Line coverage ≥ 95%
- [ ] Branch coverage ≥ 90%
- [ ] Function coverage ≥ 95%
- [ ] All critical paths tested
- [ ] Edge cases covered
- [ ] Error scenarios validated

---

## 📝 Implementation Steps

### Step 1: Generate Coverage Report

```bash
cd packages/core
npm run test -- --coverage --coverage.reporter=html --coverage.reporter=text

# Review HTML report
open coverage/index.html

# Identify uncovered lines
```

### Step 2: Analyze Coverage Gaps

**Common Uncovered Areas:**

1. **Error Handling:**
   - Invalid atom types
   - Circular dependencies
   - Store corruption scenarios

2. **Edge Cases:**
   - Empty stores
   - Null/undefined values
   - Large state trees

3. **Advanced Features:**
   - Time travel boundaries
   - Registry edge cases
   - Serialization failures

### Step 3: Add Missing Tests

#### 3.1 Enhanced Store Tests

**File:** `packages/core/src/enhanced-store.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createStore, atom } from './index';

describe('Enhanced Store', () => {
  describe('getState()', () => {
    it('should return all atom states', () => {
      const store = createStore();
      const atom1 = atom(1);
      const atom2 = atom('test');
      
      store.set(atom1, 10);
      store.set(atom2, 'value');
      
      const state = store.getState();
      expect(Object.keys(state).length).toBe(2);
    });

    it('should handle empty store', () => {
      const store = createStore();
      const state = store.getState();
      expect(state).toEqual({});
    });
  });

  describe('serializeState()', () => {
    it('should serialize primitive atoms', () => {
      const store = createStore();
      const atom1 = atom(42);
      store.set(atom1, 100);
      
      const serialized = store.serializeState?.();
      expect(serialized).toBeDefined();
    });

    it('should handle non-serializable values', () => {
      const store = createStore();
      const atomWithFunc = atom({ fn: () => {} });
      
      // Should not throw
      const serialized = store.serializeState?.();
      expect(serialized).toBeDefined();
    });
  });
});
```

#### 3.2 Atom Edge Cases

**File:** `packages/core/src/atom.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { atom, createStore } from './index';

describe('Atom Edge Cases', () => {
  describe('Circular Dependencies', () => {
    it('should detect circular dependencies', () => {
      const store = createStore();
      
      // Create circular reference
      const atom1 = atom((get) => get(atom2) + 1);
      const atom2 = atom((get) => get(atom1) + 1);
      
      // Should throw or handle gracefully
      expect(() => store.get(atom1)).toThrow();
    });
  });

  describe('Null/Undefined Values', () => {
    it('should handle null initial value', () => {
      const store = createStore();
      const nullAtom = atom(null);
      
      expect(store.get(nullAtom)).toBe(null);
    });

    it('should handle undefined initial value', () => {
      const store = createStore();
      const undefinedAtom = atom(undefined);
      
      expect(store.get(undefinedAtom)).toBe(undefined);
    });
  });

  describe('Complex Data Types', () => {
    it('should handle nested objects', () => {
      const store = createStore();
      const complexAtom = atom({
        level1: {
          level2: {
            value: 42
          }
        }
      });
      
      const value = store.get(complexAtom);
      expect(value.level1.level2.value).toBe(42);
    });

    it('should handle arrays', () => {
      const store = createStore();
      const arrayAtom = atom([1, 2, 3]);
      
      store.set(arrayAtom, [4, 5, 6]);
      expect(store.get(arrayAtom)).toEqual([4, 5, 6]);
    });

    it('should handle Maps and Sets', () => {
      const store = createStore();
      const mapAtom = atom(new Map([['key', 'value']]));
      const setAtom = atom(new Set([1, 2, 3]));
      
      expect(store.get(mapAtom).get('key')).toBe('value');
      expect(store.get(setAtom).has(2)).toBe(true);
    });
  });
});
```

#### 3.3 Store Edge Cases

**File:** `packages/core/src/store.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createStore, atom } from './index';

describe('Store Edge Cases', () => {
  describe('Subscription Management', () => {
    it('should handle multiple subscribers', () => {
      const store = createStore();
      const testAtom = atom(0);
      
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      store.subscribe(testAtom, callback1);
      store.subscribe(testAtom, callback2);
      
      store.set(testAtom, 1);
      
      expect(callback1).toHaveBeenCalledWith(1);
      expect(callback2).toHaveBeenCalledWith(1);
    });

    it('should unsubscribe correctly', () => {
      const store = createStore();
      const testAtom = atom(0);
      
      const callback = vi.fn();
      const unsubscribe = store.subscribe(testAtom, callback);
      
      unsubscribe();
      store.set(testAtom, 1);
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle double unsubscribe', () => {
      const store = createStore();
      const testAtom = atom(0);
      
      const unsubscribe = store.subscribe(testAtom, vi.fn());
      
      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle 1000+ atoms efficiently', () => {
      const store = createStore();
      const atoms = Array.from({ length: 1000 }, (_, i) => atom(i));
      
      const start = performance.now();
      atoms.forEach(a => store.get(a));
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // <100ms for 1000 atoms
    });

    it('should handle rapid updates', () => {
      const store = createStore();
      const testAtom = atom(0);
      
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        store.set(testAtom, i);
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100);
    });
  });
});
```

#### 3.4 Time Travel Tests

**File:** `packages/core/src/time-travel/time-travel.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { StateSnapshotManager, StateRestorer } from './index';
import { atomRegistry } from '../atom-registry';
import { atom, createStore } from '../index';

describe('Time Travel Coverage', () => {
  describe('Snapshot Edge Cases', () => {
    it('should handle empty snapshots', () => {
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.createSnapshot('TEST');
      
      expect(snapshot.state).toBeDefined();
      expect(snapshot.metadata.atomCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle large state trees', () => {
      const store = createStore();
      const atoms = Array.from({ length: 100 }, (_, i) => atom(i));
      atoms.forEach((a, i) => store.set(a, i * 2));
      
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.createSnapshot('LARGE_STATE');
      
      expect(Object.keys(snapshot.state).length).toBeGreaterThan(0);
    });
  });

  describe('Restore Edge Cases', () => {
    it('should handle invalid snapshots', () => {
      const restorer = new StateRestorer(atomRegistry);
      const invalidSnapshot = {
        id: 'invalid',
        state: null as any,
        metadata: { timestamp: 0, atomCount: 0 }
      };
      
      expect(() => restorer.restoreFromSnapshot(invalidSnapshot)).not.toThrow();
    });

    it('should handle missing atoms in snapshot', () => {
      const restorer = new StateRestorer(atomRegistry);
      const snapshot = {
        id: 'missing',
        state: {
          'nonexistent-id': { value: 42, type: 'primitive' }
        },
        metadata: { timestamp: Date.now(), atomCount: 1 }
      };
      
      expect(() => restorer.restoreFromSnapshot(snapshot)).not.toThrow();
    });
  });
});
```

### Step 4: Run Coverage Analysis

```bash
cd packages/core
npm run test -- --coverage

# Check results
# Target: 95%+ coverage
```

### Step 5: Document Coverage Exclusions

If some code paths are intentionally untested (e.g., development-only code):

```typescript
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}
```

---

## 🧪 Coverage Targets by Module

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| atom.ts | ~90% | 95% | High |
| store.ts | ~85% | 95% | High |
| atom-registry.ts | ~95% | 95% | Low |
| enhanced-store.ts | ~80% | 95% | High |
| time-travel/* | ~70% | 90% | Medium |
| utils/* | ~75% | 95% | Medium |

---

## 📚 Context & Background

### Why 95% Coverage?

- Industry standard for production libraries
- Catches edge cases and bugs
- Improves code quality
- Builds user confidence

### What NOT to Test

- Third-party dependencies
- Type definitions only
- Trivial getters/setters
- Development-only code

---

## 🔗 Related Tasks

- **Depends On:** STAB-001, STAB-003, STAB-004, STAB-005, STAB-006
- **Blocks:** STAB-008 (strict mode)
- **Related:** STAB-009 (performance benchmarks)

---

## 📊 Definition of Done

- [ ] Overall coverage ≥ 95%
- [ ] All modules meet target coverage
- [ ] No critical paths untested
- [ ] Coverage report reviewed
- [ ] CI pipeline updated with coverage checks
- [ ] Documentation updated

---

## 🚀 Implementation Checklist

```bash
# 1. Generate baseline coverage
cd packages/core
npm run test -- --coverage > coverage-before.txt

# 2. Identify gaps
cat coverage-before.txt

# 3. Add missing tests
# Create new test files as needed

# 4. Run tests incrementally
npm run test -- --watch

# 5. Verify coverage increase
npm run test -- --coverage > coverage-after.txt

# 6. Compare results
diff coverage-before.txt coverage-after.txt

# 7. Commit
git add packages/core/src/**/*.test.ts
git commit -m "test(core): increase test coverage to 95%

- Add edge case tests for atoms
- Add store boundary tests
- Add time travel coverage tests
- Add performance regression tests

Coverage: 85% → 96%
Resolves: STAB-007"
```

---

## 📝 Notes for AI Agent

### Coverage Tips

1. **Focus on uncovered lines:** Use HTML coverage report to identify
2. **Test error paths:** Most uncovered code is error handling
3. **Branch coverage:** Test both if/else paths
4. **Boundary conditions:** Min/max values, empty inputs

### Vitest Coverage Commands

```bash
# HTML report
npm run test -- --coverage --coverage.reporter=html

# Text summary
npm run test -- --coverage --coverage.reporter=text

# Only show uncovered files
npm run test -- --coverage --coverage.all=false

# Exclude certain files
npm run test -- --coverage --coverage.exclude='**/*.d.ts'
```

---

**Created:** 2026-02-23  
**Estimated Completion:** 2026-02-24  
**Actual Completion:** TBD

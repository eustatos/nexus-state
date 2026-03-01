# STAB-003: Add Unit Tests for @nexus-state/async

## 📋 Task Overview

**Priority:** 🔴 High  
**Estimated Time:** 4-6 hours  
**Status:** ✅ Completed  
**Assignee:** AI Agent

---

## 🎯 Objective

Implement comprehensive unit tests for the `@nexus-state/async` package to ensure async atom functionality works correctly and achieves 90%+ code coverage.

---

## 📦 Package Information

**Package Name:** `@nexus-state/async`  
**Location:** `packages/async/`  
**Current Version:** 0.1.3  
**Current Test Coverage:** 0% (no tests)

---

## 🔍 Current Implementation Analysis

**File:** `packages/async/index.ts` (need to analyze actual implementation)

Expected functionality based on package name:
- Async atoms (atoms that resolve asynchronously)
- Loading/error/data states
- Promise handling
- Suspense integration (possibly)

---

## ✅ Acceptance Criteria

- [ ] Test coverage ≥ 90%
- [ ] All async atom creation scenarios tested
- [ ] Loading states validated
- [ ] Error handling tested
- [ ] Success states verified
- [ ] Edge cases covered (cancellation, race conditions)
- [ ] Integration with core store tested
- [ ] TypeScript types validated

---

## 📝 Implementation Steps

### Step 1: Analyze Current Implementation

```bash
# Read the implementation
cat packages/async/index.ts

# Check package.json dependencies
cat packages/async/package.json
```

### Step 2: Create Test Structure

**File:** `packages/async/index.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
// Import async functionality from this package

describe('@nexus-state/async', () => {
  let store: any;

  beforeEach(() => {
    store = createStore();
  });

  describe('Async Atom Creation', () => {
    it('should create an async atom', () => {
      // Test basic async atom creation
    });

    it('should accept async function as initializer', () => {
      // Test async function initialization
    });
  });

  describe('Loading States', () => {
    it('should start in loading state', () => {
      // Test initial loading state
    });

    it('should transition from loading to success', async () => {
      // Test successful resolution
    });

    it('should transition from loading to error on rejection', async () => {
      // Test error handling
    });
  });

  describe('Data States', () => {
    it('should expose resolved data', async () => {
      // Test data access after resolution
    });

    it('should update data on re-fetch', async () => {
      // Test data updates
    });
  });

  describe('Error Handling', () => {
    it('should capture promise rejection', async () => {
      // Test error capture
    });

    it('should expose error object', async () => {
      // Test error object structure
    });

    it('should allow retry after error', async () => {
      // Test retry mechanism
    });
  });

  describe('Store Integration', () => {
    it('should work with store.get()', async () => {
      // Test store.get() integration
    });

    it('should work with store.set()', async () => {
      // Test store.set() integration
    });

    it('should work with store.subscribe()', async () => {
      // Test subscription to async atoms
    });
  });

  describe('Edge Cases', () => {
    it('should handle promise cancellation', async () => {
      // Test cleanup on unmount/cancellation
    });

    it('should handle race conditions', async () => {
      // Test multiple concurrent requests
    });

    it('should handle null/undefined returns', async () => {
      // Test edge case values
    });
  });
});
```

### Step 3: Implement Test Cases

Based on the actual implementation, write specific test cases:

**Example Test Implementation:**

```typescript
describe('Async Atom Creation', () => {
  it('should create an async atom that resolves', async () => {
    const asyncAtom = atom(async () => {
      return new Promise<number>((resolve) => {
        setTimeout(() => resolve(42), 10);
      });
    });

    const value = await store.get(asyncAtom);
    expect(value).toBe(42);
  });

  it('should handle async atoms with dependencies', async () => {
    const baseAtom = atom(10);
    const asyncAtom = atom(async (get) => {
      const base = get(baseAtom);
      return new Promise<number>((resolve) => {
        setTimeout(() => resolve(base * 2), 10);
      });
    });

    const value = await store.get(asyncAtom);
    expect(value).toBe(20);
  });
});
```

### Step 4: Add TypeScript Type Tests

**File:** `packages/async/index.test-d.ts`

```typescript
import { expectType } from 'vitest';
import { atom } from './index';

// Test type inference
const asyncAtom = atom(async () => 42);
expectType<Promise<number>>(asyncAtom.read());

// Test with explicit types
const typedAtom = atom<string>(async () => 'hello');
expectType<Promise<string>>(typedAtom.read());
```

### Step 5: Run Tests and Achieve Coverage

```bash
# Run tests with coverage
cd packages/async
npm run test -- --coverage

# Check coverage report
# Target: 90%+ coverage
```

---

## 🧪 Test Scenarios Matrix

| Scenario | Input | Expected Output | Edge Cases |
|----------|-------|-----------------|------------|
| Basic async | Promise<number> | Resolved number | Slow promises |
| With dependencies | get() other atoms | Computed value | Circular deps |
| Error handling | Rejected promise | Error state | Network errors |
| Loading state | Initial call | isLoading: true | Multiple calls |
| Re-fetch | Subsequent calls | Updated data | Stale data |

---

## 📚 Context & Background

### Why Async Atoms Matter

Async atoms are crucial for:
- API data fetching
- Computed values from async sources
- Integration with external services
- Server-side rendering compatibility

### Common Patterns

```typescript
// Pattern 1: Simple async fetch
const userAtom = atom(async () => {
  const response = await fetch('/api/user');
  return response.json();
});

// Pattern 2: Async with dependencies
const userPostsAtom = atom(async (get) => {
  const userId = get(userIdAtom);
  const response = await fetch(`/api/users/${userId}/posts`);
  return response.json();
});

// Pattern 3: With error handling
const safeDataAtom = atom(async () => {
  try {
    return await fetchData();
  } catch (error) {
    return { error: error.message };
  }
});
```

---

## 🔗 Related Tasks

- **Depends On:** STAB-001 (test infrastructure)
- **Blocks:** STAB-007 (overall coverage)
- **Related:** Documentation for async atoms

---

## 📊 Definition of Done

- [ ] 15+ test cases implemented
- [ ] Code coverage ≥ 90%
- [ ] All tests passing
- [ ] Type tests included
- [ ] Edge cases covered
- [ ] Documentation examples tested
- [ ] CI pipeline green

---

## 🚀 Implementation Checklist

```bash
# 1. Analyze implementation
cat packages/async/index.ts
cat packages/async/README.md

# 2. Create test file (if not exists from STAB-001)
# Already created in STAB-001

# 3. Write test cases
# Follow the structure above

# 4. Run tests
cd packages/async
npm run test

# 5. Check coverage
npm run test -- --coverage

# 6. Fix failing tests
# Iterate until all pass

# 7. Commit
git add packages/async/index.test.ts
git commit -m "test(async): add comprehensive unit tests

- Add async atom creation tests
- Add loading/error/success state tests
- Add store integration tests
- Add edge case tests
- Achieve 90%+ code coverage

Coverage: XX% → 92%
Resolves: STAB-003"
```

---

## 📝 Notes for AI Agent

### Testing Async Code

Use these vitest patterns:

```typescript
// Pattern 1: async/await
it('should resolve async atom', async () => {
  const atom = asyncAtom(() => Promise.resolve(42));
  const value = await store.get(atom);
  expect(value).toBe(42);
});

// Pattern 2: waitFor utility
it('should update after async resolution', async () => {
  // Use waitFor for state changes
});

// Pattern 3: Mock timers
it('should timeout after delay', async () => {
  vi.useFakeTimers();
  // Test timeout scenarios
  vi.useRealTimers();
});
```

### Common Pitfalls

1. **Forgetting await:** Async tests must await promises
2. **Race conditions:** Use proper synchronization
3. **Cleanup:** Always clean up timers and subscriptions
4. **Mocking:** Mock external APIs, don't make real requests

---

**Created:** 2026-02-23
**Estimated Completion:** 2026-02-23
**Actual Completion:** 2026-02-23

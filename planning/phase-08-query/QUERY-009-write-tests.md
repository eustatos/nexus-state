# QUERY-009: Write Tests (≥95% coverage)

## 📋 Task Overview

**Priority:** 🔴 High  
**Estimated Time:** 12 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  

---

## 🎯 Objective

Write comprehensive test suite covering all query package functionality with ≥95% code coverage.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files:**
- `packages/query/src/__tests__/*.test.ts` (NEW/UPDATE)
- All source files (test coverage)

---

## 🔍 Current State Analysis

**Findings:**
- Current behavior: Some tests exist from individual tasks
- Issues: Coverage may be below 95%
- Root cause: Need comprehensive test coverage

---

## ✅ Acceptance Criteria

- [ ] All modules tested
- [ ] Coverage ≥ 95%
- [ ] Edge cases covered
- [ ] Integration tests included
- [ ] Error scenarios tested
- [ ] Async behavior tested
- [ ] Mock external dependencies

---

## 📝 Implementation Steps

### Step 1: Create Comprehensive Test Suite

**Test Files to Create/Update:**

1. `queryAtom.test.ts` - Query atom creation and lifecycle
2. `queryCache.test.ts` - Cache operations (already done in QUERY-003)
3. `deduplication.test.ts` - Request deduplication (already done in QUERY-004)
4. `backgroundRefetch.test.ts` - Background refetch mechanisms
5. `optimisticUpdates.test.ts` - Optimistic mutations
6. `garbageCollection.test.ts` - GC functionality
7. `integration.test.ts` - End-to-end scenarios

### Step 2: Integration Tests

**How:**
```typescript
// src/__tests__/integration.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { queryAtom } from '../queryAtom';
import { queryCache } from '../queryCache';
import { queryManager } from '../queryManager';

describe('Integration Tests', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await queryCache.clear();
  });

  it('should handle complete query lifecycle', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1, name: 'John' });

    const userQuery = queryAtom({
      key: 'user-1',
      fetcher,
      staleTime: 5000,
      cacheTime: 10000,
    });

    // Initial state
    expect(store.get(userQuery).status).toBe('idle');

    // First fetch
    await (userQuery as any).fetch(store);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(store.get(userQuery).status).toBe('success');

    // Second fetch (should use cache)
    await (userQuery as any).fetch(store);
    expect(fetcher).toHaveBeenCalledTimes(1); // Still 1, cached

    // After staleTime
    await new Promise(resolve => setTimeout(resolve, 5100));
    await (userQuery as any).fetch(store);
    expect(fetcher).toHaveBeenCalledTimes(2); // Refetched
  });

  it('should deduplicate concurrent requests', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    const query = queryAtom({
      key: 'concurrent-test',
      fetcher,
    });

    // Multiple concurrent fetches
    await Promise.all([
      (query as any).fetch(store),
      (query as any).fetch(store),
      (query as any).fetch(store),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should handle optimistic updates with rollback', async () => {
    // Test optimistic mutation pattern
    // Implementation depends on mutationAtom
  });
});
```

### Step 3: Run Coverage

```bash
cd packages/query
pnpm run test:coverage

# Check coverage report
open coverage/index.html
```

---

## 🧪 Validation Commands

```bash
cd packages/query
pnpm run test
pnpm run test:coverage
pnpm run build
```

**Expected Output:**
```
✓ All tests passing (50+ tests)
✓ Coverage: ≥95%
✓ Build successful
```

---

## 🔗 Related Tasks

- **Depends On:** QUERY-001 through QUERY-008 (all implementation tasks)
- **Blocks:** QUERY-010 (Documentation)
- **Related:** TASK-006 (Test Coverage Reporting)

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-03-10  
**Actual Completion:** TBD

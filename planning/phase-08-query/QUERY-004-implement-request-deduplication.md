# QUERY-004: Implement Request Deduplication

## 📋 Task Overview

**Priority:** 🟡 Medium  
**Estimated Time:** 6 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  

---

## 🎯 Objective

Implement request deduplication to prevent multiple identical requests from being executed simultaneously.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files:**
- `packages/query/src/deduplication.ts` (NEW)
- `packages/query/src/queryManager.ts` (NEW)
- `packages/query/src/__tests__/deduplication.test.ts` (NEW)

---

## 🔍 Current State Analysis

```bash
# Check current state
cat packages/query/src/queryAtom.ts | head -50
```

**Findings:**
- Current behavior: Each query fetch triggers a new network request
- Issues: Multiple components subscribing to same query cause duplicate requests
- Root cause: No deduplication mechanism implemented

---

## ✅ Acceptance Criteria

- [ ] `RequestDeduplicator` class implemented
- [ ] Pending requests tracked by key
- [ ] Duplicate requests return same promise
- [ ] Cleanup after request completes
- [ ] Request queue with priority support
- [ ] Max concurrent requests limit (default: 6)
- [ ] Tests written (≥10 test cases)
- [ ] Deduplication verified in integration tests

---

## 📝 Implementation Steps

### Step 1: Implement Request Deduplicator

**What:** Core deduplication logic

**How:**
```typescript
// src/deduplication.ts

export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>>;

  constructor() {
    this.pendingRequests = new Map();
  }

  async fetch<Data>(
    key: string,
    fetcher: () => Promise<Data>
  ): Promise<Data> {
    // Check if request already in flight
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`Deduplicating request for ${key}`);
      return pending; // Return existing promise
    }

    // Start new request
    const promise = fetcher()
      .finally(() => {
        // Clean up when done
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Cancel a pending request
  cancel(key: string): void {
    this.pendingRequests.delete(key);
  }

  // Check if request is pending
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  // Get count of pending requests
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}
```

**Validation:**
```bash
cd packages/query
pnpm run build
```

### Step 2: Implement Priority Queue

**What:** Priority-based request queue

**How:**
```typescript
// src/deduplication.ts (add to existing)

export enum Priority {
  CRITICAL = 0,  // User-initiated, blocking UI
  HIGH = 1,      // Visible on screen
  NORMAL = 2,    // Below fold
  LOW = 3,       // Prefetch, background
  IDLE = 4,      // Can wait indefinitely
}

type Request<Data> = {
  key: string;
  fetcher: () => Promise<Data>;
  priority: Priority;
  resolve: (value: Data) => void;
  reject: (error: Error) => void;
};

export class RequestQueue {
  private queue: Request<any>[];
  private activeRequests: Set<string>;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 6) {
    this.queue = [];
    this.activeRequests = new Set();
    this.maxConcurrent = maxConcurrent;
  }

  async enqueue<Data>(request: Request<Data>): Promise<Data> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        ...request,
        resolve,
        reject,
      });

      // Sort by priority
      this.queue.sort((a, b) => a.priority - b.priority);

      // Process queue
      this.processQueue();
    });
  }

  private async processQueue() {
    while (
      this.queue.length > 0 &&
      this.activeRequests.size < this.maxConcurrent
    ) {
      const request = this.queue.shift()!;
      this.activeRequests.add(request.key);

      request.fetcher()
        .then(result => {
          request.resolve(result);
        })
        .catch(error => {
          request.reject(error);
        })
        .finally(() => {
          this.activeRequests.delete(request.key);
          // Process next in queue
          this.processQueue();
        });
    }
  }

  // Cancel request by key
  cancel(key: string): void {
    const index = this.queue.findIndex(r => r.key === key);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  // Get queue length
  getQueueLength(): number {
    return this.queue.length;
  }

  // Get active count
  getActiveCount(): number {
    return this.activeRequests.size;
  }
}
```

**Validation:**
```bash
pnpm run build
```

### Step 3: Implement Query Manager

**What:** Combine deduplication with query execution

**How:**
```typescript
// src/queryManager.ts

import { RequestDeduplicator, RequestQueue, Priority } from './deduplication';
import { QueryCache } from './queryCache';
import type { QueryAtom, QueryState } from './types';

export class QueryManager {
  private deduplicator: RequestDeduplicator;
  private queue: RequestQueue;
  private cache: QueryCache;

  constructor(cache: QueryCache) {
    this.deduplicator = new RequestDeduplicator();
    this.queue = new RequestQueue(6); // Browser limit
    this.cache = cache;
  }

  async executeQuery<T>(
    atom: QueryAtom<T>,
    store: any
  ): Promise<void> {
    const { key, fetcher, options } = atom;
    const cacheKey = typeof key === 'string' ? key : JSON.stringify(key);

    // Check cache first
    const cached = await this.cache.get<T>(cacheKey);
    if (cached && !this.cache.isStale(cached)) {
      // Update atom with cached data
      store.set(atom, {
        ...store.get(atom),
        data: cached.data,
        status: 'success',
        dataUpdatedAt: cached.timestamp,
      });
      return;
    }

    // Execute with deduplication
    await this.deduplicator.fetch(cacheKey, async () => {
      const data = await fetcher({ queryKey: key });

      // Update cache
      await this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        staleTime: options.staleTime || 5 * 60 * 1000,
        cacheTime: options.cacheTime || 10 * 60 * 1000,
        subscribers: new Set(),
      });

      // Update atom state
      store.set(atom, {
        ...store.get(atom),
        data,
        status: 'success',
        isFetching: false,
        isLoading: false,
        dataUpdatedAt: Date.now(),
      });
    });
  }

  // Cancel pending query
  cancelQuery(key: string): void {
    this.deduplicator.cancel(key);
    this.queue.cancel(key);
  }

  // Check if query is fetching
  isFetching(key: string): boolean {
    return this.deduplicator.isPending(key);
  }
}

// Singleton instance
export const queryManager = new QueryManager(queryCache);
```

**Validation:**
```bash
pnpm run build
```

### Step 4: Write Tests

**What:** Test deduplication functionality

**How:**
```typescript
// src/__tests__/deduplication.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestDeduplicator, RequestQueue, Priority } from '../deduplication';

describe('RequestDeduplicator', () => {
  let deduplicator: RequestDeduplicator;

  beforeEach(() => {
    deduplicator = new RequestDeduplicator();
  });

  it('should execute first request', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    const result = await deduplicator.fetch('key1', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result).toBe('data');
  });

  it('should deduplicate concurrent requests', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    // Start multiple requests concurrently
    const [result1, result2, result3] = await Promise.all([
      deduplicator.fetch('key1', fetcher),
      deduplicator.fetch('key1', fetcher),
      deduplicator.fetch('key1', fetcher),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result1).toBe('data');
    expect(result2).toBe('data');
    expect(result3).toBe('data');
  });

  it('should clean up after completion', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    await deduplicator.fetch('key1', fetcher);

    expect(deduplicator.isPending('key1')).toBe(false);
    expect(deduplicator.getPendingCount()).toBe(0);
  });

  it('should handle different keys separately', async () => {
    const fetcher1 = vi.fn().mockResolvedValue('data1');
    const fetcher2 = vi.fn().mockResolvedValue('data2');

    await Promise.all([
      deduplicator.fetch('key1', fetcher1),
      deduplicator.fetch('key2', fetcher2),
    ]);

    expect(fetcher1).toHaveBeenCalledTimes(1);
    expect(fetcher2).toHaveBeenCalledTimes(1);
  });

  it('should handle errors correctly', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Failed'));

    await expect(deduplicator.fetch('key1', fetcher)).rejects.toThrow('Failed');
    expect(deduplicator.isPending('key1')).toBe(false);
  });
});

describe('RequestQueue', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = new RequestQueue(2); // Max 2 concurrent
  });

  it('should respect max concurrent limit', async () => {
    const active: string[] = [];
    const maxActive: number[] = [];

    const createFetcher = (key: string) => async () => {
      active.push(key);
      maxActive.push(active.length);
      await new Promise(resolve => setTimeout(resolve, 10));
      active = active.filter(k => k !== key);
      return key;
    };

    await Promise.all([
      queue.enqueue({ key: '1', fetcher: createFetcher('1'), priority: Priority.NORMAL, resolve: () => {}, reject: () => {} }),
      queue.enqueue({ key: '2', fetcher: createFetcher('2'), priority: Priority.NORMAL, resolve: () => {}, reject: () => {} }),
      queue.enqueue({ key: '3', fetcher: createFetcher('3'), priority: Priority.NORMAL, resolve: () => {}, reject: () => {} }),
    ]);

    expect(Math.max(...maxActive)).toBe(2);
  });

  it('should prioritize requests', async () => {
    const order: string[] = [];

    const createFetcher = (key: string) => async () => {
      order.push(key);
      return key;
    };

    // Add in reverse priority order
    await Promise.all([
      queue.enqueue({ key: 'low', fetcher: createFetcher('low'), priority: Priority.LOW, resolve: () => {}, reject: () => {} }),
      queue.enqueue({ key: 'high', fetcher: createFetcher('high'), priority: Priority.HIGH, resolve: () => {}, reject: () => {} }),
      queue.enqueue({ key: 'critical', fetcher: createFetcher('critical'), priority: Priority.CRITICAL, resolve: () => {}, reject: () => {} }),
    ]);

    expect(order[0]).toBe('critical');
    expect(order[1]).toBe('high');
    expect(order[2]).toBe('low');
  });
});
```

**Validation:**
```bash
pnpm run test
```

---

## 🧪 Validation Commands

```bash
cd packages/query
pnpm run test
pnpm run test:coverage
pnpm run build
pnpm run lint
```

**Expected Output:**
```
✓ All tests passing (10+ tests)
✓ Coverage: >80%
✓ Build successful
```

---

## 📚 Context & Background

### Why This Matters

Deduplication prevents:
- Wasted bandwidth from duplicate requests
- Server overload from identical requests
- Inconsistent UI from race conditions
- Poor user experience

### Technical Context

Based on ARCHITECTURE.md:
- Track pending requests by key
- Return same promise for duplicates
- Clean up on completion
- Priority queue for request management

### Related Documentation

- [ARCHITECTURE.md - Request Deduplication](../../packages/query/ARCHITECTURE.md#request-deduplication)

---

## 🔗 Related Tasks

- **Depends On:** QUERY-001 (base), QUERY-002 (Query Atom), QUERY-003 (Cache)
- **Blocks:** QUERY-005 (Background Refetch)
- **Related:** QUERY-006 (Optimistic Updates)

---

## 📊 Definition of Done

- [ ] RequestDeduplicator implemented
- [ ] RequestQueue with priority support
- [ ] QueryManager integrates deduplication
- [ ] Tests written (≥10 test cases)
- [ ] Concurrent deduplication verified
- [ ] TypeScript strict mode compliant
- [ ] CI passing

---

## 🚀 Implementation Checklist

```bash
# 1. Create branch
git checkout -b feature/QUERY-004

# 2. Implement deduplication
# Create src/deduplication.ts

# 3. Implement query manager
# Create src/queryManager.ts

# 4. Write tests
# Create src/__tests__/deduplication.test.ts

# 5. Run tests
pnpm run test

# 6. Commit
git add .
git commit -m "feat(query): implement request deduplication

- Add RequestDeduplicator for concurrent request merging
- Add RequestQueue with priority support
- Add QueryManager integrating cache and deduplication
- Comprehensive test suite

Resolves: QUERY-004"

# 7. Push
git push origin feature/QUERY-004
```

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-03-05  
**Actual Completion:** TBD

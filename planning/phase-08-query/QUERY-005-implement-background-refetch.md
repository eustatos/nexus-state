# QUERY-005: Implement Background Refetch

## 📋 Task Overview

**Priority:** 🟡 Medium  
**Estimated Time:** 8 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  

---

## 🎯 Objective

Implement background refetch mechanisms including polling, focus-based refetch, and network-based refetch.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files:**
- `packages/query/src/backgroundRefetch.ts` (NEW)
- `packages/query/src/queryManager.ts` (UPDATE)
- `packages/query/src/__tests__/backgroundRefetch.test.ts` (NEW)

---

## 🔍 Current State Analysis

**Findings:**
- Current behavior: Queries only fetch on initial subscription
- Issues: No automatic refresh, stale data persists
- Root cause: Background refetch not implemented

---

## ✅ Acceptance Criteria

- [ ] Polling with configurable intervals
- [ ] Focus-based refetch (window focus)
- [ ] Network-based refetch (reconnect)
- [ ] Visibility-based refetch
- [ ] Adaptive refetch intervals
- [ ] Start/stop polling controls
- [ ] Tests written (≥12 test cases)

---

## 📝 Implementation Steps

### Step 1: Implement Background Refetch Manager

**How:**
```typescript
// src/backgroundRefetch.ts

import { QueryCache } from './queryCache';
import type { QueryKey } from './types';

export type RefetchTriggers = {
  refetchInterval?: number;          // Time-based polling
  refetchOnWindowFocus?: boolean;     // Focus-based
  refetchOnReconnect?: boolean;       // Network-based
  refetchOnMount?: boolean;           // Mount-based
  refetchOnVisible?: boolean;         // Visibility-based
};

export class BackgroundRefetchManager {
  private cache: QueryCache;
  private intervals: Map<string, NodeJS.Timeout>;
  private unsubscribeFocus: (() => void) | null;
  private unsubscribeNetwork: (() => void) | null;
  private observers: Map<string, IntersectionObserver>;

  constructor(cache: QueryCache) {
    this.cache = cache;
    this.intervals = new Map();
    this.unsubscribeFocus = null;
    this.unsubscribeNetwork = null;
    this.observers = new Map();
  }

  // Polling
  startPolling(queryKey: string, interval: number, refetchFn: () => void) {
    this.stopPolling(queryKey);

    const timer = setInterval(() => {
      refetchFn();
    }, interval);

    this.intervals.set(queryKey, timer);
  }

  stopPolling(queryKey: string) {
    const timer = this.intervals.get(queryKey);
    if (timer) {
      clearInterval(timer);
      this.intervals.delete(queryKey);
    }
  }

  // Focus refetch
  onWindowFocus(queryKey: string, refetchFn: () => void) {
    if (!this.unsubscribeFocus) {
      const handler = () => {
        // Trigger refetch for all queries that need it
        // Implementation depends on query tracking
      };

      window.addEventListener('focus', handler);
      this.unsubscribeFocus = () => {
        window.removeEventListener('focus', handler);
      };
    }
  }

  // Network refetch
  onReconnect(queryKey: string, refetchFn: () => void) {
    if (!this.unsubscribeNetwork) {
      const handler = () => {
        // Refetch on reconnect
      };

      window.addEventListener('online', handler);
      this.unsubscribeNetwork = () => {
        window.removeEventListener('online', handler);
      };
    }
  }

  // Visibility refetch
  observeVisibility(
    element: Element,
    queryKey: string,
    refetchFn: () => void
  ) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        refetchFn();
      }
    });

    observer.observe(element);
    this.observers.set(queryKey, observer);
  }

  // Cleanup
  cleanup(queryKey: string) {
    this.stopPolling(queryKey);

    const observer = this.observers.get(queryKey);
    if (observer) {
      observer.disconnect();
      this.observers.delete(queryKey);
    }
  }

  // Cleanup all
  destroy() {
    this.intervals.forEach(timer => clearInterval(timer));
    this.intervals.clear();

    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    this.unsubscribeFocus?.();
    this.unsubscribeNetwork?.();
  }
}
```

---

## 🧪 Validation Commands

```bash
cd packages/query
pnpm run test
pnpm run build
```

---

## 🔗 Related Tasks

- **Depends On:** QUERY-003 (Cache), QUERY-004 (Deduplication)
- **Blocks:** QUERY-009 (Tests)
- **Related:** QUERY-006 (Optimistic Updates)

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-03-06  
**Actual Completion:** TBD

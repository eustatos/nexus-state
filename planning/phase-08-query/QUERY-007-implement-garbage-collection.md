# QUERY-007: Implement Garbage Collection

## 📋 Task Overview

**Priority:** 🟡 Medium  
**Estimated Time:** 6 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  

---

## 🎯 Objective

Implement automatic garbage collection to remove stale cache entries and prevent memory leaks.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files:**
- `packages/query/src/garbageCollection.ts` (NEW)
- `packages/query/src/queryCache.ts` (UPDATE)
- `packages/query/src/__tests__/garbageCollection.test.ts` (NEW)

---

## 🔍 Current State Analysis

**Findings:**
- Current behavior: Cache entries never removed
- Issues: Memory leaks, stale data accumulation
- Root cause: GC not implemented

---

## ✅ Acceptance Criteria

- [ ] GC runs on configurable interval
- [ ] Evicts entries older than cacheTime
- [ ] Preserves entries with active subscribers
- [ ] Manual GC trigger function
- [ ] GC statistics tracking
- [ ] Tests written (≥8 test cases)

---

## 📝 Implementation Steps

### Step 1: Implement GC Manager

**How:**
```typescript
// src/garbageCollection.ts

import { QueryCache } from './queryCache';
import type { CacheEntry } from './types';

export type GCConfig = {
  interval: number;        // How often to run GC
  cacheTime: number;       // Default cache time
};

export class GarbageCollector {
  private cache: QueryCache;
  private config: GCConfig;
  private timer: NodeJS.Timeout | null;
  private stats: {
    runs: number;
    entriesCollected: number;
    lastRun: number | null;
  };

  constructor(cache: QueryCache, config?: Partial<GCConfig>) {
    this.cache = cache;
    this.config = {
      interval: 60 * 1000,  // 1 minute
      cacheTime: 10 * 60 * 1000,  // 10 minutes
      ...config,
    };
    this.timer = null;
    this.stats = {
      runs: 0,
      entriesCollected: 0,
      lastRun: null,
    };
  }

  // Run GC
  async collect(): Promise<number> {
    const now = Date.now();
    const keys = await this.cache.keys();
    let collected = 0;

    for (const key of keys) {
      const entry = await this.cache.get(key);
      if (entry && this.shouldEvict(entry, now)) {
        await this.cache.invalidate(key);
        collected++;
      }
    }

    // Update stats
    this.stats.runs++;
    this.stats.entriesCollected += collected;
    this.stats.lastRun = now;

    return collected;
  }

  // Check if entry should be evicted
  private shouldEvict(entry: CacheEntry, now: number): boolean {
    const age = now - entry.timestamp;
    const hasSubscribers = entry.subscribers.size > 0;
    return age > entry.cacheTime && !hasSubscribers;
  }

  // Start automatic GC
  start() {
    this.stop();
    this.timer = setInterval(() => {
      this.collect();
    }, this.config.interval);
  }

  // Stop automatic GC
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Get stats
  getStats() {
    return { ...this.stats };
  }
}
```

---

## 🔗 Related Tasks

- **Depends On:** QUERY-003 (Cache)
- **Blocks:** QUERY-009 (Tests)
- **Related:** QUERY-005 (Background Refetch)

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-03-08  
**Actual Completion:** TBD

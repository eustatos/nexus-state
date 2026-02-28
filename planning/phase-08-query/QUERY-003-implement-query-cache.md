# QUERY-003: Implement Query Cache

## 📋 Task Overview

**Priority:** 🔴 High  
**Estimated Time:** 12 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  

---

## 🎯 Objective

Implement a multi-tier caching system for query results with in-memory, session storage, and IndexedDB support.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files:**
- `packages/query/src/queryCache.ts` (NEW)
- `packages/query/src/cacheStorage.ts` (NEW)
- `packages/query/src/types.ts` (UPDATE)
- `packages/query/src/__tests__/queryCache.test.ts` (NEW)

---

## 🔍 Current State Analysis

```bash
# Check current state
ls -la packages/query/src/
```

**Findings:**
- Current behavior: Query atom exists but no caching
- Issues: Every fetch triggers network request, no data persistence
- Root cause: Cache layer not implemented

---

## ✅ Acceptance Criteria

- [ ] 3-tier caching: memory, session, IndexedDB
- [ ] Cache entries include timestamp and metadata
- [ ] `get(key)` checks all tiers in order
- [ ] `set(key, entry)` stores in all tiers
- [ ] `invalidate(key)` removes from all tiers
- [ ] `clear()` removes all entries
- [ ] Cache hit rate > 80% in tests
- [ ] Tests written (≥15 test cases)

---

## 📝 Implementation Steps

### Step 1: Define Cache Types

**What:** Add cache-related types

**How:**
```typescript
// src/types.ts (add to existing)

export type CacheEntry<T = unknown> = {
  data: T;
  timestamp: number;
  staleTime: number;
  cacheTime: number;
  subscribers: Set<string>;
};

export type CacheTier = 'memory' | 'session' | 'indexeddb';

export type CacheConfig = {
  staleTime: number;      // Data considered fresh for this duration
  cacheTime: number;      // Data kept in cache for this duration
  maxEntries?: number;    // Maximum entries per tier
};

export interface ICacheStorage {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
```

**Validation:**
```bash
cd packages/query
pnpm run build
```

### Step 2: Implement Memory Cache Storage

**What:** Fast in-memory cache layer

**How:**
```typescript
// src/cacheStorage.ts

import type { CacheEntry, ICacheStorage } from './types';

export class MemoryCacheStorage implements ICacheStorage {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map();
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    return (entry as CacheEntry<T>) || null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    this.cache.set(key, entry as CacheEntry);
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }
}
```

**Validation:**
```bash
pnpm run build
```

### Step 3: Implement Session Storage Cache

**What:** Browser session storage layer

**How:**
```typescript
// src/cacheStorage.ts (add to existing)

export class SessionStorageCache implements ICacheStorage {
  private prefix = 'nexus-query:';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      if (!item) return null;
      return JSON.parse(item) as CacheEntry<T>;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch {
      // Storage full or unavailable
      console.warn('SessionStorage cache failed');
    }
  }

  async remove(key: string): Promise<void> {
    sessionStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => sessionStorage.removeItem(key));
  }

  async keys(): Promise<string[]> {
    return Object.keys(sessionStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''));
  }
}
```

**Validation:**
```bash
pnpm run build
```

### Step 4: Implement IndexedDB Cache

**What:** Persistent IndexedDB layer

**How:**
```typescript
// src/cacheStorage.ts (add to existing)

const DB_NAME = 'nexus-query-cache';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

export class IndexedDBCache implements ICacheStorage {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result?.value || null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put({ key, value: entry });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      console.warn('IndexedDB cache failed');
    }
  }

  async remove(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async keys(): Promise<string[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
}
```

**Validation:**
```bash
pnpm run build
```

### Step 5: Implement Query Cache System

**What:** Main cache manager with 3-tier logic

**How:**
```typescript
// src/queryCache.ts

import type { CacheEntry, CacheConfig, ICacheStorage } from './types';
import { MemoryCacheStorage, SessionStorageCache, IndexedDBCache } from './cacheStorage';

export class QueryCache {
  private memoryCache: ICacheStorage;
  private sessionCache: ICacheStorage;
  private persistentCache: ICacheStorage;
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      cacheTime: 10 * 60 * 1000,     // 10 minutes
      ...config,
    };

    this.memoryCache = new MemoryCacheStorage();
    this.sessionCache = new SessionStorageCache();
    this.persistentCache = new IndexedDBCache();
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    // Tier 1: Check memory cache (fastest)
    let entry = await this.memoryCache.get<T>(key);
    if (entry) {
      return entry;
    }

    // Tier 2: Check session storage
    entry = await this.sessionCache.get<T>(key);
    if (entry) {
      // Promote to memory cache
      await this.memoryCache.set(key, entry);
      return entry;
    }

    // Tier 3: Check IndexedDB
    entry = await this.persistentCache.get<T>(key);
    if (entry) {
      // Promote to memory and session
      await Promise.all([
        this.memoryCache.set(key, entry),
        this.sessionCache.set(key, entry),
      ]);
      return entry;
    }

    return null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    // Store in all tiers
    await Promise.all([
      this.memoryCache.set(key, entry),
      this.sessionCache.set(key, entry),
      this.persistentCache.set(key, entry),
    ]);
  }

  async invalidate(key: string): Promise<void> {
    // Remove from all tiers
    await Promise.all([
      this.memoryCache.remove(key),
      this.sessionCache.remove(key),
      this.persistentCache.remove(key),
    ]);
  }

  async clear(): Promise<void> {
    // Clear all tiers
    await Promise.all([
      this.memoryCache.clear(),
      this.sessionCache.clear(),
      this.persistentCache.clear(),
    ]);
  }

  async keys(): Promise<string[]> {
    const keys = await this.memoryCache.keys();
    return [...new Set(keys)];
  }

  isStale(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age > entry.staleTime;
  }

  shouldEvict(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    const hasSubscribers = entry.subscribers.size > 0;
    return age > entry.cacheTime && !hasSubscribers;
  }
}

// Singleton instance
export const queryCache = new QueryCache();
```

**Validation:**
```bash
pnpm run build
```

### Step 6: Write Comprehensive Tests

**What:** Test all cache functionality

**How:**
```typescript
// src/__tests__/queryCache.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { QueryCache } from '../queryCache';
import type { CacheEntry } from '../types';

describe('QueryCache', () => {
  let cache: QueryCache;

  beforeEach(() => {
    cache = new QueryCache({
      staleTime: 1000,
      cacheTime: 2000,
    });
  });

  it('should return null for non-existent key', async () => {
    const entry = await cache.get('nonexistent');
    expect(entry).toBeNull();
  });

  it('should set and get entry', async () => {
    const testEntry: CacheEntry<string> = {
      data: 'test data',
      timestamp: Date.now(),
      staleTime: 1000,
      cacheTime: 2000,
      subscribers: new Set(),
    };

    await cache.set('test', testEntry);
    const retrieved = await cache.get('test');

    expect(retrieved).NotNull;
    expect(retrieved?.data).toBe('test data');
  });

  it('should invalidate entry', async () => {
    const testEntry: CacheEntry<string> = {
      data: 'test',
      timestamp: Date.now(),
      staleTime: 1000,
      cacheTime: 2000,
      subscribers: new Set(),
    };

    await cache.set('test', testEntry);
    await cache.invalidate('test');

    const retrieved = await cache.get('test');
    expect(retrieved).toBeNull();
  });

  it('should clear all entries', async () => {
    await cache.set('key1', { data: '1', timestamp: Date.now(), staleTime: 1000, cacheTime: 2000, subscribers: new Set() });
    await cache.set('key2', { data: '2', timestamp: Date.now(), staleTime: 1000, cacheTime: 2000, subscribers: new Set() });

    await cache.clear();

    expect(await cache.get('key1')).toBeNull();
    expect(await cache.get('key2')).toBeNull();
  });

  it('should detect stale entries', () => {
    const freshEntry: CacheEntry = {
      data: 'fresh',
      timestamp: Date.now(),
      staleTime: 5000,
      cacheTime: 10000,
      subscribers: new Set(),
    };

    const staleEntry: CacheEntry = {
      data: 'stale',
      timestamp: Date.now() - 10000,
      staleTime: 5000,
      cacheTime: 10000,
      subscribers: new Set(),
    };

    expect(cache.isStale(freshEntry)).toBe(false);
    expect(cache.isStale(staleEntry)).toBe(true);
  });

  it('should detect entries for eviction', () => {
    const activeEntry: CacheEntry = {
      data: 'active',
      timestamp: Date.now() - 10000,
      staleTime: 1000,
      cacheTime: 5000,
      subscribers: new Set(['subscriber1']),
    };

    const evictableEntry: CacheEntry = {
      data: 'evict',
      timestamp: Date.now() - 10000,
      staleTime: 1000,
      cacheTime: 5000,
      subscribers: new Set(),
    };

    expect(cache.shouldEvict(activeEntry)).toBe(false);
    expect(cache.shouldEvict(evictableEntry)).toBe(true);
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
# Run tests
cd packages/query
pnpm run test

# Check coverage
pnpm run test:coverage

# Build
pnpm run build

# Lint
pnpm run lint
```

**Expected Output:**
```
✓ All tests passing (15+ tests)
✓ Coverage: >85%
✓ Build successful
✓ ESLint passing
```

---

## 📚 Context & Background

### Why This Matters

Caching is critical for:
- Reducing unnecessary network requests
- Improving application performance
- Supporting offline functionality
- Providing instant UI updates

### Technical Context

Based on ARCHITECTURE.md:
- 3-tier caching: memory (fastest), session, IndexedDB (persistent)
- Staleness model with configurable times
- Automatic promotion between tiers
- Garbage collection for evictable entries

### Related Documentation

- [ARCHITECTURE.md - Caching Strategy](../../packages/query/ARCHITECTURE.md#caching-strategy)

---

## 🔗 Related Tasks

- **Depends On:** QUERY-001 (base), QUERY-002 (Query Atom)
- **Blocks:** QUERY-004 (Deduplication), QUERY-005 (Background Refetch), QUERY-007 (GC)
- **Related:** QUERY-006 (Optimistic Updates)

---

## 📊 Definition of Done

- [ ] 3-tier cache implemented
- [ ] All cache operations working (get, set, invalidate, clear)
- [ ] Staleness detection implemented
- [ ] Eviction detection implemented
- [ ] Tests written (≥15 test cases)
- [ ] Cache hit rate > 80% in tests
- [ ] TypeScript strict mode compliant
- [ ] CI passing

---

## 🚀 Implementation Checklist

```bash
# 1. Create branch
git checkout -b feature/QUERY-003

# 2. Implement cache storage layers
# Create src/cacheStorage.ts

# 3. Implement query cache
# Create src/queryCache.ts

# 4. Update types
# Update src/types.ts

# 5. Write tests
# Create src/__tests__/queryCache.test.ts

# 6. Run tests
pnpm run test

# 7. Commit
git add .
git commit -m "feat(query): implement 3-tier cache system

- Add MemoryCacheStorage, SessionStorageCache, IndexedDBCache
- Implement QueryCache with tier promotion
- Add staleness and eviction detection
- Comprehensive test suite

Resolves: QUERY-003"

# 8. Push
git push origin feature/QUERY-003
```

---

## 📝 Notes for AI Agent

### Key Considerations

- Memory cache is fastest but cleared on page reload
- Session storage survives navigation
- IndexedDB survives browser restart
- Handle storage errors gracefully

### Edge Cases

- Storage quota exceeded
- IndexedDB not available (private browsing)
- Concurrent access from multiple tabs
- Serialization of complex objects

### Performance Tips

```typescript
// Batch operations when possible
await Promise.all([
  this.memoryCache.set(key, entry),
  this.sessionCache.set(key, entry),
]);

// Check memory first (fastest path)
const entry = await this.memoryCache.get(key);
if (entry) return entry;
```

---

## 🐛 Known Issues / Blockers

- [ ] No known issues

---

## 📈 Progress Tracking

**Started:** TBD  
**Last Updated:** 2026-02-28  
**Completed:** TBD  

**Time Spent:** 0 hours (vs estimated 12 hours)

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-03-04  
**Actual Completion:** TBD

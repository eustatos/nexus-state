# QUERY-008: Add TypeScript Types

## 📋 Task Overview

**Priority:** 🔴 High  
**Estimated Time:** 4 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  

---

## 🎯 Objective

Ensure comprehensive TypeScript type coverage for all query package exports with proper type inference.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files:**
- `packages/query/src/types.ts` (UPDATE)
- `packages/query/src/index.ts` (UPDATE)
- All package files (type annotations)

---

## 🔍 Current State Analysis

**Findings:**
- Current behavior: Basic types exist
- Issues: May lack advanced type inference, generics
- Root cause: Types need enhancement for full DX

---

## ✅ Acceptance Criteria

- [ ] All public APIs fully typed
- [ ] Type inference works for query data
- [ ] Generic types for custom configurations
- [ ] Utility types exported
- [ ] No `any` types (use `unknown`)
- [ ] TypeScript strict mode passes
- [ ] Type tests included

---

## 📝 Implementation Steps

### Step 1: Enhance Type Definitions

**How:**
```typescript
// src/types.ts

// Query key helpers
export type QueryKeyFunction = (args: any) => QueryKey;

// Query config with defaults
export type QueryConfig = {
  defaultStaleTime?: number;
  defaultCacheTime?: number;
  defaultRetry?: number;
  defaultRefetchOnWindowFocus?: boolean;
};

// UseQuery hook types (for React integration)
export type UseQueryOptions<T> = QueryOptions<T> & {
  enabled?: boolean;
  suspense?: boolean;
  select?: (data: T) => any;
};

export type UseQueryResult<T> = QueryState<T> & {
  refetch: () => Promise<void>;
  invalidate: () => void;
};

// Mutation types
export type MutationKey = string | readonly unknown[];

export type MutationState<Data, Error = unknown> = {
  data: Data | undefined;
  error: Error | undefined;
  status: 'idle' | 'loading' | 'success' | 'error';
  reset: () => void;
};
```

### Step 2: Add Type Tests

**How:**
```typescript
// src/__tests__/types.test.ts

import { describe, it, expectTypeOf } from 'vitest';
import { queryAtom } from '../queryAtom';
import type { QueryState } from '../types';

describe('TypeScript Types', () => {
  it('should infer data type from fetcher', () => {
    const query = queryAtom({
      key: 'user',
      fetcher: async () => ({ id: 1, name: 'John' }),
    });

    expectTypeOf<QueryState<{ id: number; name: string }>>()
      .toMatchTypeOf<ReturnType<typeof query.read>>();
  });

  it('should accept generic type parameter', () => {
    interface User {
      id: number;
      name: string;
    }

    const query = queryAtom<User>({
      key: 'user',
      fetcher: async () => ({ id: 1, name: 'John' }),
    });

    expectTypeOf<QueryState<User>>()
      .toMatchTypeOf<ReturnType<typeof query.read>>();
  });
});
```

---

## 🔗 Related Tasks

- **Depends On:** QUERY-002 (Query Atom), QUERY-006 (Optimistic Updates)
- **Blocks:** QUERY-009 (Tests), QUERY-010 (Documentation)
- **Related:** Phase 02 (Code Quality - TypeScript strict)

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-03-05  
**Actual Completion:** TBD

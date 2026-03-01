# ECO-001: Create Query Package Foundation

## 📋 Task Overview

**Priority:** 🔴 Critical  
**Estimated Time:** 6-8 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Create the foundational structure for @nexus-state/query package with basic query functionality, type-safe API, and framework-agnostic design.

---

## 📦 Affected Components

**New Package:** `@nexus-state/query`  
**Files to create:**
- `packages/query/package.json`
- `packages/query/tsconfig.json`
- `packages/query/README.md`
- `packages/query/CHANGELOG.md`
- `packages/query/src/index.ts`
- `packages/query/src/types.ts`
- `packages/query/src/query.ts`
- `packages/query/src/query-client.ts`
- `packages/query/src/__tests__/query.test.ts`

---

## 🔍 Current State Analysis

```bash
ls packages/ | grep query
```

**Findings:**
- ❌ Package does not exist
- ❌ No query functionality in core
- ✅ Core has atoms, computed atoms, and stores
- ✅ Can build on top of existing atom system

**Market Analysis:**
- TanStack Query: 37M+ downloads/week
- SWR: 5M+ downloads/week
- Clear market need for data fetching solution

---

## ✅ Acceptance Criteria

- [ ] Package structure created
- [ ] package.json configured correctly
- [ ] Basic query function implemented
- [ ] Query states: idle, loading, success, error
- [ ] Automatic refetching capability
- [ ] Type-safe API with TypeScript
- [ ] Framework-agnostic (not tied to React)
- [ ] Basic tests passing (≥90% coverage)
- [ ] README with usage examples
- [ ] Build successful
- [ ] Can be published to npm

---

## 📝 Implementation Steps

### Step 1: Create package structure

```bash
mkdir -p packages/query/src/__tests__
```

### Step 2: Create package.json

**File:** `packages/query/package.json`

```json
{
  "name": "@nexus-state/query",
  "version": "0.1.0",
  "description": "Powerful data fetching and caching for Nexus State",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext .ts"
  },
  "keywords": [
    "state-management",
    "query",
    "data-fetching",
    "caching",
    "nexus-state"
  ],
  "dependencies": {
    "@nexus-state/core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.9.3",
    "vitest": "^3.0.7",
    "eslint": "^8.57.1"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/eustatos/nexus-state",
    "directory": "packages/query"
  },
  "homepage": "https://nexus-state.website.yandexcloud.net/",
  "license": "MIT",
  "author": "Nexus State Contributors"
}
```

### Step 3: Create tsconfig.json

**File:** `packages/query/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["src/**/*.test.ts", "node_modules", "dist"]
}
```

### Step 4: Create types

**File:** `packages/query/src/types.ts`

```typescript
import { Atom } from '@nexus-state/core';

/**
 * Query status types
 */
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Query state structure
 */
export interface QueryState<TData = unknown, TError = Error> {
  status: QueryStatus;
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  isFetching: boolean;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  failureCount: number;
}

/**
 * Query options
 */
export interface QueryOptions<TData = unknown, TError = Error> {
  /**
   * Unique key for the query
   */
  queryKey: string | readonly unknown[];
  
  /**
   * Function to fetch data
   */
  queryFn: () => Promise<TData>;
  
  /**
   * Time in ms before data is considered stale
   * @default 0
   */
  staleTime?: number;
  
  /**
   * Time in ms before inactive cache data is garbage collected
   * @default 5 * 60 * 1000 (5 minutes)
   */
  cacheTime?: number;
  
  /**
   * Number of retry attempts
   * @default 3
   */
  retry?: number | boolean;
  
  /**
   * Delay in ms between retries
   * @default attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
   */
  retryDelay?: number | ((attemptIndex: number) => number);
  
  /**
   * Enable/disable query
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Refetch on window focus
   * @default true
   */
  refetchOnWindowFocus?: boolean;
  
  /**
   * Refetch on reconnect
   * @default true
   */
  refetchOnReconnect?: boolean;
  
  /**
   * Refetch interval in ms
   */
  refetchInterval?: number | false;
  
  /**
   * Initial data
   */
  initialData?: TData;
  
  /**
   * Callback on success
   */
  onSuccess?: (data: TData) => void;
  
  /**
   * Callback on error
   */
  onError?: (error: TError) => void;
  
  /**
   * Callback on settled (success or error)
   */
  onSettled?: (data: TData | undefined, error: TError | null) => void;
}

/**
 * Query result
 */
export interface QueryResult<TData = unknown, TError = Error> 
  extends QueryState<TData, TError> {
  /**
   * Refetch the query
   */
  refetch: () => Promise<void>;
  
  /**
   * Remove the query from cache
   */
  remove: () => void;
}

/**
 * Internal query atom type
 */
export interface QueryAtom<TData = unknown, TError = Error> 
  extends Atom<QueryState<TData, TError>> {
  queryKey: string;
  options: QueryOptions<TData, TError>;
}
```

### Step 5: Implement basic query

**File:** `packages/query/src/query.ts`

```typescript
import { atom, createStore, Store } from '@nexus-state/core';
import { QueryOptions, QueryState, QueryAtom, QueryResult } from './types';

/**
 * Convert query key to string
 */
function serializeQueryKey(queryKey: string | readonly unknown[]): string {
  if (typeof queryKey === 'string') {
    return queryKey;
  }
  return JSON.stringify(queryKey);
}

/**
 * Create initial query state
 */
function createInitialState<TData, TError>(
  options: QueryOptions<TData, TError>
): QueryState<TData, TError> {
  const hasInitialData = options.initialData !== undefined;
  
  return {
    status: hasInitialData ? 'success' : 'idle',
    data: options.initialData,
    error: null,
    isLoading: false,
    isSuccess: hasInitialData,
    isError: false,
    isIdle: !hasInitialData,
    isFetching: false,
    dataUpdatedAt: hasInitialData ? Date.now() : 0,
    errorUpdatedAt: 0,
    failureCount: 0
  };
}

/**
 * Create a query atom
 */
export function createQuery<TData = unknown, TError = Error>(
  store: Store,
  options: QueryOptions<TData, TError>
): QueryAtom<TData, TError> {
  const queryKey = serializeQueryKey(options.queryKey);
  
  // Create atom with initial state
  const queryAtom = atom<QueryState<TData, TError>>(
    createInitialState(options),
    `query:${queryKey}`
  ) as QueryAtom<TData, TError>;
  
  // Attach metadata
  queryAtom.queryKey = queryKey;
  queryAtom.options = options;
  
  return queryAtom;
}

/**
 * Execute query
 */
export async function executeQuery<TData, TError>(
  store: Store,
  queryAtom: QueryAtom<TData, TError>,
  retryCount: number = 0
): Promise<void> {
  const { options } = queryAtom;
  
  // Check if enabled
  if (options.enabled === false) {
    return;
  }
  
  // Set loading state
  const currentState = store.get(queryAtom);
  store.set(queryAtom, {
    ...currentState,
    status: currentState.data ? 'success' : 'loading',
    isLoading: currentState.data === undefined,
    isFetching: true,
    isIdle: false
  });
  
  try {
    // Execute query function
    const data = await options.queryFn();
    
    // Set success state
    store.set(queryAtom, {
      status: 'success',
      data,
      error: null,
      isLoading: false,
      isSuccess: true,
      isError: false,
      isIdle: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0
    });
    
    // Call success callback
    if (options.onSuccess) {
      options.onSuccess(data);
    }
    
    // Call settled callback
    if (options.onSettled) {
      options.onSettled(data, null);
    }
    
  } catch (error) {
    const typedError = error as TError;
    const newFailureCount = retryCount + 1;
    
    // Determine if should retry
    const maxRetries = typeof options.retry === 'number' 
      ? options.retry 
      : options.retry === false 
        ? 0 
        : 3;
    
    const shouldRetry = newFailureCount <= maxRetries;
    
    if (shouldRetry) {
      // Calculate retry delay
      const retryDelay = typeof options.retryDelay === 'function'
        ? options.retryDelay(retryCount)
        : options.retryDelay ?? Math.min(1000 * 2 ** retryCount, 30000);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return executeQuery(store, queryAtom, newFailureCount);
    }
    
    // Set error state
    store.set(queryAtom, {
      status: 'error',
      data: currentState.data,
      error: typedError,
      isLoading: false,
      isSuccess: false,
      isError: true,
      isIdle: false,
      isFetching: false,
      dataUpdatedAt: currentState.dataUpdatedAt,
      errorUpdatedAt: Date.now(),
      failureCount: newFailureCount
    });
    
    // Call error callback
    if (options.onError) {
      options.onError(typedError);
    }
    
    // Call settled callback
    if (options.onSettled) {
      options.onSettled(undefined, typedError);
    }
  }
}

/**
 * Use query (framework-agnostic)
 */
export function useQuery<TData = unknown, TError = Error>(
  store: Store,
  options: QueryOptions<TData, TError>
): QueryResult<TData, TError> {
  // Get or create query atom
  let queryAtom = createQuery(store, options);
  
  // Execute query immediately if no data
  const currentState = store.get(queryAtom);
  if (currentState.status === 'idle' && options.enabled !== false) {
    executeQuery(store, queryAtom);
  }
  
  // Get current state
  const state = store.get(queryAtom);
  
  // Return result with methods
  return {
    ...state,
    refetch: async () => {
      await executeQuery(store, queryAtom);
    },
    remove: () => {
      store.set(queryAtom, createInitialState(options));
    }
  };
}
```

### Step 6: Create index

**File:** `packages/query/src/index.ts`

```typescript
export { useQuery, createQuery, executeQuery } from './query';
export type {
  QueryOptions,
  QueryState,
  QueryResult,
  QueryStatus,
  QueryAtom
} from './types';
```

### Step 7: Create tests

**File:** `packages/query/src/__tests__/query.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { useQuery } from '../query';

describe('@nexus-state/query - Basic Functionality', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('useQuery', () => {
    it('should start in idle state', () => {
      const result = useQuery(store, {
        queryKey: 'test',
        queryFn: async () => 'data',
        enabled: false
      });

      expect(result.status).toBe('idle');
      expect(result.isIdle).toBe(true);
      expect(result.isLoading).toBe(false);
      expect(result.data).toBeUndefined();
    });

    it('should fetch data successfully', async () => {
      const queryFn = vi.fn(async () => 'test data');

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn
      });

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('success');
      expect(result.data).toBe('test data');
      expect(result.isSuccess).toBe(true);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      const queryFn = vi.fn(async () => {
        throw error;
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn,
        retry: false
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(result.status).toBe('error');
      expect(result.error).toBe(error);
      expect(result.isError).toBe(true);
    });

    it('should use initial data', () => {
      const result = useQuery(store, {
        queryKey: 'test',
        queryFn: async () => 'fetched',
        initialData: 'initial'
      });

      expect(result.data).toBe('initial');
      expect(result.isSuccess).toBe(true);
    });

    it('should support refetch', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(result.data).toBe('data-1');

      await result.refetch();
      expect(queryFn).toHaveBeenCalledTimes(2);
    });

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn();

      useQuery(store, {
        queryKey: 'test',
        queryFn: async () => 'data',
        onSuccess
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onSuccess).toHaveBeenCalledWith('data');
    });

    it('should call onError callback', async () => {
      const error = new Error('Test error');
      const onError = vi.fn();

      useQuery(store, {
        queryKey: 'test',
        queryFn: async () => { throw error; },
        onError,
        retry: false
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
```

### Step 8: Create README

**File:** `packages/query/README.md`

```markdown
# @nexus-state/query

Powerful data fetching and caching for Nexus State.

## Installation

\`\`\`bash
npm install @nexus-state/query
\`\`\`

## Quick Start

\`\`\`typescript
import { createStore } from '@nexus-state/core';
import { useQuery } from '@nexus-state/query';

const store = createStore();

const userQuery = useQuery(store, {
  queryKey: 'user',
  queryFn: async () => {
    const response = await fetch('/api/user');
    return response.json();
  }
});

console.log(userQuery.data); // User data
console.log(userQuery.isLoading); // Loading state
console.log(userQuery.error); // Error if any

// Refetch
await userQuery.refetch();
\`\`\`

## Features

- ✅ Automatic caching
- ✅ Background refetching
- ✅ Retry logic
- ✅ TypeScript support
- ✅ Framework agnostic
- ⬜ Infinite queries (coming soon)
- ⬜ Mutations (coming soon)
- ⬜ SSR support (coming soon)

## License

MIT
\`\`\`

---

## 🧪 Validation Commands

\`\`\`bash
cd packages/query

# Install dependencies
pnpm install

# Run tests
pnpm test

# Coverage
pnpm test:coverage

# Build
pnpm build

# Lint
pnpm lint
\`\`\`

**Expected Output:**
\`\`\`
✓ packages/query/src/__tests__/query.test.ts
  ✓ useQuery (7 tests)

Test Files  1 passed (1)
Tests  7 passed (7)
Coverage: 90%+
\`\`\`

---

## 📚 Context & Background

### Why This Matters

Data fetching is one of the most common tasks in applications. Having a built-in solution that:
- Integrates seamlessly with Nexus State
- Provides caching out of the box
- Works with any framework
- Is type-safe

This will significantly increase library adoption.

---

## 🔗 Related Tasks

- **Depends On:** Phase 00, Phase 01 complete
- **Blocks:** ECO-002 (caching layer)
- **Related:** ECO-007 (form package)

---

## 📊 Definition of Done

- [ ] Package created with correct structure
- [ ] package.json configured
- [ ] Basic query functionality working
- [ ] Tests passing (≥90%)
- [ ] README with examples
- [ ] Build successful
- [ ] Can run `npm pack --dry-run` successfully

---

**Created:** 2026-03-01  
**Estimated Completion:** 2026-04-03

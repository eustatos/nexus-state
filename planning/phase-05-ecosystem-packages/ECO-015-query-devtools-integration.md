# ECO-015: Implement DevTools for @nexus-state/query

**Status:** 🔵 Not Started
**Priority:** 🟡 Medium
**Estimated Time:** 5-6 hours
**Dependencies:** ECO-006 (React hooks), @nexus-state/devtools
**Package:** @nexus-state/query

---

## 📋 Overview

Implement dedicated DevTools panel for `@nexus-state/query` to visualize query states, cache, and network activity - similar to TanStack Query DevTools.

**Key Goals:**
- Real-time query state visualization
- Cache inspection
- Network activity tracking
- Query invalidation UI
- TypeScript support

---

## 🎯 Objectives

### Must Have
- [ ] Query list panel
- [ ] Query state inspection (data, error, loading)
- [ ] Cache explorer
- [ ] Query invalidation button
- [ ] Refetch button
- [ ] Network activity timeline

### Should Have
- [ ] Query search/filter
- [ ] Query grouping
- [ ] Mutation tracking
- [ ] Stale data indicator
- [ ] Query key hierarchy view

### Nice to Have
- [ ] Query diff viewer
- [ ] Performance metrics
- [ ] Export query state
- [ ] Mock query responses
- [ ] Dark mode support

---

## 🏗️ Implementation Plan

### Step 1: Define DevTools Types (30 min)

**File:** `packages/query/src/devtools/types.ts`

```typescript
export interface QueryDevToolsConfig {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  initialIsOpen?: boolean;
  panelPosition?: 'left' | 'right' | 'bottom';
  closeButtonProps?: React.ComponentProps<'button'>;
  toggleButtonProps?: React.ComponentProps<'button'>;
}

export interface QuerySnapshot {
  queryKey: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  data: unknown;
  error: unknown;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  isFetching: boolean;
  isStale: boolean;
  failureCount: number;
}

export interface MutationSnapshot {
  mutationId: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  variables: unknown;
  data: unknown;
  error: unknown;
  failureCount: number;
}

export interface QueryCacheSnapshot {
  queries: QuerySnapshot[];
  mutations: MutationSnapshot[];
  timestamp: number;
}

export interface QueryDevToolsStore {
  queries: Map<string, QuerySnapshot>;
  mutations: Map<string, MutationSnapshot>;
  networkActivity: NetworkActivityEntry[];
  subscribe: (listener: () => void) => () => void;
  invalidateQuery: (queryKey: string) => void;
  refetchQuery: (queryKey: string) => Promise<void>;
  removeQuery: (queryKey: string) => void;
  clearCache: () => void;
}

export interface NetworkActivityEntry {
  id: string;
  queryKey: string;
  type: 'query' | 'mutation';
  status: 'pending' | 'success' | 'error';
  startedAt: number;
  endedAt?: number;
  duration?: number;
}
```

### Step 2: Implement DevTools Store (1.5 hours)

**File:** `packages/query/src/devtools/devtools-store.ts`

```typescript
import type {
  QueryDevToolsStore,
  QuerySnapshot,
  MutationSnapshot,
  NetworkActivityEntry,
} from './types';

export function createQueryDevToolsStore(): QueryDevToolsStore {
  const queries = new Map<string, QuerySnapshot>();
  const mutations = new Map<string, MutationSnapshot>();
  const networkActivity: NetworkActivityEntry[] = [];
  const listeners = new Set<() => void>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    queries,
    mutations,
    networkActivity,

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    invalidateQuery(queryKey: string) {
      const query = queries.get(queryKey);
      if (query) {
        query.isStale = true;
        notify();
      }
    },

    async refetchQuery(queryKey: string) {
      // Trigger refetch through query system
      console.log('Refetch:', queryKey);
      // Implementation depends on query cache integration
    },

    removeQuery(queryKey: string) {
      queries.delete(queryKey);
      notify();
    },

    clearCache() {
      queries.clear();
      mutations.clear();
      networkActivity.length = 0;
      notify();
    },
  };
}

// Global instance
let globalDevToolsStore: QueryDevToolsStore | null = null;

export function getQueryDevToolsStore(): QueryDevToolsStore {
  if (!globalDevToolsStore) {
    globalDevToolsStore = createQueryDevToolsStore();
  }
  return globalDevToolsStore;
}
```

### Step 3: Implement Query Tracker Plugin (1 hour)

**File:** `packages/query/src/devtools/query-tracker.ts`

```typescript
import { getQueryDevToolsStore } from './devtools-store';
import type { QuerySnapshot, NetworkActivityEntry } from './types';

/**
 * Track query for DevTools
 */
export function trackQuery(queryKey: string, snapshot: QuerySnapshot): void {
  if (typeof window === 'undefined') return;

  const store = getQueryDevToolsStore();
  store.queries.set(queryKey, snapshot);
}

/**
 * Track network activity
 */
export function trackNetworkActivity(
  queryKey: string,
  type: 'query' | 'mutation'
): string {
  if (typeof window === 'undefined') return '';

  const store = getQueryDevToolsStore();
  const activityId = `${type}-${queryKey}-${Date.now()}`;

  const entry: NetworkActivityEntry = {
    id: activityId,
    queryKey,
    type,
    status: 'pending',
    startedAt: Date.now(),
  };

  store.networkActivity.push(entry);

  // Keep only last 100 entries
  if (store.networkActivity.length > 100) {
    store.networkActivity.shift();
  }

  return activityId;
}

/**
 * Update network activity status
 */
export function updateNetworkActivity(
  activityId: string,
  status: 'success' | 'error'
): void {
  if (typeof window === 'undefined') return;

  const store = getQueryDevToolsStore();
  const entry = store.networkActivity.find((e) => e.id === activityId);

  if (entry) {
    entry.status = status;
    entry.endedAt = Date.now();
    entry.duration = entry.endedAt - entry.startedAt;
  }
}

/**
 * Integrate with query execution
 */
export function withDevToolsTracking<T>(
  queryKey: string,
  promise: Promise<T>
): Promise<T> {
  const activityId = trackNetworkActivity(queryKey, 'query');

  return promise
    .then((result) => {
      updateNetworkActivity(activityId, 'success');
      return result;
    })
    .catch((error) => {
      updateNetworkActivity(activityId, 'error');
      throw error;
    });
}
```

### Step 4: Implement React DevTools UI (2 hours)

**File:** `packages/query/react/QueryDevTools.tsx`

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { getQueryDevToolsStore } from '../src/devtools/devtools-store';
import type { QueryDevToolsConfig } from '../src/devtools/types';

/**
 * Query DevTools Panel Component
 * 
 * @example
 * ```tsx
 * import { QueryDevTools } from '@nexus-state/query/react';
 * 
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <QueryDevTools position="bottom-right" />
 *     </>
 *   );
 * }
 * ```
 */
export function QueryDevTools(config: QueryDevToolsConfig = {}) {
  const {
    position = 'bottom-right',
    initialIsOpen = false,
    panelPosition = 'bottom',
  } = config;

  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const store = getQueryDevToolsStore();

  // Subscribe to store updates
  const [, forceUpdate] = useState({});
  useEffect(() => {
    return store.subscribe(() => {
      forceUpdate({});
    });
  }, [store]);

  // Filter queries
  const filteredQueries = useMemo(() => {
    const queries = Array.from(store.queries.entries());
    if (!filter) return queries;

    return queries.filter(([key]) =>
      key.toLowerCase().includes(filter.toLowerCase())
    );
  }, [store.queries, filter]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          [position.includes('bottom') ? 'bottom' : 'top']: '10px',
          [position.includes('right') ? 'right' : 'left']: '10px',
          padding: '8px 12px',
          background: '#FF6347',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 99999,
        }}
      >
        ⚡ Queries
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        [panelPosition]: 0,
        left: panelPosition !== 'bottom' ? undefined : 0,
        right: panelPosition !== 'bottom' ? undefined : 0,
        width: panelPosition === 'bottom' ? '100%' : '400px',
        height: panelPosition === 'bottom' ? '300px' : '100vh',
        background: 'white',
        borderTop: panelPosition === 'bottom' ? '2px solid #FF6347' : undefined,
        borderLeft: panelPosition === 'right' ? '2px solid #FF6347' : undefined,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 99999,
        fontFamily: 'monospace',
        fontSize: '12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          background: '#FF6347',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <strong>⚡ Query DevTools</strong>
          <span style={{ marginLeft: '12px', opacity: 0.8 }}>
            {store.queries.size} queries
          </span>
        </div>
        <div>
          <button
            onClick={() => store.clearCache()}
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              marginRight: '8px',
            }}
          >
            Clear Cache
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Filter queries..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '6px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Query List */}
        <div
          style={{
            width: '50%',
            overflowY: 'auto',
            borderRight: '1px solid #eee',
          }}
        >
          {filteredQueries.map(([key, query]) => (
            <div
              key={key}
              onClick={() => setSelectedQuery(key)}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                background: selectedQuery === key ? '#f0f0f0' : 'white',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusIndicator status={query.status} />
                <span style={{ fontWeight: 'bold', wordBreak: 'break-all' }}>
                  {key}
                </span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
                {query.isStale && '⏰ Stale • '}
                {query.isFetching && '🔄 Fetching • '}
                Updated: {new Date(query.dataUpdatedAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Query Details */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {selectedQuery ? (
            <QueryDetails
              query={store.queries.get(selectedQuery)!}
              queryKey={selectedQuery}
              onInvalidate={() => store.invalidateQuery(selectedQuery)}
              onRefetch={() => store.refetchQuery(selectedQuery)}
              onRemove={() => {
                store.removeQuery(selectedQuery);
                setSelectedQuery(null);
              }}
            />
          ) : (
            <div style={{ color: '#999', textAlign: 'center', marginTop: '40px' }}>
              Select a query to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: string }) {
  const colors = {
    idle: '#999',
    loading: '#3498db',
    success: '#2ecc71',
    error: '#e74c3c',
  };

  return (
    <div
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: colors[status as keyof typeof colors] || '#999',
      }}
    />
  );
}

function QueryDetails({
  query,
  queryKey,
  onInvalidate,
  onRefetch,
  onRemove,
}: {
  query: any;
  queryKey: string;
  onInvalidate: () => void;
  onRefetch: () => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0' }}>Query Details</h3>

      {/* Actions */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button
          onClick={onRefetch}
          style={{
            padding: '6px 12px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🔄 Refetch
        </button>
        <button
          onClick={onInvalidate}
          style={{
            padding: '6px 12px',
            background: '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ⏰ Invalidate
        </button>
        <button
          onClick={onRemove}
          style={{
            padding: '6px 12px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🗑️ Remove
        </button>
      </div>

      {/* State */}
      <DetailSection title="State">
        <div>Status: <strong>{query.status}</strong></div>
        <div>Fetching: {query.isFetching ? '✅ Yes' : '❌ No'}</div>
        <div>Stale: {query.isStale ? '✅ Yes' : '❌ No'}</div>
        <div>Failure Count: {query.failureCount}</div>
      </DetailSection>

      {/* Data */}
      {query.data !== undefined && (
        <DetailSection title="Data">
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '8px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify(query.data, null, 2)}
          </pre>
        </DetailSection>
      )}

      {/* Error */}
      {query.error && (
        <DetailSection title="Error">
          <pre style={{ 
            background: '#fee', 
            padding: '8px', 
            borderRadius: '4px',
            color: '#c00'
          }}>
            {JSON.stringify(query.error, null, 2)}
          </pre>
        </DetailSection>
      )}

      {/* Timestamps */}
      <DetailSection title="Timestamps">
        <div>
          Data Updated: {new Date(query.dataUpdatedAt).toLocaleString()}
        </div>
        {query.errorUpdatedAt > 0 && (
          <div>
            Error Updated: {new Date(query.errorUpdatedAt).toLocaleString()}
          </div>
        )}
      </DetailSection>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>{title}</h4>
      {children}
    </div>
  );
}
```

### Step 5: Integrate with Query Hooks (1 hour)

**File:** `packages/query/react/useQuery.tsx`

Update to track queries in DevTools:

```typescript
import { trackQuery } from '../src/devtools/query-tracker';

export function useQuery<TData = unknown, TError = Error>(
  // ... existing params
) {
  // ... existing implementation

  // Track in DevTools
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      trackQuery(stringQueryKey, {
        queryKey: stringQueryKey,
        status: state.status,
        data: state.data,
        error: state.error,
        dataUpdatedAt: state.dataUpdatedAt,
        errorUpdatedAt: state.errorUpdatedAt,
        isFetching: state.isFetching,
        isStale,
        failureCount: state.failureCount,
      });
    }
  }, [stringQueryKey, state, isStale]);

  // ... rest of implementation
}
```

### Step 6: Add Tests (1 hour)

**File:** `packages/query/react/__tests__/QueryDevTools.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryDevTools } from '../QueryDevTools';
import { getQueryDevToolsStore } from '../../src/devtools/devtools-store';

describe('QueryDevTools', () => {
  it('should render toggle button when closed', () => {
    render(<QueryDevTools />);
    expect(screen.getByText(/Queries/i)).toBeInTheDocument();
  });

  it('should open panel on button click', () => {
    render(<QueryDevTools />);
    fireEvent.click(screen.getByText(/Queries/i));
    expect(screen.getByText('Query DevTools')).toBeInTheDocument();
  });

  it('should display query list', () => {
    const store = getQueryDevToolsStore();
    store.queries.set('test-query', {
      queryKey: 'test-query',
      status: 'success',
      data: { foo: 'bar' },
      error: null,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      isFetching: false,
      isStale: false,
      failureCount: 0,
    });

    render(<QueryDevTools initialIsOpen />);
    expect(screen.getByText('test-query')).toBeInTheDocument();
  });

  it('should filter queries', () => {
    const store = getQueryDevToolsStore();
    store.queries.set('user-1', { /* ... */ } as any);
    store.queries.set('posts-1', { /* ... */ } as any);

    render(<QueryDevTools initialIsOpen />);

    const filterInput = screen.getByPlaceholderText('Filter queries...');
    fireEvent.change(filterInput, { target: { value: 'user' } });

    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.queryByText('posts-1')).not.toBeInTheDocument();
  });

  it('should show query details on selection', () => {
    const store = getQueryDevToolsStore();
    store.queries.set('test-query', {
      queryKey: 'test-query',
      status: 'success',
      data: { name: 'John' },
      error: null,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      isFetching: false,
      isStale: false,
      failureCount: 0,
    });

    render(<QueryDevTools initialIsOpen />);
    fireEvent.click(screen.getByText('test-query'));

    expect(screen.getByText('Query Details')).toBeInTheDocument();
    expect(screen.getByText(/John/)).toBeInTheDocument();
  });

  it('should clear cache', () => {
    const store = getQueryDevToolsStore();
    store.queries.set('test-query', { /* ... */ } as any);

    render(<QueryDevTools initialIsOpen />);
    fireEvent.click(screen.getByText('Clear Cache'));

    expect(store.queries.size).toBe(0);
  });
});
```

### Step 7: Update Documentation (30 min)

**File:** `packages/query/README.md`

Add DevTools section:

```markdown
## DevTools

Visual debugging for queries and mutations.

### Setup

```tsx
import { QueryDevTools } from '@nexus-state/query/react';

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <QueryDevTools position="bottom-right" />
      )}
    </>
  );
}
```

### Features

- **Query List**: See all active queries
- **State Inspection**: View data, errors, loading states
- **Cache Control**: Invalidate, refetch, or remove queries
- **Network Timeline**: Track fetch timing and status
- **Search**: Filter queries by key

### Configuration

```tsx
<QueryDevTools
  position="bottom-right" // or 'top-left', 'top-right', 'bottom-left'
  initialIsOpen={false}
  panelPosition="bottom" // or 'left', 'right'
/>
```

### Production

DevTools automatically excluded in production builds when using tree-shaking.

```tsx
// Only in development
{process.env.NODE_ENV === 'development' && <QueryDevTools />}
```
```

---

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] DevTools panel renders
- [ ] Query list display
- [ ] Query details view
- [ ] Invalidate/refetch/remove actions
- [ ] Search/filter
- [ ] Real-time updates

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] Test coverage ≥80%
- [ ] No ESLint errors
- [ ] Proper JSDoc comments

### Documentation
- [ ] README with DevTools guide
- [ ] Screenshots
- [ ] Configuration options
- [ ] Best practices

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] DevTools store
- [ ] Query tracking
- [ ] Filter functionality
- [ ] Actions (invalidate, refetch, remove)

### Integration Tests
- [ ] Real query integration
- [ ] State updates
- [ ] Multiple queries

### Visual Tests
- [ ] UI rendering
- [ ] Responsive layout
- [ ] Dark mode

---

## 📦 Deliverables

- [ ] `devtools/` directory with all DevTools code
- [ ] `QueryDevTools.tsx` component
- [ ] Integration with query hooks
- [ ] Test suite
- [ ] Updated README
- [ ] Screenshots/GIFs

---

## 🔗 Dependencies

### Depends On
- ECO-006: React hooks
- @nexus-state/devtools (optional integration)

### Enables
- Better debugging experience
- Visual query inspection
- Faster development

---

## 📝 Notes

### Design Decisions

1. **Separate Package**: Consider splitting to `@nexus-state/query-devtools`
2. **React-only**: Start with React, expand to other frameworks later
3. **Tree-shaking**: Ensure production builds exclude DevTools
4. **Styling**: Inline styles for zero dependencies

### Future Enhancements

- Integration with Redux DevTools Extension
- Export/import query snapshots
- Time-travel debugging
- Query performance profiling
- Network waterfall visualization

---

**Created:** 2026-03-01
**Last Updated:** 2026-03-01
**Assignee:** TBD

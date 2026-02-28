# @nexus-state/query - Roadmap

> **Data fetching and caching package - React Query alternative built on Nexus State**

---

## 📦 Package Overview

**Current Version:** Not yet released  
**Status:** Planning phase  
**Target First Release:** Q3 2026  
**Maintainer:** Nexus State Team  
**Last Updated:** 2026-02-26

### Purpose
Powerful data fetching and caching solution built on top of @nexus-state/core, providing React Query-like functionality with atomic state architecture.

### Dependencies
- `@nexus-state/core`: workspace:*
- `@nexus-state/async`: workspace:*

---

## 🎯 Vision

### Why Build This?

**Problem:** Existing solutions (React Query, SWR) are:
- React-only (not framework-agnostic)
- Separate state systems (don't integrate with Nexus State)
- Complex API surface

**Solution:** Nexus Query
- Framework-agnostic (works with React, Vue, Svelte)
- Built on atoms (integrates seamlessly with Nexus State)
- Simple, composable primitives

### Core Principles
1. **Atomic by nature** - Each query is an atom
2. **Framework agnostic** - Works everywhere Nexus State works
3. **Type-safe** - Full TypeScript inference
4. **Composable** - Queries can depend on other queries
5. **Performant** - Smart caching and deduplication

---

## 🗓️ Roadmap by Version

---

## v0.1.0 - Alpha Release

**Target:** July 31, 2026  
**Focus:** Core query functionality

### Goals
- Basic query atoms
- Automatic caching
- Background refetching
- Request deduplication

### Features

#### 🔍 Query Atoms

```typescript
import { queryAtom } from '@nexus-state/query';

// Basic query
const userQuery = queryAtom({
  key: 'user',
  fetcher: async () => {
    const response = await fetch('/api/user');
    return response.json();
  }
});

// Usage in React
function UserProfile() {
  const user = useAtomValue(userQuery);
  
  if (user.isLoading) return <Spinner />;
  if (user.error) return <Error error={user.error} />;
  
  return <div>{user.data.name}</div>;
}
```

#### 📊 Query State Structure

```typescript
type QueryState<Data> = {
  data: Data | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isFetching: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  dataUpdatedAt: number;
  errorUpdatedAt: number;
};
```

#### 🔄 Automatic Refetching

```typescript
const userQuery = queryAtom({
  key: 'user',
  fetcher: fetchUser,
  
  // Refetch on window focus
  refetchOnWindowFocus: true,
  
  // Refetch on reconnect
  refetchOnReconnect: true,
  
  // Stale time (data considered fresh for 5 minutes)
  staleTime: 5 * 60 * 1000,
  
  // Cache time (keep in cache for 30 minutes)
  cacheTime: 30 * 60 * 1000
});
```

#### 🎯 Dependent Queries

```typescript
// Query depends on another query
const userQuery = queryAtom({
  key: 'user',
  fetcher: fetchUser
});

const postsQuery = queryAtom({
  key: 'posts',
  fetcher: async (get) => {
    const user = get(userQuery);
    if (!user.data) return [];
    return fetchPosts(user.data.id);
  },
  enabled: (get) => get(userQuery).status === 'success'
});
```

### API

```typescript
// Create query
export function queryAtom<Data>(options: QueryOptions<Data>): Atom<QueryState<Data>>;

// Invalidate query (force refetch)
export function invalidateQuery(queryAtom: Atom): void;

// Prefetch query
export function prefetchQuery<Data>(queryAtom: Atom<QueryState<Data>>): Promise<void>;

// Get query data without subscribing
export function getQueryData<Data>(queryAtom: Atom<QueryState<Data>>): Data | undefined;
```

---

## v0.2.0 - Mutations

**Target:** September 30, 2026  
**Focus:** Data updates and mutations

### Features

#### ✍️ Mutation Atoms

```typescript
import { mutationAtom } from '@nexus-state/query';

const updateUserMutation = mutationAtom({
  mutationFn: async (userData: UserUpdate) => {
    const response = await fetch('/api/user', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return response.json();
  },
  
  // Invalidate queries after mutation
  onSuccess: (data, variables, context) => {
    invalidateQuery(userQuery);
    invalidateQuery(usersListQuery);
  },
  
  // Optimistic updates
  onMutate: async (newUser) => {
    // Cancel outgoing refetches
    await cancelQueries(userQuery);
    
    // Snapshot current value
    const previousUser = getQueryData(userQuery);
    
    // Optimistically update
    setQueryData(userQuery, newUser);
    
    // Return context for rollback
    return { previousUser };
  },
  
  // Rollback on error
  onError: (err, newUser, context) => {
    setQueryData(userQuery, context.previousUser);
  }
});

// Usage
function UpdateProfile() {
  const mutation = useMutation(updateUserMutation);
  
  return (
    <button 
      onClick={() => mutation.mutate({ name: 'John' })}
      disabled={mutation.isLoading}
    >
      {mutation.isLoading ? 'Updating...' : 'Update'}
    </button>
  );
}
```

#### 🎯 Mutation State

```typescript
type MutationState<Data, Variables> = {
  data: Data | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  variables: Variables | undefined;
  mutate: (variables: Variables) => Promise<Data>;
  reset: () => void;
};
```

#### 🔄 Optimistic Updates

```typescript
const addTodoMutation = mutationAtom({
  mutationFn: createTodo,
  
  onMutate: async (newTodo) => {
    // Cancel queries
    await cancelQueries(todosQuery);
    
    // Snapshot
    const previousTodos = getQueryData(todosQuery);
    
    // Optimistic update
    setQueryData(todosQuery, (old) => [...old, newTodo]);
    
    return { previousTodos };
  },
  
  onError: (err, newTodo, context) => {
    // Rollback
    setQueryData(todosQuery, context.previousTodos);
  },
  
  onSettled: () => {
    // Always refetch after error or success
    invalidateQuery(todosQuery);
  }
});
```

---

## v1.0.0 - Production Ready

**Target:** December 31, 2026  
**Focus:** Enterprise features and stability

### Features

#### 📡 Infinite Queries

```typescript
const infinitePostsQuery = infiniteQueryAtom({
  key: 'infinite-posts',
  fetcher: async ({ pageParam = 0 }) => {
    const response = await fetch(`/api/posts?page=${pageParam}`);
    return response.json();
  },
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.hasMore ? allPages.length : undefined;
  },
  getPreviousPageParam: (firstPage, allPages) => {
    return firstPage.page > 0 ? firstPage.page - 1 : undefined;
  }
});

// Usage
function PostsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery(infinitePostsQuery);
  
  return (
    <div>
      {data.pages.map((page) => (
        page.posts.map((post) => <Post key={post.id} {...post} />)
      ))}
      
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
```

#### 🎯 Query Filters

```typescript
// Invalidate multiple queries
invalidateQueries({
  predicate: (query) => query.key.startsWith('user-')
});

// Remove queries
removeQueries({
  predicate: (query) => query.state.isError
});

// Reset queries
resetQueries({
  key: 'posts',
  exact: false // Reset all queries starting with 'posts'
});
```

#### 📊 DevTools Integration

```typescript
import { QueryDevTools } from '@nexus-state/query/devtools';

function App() {
  return (
    <StoreProvider>
      <QueryDevTools position="bottom-right" />
      <YourApp />
    </StoreProvider>
  );
}

// DevTools shows:
// - All active queries
// - Query state (loading, success, error)
// - Cache entries
// - Background refetches
// - Mutation history
```

#### 🔄 Polling

```typescript
const liveDataQuery = queryAtom({
  key: 'live-data',
  fetcher: fetchLiveData,
  
  // Poll every 5 seconds
  refetchInterval: 5000,
  
  // Stop polling on error
  refetchIntervalInBackground: false,
  
  // Stop when window not focused
  enabled: (get) => get(windowFocusedAtom)
});
```

#### 🎨 Suspense Support

```typescript
const userQuery = queryAtom({
  key: 'user',
  fetcher: fetchUser,
  suspense: true // Enable suspense mode
});

// Usage with Suspense
function UserProfile() {
  const user = useQueryValue(userQuery); // Suspends if loading
  return <div>{user.name}</div>; // No loading state needed
}

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserProfile />
    </Suspense>
  );
}
```

---

## v1.1.0 - Advanced Caching

**Target:** Q1 2027  
**Focus:** Advanced caching strategies

### Features

#### 💾 Persistent Queries

```typescript
const userQuery = queryAtom({
  key: 'user',
  fetcher: fetchUser,
  
  // Persist to localStorage/IndexedDB
  persist: {
    storage: 'indexeddb',
    key: 'user-cache',
    version: 1,
    
    // Serialize/deserialize
    serialize: (data) => JSON.stringify(data),
    deserialize: (str) => JSON.parse(str),
    
    // Revalidate on mount
    revalidateOnMount: true
  }
});
```

#### 🔗 Query Dependencies Graph

```typescript
// Visualize query dependencies
const graph = getQueryDependencyGraph();

// Returns:
{
  nodes: [
    { id: 'user', type: 'query' },
    { id: 'posts', type: 'query' },
    { id: 'comments', type: 'query' }
  ],
  edges: [
    { from: 'posts', to: 'user' }, // posts depends on user
    { from: 'comments', to: 'posts' }
  ]
}
```

#### 🎯 Selective Hydration

```typescript
// SSR: Pre-fetch specific queries
export async function getServerSideProps() {
  const queryClient = createQueryClient();
  
  // Prefetch critical queries
  await Promise.all([
    prefetchQuery(queryClient, userQuery),
    prefetchQuery(queryClient, postsQuery)
  ]);
  
  return {
    props: {
      dehydratedState: dehydrate(queryClient, {
        // Only hydrate specific queries
        shouldDehydrateQuery: (query) => {
          return ['user', 'posts'].includes(query.key);
        }
      })
    }
  };
}
```

#### 🔄 Background Sync

```typescript
const offlineQuery = queryAtom({
  key: 'offline-data',
  fetcher: fetchData,
  
  // Background sync when online
  backgroundSync: {
    enabled: true,
    
    // Retry strategy
    retry: {
      attempts: 3,
      delay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
    },
    
    // Sync when online
    syncOnReconnect: true
  }
});
```

---

## v2.0.0 - Next Generation

**Target:** Q3 2027  
**Status:** Vision / Exploration

### Potential Features

#### 🤖 AI-Powered Optimizations

```typescript
const smartQuery = queryAtom({
  key: 'smart-data',
  fetcher: fetchData,
  
  // AI predicts when to prefetch
  ai: {
    predictivePrefetch: true,
    
    // Learn from user behavior
    learnFromUsage: true,
    
    // Auto-adjust cache times
    dynamicCaching: true
  }
});

// AI notices:
// - User always navigates to profile after login
// - Prefetches profile data on login
// - Adjusts cache time based on update frequency
```

#### 🌐 Distributed Queries (Multi-Tab)

```typescript
const sharedQuery = queryAtom({
  key: 'shared-data',
  fetcher: fetchData,
  
  // Share across browser tabs
  distributed: {
    channel: 'broadcast-channel',
    
    // Sync strategy
    sync: 'leader-follower', // or 'all-sync'
    
    // Conflict resolution
    conflict: 'last-write-wins'
  }
});
```

#### 📊 Query Analytics

```typescript
// Built-in analytics
const analytics = getQueryAnalytics();

// Returns:
{
  totalQueries: 47,
  cacheHitRate: 0.89, // 89% cache hits
  avgFetchTime: 234,  // ms
  
  slowQueries: [
    { key: 'heavy-data', avgTime: 1234 }
  ],
  
  errorRate: 0.02, // 2% error rate
  
  recommendations: [
    "Consider increasing staleTime for 'user' query",
    "Query 'posts' is refetching too frequently"
  ]
}
```

---

## 🚫 Non-Goals

### Will NOT Support
- ❌ GraphQL client (use existing solutions)
- ❌ WebSocket handling (separate package)
- ❌ File uploads (use dedicated library)
- ❌ Built-in authentication (use auth library)

### Design Principles
1. **Atoms first** - Everything is an atom
2. **Framework agnostic** - Works with any framework
3. **Simple API** - Easy to learn, powerful features
4. **Type-safe** - Full TypeScript support
5. **Composable** - Queries can depend on atoms/queries

---

## 📊 Success Metrics

### Quality Gates (must pass for each release)

#### v1.0.0
- [ ] 95%+ test coverage
- [ ] <5KB bundle size (core)
- [ ] React Query feature parity (80%+)
- [ ] Full TypeScript support
- [ ] Zero memory leaks
- [ ] Comprehensive documentation

#### v1.5.0
- [ ] <4KB bundle size
- [ ] Persistent queries working
- [ ] DevTools complete
- [ ] SSR fully supported

#### v2.0.0
- [ ] AI-powered features
- [ ] Distributed queries
- [ ] Analytics dashboard
- [ ] 99%+ test coverage

---

## 🎯 Comparison with React Query

### Feature Parity

| Feature | React Query | Nexus Query | Notes |
|---------|-------------|-------------|-------|
| Basic queries | ✅ | ✅ v0.1 | |
| Mutations | ✅ | ✅ v0.2 | |
| Infinite queries | ✅ | ✅ v1.0 | |
| Optimistic updates | ✅ | ✅ v0.2 | |
| Suspense | ✅ | ✅ v1.0 | |
| DevTools | ✅ | ✅ v1.0 | |
| Persistence | ✅ | ✅ v1.1 | |
| Framework agnostic | ❌ | ✅ v0.1 | **Advantage** |
| Atom integration | ❌ | ✅ v0.1 | **Advantage** |
| AI optimizations | ❌ | ✅ v2.0 | **Advantage** |

### Migration from React Query

```typescript
// React Query
const { data, isLoading } = useQuery(['user'], fetchUser);

// Nexus Query
const userQuery = queryAtom({ key: 'user', fetcher: fetchUser });
const { data, isLoading } = useAtomValue(userQuery);

// Migration helper
import { fromReactQuery } from '@nexus-state/query/migrate';

const nexusQuery = fromReactQuery(['user'], fetchUser);
```

---

## 🐛 Bug Triage Priority

### P0 - Critical
- Data loss
- Memory leaks
- Security vulnerabilities
- Cache corruption

### P1 - High
- Incorrect cache behavior
- Performance regressions
- TypeScript errors
- Mutation failures

### P2 - Medium
- DevTools bugs
- Documentation gaps
- Edge cases
- Missing features

### P3 - Low
- Nice-to-have features
- Performance micro-optimizations
- Additional utilities

---

## 📞 Contributing

### How to Propose Features
1. Check this roadmap
2. Open GitHub Discussion with "Query: " prefix
3. Describe data fetching use case
4. Wait for maintainer feedback

### Testing Requirements
- All features must have tests
- SSR scenarios must be tested
- Cache behavior must be verified
- Memory leaks must be checked

---

## 🔗 Related Packages

### Dependencies
- `@nexus-state/core` - Core state management
- `@nexus-state/async` - Async utilities

### Complementary Packages
- `@nexus-state/react` - React integration
- `@nexus-state/devtools` - DevTools
- `@nexus-state/persist` - Persistence

### Alternatives
- React Query (React only)
- SWR (React only)
- Apollo Client (GraphQL)
- RTK Query (Redux)

---

## 📚 Resources

### Documentation
- [Query Guide](../../docs/api/query.md)
- [Examples](../../docs/examples/async-data.md)
- [Migration from React Query](../../docs/migration/react-query.md)

### Community
- [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)
- [Discord #query Channel](https://discord.gg/nexus-state)

---

**Roadmap Owner:** Query Team  
**Review Cadence:** Monthly  
**Next Review:** 2026-07-01

---

> 💡 **Feedback Welcome:** Have ideas for data fetching? Share in [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)!

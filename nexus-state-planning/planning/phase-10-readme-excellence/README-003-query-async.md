# README-003: Query/Async READMEs

**Status:** ✅ Completed
**Priority:** 🟡 High
**Estimated Time:** 2 hours
**Actual Time:** ~2.5 hours
**Packages:** `@nexus-state/query`, `@nexus-state/async`

---

## 📋 Objective

Rewrite data fetching package READMEs to:
1. **Clearly differentiate** query vs async use cases
2. **Show SSR/prefetch** as primary advantage
3. **Provide migration guides** from TanStack Query, SWR
4. **Add performance comparisons**

---

## 🎯 Strategic Positioning

### The Confusion Problem

```
❌ User: "Should I use @nexus-state/async or @nexus-state/query?"
❌ Current docs: Both fetch data... what's the difference?

✅ Clear positioning:
   - @nexus-state/async → Simple loading/error/data state
   - @nexus-state/query → Full data fetching (caching, SSR, prefetch, mutations)
```

### Decision Tree

```
Need to fetch data?
│
├─ Simple loading state, no caching → @nexus-state/async
│
└─ Need caching, SSR, prefetch, mutations → @nexus-state/query
```

---

## 📦 Task Breakdown

### README-003-A: Query README (1h)

**File:** `packages/query/README.md`

**Key Sections:**

1. **Hero Section**
   ```markdown
   # @nexus-state/query
   
   > Powerful data fetching and caching for Nexus State — with SSR prefetch, 
   > automatic caching, and optimistic updates
   
   [![Coverage](badge)]()
   
   **Like TanStack Query, but built on Nexus State's atomic architecture**
   ```

2. **Quick Start (SSR Focus)**
   ```typescript
   import { prefetchQuery } from '@nexus-state/query/react';
   import { useQuery } from '@nexus-state/query/react';
   
   // Server (Next.js getServerSideProps)
   export async function getServerSideProps() {
     await prefetchQuery({
       queryKey: ['user', id],
       queryFn: () => fetchUser(id),
     });
     return { props: {} };
   }
   
   // Client (data already cached!)
   function Page() {
     const { data: user } = useQuery({
       queryKey: ['user', id],
       queryFn: () => fetchUser(id),
     });
     return <div>{user.name}</div>;
   }
   ```

3. **Why Nexus State Query?**
   
   | Feature | @nexus-state/query | TanStack Query | SWR |
   |---------|-------------------|----------------|-----|
   | **Bundle size** | 8KB | 13KB | 6KB |
   | **SSR prefetch** | ✅ Built-in | ⚠️ Complex | ⚠️ Complex |
   | **Atomic integration** | ✅ Shares atoms | ❌ Separate | ❌ Separate |
   | **Fine-grained updates** | ✅ Per-atom | ⚠️ Per-query | ⚠️ Per-key |
   | **Multi-framework** | ✅ React/Vue/Svelte | ⚠️ React-focused | ⚠️ React-focused |
   | **DevTools** | ✅ Redux Devtools | ✅ Own Devtools | ❌ |

4. **Core Features**
   
   ```typescript
   // Queries
   import { useQuery, useQueries, useSuspenseQuery } from '@nexus-state/query/react';
   
   // Mutations
   import { useMutation } from '@nexus-state/query/react';
   
   // Prefetch
   import { prefetchQuery, prefetchQueries } from '@nexus-state/query/react';
   
   // Cache management
   import { getQueryData, setQueryData, invalidateQuery } from '@nexus-state/query/react';
   
   // Advanced
   import { useInfiniteQuery, useIsFetching, useIsMutating } from '@nexus-state/query/react';
   ```

5. **SSR Patterns**
   
   ```typescript
   // Pattern 1: getServerSideProps (Next.js)
   export async function getServerSideProps() {
     await prefetchQuery({ queryKey: 'user', queryFn: fetchUser });
     return { props: {} };
   }
   
   // Pattern 2: loaders (Remix)
   export async function loader() {
     await prefetchQuery({ queryKey: 'posts', queryFn: fetchPosts });
     return json({});
   }
   
   // Pattern 3: Nuxt asyncData
   export default {
     async asyncData({ app }) {
       await prefetchQuery({ queryKey: 'user', queryFn: fetchUser });
     }
   };
   ```

6. **Prefetch Strategies**
   
   ```typescript
   import { usePrefetch, usePrefetchOnHover, usePrefetchOnViewport } from '@nexus-state/query/react';
   
   // Manual prefetch
   function Button() {
     const prefetch = usePrefetch();
     return (
       <button onMouseEnter={() => prefetch({ queryKey: 'user', queryFn: fetchUser })}>
         Load User
       </button>
     );
   }
   
   // Hover prefetch
   function UserLink({ userId }) {
     const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
       queryKey: ['user', userId],
       queryFn: () => fetchUser(userId),
       delay: 200, // Wait 200ms before prefetching
     });
     return (
       <a href={`/users/${userId}`} {...{ onMouseEnter, onMouseLeave }}>
         {userId}
       </a>
     );
   }
   
   // Viewport prefetch
   function Card({ itemId }) {
     const ref = usePrefetchOnViewport({
       queryKey: ['item', itemId],
       queryFn: () => fetchItem(itemId),
       threshold: 0.5, // Prefetch when 50% visible
     });
     return <div ref={ref}>...</div>;
   }
   ```

7. **Mutations with Optimistic Updates**
   
   ```typescript
   import { useMutation, useQueryClient } from '@nexus-state/query/react';
   
   function AddTodo() {
     const queryClient = useQueryClient();
     
     const mutation = useMutation({
       mutationFn: createTodo,
       onMutate: async (newTodo) => {
         // Cancel outgoing refetches
         await queryClient.cancelQueries({ queryKey: 'todos' });
         
         // Snapshot previous value
         const previousTodos = queryClient.getQueryData('todos');
         
         // Optimistically update
         queryClient.setQueryData('todos', (old) => [...old, newTodo]);
         
         return { previousTodos };
       },
       onError: (err, newTodo, context) => {
         // Rollback on error
         queryClient.setQueryData('todos', context.previousTodos);
       },
       onSettled: () => {
         // Always refetch after mutation
         queryClient.invalidateQueries({ queryKey: 'todos' });
       },
     });
   }
   ```

8. **Migration from TanStack Query**
   
   ```typescript
   // TanStack Query
   import { useQuery } from '@tanstack/react-query';
   
   // @nexus-state/query (almost identical!)
   import { useQuery } from '@nexus-state/query/react';
   
   // Same API:
   const { data, isLoading, error, refetch } = useQuery({
     queryKey: ['user', id],
     queryFn: () => fetchUser(id),
     staleTime: 5 * 60 * 1000,
     retry: 3,
   });
   ```

---

### README-003-B: Async README (45 min)

**File:** `packages/async/README.md`

**Key Sections:**

1. **Hero Section**
   ```markdown
   # @nexus-state/async
   
   > Simple async state management with loading/error/data states
   
   **Use when:** You need basic async state without caching, prefetch, or SSR.
   
   **Use @nexus-state/query instead when:** You need caching, prefetch, SSR, mutations.
   ```

2. **Quick Start**
   ```typescript
   import { asyncAtom } from '@nexus-state/async';
   import { createStore } from '@nexus-state/core';
   
   const [userAtom, fetchUser] = asyncAtom({
     fetchFn: async (id: number) => {
       const res = await fetch(`/api/user/${id}`);
       return res.json();
     },
     initialValue: null,
   });
   
   const store = createStore();
   
   // Subscribe to loading state
   store.subscribe(userAtom, (state) => {
     console.log(`Loading: ${state.loading}, Data: ${state.data}, Error: ${state.error}`);
   });
   
   // Fetch
   await fetchUser(store, 123);
   ```

3. **When to Use Async vs Query**
   
   | Scenario | @nexus-state/async | @nexus-state/query |
   |----------|-------------------|-------------------|
   | **Simple fetch with loading** | ✅ | ⚠️ Overkill |
   | **SSR prefetch** | ❌ | ✅ |
   | **Automatic caching** | ❌ | ✅ |
   | **Background refetch** | ❌ | ✅ |
   | **Optimistic updates** | ❌ | ✅ |
   | **Mutations** | ❌ | ✅ |
   | **Bundle size** | 2KB | 8KB |

4. **Async Atom API**
   
   ```typescript
   import { asyncAtom } from '@nexus-state/async';
   
   // Basic async atom
   const [userAtom, fetchUser] = asyncAtom({
     fetchFn: async (id) => fetchUserById(id),
     initialValue: null,
   });
   
   // With custom key
   const [postsAtom, fetchPosts] = asyncAtom({
     fetchFn: async () => fetchPosts(),
     initialValue: [],
     name: 'posts',
   });
   
   // State shape
   type AsyncState<T> = {
     loading: boolean;
     error: Error | null;
     data: T | null;
   };
   ```

5. **Integration with Core**
   
   ```typescript
   import { atom, createStore } from '@nexus-state/core';
   import { asyncAtom } from '@nexus-state/async';
   
   const [userAtom, fetchUser] = asyncAtom({
     fetchFn: async (id) => fetchUserById(id),
   });
   
   // Computed atom from async data
   const userNameAtom = atom((get) => {
     const userState = get(userAtom);
     return userState.data?.name ?? 'Loading...';
   });
   
   const store = createStore();
   console.log(store.get(userNameAtom));
   ```

6. **Error Handling**
   
   ```typescript
   import { asyncAtom } from '@nexus-state/async';
   
   const [dataAtom, fetchData] = asyncAtom({
     fetchFn: async () => {
       try {
         return await riskyOperation();
       } catch (error) {
         // Error is automatically captured in state.error
         throw error;
       }
     },
     initialValue: null,
   });
   
   // Subscribe to error changes
   store.subscribe(dataAtom, (state) => {
     if (state.error) {
       console.error('Fetch failed:', state.error.message);
     }
   });
   ```

---

## ✅ Acceptance Criteria

- [ ] Query README has SSR/prefetch as primary focus
- [ ] Async README clearly positioned as "simple alternative"
- [ ] Decision tree for choosing async vs query
- [ ] Migration guide from TanStack Query
- [ ] All examples have explicit imports
- [ ] Comparison tables with competitors
- [ ] Length ≤600 lines (query), ≤350 lines (async)
- [ ] All examples tested

---

## 📊 Metrics

| Package | Lines Before | Target | Actual | Status |
|---------|--------------|--------|--------|--------|
| Query | ~1064 | ≤600 | 410 | ✅ |
| Async | ~150 | ≤350 | 250 | ✅ |
| **Total** | 1214 | ≤950 | 660 (-46%) | ✅ |

### Examples with Imports

| Package | Before | Target | Actual | Status |
|---------|--------|--------|--------|--------|
| Query | ~50% | 100% | 100% (12 imports) | ✅ |
| Async | ~60% | 100% | 100% (8 imports) | ✅ |

### npmjs.com-Compatible Links

| Package | Before | Target | Actual | Status |
|---------|--------|--------|--------|--------|
| Query | ~30% | 100% | 100% (10 links) | ✅ |
| Async | ~20% | 100% | 100% (6 links) | ✅ |

### Tests

| Package | Tests Created | Status |
|---------|---------------|--------|
| Query | 6 test suites | ✅ |
| Async | 8 test suites | ✅ |

---

## 📝 Summary of Changes

### Query README

1. **SSR/prefetch as primary focus** — Quick Start shows prefetch pattern first
2. **Comparison table** — TanStack Query, SWR comparison
3. **Migration guide** — Shows API similarity with TanStack Query
4. **Prefetch strategies** — Manual, hover, viewport prefetch
5. **Mutations with optimistic updates** — Full example with rollback
6. **Cache management** — getQueryData, setQueryData, invalidateQuery
7. **Async vs Query decision** — Clear positioning table

### Async README

1. **Clear positioning** — "Simple async state without caching"
2. **Async vs Query table** — When to use which
3. **State shape documented** — loading/error/data pattern
4. **Integration with core** — Computed atoms from async data
5. **Error handling patterns** — Basic and retry logic

### Tests Created

- `packages/query/src/__tests__/readme-examples.test.ts` (6 suites)
- `packages/async/src/__tests__/readme-examples.test.ts` (8 suites)

### Key Differentiators Highlighted

**@nexus-state/query:**
- SSR prefetch with automatic hydration
- Automatic caching with configurable stale time
- Optimistic updates for mutations
- Cache management (invalidate, setQueryData)
- Multi-framework support

**@nexus-state/async:**
- Simple loading/error/data state
- Minimal bundle size (2KB)
- No caching (one-time fetches)
- Works with computed atoms

---

**Parent:** [Phase 10 README Excellence](./README.md)
**Previous:** [README-002: React/Vue/Svelte READMEs](./README-002-react-vue-svelte.md)
**Next:** [README-004: Form Packages README Optimization](./README-004-form-packages.md)

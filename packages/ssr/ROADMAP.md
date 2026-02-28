# @nexus-state/ssr - Roadmap

> **Server-Side Rendering utilities - SSR, SSG, and streaming support**

---

## 📦 Package Overview

**Current Version:** Not yet released  
**Status:** Planning phase  
**Target First Release:** Q4 2026  
**Maintainer:** Nexus State Team  
**Last Updated:** 2026-02-26

### Purpose
Comprehensive server-side rendering utilities for Nexus State, supporting SSR, SSG, ISR, and streaming in Next.js, Remix, Astro, and other frameworks.

### Dependencies
- `@nexus-state/core`: workspace:*
- `@nexus-state/react`: workspace:* (optional)
- `@nexus-state/query`: workspace:* (optional)

---

## 🎯 Vision

### Why Build This?

**Problem:** SSR with state management is complex:
- Hydration mismatches
- Memory leaks (store per request)
- Data serialization issues
- Race conditions

**Solution:** Nexus SSR
- Automatic hydration
- Proper cleanup
- Safe serialization
- Framework-agnostic patterns

### Core Principles
1. **Zero hydration mismatches** - Server and client state always match
2. **Memory safe** - No leaks from uncleaned stores
3. **Type-safe** - Full TypeScript support
4. **Framework agnostic** - Works with any meta-framework

---

## 🗓️ Roadmap by Version

---

## v0.1.0 - Alpha Release

**Target:** October 31, 2026  
**Focus:** Basic SSR support

### Goals
- Server store creation
- State serialization/deserialization
- Basic hydration
- Next.js App Router support

### Features

#### 🏗️ Server Store Factory

```typescript
import { createServerStore } from '@nexus-state/ssr';

// Create isolated store per request
export async function createRequestStore() {
  const store = createServerStore({
    // Automatic cleanup after request
    autoCleanup: true,
    
    // Track for debugging
    debug: process.env.NODE_ENV === 'development'
  });
  
  return store;
}

// Next.js App Router example
export default async function Page() {
  const store = await createRequestStore();
  
  // Pre-populate atoms
  const user = await fetchUser();
  store.set(userAtom, user);
  
  return <App store={store} />;
}
```

#### 💧 Hydration API

```typescript
import { hydrateStore, dehydrateStore } from '@nexus-state/ssr';

// Server: Serialize state
export async function getServerSideProps() {
  const store = createServerStore();
  
  // Fetch data
  await store.set(userAtom, await fetchUser());
  await store.set(postsAtom, await fetchPosts());
  
  // Dehydrate state for client
  const dehydratedState = dehydrateStore(store, {
    // Only include specific atoms
    include: [userAtom, postsAtom],
    
    // Exclude sensitive data
    exclude: [authTokenAtom]
  });
  
  return {
    props: {
      dehydratedState
    }
  };
}

// Client: Hydrate state
function App({ dehydratedState }) {
  const store = useMemo(() => {
    const s = createStore();
    hydrateStore(s, dehydratedState);
    return s;
  }, []);
  
  return (
    <StoreProvider store={store}>
      <YourApp />
    </StoreProvider>
  );
}
```

#### 📦 State Serialization

```typescript
// Automatic serialization with type safety
const dehydrated = dehydrateStore(store, {
  // Custom serializers for special types
  serializers: {
    Date: (date: Date) => ({ __type: 'Date', value: date.toISOString() }),
    Map: (map: Map<any, any>) => ({ __type: 'Map', value: Array.from(map) }),
    Set: (set: Set<any>) => ({ __type: 'Set', value: Array.from(set) })
  },
  
  // Custom deserializers
  deserializers: {
    Date: (obj) => new Date(obj.value),
    Map: (obj) => new Map(obj.value),
    Set: (obj) => new Set(obj.value)
  }
});

// Example usage with Date
const dateAtom = atom(new Date());
store.set(dateAtom, new Date('2026-01-01'));

const dehydrated = dehydrateStore(store);
// Serialized: { "atom-id": { "__type": "Date", "value": "2026-01-01T00:00:00.000Z" } }

const newStore = createStore();
hydrateStore(newStore, dehydrated);
store.get(dateAtom) instanceof Date; // ✅ true
```

#### 🎯 Selective Hydration

```typescript
// Hydrate only specific atoms
hydrateStore(store, dehydratedState, {
  // Only hydrate these atoms
  atoms: [userAtom, settingsAtom],
  
  // Or use predicate
  shouldHydrate: (atomId, value) => {
    // Don't hydrate temporary data
    if (atomId.startsWith('temp-')) return false;
    return true;
  }
});
```

---

## v0.2.0 - Framework Integrations

**Target:** November 30, 2026  
**Focus:** Support major meta-frameworks

### Features

#### ⚡ Next.js Integration

```typescript
// app/layout.tsx (App Router)
import { NextSSRProvider } from '@nexus-state/ssr/next';

export default async function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NextSSRProvider>
          {children}
        </NextSSRProvider>
      </body>
    </html>
  );
}

// app/page.tsx
import { getServerStore } from '@nexus-state/ssr/next';

export default async function Page() {
  const store = await getServerStore();
  
  // Pre-fetch data
  await store.set(userAtom, await fetchUser());
  
  return <UserProfile />;
}
```

#### 🎵 Remix Integration

```typescript
// app/root.tsx
import { RemixSSRProvider } from '@nexus-state/ssr/remix';

export async function loader() {
  const store = createServerStore();
  
  // Pre-populate
  const user = await fetchUser();
  store.set(userAtom, user);
  
  return json({
    dehydratedState: dehydrateStore(store)
  });
}

export default function App() {
  const { dehydratedState } = useLoaderData();
  
  return (
    <RemixSSRProvider dehydratedState={dehydratedState}>
      <Outlet />
    </RemixSSRProvider>
  );
}
```

#### 🚀 Astro Integration

```typescript
---
// src/pages/index.astro
import { AstroSSRProvider } from '@nexus-state/ssr/astro';

const store = createServerStore();
await store.set(userAtom, await fetchUser());

const dehydratedState = dehydrateStore(store);
---

<AstroSSRProvider dehydratedState={dehydratedState}>
  <UserProfile client:load />
</AstroSSRProvider>
```

#### 🌊 SvelteKit Integration

```typescript
// src/routes/+page.server.ts
import { createServerStore, dehydrateStore } from '@nexus-state/ssr';

export async function load() {
  const store = createServerStore();
  await store.set(userAtom, await fetchUser());
  
  return {
    dehydratedState: dehydrateStore(store)
  };
}

// src/routes/+page.svelte
<script>
  import { SvelteKitSSRProvider } from '@nexus-state/ssr/sveltekit';
  export let data;
</script>

<SvelteKitSSRProvider dehydratedState={data.dehydratedState}>
  <UserProfile />
</SvelteKitSSRProvider>
```

---

## v1.0.0 - Production Ready

**Target:** December 31, 2026  
**Focus:** Advanced SSR features

### Features

#### 🌊 Streaming SSR

```typescript
// Next.js Streaming
import { createStreamingStore } from '@nexus-state/ssr/next';

export default async function Page() {
  const store = createStreamingStore();
  
  // Critical data (blocking)
  await store.set(userAtom, await fetchUser());
  
  // Non-critical data (streamed)
  store.stream(postsAtom, fetchPosts());
  store.stream(commentsAtom, fetchComments());
  
  return (
    <Suspense fallback={<UserSkeleton />}>
      <UserProfile />
      
      <Suspense fallback={<PostsSkeleton />}>
        <PostsList />
      </Suspense>
    </Suspense>
  );
}
```

#### 📊 Progressive Hydration

```typescript
import { progressiveHydrate } from '@nexus-state/ssr';

// Hydrate in priority order
progressiveHydrate(store, dehydratedState, {
  // Hydrate critical atoms first
  priority: [
    { atoms: [userAtom, authAtom], level: 'critical' },
    { atoms: [postsAtom], level: 'high' },
    { atoms: [commentsAtom], level: 'low' }
  ],
  
  // Hydrate on idle
  strategy: 'idle', // or 'eager' | 'lazy' | 'visible'
  
  // Track progress
  onProgress: (progress) => {
    console.log(`Hydration ${progress}% complete`);
  }
});
```

#### 🎯 Incremental Static Regeneration (ISR)

```typescript
// Next.js ISR with Nexus State
export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' }
  ];
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Page({ params }) {
  const store = createServerStore();
  
  // Fetch data
  const post = await fetchPost(params.id);
  store.set(postAtom, post);
  
  // Cache dehydrated state
  const dehydrated = dehydrateStore(store);
  
  return (
    <StoreProvider dehydratedState={dehydrated}>
      <Post />
    </StoreProvider>
  );
}
```

#### 🔄 Stale-While-Revalidate

```typescript
import { createSSGStore } from '@nexus-state/ssr';

export async function getStaticProps({ params }) {
  const store = createSSGStore({
    cache: {
      // Serve stale content while revalidating
      staleWhileRevalidate: true,
      
      // Cache duration
      maxAge: 3600, // 1 hour
      
      // Revalidation interval
      revalidate: 60 // 1 minute
    }
  });
  
  await store.set(postAtom, await fetchPost(params.id));
  
  return {
    props: {
      dehydratedState: dehydrateStore(store)
    },
    revalidate: 60
  };
}
```

#### 🎨 React Server Components (RSC)

```typescript
// app/user/page.tsx (Server Component)
import { createRSCStore } from '@nexus-state/ssr/react';

export default async function UserPage() {
  const store = createRSCStore();
  
  // Fetch in Server Component
  const user = await fetchUser();
  store.set(userAtom, user);
  
  // Pass to Client Component
  return <UserProfile store={store} />;
}

// components/UserProfile.tsx (Client Component)
'use client';
import { useServerStore } from '@nexus-state/ssr/react';

export function UserProfile({ store }) {
  const user = useAtomValue(userAtom, { store });
  return <div>{user.name}</div>;
}
```

---

## v1.1.0 - Advanced Features

**Target:** Q1 2027  
**Focus:** Performance and edge cases

### Features

#### 🚀 Edge Runtime Support

```typescript
// Vercel Edge Runtime
export const runtime = 'edge';

export async function GET(request: Request) {
  const store = createEdgeStore({
    // Limited memory in edge
    maxSize: 1024 * 1024, // 1MB
    
    // Fast serialization
    serializationMode: 'fast'
  });
  
  await store.set(userAtom, await fetchUser());
  
  return Response.json({
    dehydratedState: dehydrateStore(store)
  });
}
```

#### 💾 State Caching

```typescript
import { createCachedStore } from '@nexus-state/ssr';

const store = createCachedStore({
  cache: {
    // Cache layer (Redis, Upstash, etc.)
    adapter: redisAdapter,
    
    // Cache key generation
    keyGenerator: (request) => {
      return `store:${request.url}:${request.user.id}`;
    },
    
    // TTL
    ttl: 3600,
    
    // Invalidation
    invalidateOn: ['user-update', 'post-create']
  }
});
```

#### 🔒 Secure Serialization

```typescript
// Prevent XSS via JSON injection
const dehydrated = dehydrateStore(store, {
  // Escape HTML entities
  escapeHTML: true,
  
  // Remove functions (security)
  removeFunctions: true,
  
  // Sanitize sensitive data
  sanitize: (atomId, value) => {
    // Remove passwords, tokens, etc.
    if (atomId === 'authToken') return undefined;
    return value;
  }
});
```

#### 📊 SSR Performance Monitoring

```typescript
import { monitorSSR } from '@nexus-state/ssr/monitoring';

const metrics = monitorSSR(store, {
  track: {
    serializationTime: true,
    hydrationTime: true,
    storeSize: true,
    atomCount: true
  },
  
  onMetrics: (metrics) => {
    // Send to monitoring service
    analytics.track('ssr-performance', metrics);
  }
});

// Metrics:
// {
//   serializationTime: 12, // ms
//   hydrationTime: 8,      // ms
//   storeSize: 45000,      // bytes
//   atomCount: 47
// }
```

---

## v2.0.0 - Next Generation

**Target:** Q3 2027  
**Status:** Vision / Exploration

### Potential Features

#### 🤖 AI-Powered Prefetching

```typescript
const store = createAIStore({
  ai: {
    // Predict which data to prefetch
    predictivePrefetch: true,
    
    // Learn from user behavior
    learnFromNavigation: true,
    
    // Auto-optimize cache
    dynamicCaching: true
  }
});

// AI notices:
// - User always goes to profile after login
// - Prefetches profile data on login page
// - Adjusts cache strategy based on patterns
```

#### 🌐 Distributed SSR

```typescript
// Multi-region SSR with state sync
const store = createDistributedStore({
  regions: ['us-east', 'eu-west', 'ap-south'],
  
  // State replication
  replication: {
    strategy: 'eventual-consistency',
    syncInterval: 1000
  },
  
  // Conflict resolution
  conflicts: 'last-write-wins'
});
```

#### 📈 Smart ISR

```typescript
// ML-powered revalidation
export const revalidate = 'smart';

export async function getStaticProps({ params }) {
  const store = createSmartSSGStore({
    // AI determines optimal revalidation time
    smartRevalidation: {
      // Learn from update frequency
      adaptive: true,
      
      // Revalidate popular pages more often
      popularityBased: true,
      
      // Predict when content will change
      predictive: true
    }
  });
  
  // AI suggests: Revalidate every 73 seconds
  // based on historical update patterns
}
```

---

## 🚫 Non-Goals

### Will NOT Support
- ❌ Browser-only features (use client-side packages)
- ❌ Static site generation without framework
- ❌ Custom server implementations (use framework adapters)
- ❌ Non-JavaScript runtimes (Deno support maybe in future)

### Design Principles
1. **Framework adapters** - Don't reinvent routing/rendering
2. **Zero hydration bugs** - Server and client must match
3. **Memory safe** - Automatic cleanup
4. **Type-safe** - Full TypeScript support
5. **Performance first** - Minimal serialization overhead

---

## 📊 Success Metrics

### Quality Gates (must pass for each release)

#### v1.0.0
- [ ] Zero hydration mismatches
- [ ] <2KB bundle size
- [ ] <10ms serialization time
- [ ] 95%+ test coverage
- [ ] All major frameworks supported
- [ ] Memory leak tests passing

#### v1.5.0
- [ ] Edge runtime support
- [ ] Streaming SSR working
- [ ] Progressive hydration
- [ ] <1KB bundle size

#### v2.0.0
- [ ] AI-powered prefetching
- [ ] Distributed SSR
- [ ] Smart ISR
- [ ] 99%+ test coverage

---

## 🎯 Framework Support Matrix

| Framework | SSR | SSG | ISR | Streaming | RSC | Priority |
|-----------|-----|-----|-----|-----------|-----|----------|
| Next.js 13+ | ✅ v0.1 | ✅ v0.1 | ✅ v1.0 | ✅ v1.0 | ✅ v1.0 | **High** |
| Remix | ✅ v0.2 | ❌ | ❌ | ✅ v1.0 | ❌ | **High** |
| Astro | ✅ v0.2 | ✅ v0.2 | ❌ | ❌ | ❌ | **Medium** |
| SvelteKit | ✅ v0.2 | ✅ v0.2 | ❌ | ❌ | ❌ | **Medium** |
| Nuxt 3 | ✅ v0.2 | ✅ v0.2 | ❌ | ❌ | ❌ | **Low** |
| SolidStart | ⏳ v1.1 | ⏳ v1.1 | ❌ | ❌ | ❌ | **Low** |

---

## 🐛 Common SSR Pitfalls (Solved)

### 1. Hydration Mismatches

**Problem:**
```typescript
// Server renders: <div>Loading...</div>
// Client expects: <div>User data</div>
// Result: Hydration mismatch! ❌
```

**Solution:**
```typescript
// Nexus SSR ensures exact match
const dehydrated = dehydrateStore(store);
hydrateStore(clientStore, dehydrated);
// Server and client state identical ✅
```

### 2. Memory Leaks

**Problem:**
```typescript
// Store persists between requests
const globalStore = createStore(); // ❌ Leak!

app.get('/page', (req, res) => {
  globalStore.set(userAtom, req.user); // Leaks to other users!
});
```

**Solution:**
```typescript
// Store per request
app.get('/page', async (req, res) => {
  const store = createServerStore({
    autoCleanup: true // ✅ Cleaned up after request
  });
  
  store.set(userAtom, req.user);
});
```

### 3. Serialization Errors

**Problem:**
```typescript
// Functions can't be serialized
store.set(callbackAtom, () => console.log('hi')); // ❌
const dehydrated = dehydrateStore(store); // Error!
```

**Solution:**
```typescript
// Automatic filtering
const dehydrated = dehydrateStore(store, {
  removeFunctions: true, // ✅ Functions excluded
  removeNonSerializable: true
});
```

---

## 📞 Contributing

### How to Propose Features
1. Check this roadmap
2. Open GitHub Discussion with "SSR: " prefix
3. Describe SSR use case and framework
4. Wait for maintainer feedback

### Testing Requirements
- All features must have SSR tests
- Hydration must be verified
- Memory leaks must be checked
- All frameworks must be tested

---

## 🔗 Related Packages

### Dependencies
- `@nexus-state/core` - Core state management
- `@nexus-state/react` - React integration
- `@nexus-state/query` - Data fetching

### Framework Adapters
- `@nexus-state/ssr/next` - Next.js
- `@nexus-state/ssr/remix` - Remix
- `@nexus-state/ssr/astro` - Astro
- `@nexus-state/ssr/sveltekit` - SvelteKit

---

## 📚 Resources

### Documentation
- [SSR Guide](../../docs/guides/ssr.md)
- [Next.js Guide](../../docs/guides/nextjs-integration.md)
- [Remix Guide](../../docs/guides/remix-integration.md)

### Examples
- [Next.js App Router Example](../../examples/nextjs-app-router)
- [Remix Example](../../examples/remix-ssr)
- [Astro Example](../../examples/astro-ssr)

### Community
- [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)
- [Discord #ssr Channel](https://discord.gg/nexus-state)

---

**Roadmap Owner:** SSR Team  
**Review Cadence:** Monthly  
**Next Review:** 2026-10-01

---

> 💡 **Feedback Welcome:** Building SSR apps with Nexus State? Share your experience in [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)!

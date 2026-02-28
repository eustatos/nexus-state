# @nexus-state/ssr - Architecture

> **Technical architecture for server-side rendering utilities**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Challenges](#core-challenges)
3. [System Architecture](#system-architecture)
4. [Serialization Strategy](#serialization-strategy)
5. [Hydration Mechanism](#hydration-mechanism)
6. [Memory Management](#memory-management)
7. [Performance Optimizations](#performance-optimizations)

---

## Overview

### Purpose
Enable safe, performant server-side rendering with Nexus State by solving serialization, hydration, and memory management challenges.

### Core Challenge
**Problem:** Bridge the gap between server and client while maintaining:
- State consistency (no hydration mismatches)
- Memory safety (no leaks between requests)
- Performance (minimal overhead)
- Type safety (full TypeScript support)

---

## Core Challenges

### Challenge 1: Serialization

**Problem:** JavaScript objects → JSON → JavaScript objects

```typescript
// Not all types are JSON-serializable
const problemTypes = {
  date: new Date(),           // Becomes string
  map: new Map(),             // Becomes {}
  set: new Set(),             // Becomes {}
  regex: /test/,              // Becomes {}
  function: () => {},         // Can't serialize
  symbol: Symbol('foo'),      // Can't serialize
  circular: obj               // Stack overflow
};
```

**Solution:** Custom serialization layer

```typescript
class StateSerializer {
  private typeRegistry = new Map<string, TypeHandler>();
  
  serialize(value: any): SerializedValue {
    // 1. Detect type
    const type = this.detectType(value);
    
    // 2. Get handler
    const handler = this.typeRegistry.get(type);
    if (!handler) {
      throw new Error(`No serializer for ${type}`);
    }
    
    // 3. Serialize with metadata
    return {
      __type: type,
      __value: handler.serialize(value)
    };
  }
  
  deserialize(serialized: SerializedValue): any {
    const handler = this.typeRegistry.get(serialized.__type);
    return handler.deserialize(serialized.__value);
  }
}

// Built-in handlers
serializer.register('Date', {
  serialize: (date: Date) => date.toISOString(),
  deserialize: (str: string) => new Date(str)
});

serializer.register('Map', {
  serialize: (map: Map<any, any>) => Array.from(map.entries()),
  deserialize: (entries: any[]) => new Map(entries)
});
```

### Challenge 2: Hydration Timing

**Problem:** When to hydrate?

```
Server renders HTML → Client downloads JS → React hydrates → When to restore state?

Too early:  State not yet needed, waste resources
Too late:   User sees loading/incorrect state
Just right: Progressive hydration
```

**Solution:** Multi-strategy hydration

```typescript
type HydrationStrategy = 
  | 'eager'      // Immediately on page load
  | 'lazy'       // On first access
  | 'idle'       // When browser idle
  | 'visible'    // When component visible
  | 'progressive'; // Critical first, rest later

class HydrationManager {
  hydrate(
    store: Store,
    dehydratedState: DehydratedState,
    strategy: HydrationStrategy
  ) {
    switch (strategy) {
      case 'eager':
        return this.hydrateEagerly(store, dehydratedState);
      
      case 'idle':
        return this.hydrateOnIdle(store, dehydratedState);
      
      case 'progressive':
        return this.hydrateProgressively(store, dehydratedState);
    }
  }
  
  private hydrateOnIdle(store: Store, state: DehydratedState) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.restoreState(store, state);
      });
    } else {
      setTimeout(() => {
        this.restoreState(store, state);
      }, 0);
    }
  }
}
```

### Challenge 3: Memory Leaks

**Problem:** Store persists between requests

```typescript
// ❌ BAD: Global store
const globalStore = createStore();

app.get('/user/:id', (req, res) => {
  globalStore.set(userAtom, fetchUser(req.params.id));
  // Store keeps growing, never cleaned up
  // User A sees User B's data! Security issue!
});
```

**Solution:** Store-per-request with cleanup

```typescript
// ✅ GOOD: Request-scoped store
class RequestStoreManager {
  private stores = new WeakMap<Request, Store>();
  
  getStore(request: Request): Store {
    let store = this.stores.get(request);
    
    if (!store) {
      store = createStore();
      this.stores.set(request, store);
      
      // Auto-cleanup when request ends
      request.on('finish', () => {
        this.cleanup(store);
        this.stores.delete(request);
      });
    }
    
    return store;
  }
  
  private cleanup(store: Store) {
    // Clear all atoms
    store.clear();
    
    // Remove subscribers
    store.unsubscribeAll();
    
    // Allow GC
    store = null;
  }
}
```

---

## System Architecture

### Server-Side Flow

```
┌─────────────────────────────────────────────┐
│          1. Request Arrives                 │
└────────────────┬────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ Create Store   │ ← Per-request isolation
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Fetch Data     │ ← Pre-populate atoms
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Render HTML    │ ← Framework renders
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Serialize      │ ← Dehydrate state
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Inject to HTML │ ← <script>window.__STATE__</script>
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Send Response  │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Cleanup Store  │ ← Prevent memory leaks
         └────────────────┘
```

### Client-Side Flow

```
┌─────────────────────────────────────────────┐
│        1. HTML + JS Downloaded              │
└────────────────┬────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ Parse State    │ ← window.__STATE__
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Create Store   │ ← Client store
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Deserialize    │ ← Restore types
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Hydrate Store  │ ← Populate atoms
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ React Hydrate  │ ← Match server HTML
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Interactive!   │ ← App ready
         └────────────────┘
```

---

## Serialization Strategy

### Dehydration (Server)

```typescript
interface DehydratedState {
  atoms: Record<string, SerializedAtom>;
  metadata: {
    version: string;
    timestamp: number;
    serverRendered: boolean;
  };
}

interface SerializedAtom {
  id: string;
  value: any;
  type?: string; // For custom types
  meta?: Record<string, any>;
}

function dehydrateStore(
  store: Store,
  options?: DehydrationOptions
): DehydratedState {
  const atoms: Record<string, SerializedAtom> = {};
  
  // Get all atoms with values
  for (const [atom, value] of store.entries()) {
    // Skip excluded atoms
    if (options?.exclude?.includes(atom)) continue;
    
    // Only include specified atoms
    if (options?.include && !options.include.includes(atom)) continue;
    
    // Serialize value
    try {
      atoms[atom.id] = {
        id: atom.id,
        value: serializeValue(value, options?.serializers),
        type: detectType(value)
      };
    } catch (error) {
      console.warn(`Failed to serialize atom ${atom.id}:`, error);
    }
  }
  
  return {
    atoms,
    metadata: {
      version: '1.0',
      timestamp: Date.now(),
      serverRendered: true
    }
  };
}
```

### Hydration (Client)

```typescript
function hydrateStore(
  store: Store,
  dehydratedState: DehydratedState,
  options?: HydrationOptions
): void {
  // Validate version
  if (dehydratedState.metadata.version !== '1.0') {
    throw new Error('Incompatible state version');
  }
  
  // Restore atoms
  for (const [atomId, serialized] of Object.entries(dehydratedState.atoms)) {
    // Find atom by ID
    const atom = atomRegistry.getAtomById(atomId);
    if (!atom) {
      console.warn(`Atom ${atomId} not found`);
      continue;
    }
    
    // Deserialize value
    try {
      const value = deserializeValue(
        serialized.value,
        serialized.type,
        options?.deserializers
      );
      
      // Restore to store
      store.set(atom, value);
    } catch (error) {
      console.warn(`Failed to deserialize atom ${atomId}:`, error);
    }
  }
}
```

### Type Handlers

```typescript
// Registry of type handlers
const typeHandlers = new Map<string, TypeHandler>();

interface TypeHandler {
  detect: (value: any) => boolean;
  serialize: (value: any) => any;
  deserialize: (serialized: any) => any;
}

// Date handler
typeHandlers.set('Date', {
  detect: (value) => value instanceof Date,
  serialize: (date: Date) => date.toISOString(),
  deserialize: (str: string) => new Date(str)
});

// Map handler
typeHandlers.set('Map', {
  detect: (value) => value instanceof Map,
  serialize: (map: Map<any, any>) => ({
    entries: Array.from(map.entries())
  }),
  deserialize: (obj: { entries: any[] }) => new Map(obj.entries)
});

// Set handler
typeHandlers.set('Set', {
  detect: (value) => value instanceof Set,
  serialize: (set: Set<any>) => ({
    values: Array.from(set)
  }),
  deserialize: (obj: { values: any[] }) => new Set(obj.values)
});

// RegExp handler
typeHandlers.set('RegExp', {
  detect: (value) => value instanceof RegExp,
  serialize: (regex: RegExp) => ({
    source: regex.source,
    flags: regex.flags
  }),
  deserialize: (obj: { source: string; flags: string }) => 
    new RegExp(obj.source, obj.flags)
});
```

---

## Hydration Mechanism

### Progressive Hydration

```typescript
class ProgressiveHydrator {
  private hydrationQueue: HydrationTask[] = [];
  
  async hydrate(
    store: Store,
    dehydratedState: DehydratedState,
    priorities: AtomPriority[]
  ) {
    // 1. Critical atoms first (blocking)
    const critical = priorities.filter(p => p.level === 'critical');
    for (const { atoms } of critical) {
      await this.hydrateAtoms(store, dehydratedState, atoms);
    }
    
    // 2. High priority on requestIdleCallback
    const high = priorities.filter(p => p.level === 'high');
    requestIdleCallback(() => {
      high.forEach(({ atoms }) => {
        this.hydrateAtoms(store, dehydratedState, atoms);
      });
    });
    
    // 3. Low priority deferred
    const low = priorities.filter(p => p.level === 'low');
    setTimeout(() => {
      low.forEach(({ atoms }) => {
        this.hydrateAtoms(store, dehydratedState, atoms);
      });
    }, 1000);
  }
  
  private async hydrateAtoms(
    store: Store,
    state: DehydratedState,
    atoms: Atom[]
  ) {
    for (const atom of atoms) {
      const serialized = state.atoms[atom.id];
      if (serialized) {
        const value = deserializeValue(serialized.value, serialized.type);
        store.set(atom, value);
      }
    }
  }
}
```

---

## Memory Management

### Store Lifecycle

```typescript
class ServerStoreManager {
  private stores = new Map<string, StoreEntry>();
  
  createStore(requestId: string): Store {
    const store = createStore();
    
    const entry: StoreEntry = {
      store,
      createdAt: Date.now(),
      requestId
    };
    
    this.stores.set(requestId, entry);
    
    return store;
  }
  
  cleanup(requestId: string) {
    const entry = this.stores.get(requestId);
    if (!entry) return;
    
    // 1. Clear all atom values
    entry.store.clear();
    
    // 2. Remove all subscriptions
    entry.store.unsubscribeAll();
    
    // 3. Remove from registry
    this.stores.delete(requestId);
    
    // 4. Log cleanup
    console.debug(`Cleaned up store for request ${requestId}`);
  }
  
  // Auto-cleanup stale stores
  startGC(interval: number = 60000) {
    setInterval(() => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      for (const [requestId, entry] of this.stores.entries()) {
        if (now - entry.createdAt > maxAge) {
          console.warn(`Cleaning up stale store: ${requestId}`);
          this.cleanup(requestId);
        }
      }
    }, interval);
  }
}
```

---

## Performance Optimizations

### 1. Lazy Serialization

```typescript
// Only serialize when needed
class LazySerializer {
  private cache = new WeakMap<Store, DehydratedState>();
  
  serialize(store: Store): DehydratedState {
    // Check cache
    let cached = this.cache.get(store);
    if (cached) return cached;
    
    // Serialize
    const dehydrated = dehydrateStore(store);
    
    // Cache result
    this.cache.set(store, dehydrated);
    
    return dehydrated;
  }
}
```

### 2. Incremental Hydration

```typescript
// Hydrate only what changed
function incrementalHydrate(
  store: Store,
  oldState: DehydratedState,
  newState: DehydratedState
) {
  // Compute diff
  const diff = computeStateDiff(oldState, newState);
  
  // Only hydrate changed atoms
  for (const [atomId, value] of Object.entries(diff.changed)) {
    const atom = atomRegistry.getAtomById(atomId);
    if (atom) {
      store.set(atom, deserializeValue(value));
    }
  }
}
```

### 3. Compression

```typescript
import { compress, decompress } from 'lz-string';

function dehydrateStoreCompressed(store: Store): string {
  const dehydrated = dehydrateStore(store);
  const json = JSON.stringify(dehydrated);
  const compressed = compress(json);
  return compressed;
}

function hydrateStoreCompressed(store: Store, compressed: string) {
  const json = decompress(compressed);
  const dehydrated = JSON.parse(json);
  hydrateStore(store, dehydrated);
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-26  
**Maintained By:** SSR Team  
**Review Schedule:** Quarterly

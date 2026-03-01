# CORE-006: Fix Store Isolation in Atom Registry

## 📋 Task Overview

**Priority:** 🔴 Critical
**Estimated Time:** 4-6 hours
**Status:** ⬜ Not Started
**Assignee:** AI Agent

---

## 🎯 Objective

Fix the store isolation violation in atom-registry.ts where all atoms are stored in a global registry regardless of which store they belong to, breaking store isolation guarantees.

---

## 🐛 Current Problem

### Issue Description

The current `AtomRegistry` implementation violates store isolation by storing all atoms in a single global `Map<symbol, any>` regardless of which store created them.

### Code Analysis

**Current Implementation (BROKEN):**

```typescript
export class AtomRegistry {
  private registry: Map<symbol, any>; // ❌ Global registry for ALL atoms
  private stores: Map<Store, StoreRegistry> = new Map();

  register(atom: any, name?: string): void {
    const id = atom.id;

    // All atoms go into the same global registry!
    if (this.registry.has(id)) {
      return;
    }

    this.registry.set(id, atom); // ❌ No store separation
  }

  attachStore(store: Store, _mode: 'global' | 'isolated' = 'global'): void {
    // Only registers store, doesn't create isolated storage
    if (!this.stores.has(store)) {
      this.stores.set(store, {
        store,
        atoms: new Set(),
      });
    }
    // ❌ Atoms still go to global registry regardless of mode
  }
}
```

### Isolation Violation Scenario

```typescript
// Store 1
const store1 = createStore();
const atom1 = atom(0, 'counter');
store1.set(atom1, 5);

// Store 2
const store2 = createStore();

// ❌ BUG: atom1 is accessible from store2 because it's in global registry!
const value = store2.get(atom1); // Returns 5 instead of isolated state
```

### Expected Behavior

```typescript
// In 'isolated' mode:
// - Each store should have its own atom instances
// - atom1 in store1 should NOT be accessible from store2
// - Same atom definition should create different instances per store

// In 'global' mode:
// - Atoms can be shared across stores (opt-in behavior)
// - But this should be explicit, not default
```

---

## ✅ Acceptance Criteria

- [ ] Atoms in 'isolated' mode are not accessible across stores
- [ ] Each store maintains its own atom registry
- [ ] Global registry is opt-in, not default
- [ ] Symbol IDs are unique per store+atom combination
- [ ] All existing tests pass with new isolation
- [ ] DevTools integration still works with isolated atoms
- [ ] Time travel works independently per store
- [ ] No breaking changes to public API

---

## 📝 Implementation Steps

### Step 1: Redesign AtomRegistry Data Structure

**File:** `packages/core/src/atom-registry.ts`

```typescript
export class AtomRegistry {
  private static instance: AtomRegistry;

  // Per-store registries for isolated mode
  private storeRegistries: Map<
    Store,
    {
      atoms: Map<symbol, any>;
      metadata: Map<symbol, AtomMetadata>;
    }
  > = new Map();

  // Global registry (only for 'global' mode atoms)
  private globalRegistry: {
    atoms: Map<symbol, any>;
    metadata: Map<symbol, AtomMetadata>;
  } = {
    atoms: new Map(),
    metadata: new Map(),
  };

  // Track store attachment mode
  private storeModes: Map<Store, 'global' | 'isolated'> = new Map();

  private counter: number = 0;

  private constructor() {}

  static getInstance(): AtomRegistry {
    if (!AtomRegistry.instance) {
      AtomRegistry.instance = new AtomRegistry();
    }
    return AtomRegistry.instance;
  }
}
```

### Step 2: Update attachStore Method

```typescript
/**
 * Attach a store to the registry with specified mode
 * @param store The store to attach
 * @param mode Registry mode - 'global' or 'isolated' (default: 'isolated')
 */
attachStore(store: Store, mode: "global" | "isolated" = "isolated"): void {
  if (!this.storeRegistries.has(store)) {
    this.storeRegistries.set(store, {
      atoms: new Map(),
      metadata: new Map()
    });
  }

  this.storeModes.set(store, mode);
}
```

### Step 3: Update register Method

```typescript
/**
 * Register an atom with a specific store
 * @param atom The atom to register
 * @param store The store this atom belongs to
 * @param name Optional display name for DevTools
 */
register(atom: any, store: Store | null, name?: string): void {
  const id = atom.id;

  // Determine which registry to use based on store mode
  const registry = this.getRegistryForStore(store);

  // Handle duplicate registrations
  if (registry.atoms.has(id)) {
    if (name) {
      const existingMetadata = registry.metadata.get(id);
      if (existingMetadata) {
        registry.metadata.set(id, {
          ...existingMetadata,
          name
        });
      }
    }
    return;
  }

  // Generate fallback name
  const displayName = name || `atom-${++this.counter}`;

  // Determine atom type
  let type: AtomType;
  if (atom.type) {
    type = atom.type;
  } else if (atom.read) {
    type = atom.write ? 'writable' : 'computed';
  } else {
    type = 'primitive';
  }

  // Store in appropriate registry
  registry.atoms.set(id, atom);
  registry.metadata.set(id, {
    name: displayName,
    createdAt: Date.now(),
    type
  });
}

/**
 * Get the appropriate registry for a store
 */
private getRegistryForStore(store: Store | null): {
  atoms: Map<symbol, any>;
  metadata: Map<symbol, AtomMetadata>;
} {
  if (!store) {
    return this.globalRegistry;
  }

  const mode = this.storeModes.get(store);

  if (mode === 'global') {
    return this.globalRegistry;
  }

  const storeRegistry = this.storeRegistries.get(store);
  if (storeRegistry) {
    return storeRegistry;
  }

  // Fallback to global if store not registered
  return this.globalRegistry;
}
```

### Step 4: Update get Methods

```typescript
/**
 * Get atom by symbol ID and optional store
 * @param id Symbol ID of the atom
 * @param store Optional store to search in
 * @returns The atom or undefined if not found
 */
get(id: symbol, store?: Store): any | undefined {
  // If store provided, check store-specific registry first
  if (store) {
    const storeRegistry = this.storeRegistries.get(store);
    if (storeRegistry && storeRegistry.atoms.has(id)) {
      return storeRegistry.atoms.get(id);
    }

    // Check global registry for global mode stores
    const mode = this.storeModes.get(store);
    if (mode === 'global' && this.globalRegistry.atoms.has(id)) {
      return this.globalRegistry.atoms.get(id);
    }
  }

  // Check global registry
  return this.globalRegistry.atoms.get(id);
}

/**
 * Get atom by name within a specific store
 * @param name The atom name
 * @param store The store to search in
 * @returns The atom or undefined if not found
 */
getByName(name: string, store?: Store): any | undefined {
  if (store) {
    const storeRegistry = this.storeRegistries.get(store);
    if (storeRegistry) {
      for (const [id, atom] of storeRegistry.atoms) {
        const metadata = storeRegistry.metadata.get(id);
        if (metadata && metadata.name === name) {
          return atom;
        }
      }
    }
  }

  // Search global registry
  for (const [id, atom] of this.globalRegistry.atoms) {
    const metadata = this.globalRegistry.metadata.get(id);
    if (metadata && metadata.name === name) {
      return atom;
    }
  }

  return undefined;
}
```

### Step 5: Update Store Integration

**File:** `packages/core/src/store.ts`

```typescript
export function createStore(
  plugins: Plugin[] = [],
  options?: {
    registryMode?: 'global' | 'isolated';
  }
): Store {
  // ... existing code ...

  const store: Store = {
    get,
    set,
    subscribe,
    getState,
    // ... other methods
  };

  // Register store with atom registry
  const mode = options?.registryMode ?? 'isolated'; // Default to isolated!
  atomRegistry.attachStore(store, mode);

  // Apply plugins
  plugins.forEach((plugin) => plugin(store));

  return store;
}
```

### Step 6: Update atom Creation

**File:** `packages/core/src/atom.ts`

```typescript
export function atom<T>(
  initialValue: T,
  name?: string,
  options?: { store?: Store }
): Atom<T> {
  const id = Symbol(name || `atom-${Date.now()}-${Math.random()}`);

  const atomObj: PrimitiveAtom<T> = {
    id,
    type: 'primitive',
    name,
    read: () => initialValue,
    write: (set, value) => {
      set(atomObj, value);
    },
  };

  // Register with specific store if provided
  if (options?.store) {
    atomRegistry.register(atomObj, options.store, name);
  } else {
    atomRegistry.register(atomObj, null, name); // Global registry
  }

  return atomObj;
}
```

### Step 7: Update createStore Calls

Update all places that call `createStore()` to specify the mode:

```typescript
// For shared/global state (DevTools, time travel)
const globalStore = createStore([], { registryMode: 'global' });

// For isolated component state
const isolatedStore = createStore([], { registryMode: 'isolated' });

// Default (backward compatible)
const defaultStore = createStore(); // Uses 'isolated' by default
```

### Step 8: Update Tests

Add tests for store isolation:

```typescript
describe('Store Isolation', () => {
  it('should isolate atoms between stores in isolated mode', () => {
    const store1 = createStore([], { registryMode: 'isolated' });
    const store2 = createStore([], { registryMode: 'isolated' });

    const atom1Store1 = atom(0, 'counter', { store: store1 });
    const atom1Store2 = atom(0, 'counter', { store: store2 });

    store1.set(atom1Store1, 5);
    store2.set(atom1Store2, 10);

    expect(store1.get(atom1Store1)).toBe(5);
    expect(store2.get(atom1Store2)).toBe(10);

    // Atoms should be different instances
    expect(atom1Store1).not.toBe(atom1Store2);
  });

  it('should share atoms in global mode', () => {
    const store1 = createStore([], { registryMode: 'global' });
    const store2 = createStore([], { registryMode: 'global' });

    const sharedAtom = atom(0, 'shared');

    store1.set(sharedAtom, 5);

    // Same atom accessible from both stores
    expect(store2.get(sharedAtom)).toBe(5);
  });
});
```

---

## 🧪 Validation Commands

```bash
# 1. Run tests
pnpm run test

# 2. Verify isolation
cd packages/core
pnpm run test -- src/__tests__/store-isolation.test.ts

# 3. Check build
pnpm run build

# 4. Run DevTools integration tests
pnpm run test --filter=@nexus-state/devtools
```

---

## 📚 Context & Background

### Why This Matters

1. **State Encapsulation**: Stores should encapsulate their state
2. **SSR Safety**: Server-side rendering requires isolated state per request
3. **Micro-frontends**: Different app sections may need isolated state
4. **Testing**: Tests should not leak state between test cases
5. **Memory Management**: Isolated stores can be garbage collected independently

### Breaking Changes

This is a **breaking change** for users relying on implicit atom sharing:

**Before:**

```typescript
const store1 = createStore();
const store2 = createStore();
const sharedAtom = atom(0);

store1.set(sharedAtom, 5);
const value = store2.get(sharedAtom); // Returns 5 (implicit sharing)
```

**After:**

```typescript
const store1 = createStore([], { registryMode: 'isolated' });
const store2 = createStore([], { registryMode: 'isolated' });

const atom1 = atom(0, undefined, { store: store1 });
const atom2 = atom(0, undefined, { store: store2 });

store1.set(atom1, 5);
const value = store2.get(atom2); // Returns 0 (isolated)

// For sharing, use global mode:
const globalStore = createStore([], { registryMode: 'global' });
const sharedAtom = atom(0);
```

---

## 🔗 Related Tasks

- **Depends On:** None
- **Blocks:** Production release (critical isolation bug)
- **Related:**
  - CORE-001 (Store registry implementation)
  - QUAL-005 (Security audit - isolation is security feature)

---

## 📊 Definition of Done

- [ ] Per-store registries implemented
- [ ] Global/isolated modes working correctly
- [ ] All existing tests pass
- [ ] New isolation tests added and passing
- [ ] DevTools integration verified
- [ ] Time travel works per store
- [ ] Documentation updated
- [ ] Migration guide provided
- [ ] No memory leaks

---

## 🚀 Migration Guide

### For Users

If you're currently using multiple stores and relying on atom sharing:

**Option 1: Use Global Mode**

```typescript
// Before
const store1 = createStore();
const store2 = createStore();

// After
const store1 = createStore([], { registryMode: 'global' });
const store2 = createStore([], { registryMode: 'global' });
```

**Option 2: Explicit Atom Sharing**

```typescript
// Before
const sharedAtom = atom(0);
store1.set(sharedAtom, 5);
const value = store2.get(sharedAtom);

// After - pass store explicitly
const atom1 = atom(0, undefined, { store: store1 });
const atom2 = atom(0, undefined, { store: store2 });
// These are now isolated - use global mode if you need sharing
```

### For Package Maintainers

Update your package to pass store context:

```typescript
// Before
export function useAtom(atom) {
  const store = useStore();
  return [store.get(atom), (v) => store.set(atom, v)];
}

// After
export function useAtom(atom, store) {
  const actualStore = store || useStore();
  return [actualStore.get(atom), (v) => actualStore.set(atom, v)];
}
```

---

**Created:** 2026-02-27
**Priority:** Critical (Isolation Bug)
**Estimated Completion:** 2026-02-28
**Actual Completion:** TBD

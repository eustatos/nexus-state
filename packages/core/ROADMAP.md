# @nexus-state/core - Roadmap

> **Package-specific roadmap for the core state management library**

---

## 📦 Package Overview

**Current Version:** 0.1.6  
**Status:** Pre-release (unstable API)  
**Maintainer:** Nexus State Team  
**Last Updated:** 2026-02-26

### Purpose
Core state management primitives - atoms, stores, computed values, and time travel debugging.

### Dependencies
- Zero runtime dependencies
- Dev: TypeScript, Vitest

---

## 🎯 Current State (v0.1.6)

### ✅ What Works
- Basic atom creation (`atom(value)` and `atom(getter)`)
- Store creation and management
- Subscription system
- Computed atoms with dependency tracking
- Time travel (snapshot-based)
- Enhanced store with plugins
- Atom registry for debugging

### ⚠️ Known Issues
- 23 failing tests in time-travel module
- Performance not optimized (120ms for 1000 atoms)
- Bundle size 4.2KB (target: <3KB)
- API not frozen (breaking changes possible)
- Memory leaks in long-running subscriptions

### 📊 Metrics
| Metric | Current | Target v1.0 |
|--------|---------|-------------|
| Test Coverage | 85% | 95%+ |
| Tests Passing | 96.6% (653/676) | 100% |
| Bundle Size | 4.2KB | <3KB |
| Performance | 120ms/1k atoms | <50ms |

---

## 🗓️ Roadmap by Version

---

## v0.2.0 - Stability Release

**Target:** March 31, 2026  
**Focus:** Production-ready core functionality

### Goals
- Fix all failing tests
- Optimize performance
- Reduce bundle size
- Stabilize API

### Features

#### 🐛 Bug Fixes (Critical)
- [ ] Fix time-travel jump-to-snapshot issues
- [ ] Fix time-travel undo/redo edge cases
- [ ] Fix memory leaks in subscription cleanup
- [ ] Fix circular dependency detection

#### 🚀 Performance
- [ ] Optimize atom lookup (O(1) instead of O(n))
- [ ] Lazy evaluation of computed atoms
- [ ] Batch subscription notifications
- [ ] Reduce object allocations in hot paths
- [ ] Target: <50ms for 1000 atoms

#### 📦 Bundle Size
- [ ] Tree-shaking improvements
- [ ] Remove dead code
- [ ] Optimize TypeScript output
- [ ] Target: <3KB gzipped

#### ✅ Testing
- [ ] Achieve 95%+ coverage
- [ ] Add performance benchmarks
- [ ] Add memory leak tests
- [ ] Integration tests with all adapters

### Breaking Changes
- None (maintaining 0.x API)

---

## v1.0.0 - Production Ready

**Target:** June 30, 2026  
**Focus:** API stability and enterprise readiness

### Goals
- **API Freeze:** No breaking changes for 12+ months
- Enterprise-grade quality
- Full TypeScript support
- Comprehensive documentation

### Features

#### 🔒 API Stability
- [ ] Freeze public API surface
- [ ] Deprecation warnings for future changes
- [ ] Semantic versioning commitment
- [ ] API versioning strategy

#### 🏗️ Architecture
- [ ] Plugin system v2 (composable)
- [ ] Middleware hooks (beforeSet, afterSet, onSubscribe)
- [ ] Store isolation modes (scoped stores)
- [ ] Atom namespacing

#### 🧪 Developer Experience
- [ ] Better error messages
- [ ] Debug mode with verbose logging
- [ ] TypeScript strict mode support
- [ ] Performance profiling hooks

#### 📚 Documentation
- [ ] Complete API reference
- [ ] Architecture documentation
- [ ] Performance tuning guide
- [ ] Migration guide from v0.x

### Breaking Changes (from v0.x)
- Deprecate old plugin API
- Remove experimental features
- Stricter TypeScript types

---

## v1.1.0 - Enhanced Atoms

**Target:** September 30, 2026  
**Focus:** Advanced atom capabilities

### Features

#### 🔄 Atom Lifecycle
```typescript
const userAtom = atom(initialValue, {
  onMount: (store) => {
    // Called when first subscriber added
    console.log('User atom mounted');
    return () => {
      // Cleanup when last subscriber removed
      console.log('User atom unmounted');
    };
  },
  
  onUpdate: (oldValue, newValue) => {
    // Called after every update
    console.log('User updated', { oldValue, newValue });
  }
});
```

#### 🎯 Atom Selectors
```typescript
// Select part of an atom's value
const userNameAtom = atom((get) => get(userAtom).name);

// With equality check
const userNameAtom = atom(
  (get) => get(userAtom).name,
  { equals: (a, b) => a.toLowerCase() === b.toLowerCase() }
);
```

#### 🔗 Atom Dependencies
```typescript
// Explicit dependency declaration
const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
  { deps: [firstNameAtom, lastNameAtom] } // Optional explicit deps
);

// Conditional dependencies
const conditionalAtom = atom((get) => {
  const useCache = get(useCacheAtom);
  return useCache ? get(cachedDataAtom) : get(freshDataAtom);
});
```

#### 📝 Atom Metadata
```typescript
const userAtom = atom(initialValue, {
  debugLabel: 'User Profile',
  tags: ['auth', 'user-data'],
  version: 1,
  schema: z.object({ name: z.string(), age: z.number() })
});

// Query atoms by metadata
const authAtoms = store.findAtoms({ tags: ['auth'] });
```

#### 🎨 Writable Computed Atoms
```typescript
const celsiusAtom = atom(0);
const fahrenheitAtom = atom(
  (get) => get(celsiusAtom) * 9/5 + 32, // read
  (get, set, newValue) => {             // write
    set(celsiusAtom, (newValue - 32) * 5/9);
  }
);
```

### API Additions
- `atom.lifecycle()` - Lifecycle hooks
- `atom.selector()` - Derived state with custom equality
- `store.findAtoms()` - Query atoms by metadata
- `store.batch()` - Batch multiple updates

---

## v1.2.0 - Performance & Scale

**Target:** December 31, 2026  
**Focus:** Large-scale applications

### Features

#### ⚡ Performance Optimizations
- [ ] Atom value memoization strategies
- [ ] Subscription batching improvements
- [ ] Lazy computed atom evaluation
- [ ] Virtual atom support (millions of atoms)

#### 📊 Memory Management
```typescript
const store = createStore({
  gc: {
    enabled: true,
    interval: 60000, // Clean up every 60s
    strategy: 'unused-atoms' // Remove atoms with 0 subscribers
  }
});

// Manual cleanup
store.gc.collect(); // Force garbage collection
store.gc.stats();   // Memory usage stats
```

#### 🔍 Advanced Debugging
```typescript
const store = createStore({
  debug: {
    trace: true,              // Stack traces
    performance: true,        // Performance metrics
    subscriptionLeaks: true,  // Detect memory leaks
  }
});

// Debug API
store.debug.getAtomGraph();       // Dependency graph
store.debug.getSubscriptionTree(); // Subscription hierarchy
store.debug.getPerformanceReport(); // Performance stats
```

#### 🎯 Selective Updates
```typescript
// Only notify if value actually changed
const userAtom = atom(initialValue, {
  equals: (prev, next) => prev.id === next.id
});

// Custom comparison
const arrayAtom = atom([], {
  equals: (prev, next) => 
    prev.length === next.length && 
    prev.every((v, i) => v === next[i])
});
```

### Benchmarks
- Support 100,000+ atoms
- <10ms update time for 10,000 subscriptions
- <100MB memory for typical app

---

## v2.0.0 - Next Generation

**Target:** Q2 2027  
**Status:** Vision / Exploration

### Potential Features

#### 🤖 AI-Powered Debugging
```typescript
const store = createStore({
  ai: {
    enabled: true,
    explainChanges: true,
    suggestOptimizations: true
  }
});

// AI explains state change
const explanation = await store.ai.explain(change);
// "This update triggered 47 re-renders because..."
```

#### 🌐 Distributed State
```typescript
// Sync state across tabs/devices
const sharedAtom = atom.distributed(0, {
  channel: 'broadcast-channel', // or 'websocket'
  conflict: 'last-write-wins',   // or 'merge' or custom
  persistence: 'indexeddb'
});
```

#### 🔄 Reactive Transactions
```typescript
store.transaction(() => {
  set(atom1, value1);
  set(atom2, value2);
  set(atom3, value3);
  // All updates batched, subscribers notified once
  // Rollback on error
});
```

#### 📡 Observable Atoms
```typescript
// RxJS interop
const observable$ = toObservable(userAtom);
const atom = fromObservable(observable$);

// Async iteration
for await (const value of atomIterator(userAtom)) {
  console.log('Value changed:', value);
}
```

#### 🎭 Atom Snapshots & Restoration
```typescript
// Save/restore atom state
const snapshot = store.snapshot([atom1, atom2, atom3]);
store.restore(snapshot);

// Compare snapshots
const diff = store.diff(snapshot1, snapshot2);
```

---

## 🔬 Experimental Features

> Features in exploration phase, may or may not ship

### Atom Families v2
```typescript
const todoFamily = atomFamily((id: string) => ({
  id,
  title: '',
  completed: false
}), {
  cache: 'lru',
  maxSize: 1000,
  eviction: (atom) => atom.subscribers.length === 0
});

// Batch operations
todoFamily.updateMany([id1, id2], (draft) => {
  draft.completed = true;
});
```

### Time Travel v2 (Delta-based)
```typescript
const store = createStore({
  timeTravel: {
    strategy: 'delta',      // More memory efficient
    compression: true,       // Compress old snapshots
    maxHistory: 100,
    persistence: 'indexeddb' // Persist history
  }
});
```

### Atom Schema Validation
```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string(),
  age: z.number().min(0)
});

const userAtom = atom(initialValue, {
  schema: userSchema,
  validate: 'throw' // or 'warn' or 'silent'
});

// Runtime validation on set
store.set(userAtom, { name: 'John', age: -1 }); 
// Throws: Invalid age
```

---

## 🚫 Non-Goals

### Will NOT Support
- ❌ Built-in async (use @nexus-state/async)
- ❌ Built-in persistence (use @nexus-state/persist)
- ❌ UI components (keep core headless)
- ❌ GraphQL client features
- ❌ Form validation logic

### Design Principles
1. **Keep core minimal** - Advanced features in separate packages
2. **Zero dependencies** - Core must be dependency-free
3. **Framework agnostic** - No React/Vue/Svelte specifics
4. **Performance first** - Never sacrifice speed for convenience
5. **TypeScript native** - First-class TypeScript support

---

## 📊 Success Metrics

### Quality Gates (must pass for each release)

#### v1.0.0
- [ ] 95%+ test coverage
- [ ] 100% tests passing
- [ ] <3KB bundle size
- [ ] <50ms performance (1000 atoms)
- [ ] Zero memory leaks
- [ ] TypeScript strict mode

#### v1.5.0
- [ ] 98%+ test coverage
- [ ] <2.5KB bundle size
- [ ] <30ms performance (1000 atoms)
- [ ] Support 50,000+ atoms
- [ ] API documentation complete

#### v2.0.0
- [ ] 99%+ test coverage
- [ ] <2KB bundle size
- [ ] <20ms performance (1000 atoms)
- [ ] Support 100,000+ atoms
- [ ] AI-powered debugging working

---

## 🔄 Deprecation Policy

### Process
1. Feature marked deprecated in version N
2. Warning added to documentation
3. Console warning in development mode
4. Removed in version N+2 (minimum 6 months)

### Example Timeline
```
v1.0: Feature X introduced
v1.5: Feature X deprecated (warnings added)
v2.0: Feature X can be removed (if needed)
```

---

## 🐛 Bug Triage Priority

### P0 - Critical (fix immediately)
- Data loss
- Security vulnerability
- Complete feature breakage
- Memory leaks in production

### P1 - High (fix in next patch)
- Incorrect behavior
- Performance regression
- TypeScript errors
- DevTools not working

### P2 - Medium (fix in next minor)
- Edge cases
- Minor performance issues
- Inconvenient API
- Missing documentation

### P3 - Low (backlog)
- Nice-to-have features
- Code quality improvements
- Additional tests
- Documentation typos

---

## 📞 Contributing to Core

### How to Propose Features
1. Check this roadmap
2. Open GitHub Discussion
3. Wait for maintainer feedback
4. Create detailed RFC if approved
5. Submit PR with tests

### Code Review Criteria
- Tests must pass (100%)
- Coverage must not decrease
- Performance benchmarks pass
- TypeScript strict mode
- Documentation updated
- Breaking changes justified

---

## 🔗 Related Packages

### Official Packages
- `@nexus-state/react` - React integration
- `@nexus-state/vue` - Vue integration
- `@nexus-state/svelte` - Svelte integration
- `@nexus-state/devtools` - DevTools integration
- `@nexus-state/async` - Async atom utilities
- `@nexus-state/persist` - State persistence
- `@nexus-state/family` - Atom families

### Roadmap Dependencies
| Core Version | Requires | Enables |
|--------------|----------|---------|
| v0.2.0 | None | All adapters stable |
| v1.0.0 | TypeScript 5.0+ | Enterprise adoption |
| v1.1.0 | None | Advanced adapters |
| v2.0.0 | IndexedDB API | Distributed state |

---

## 📚 Resources

### Documentation
- [Main Documentation](../../docs/)
- [API Reference](../../docs/api/core.md)
- [Architecture](./ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)

### Planning
- [Project Roadmap](../../planning/ROADMAP.md)
- [Current Phase](../../planning/README.md)
- [Changelog](./CHANGELOG.md)

### Community
- [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)
- [Issue Tracker](https://github.com/eustatos/nexus-state/issues)
- [Discord](https://discord.gg/nexus-state) (coming soon)

---

**Roadmap Owner:** Core Team  
**Review Cadence:** Monthly  
**Next Review:** 2026-03-26

---

> 💡 **Feedback Welcome:** This roadmap evolves based on user needs. Share your thoughts in [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)!

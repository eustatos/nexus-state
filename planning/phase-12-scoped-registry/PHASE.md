# Phase 12: Scoped Registry Architecture

## Problem

Current architecture has **triple registration** of atoms across 3 separate data structures:
1. `AtomStateManager.states` — per-store values
2. `StoreImpl.registry.atoms` — per-store Set of IDs
3. `AtomRegistry` (global singleton) — atom references + metadata

This causes:
- Code duplication (3 call sites for `atomRegistry.register()`)
- Bug: `AtomStateManager` uses global singleton, breaking SSR isolation
- Large bundle size (global registry always included)
- Memory overhead (3 structures to sync)

## Solution

Unify all three into a single **`ScopedRegistry`** owned by each Store:

```
┌──────────────────────────────────────┐
│           Store (scoped)             │
│                                      │
│  ┌────────────────────────────────┐ │
│  │       ScopedRegistry           │ │
│  │                                │ │
│  │  entries: Map<symbol, Entry>   │ │
│  │    ┌───────────────────────┐   │ │
│  │    │ AtomEntry:            │   │ │
│  │    │  atom: Atom           │   │ │
│  │    │  state: AtomState     │   │ │
│  │    │  metadata: Metadata   │   │ │
│  │    └───────────────────────┘   │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  DevToolsPlugin (optional)     │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  TimeTravelPlugin (optional)   │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Key Changes

| Before | After |
|--------|-------|
| `atomRegistry` global singleton | No global singletons |
| `createIsolatedRegistry()` for SSR | Every store is isolated by default |
| DevTools built-in | DevTools as optional plugin |
| No time-travel | `snapshot()` / `restore()` API |
| 3 registration call sites | 1 `ScopedRegistry.ensure()` method |

## Migration Strategy

1. Create `ScopedRegistry` (new file, no breaking changes)
2. Refactor `StoreImpl` to use it
3. Remove `atomRegistry.register()` from `AtomStateManager`
4. Convert DevTools to plugin
5. Add `snapshot()` / `restore()` for time-travel
6. Deprecate `createIsolatedRegistry()` and global `atomRegistry`
7. Remove old registry code

## Success Criteria

- ✅ Zero global singletons in core path (`atom` + `createStore` + `get`/`set`)
- ✅ All existing tests pass
- ✅ SSR isolation works by default (no extra API)
- ✅ DevTools tree-shakeable (not in bundle unless imported)
- ✅ `snapshot()` / `restore()` API works
- ✅ Bundle size reduced (no dead code)
- ✅ No duplicate registration logic

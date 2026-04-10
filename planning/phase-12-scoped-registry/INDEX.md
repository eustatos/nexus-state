# Phase 12: Scoped Registry — Task Index

## Overview

Refactor nexus-state from triple-registry architecture to a unified `ScopedRegistry` per store, eliminating global singletons, enabling tree-shakeable DevTools, and adding native time-travel support.

## Task Dependency Graph

```
12.1 ─────────────────────────────────────────────────────┐
  Create ScopedRegistry                                   │
  (new file, no breaking changes)                         │
                                                          ▼
12.2 ─────────────────────────────────────────────────────┤
  Refactor StoreImpl to use ScopedRegistry                │
  (internal refactoring, API unchanged)                   │
  Depends on: 12.1                                        │
                                                          ▼
12.3 ─────────────────────────────────────────────────────┤
  Convert DevTools to Optional Plugin                     │
  (tree-shakeable, separate entry point)                  │
  Depends on: 12.2                                        │
                                                          ▼
12.4 ─────────────────────────────────────────────────────┤
  Add Snapshot / Time-Travel API                          │
  (new feature, no breaking changes)                      │
  Depends on: 12.2, 12.3                                  │
                                                          ▼
12.5 ─────────────────────────────────────────────────────┤
  Remove Global atomRegistry                              │
  (deprecation + removal, BREAKING)                       │
  Depends on: 12.2, 12.3, 12.4                            │
                                                          ▼
12.6 ─────────────────────────────────────────────────────┘
  Optimize Bundle Size & Tree-Shaking
  (verification + optimization)
  Depends on: 12.2, 12.3, 12.5
```

## Execution Order

Tasks can be executed **sequentially** (12.1 → 12.2 → 12.3 → 12.4 → 12.5 → 12.6).

**Parallelization opportunities:**
- 12.3 and 12.4 can start in parallel after 12.2 completes
- 12.6 runs last (validation only)

## Task Summary

| Task | File | Effort | Breaking | Key Output |
|------|------|--------|----------|------------|
| [12.1](tasks/12.1-create-scoped-registry.md) | `store/ScopedRegistry.ts` | Medium | No | Unified registry class |
| [12.2](tasks/12.2-refactor-store-impl.md) | `store/StoreImpl.ts` | Large | No | Refactored store |
| [12.3](tasks/12.3-devtools-as-plugin.md) | `plugins/devtools.ts` | Medium | No | Tree-shakeable DevTools |
| [12.4](tasks/12.4-time-travel-api.md) | `utils/time-travel.ts` | Medium | No | snapshot/restore API |
| [12.5](tasks/12.5-remove-global-registry.md) | `atom-registry.ts` | Small | **Yes** | Deprecation + removal |
| [12.6](tasks/12.6-optimize-bundle.md) | Various | Small | No | Size verification report |

## Architecture Comparison

### Before

```
atom() ──→ atomRegistry (GLOBAL singleton)
                     │
store.get(atom) ────→ atomRegistry.register()  ← 3rd call site
store.set(atom) ────→ atomRegistry.register()  ← 2nd call site
stateManager ───────→ atomRegistry.register()  ← 1st call site (BUG)
```

### After

```
atom() ──→ (no registry — pure object)

store.get(atom) ──→ ScopedRegistry.ensure() ──→ (one call, done)
store.set(atom) ──→ ScopedRegistry.ensure() ──→ (same path)

DevToolsPlugin ──→ subscribes to store events (optional)
TimeTravel ──→ snapshot/restore on store (optional)
```

## Metrics

| Metric | Before | Target After |
|--------|--------|--------------|
| Registration call sites | 3 | 1 |
| Global singletons | 1 (`atomRegistry`) | 0 |
| ESM bundle size (JS only) | ~161 KB | < 100 KB |
| Minimal bundle (atom+store) | ~30 KB | < 5 KB |
| DevTools in minimal bundle | Yes | No |
| SSR isolation API | `createIsolatedRegistry()` | Default (no API needed) |
| Time-travel support | None | `snapshot()` / `restore()` |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing user code | Medium | High | Deprecation phase (Task 12.5) |
| Test failures | High | Medium | Comprehensive test updates in each task |
| Performance regression | Low | High | Benchmark before/after |
| Migration complexity | Medium | Medium | MIGRATION.md with examples |

## Files Changed

| File | Tasks | Action |
|------|-------|--------|
| `store/ScopedRegistry.ts` | 12.1 | **Create** |
| `store/types.ts` | 12.1 | **Create** or update |
| `store/ScopedRegistry.test.ts` | 12.1 | **Create** |
| `store/StoreImpl.ts` | 12.2, 12.3, 12.4 | Modify |
| `store/AtomStateManager.ts` | 12.2 | Modify |
| `store.ts` | 12.2, 12.5 | Modify |
| `plugins/devtools.ts` | 12.3 | **Create** |
| `plugins/devtools.test.ts` | 12.3 | **Create** |
| `debug.ts` | 12.3 | **Create** |
| `utils/time-travel.ts` | 12.4 | **Create** |
| `utils/time-travel.test.ts` | 12.4 | **Create** |
| `types.ts` | 12.4 | Modify |
| `atom-registry.ts` | 12.5 | Deprecate → Delete |
| `atom.ts` | 12.5 | Modify |
| `index.ts` | 12.3, 12.5 | Modify |
| `package.json` | 12.3, 12.6 | Modify |
| `.npmignore` | 12.6 | Modify |
| `MIGRATION.md` | 12.5 | Update |
| `CHANGELOG.md` | 12.5 | Update |

# Phase 14: Cleanup and Consolidation — Task Index

## Overview

Complete partially-implemented work from previous phases, fix critical architectural debt, and consolidate over-split packages. This phase focuses on **finishing what was started** and **solving real problems** rather than planning new features.

## Task Dependency Graph

```
14.1 ─────────────────────────────────────────────────────┐
  Complete DevTools-as-Plugin                              │
  (remove DevToolsIntegration from StoreImpl)              │
  Depends on: none                                         │
                                                           ▼
14.2 ─────────────────────────────────────────────────────┤
  Decide Time-Travel Fate                                  │
  (accept/reject/defer with rationale)                     │
  Depends on: 14.1                                         │
                                                           ▼
14.3 ─────────────────────────────────────────────────────┤
  Finish Remove Global Singletons                          │
  (remove deprecated batcher, globalActionTracker)         │
  Depends on: none                                         │
                                                           ▼
14.4 ─────────────────────────────────────────────────────┤
  Measure and Optimize Bundle Size                         │
  (achieve < 5 KB minimal bundle)                          │
  Depends on: 14.1, 14.3                                   │
                                                           ▼
14.5 ─────────────────────────────────────────────────────┤
  Consolidate Micro-Packages                               │
  (merge 6 single-file packages into @nexus-state/extras)  │
  Depends on: none                                         │
                                                           ▼
14.6 ─────────────────────────────────────────────────────┤
  Fix form → react Dependency                              │
  (make form framework-agnostic)                           │
  Depends on: none                                         │
                                                           ▼
14.7 ─────────────────────────────────────────────────────┤
  Deduplicate form-builder                                 │
  (remove byte-identical copy in form-builder-react)       │
  Depends on: 14.6                                         │
                                                           ▼
14.8 ─────────────────────────────────────────────────────┘
  Update All Documentation                                 │
  (sync task files, READMEs, MIGRATION.md)                 │
  Depends on: 14.1-14.7
```

## Execution Order

Tasks can be executed **sequentially** (14.1 → 14.2 → ... → 14.8).

**Parallelization opportunities:**
- 14.1 and 14.3 can run in parallel (independent)
- 14.5, 14.6, 14.7 can run in parallel after 14.1-14.4 complete
- 14.8 runs last (documentation sync)

## Task Summary

| Task | File | Effort | Breaking | Key Output |
|------|------|--------|----------|------------|
| [14.1](tasks/14.1-complete-devtools-plugin.md) | `StoreImpl.ts`, `DevToolsIntegration.ts` | Medium | No | DevTools fully optional |
| [14.2](tasks/14.2-decide-time-travel-fate.md) | Documentation | Small | No | Decision document |
| [14.3](tasks/14.3-finish-remove-singletons.md) | `batching.ts`, `action-tracker.ts` | Small | **Yes** | Zero global singletons |
| [14.4](tasks/14.4-measure-bundle-size.md) | Measurement scripts | Small | No | Bundle < 5 KB gzipped |
| [14.5](tasks/14.5-consolidate-micro-packages.md) | 6 packages | Large | **Yes** | `@nexus-state/extras` package |
| [14.6](tasks/14.6-fix-form-react-dependency.md) | `form/package.json`, `form/src/` | Medium | **Partial** | Form framework-agnostic |
| [14.7](tasks/14.7-deduplicate-form-builder.md) | `form-builder-react/src/` | Medium | No | No code duplication |
| [14.8](tasks/14.8-update-documentation.md) | All docs | Small | No | Docs match reality |

## Decisions

| Decision | Status | Rationale | Document |
|----------|--------|-----------|----------|
| Time-Travel API | **REJECTED** | Separate package exists, DevTools plugin provides it, low user demand, violates minimal core principle | [decisions/time-travel.md](decisions/time-travel.md) |

## Current State (as of 2026-07-10)

### What Works Well

| Component | Status | Evidence |
|-----------|--------|----------|
| `ScopedRegistry` | ✅ Fully integrated | 305 lines, single source of truth for atom data |
| `StoreImpl` lazy subsystems | ✅ 4 required + 3 lazy | PluginSystem, DevToolsIntegration, BatchProcessor are null-checked |
| `AtomStateManager` | ✅ Removed | Zero references in codebase |
| Subpath exports | ✅ Configured | 6 subpaths in `package.json`, `sideEffects: false` |
| Dead code | ✅ Removed | `enhanced-store.ts`, `SignalBasedReactive.ts`, `reactive/config.ts` deleted |
| `PluginSystem` optimization | ✅ O(1) early return | `this.hooks.length === 0` checks in all three hook methods |

### What Needs Work

| Issue | Current State | Impact |
|-------|---------------|--------|
| `DevToolsIntegration` hardcoded | Still imported in `StoreImpl` (245 lines) | Adds 0.35 KB to minimal bundle, prevents tree-shaking |
| Time-travel API | Not implemented (only `setByName` exists) | Feature gap, but low user demand |
| Global `batcher` | Exported as `@deprecated` | SSR-unsafe, but backward-compatible alias exists |
| Global `globalActionTracker` | Exported as `@deprecated` | SSR-unsafe, but backward-compatible alias exists |
| Minimal bundle size | 5.35 KB gzipped (target < 5 KB) | Exceeds target by 0.35 KB due to DevToolsIntegration |
| `form` → `react` dependency | Hard dependency in `package.json` | Forces React on Vue/Svelte users |
| `form-builder-react` duplication | Byte-identical copy of `form-builder-core` | Maintenance burden, risk of divergence |
| Micro-packages (8 packages) | 20-180 lines each, single file | Over-splitting, package management overhead |

## Architecture Comparison

### Before (current)

```
import { atom, createStore } from '@nexus-state/core'
  └── pulls in:
      ├── atom.ts ✓
      ├── createStore / StoreImpl
      │   ├── ScopedRegistry
      │   ├── ComputedEvaluator
      │   ├── DependencyTracker
      │   ├── NotificationManager
      │   ├── PluginSystem?          ← lazy, only if plugins
      │   ├── DevToolsIntegration    ← always imported (245 lines)
      │   └── BatchProcessor?        ← lazy, only if batching
      └── DevToolsIntegration code   ← 0.35 KB in minimal bundle

@nexus-state/async     ← 80 lines, single file
@nexus-state/family    ← 50 lines, single file
@nexus-state/immer     ← 70 lines, single file
@nexus-state/persist   ← 70 lines, single file
@nexus-state/middleware← 180 lines, single file
@nexus-state/web-worker← 100 lines, single file
  └── 6 separate packages, each with own package.json, README, tests

@nexus-state/form
  └── depends on @nexus-state/react (forces React on Vue/Svelte users)

@nexus-state/form-builder-react
  └── byte-identical copy of form-builder-core + React wrappers
```

### After (target)

```
import { atom, createStore } from '@nexus-state/core'
  └── pulls in:
      ├── atom.ts ✓
      ├── createStore / StoreImpl
      │   ├── ScopedRegistry
      │   ├── ComputedEvaluator
      │   ├── DependencyTracker
      │   ├── NotificationManager
      │   ├── PluginSystem?          ← lazy
      │   ├── DevToolsIntegration?   ← lazy (dynamic import or removed)
      │   └── BatchProcessor?        ← lazy
      └── NO DevTools code in minimal bundle (< 5 KB)

@nexus-state/extras
  ├── /async      ← subpath export
  ├── /family     ← subpath export
  ├── /immer      ← subpath export
  ├── /persist    ← subpath export
  ├── /middleware ← subpath export
  └── /web-worker ← subpath export
  └── single package, shared infrastructure

@nexus-state/form
  └── framework-agnostic core + optional React/Vue/Svelte subpaths

@nexus-state/form-builder-react
  └── imports from form-builder-core, no duplication
```

## Metrics

| Metric | Before | Target After |
|--------|--------|--------------|
| Minimal bundle (atom + store) | 5.35 KB gzipped | < 5 KB gzipped |
| Global singletons (deprecated) | 2 (`batcher`, `globalActionTracker`) | 0 |
| `DevToolsIntegration` in minimal bundle | Yes (0.35 KB) | No |
| Packages in monorepo | 23 | 18 (after consolidation) |
| Micro-packages (1 file) | 8 | 2 (svelte, vue — framework isolation) |
| `form` React dependency | Hard | Optional (subpath) |
| Code duplication in form-builder | 100% copy | 0% (imports from core) |
| Time-travel API decision | Undecided | Documented (accept/reject/defer) |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking user code with global singletons | Medium | High | Major version bump (1.0.0), migration guide |
| `form` React removal breaks existing code | High | High | Keep React subpath (`@nexus-state/form/react`), deprecation period |
| Package consolidation confuses users | Medium | Medium | Clear migration guide, re-export from old names temporarily |
| DevTools dynamic import adds complexity | Low | Low | Fallback to static import if dynamic fails |
| Time-travel rejection disappoints users | Low | Low | Document rationale, point to `@nexus-state/time-travel` package |
| Bundle size still exceeds target | Low | Low | Profile with actual user code, not synthetic tests |

## Files Changed

| File | Tasks | Action |
|------|-------|--------|
| `store/StoreImpl.ts` | 14.1, 14.4 | Modify — remove DevToolsIntegration import |
| `store/DevToolsIntegration.ts` | 14.1 | Deprecate or remove |
| `batching.ts` | 14.3 | Remove `batcher` export |
| `utils/action-tracker.ts` | 14.3 | Remove `globalActionTracker` export |
| `package.json` (core) | 14.4, 14.5 | Update exports, add `extras` workspace |
| `packages/async/` | 14.5 | Move to `packages/extras/async/` |
| `packages/family/` | 14.5 | Move to `packages/extras/family/` |
| `packages/immer/` | 14.5 | Move to `packages/extras/immer/` |
| `packages/persist/` | 14.5 | Move to `packages/extras/persist/` |
| `packages/middleware/` | 14.5 | Move to `packages/extras/middleware/` |
| `packages/web-worker/` | 14.5 | Move to `packages/extras/web-worker/` |
| `packages/extras/` | 14.5 | **Create** — consolidated package |
| `packages/form/package.json` | 14.6 | Remove `@nexus-state/react` dependency |
| `packages/form/src/` | 14.6 | Split React hooks into subpath |
| `packages/form-builder-react/src/` | 14.7 | Remove duplicated files, import from core |
| `MIGRATION.md` | 14.8 | Update with Phase 14 changes |
| All task files | 14.8 | Mark completed tasks |

## Success Criteria

- [x] `DevToolsIntegration` not statically imported in `StoreImpl` ✅ (14.1)
- [x] Minimal bundle < 5 KB gzipped (atom + createStore only) ✅ 4.33 KB (14.4)
- [x] Zero global singletons in published code (`batcher`, `globalActionTracker` removed) ✅ (14.3)
- [x] Time-travel fate documented (accept/reject/defer with rationale) ✅ REJECTED (14.2)
- [x] 6 micro-packages consolidated into `@nexus-state/extras` ✅ (14.5, 8/10 criteria — tests not moved)
- [x] `form` package does not depend on `@nexus-state/react` in main entry ✅ (14.6)
- [ ] `form-builder-react` imports from `form-builder-core` (no duplication) ❌ (14.7 not started)
- [x] All task files reflect actual completion status ✅ (14.8)
- [x] `MIGRATION.md` updated with breaking changes ✅ (14.8)
- [ ] All existing tests pass ⚠️ (14.5 tests not moved to extras)
- [x] Monorepo has 18 packages (down from 23) ✅ (14.5)

## Versioning Strategy

This phase includes **breaking changes** (removal of deprecated globals, package consolidation, form React dependency removal). Recommended approach:

1. **Deprecation period** (current release): Keep deprecated exports with warnings
2. **Major version bump** (Phase 14 release): Remove deprecated exports, consolidate packages
3. **Migration guide**: Document all breaking changes with before/after examples
4. **Temporary re-exports**: Old package names (`@nexus-state/async`, etc.) re-export from `@nexus-state/extras` for one minor version

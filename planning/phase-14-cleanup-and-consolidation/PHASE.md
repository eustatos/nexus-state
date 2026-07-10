# Phase 14: Cleanup and Consolidation — Finish What Was Started

## Problem

After Phase 12 (Scoped Registry) and Phase 13 (Core Modularity), the codebase is **mostly** in good shape, but several critical items remain incomplete, and new architectural debt has accumulated:

1. **DevToolsIntegration is still hardcoded in StoreImpl** — prevents tree-shaking, adds 0.35 KB to minimal bundle
2. **Time-travel API was never implemented** — planned but not delivered, decision needed
3. **Global singletons still exported** — `batcher` and `globalActionTracker` marked `@deprecated` but not removed
4. **Minimal bundle exceeds target** — 5.35 KB vs < 5 KB target (due to DevToolsIntegration)
5. **8 micro-packages are over-split** — 20-180 lines each, package management overhead
6. **`form` hard-depends on React** — forces React on Vue/Svelte users
7. **`form-builder-react` duplicates `form-builder-core`** — byte-identical copy
8. **Task files are stale** — Phase 13 shows all `[ ]` but 4 of 6 tasks are done

This phase focuses on **completion, not expansion**. No new features. No new abstractions. Just finishing and consolidating.

---

## Current State (as of 2026-07-10)

### Completed (Phase 12 + 13)

| Item | Status | Evidence |
|------|--------|----------|
| `ScopedRegistry` | ✅ Done | `store/ScopedRegistry.ts` (305 lines), fully integrated in StoreImpl |
| `AtomStateManager` removed | ✅ Done | Zero references in codebase |
| Lazy subsystem initialization | ✅ Done | 4 required + 3 lazy (PluginSystem, DevToolsIntegration, BatchProcessor) |
| `PluginSystem` O(1) optimization | ✅ Done | `this.hooks.length === 0` early return in all three methods |
| Subpath exports configured | ✅ Done | 6 subpaths in `package.json`, `sideEffects: false` |
| Dead code removed | ✅ Done | `enhanced-store.ts`, `SignalBasedReactive.ts`, `reactive/config.ts` deleted |

### Incomplete

#### 1. DevToolsIntegration Still Hardcoded (from Phase 12.3)

**File:** `packages/core/src/store/StoreImpl.ts` (line ~72)

```typescript
private _devTools: DevToolsIntegration | null = null;
```

**Problem:** `DevToolsIntegration` (245 lines) is statically imported, even though it's only created when `options.devtools: true`. This adds ~0.35 KB to the minimal bundle.

**Current state:**
- `DevToolsIntegration` class exists at `store/DevToolsIntegration.ts`
- Separate `DevToolsPlugin` exists at `plugins/devtools.ts` (300 lines) — full Redux DevTools integration
- Two independent implementations coexist

**Why it matters:** Minimal bundle (atom + createStore) should not include DevTools code. Current size: 5.35 KB gzipped. Target: < 5 KB.

#### 2. Time-Travel API Never Implemented (from Phase 12.4)

**Planned:** `snapshot()` / `restore()` API on Store, `TimeTravelManager` class

**Actual:** Only `setByName(name, value)` exists (for SSR hydration). No snapshot/restore. `@nexus-state/time-travel` package exists separately but is not integrated into core.

**Why it matters:** Feature was over-engineered in planning (time-travel manager with back/forward/history), never implemented. Need to decide: accept (move to separate phase), reject (document why), or defer (postpone to future).

#### 3. Global Singletons Still Exported (from Phase 13.3)

**File:** `packages/core/src/batching.ts` (line 112)

```typescript
/**
 * @deprecated Use per-store Batcher instead. Global state is SSR-unsafe and causes test pollution.
 */
export const batcher = standaloneBatcher;
```

**File:** `packages/core/src/utils/action-tracker.ts` (line 238)

```typescript
/**
 * @deprecated Use per-instance ActionTracker instead. Global state is SSR-unsafe.
 */
export const globalActionTracker = new ActionTracker();
```

**Problem:** Deprecated exports still present. Users can still import them. SSR-unsafe.

**Why it matters:** Zero global singletons was a Phase 13 goal. Deprecated exports violate this.

#### 4. Bundle Size Exceeds Target

**Measurement:** `packages/core/BUNDLE-REPORT.md` (2026-06-05)

| Scenario | Raw | Gzip | Target | Status |
|----------|-----|------|--------|--------|
| Minimal (atom + createStore) | 17.86 KB | **5.35 KB** | < 5 KB | ❌ +0.35 KB |
| + batching | 17.92 KB | 5.37 KB | +1 KB | ✅ |
| + devtools | 20.01 KB | 5.89 KB | +2 KB | ✅ |
| Full (backward compat) | 21.05 KB | 6.25 KB | < 15 KB | ✅ |

**Root cause:** Static import of `DevToolsIntegration` in `StoreImpl` pulls in `serializeState` and `storeLogger` (0.35 KB).

#### 5. Micro-Packages Are Over-Split

| Package | Lines | Files | Justification |
|---------|-------|-------|---------------|
| `async` | ~80 | 1 | Weak — helper function |
| `family` | ~50 | 1 | Weak — trivial utility |
| `immer` | ~70 | 1 | Weak — single function |
| `persist` | ~70 | 1 | Weak — single plugin |
| `middleware` | ~180 | 1 | Moderate — small plugin |
| `web-worker` | ~100 | 1 | Moderate — separate concept |
| `svelte` | ~20 | 1 | **Extremely weak** — one function |
| `vue` | ~25 | 1 | **Extremely weak** — one function |

**Problem:** Each package has its own `package.json`, README, tests, build config. Maintenance burden. Confusing for users ("do I need @nexus-state/async or is it in core?").

**Why it matters:** Tree-shaking works via subpath exports + `sideEffects: false`. Separate packages add overhead without benefit.

#### 6. `form` Hard-Depends on React

**File:** `packages/form/package.json`

```json
{
  "dependencies": {
    "@nexus-state/react": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

**Problem:** Vue/Svelte users of `@nexus-state/form` must install React. Form package is not framework-agnostic despite claims.

**Why it matters:** Library should work with any framework. React hooks should be optional subpath.

#### 7. `form-builder-react` Duplicates `form-builder-core`

**Files:**
- `packages/form-builder-core/src/state/builder-state.ts`
- `packages/form-builder-react/src/state/builder-state.ts`

**Problem:** Byte-identical copy. Same for `schema/`, `registry/`, `export/`, `utils/` directories.

**Why it matters:** Maintenance burden. Risk of divergence. `form-builder-react/src/index.ts` does `export * from '@nexus-state/form-builder-core'` — so why duplicate?

#### 8. Task Files Are Stale

**Phase 13 task files:** All show `[ ]` for acceptance criteria, but:
- 13.1 (Remove AtomStateManager) — ✅ done
- 13.2 (Lazy Subsystem Init) — ✅ done
- 13.4 (Optimize PluginSystem) — ✅ done
- 13.3, 13.5, 13.6 — 🟡 mostly done

**Why it matters:** Developers (and LLMs) read task files as source of truth. Stale files mislead.

---

## Target Architecture

### Principle: Finish, Don't Expand

```
@nexus-state/core (minimal import)
├── atom()                     ← pure object factory
├── createStore()              ← StoreImpl with lazy subsystems
│   ├── ScopedRegistry         ← always
│   ├── ComputedEvaluator      ← always
│   ├── DependencyTracker      ← always
│   ├── NotificationManager    ← always
│   ├── PluginSystem?          ← lazy
│   ├── DevToolsIntegration?   ← lazy (dynamic import or removed)
│   └── BatchProcessor?        ← lazy
└── NO global singletons
    NO DevTools code in minimal bundle
    NO dead code

@nexus-state/extras (consolidated)
├── /async      ← subpath export
├── /family     ← subpath export
├── /immer      ← subpath export
├── /persist    ← subpath export
├── /middleware ← subpath export
└── /web-worker ← subpath export

@nexus-state/form (framework-agnostic)
├── /           ← core form logic (no React dependency)
├── /react      ← React hooks (optional)
├── /vue        ← Vue composables (optional, future)
└── /svelte     ← Svelte stores (optional, future)

@nexus-state/form-builder-react (no duplication)
├── imports from @nexus-state/form-builder-core
└── React-specific wrappers only
```

### Key Changes

| Before | After |
|--------|-------|
| `DevToolsIntegration` statically imported | Dynamic import or removed from StoreImpl |
| Global `batcher` exported (deprecated) | Removed (major version bump) |
| Global `globalActionTracker` exported (deprecated) | Removed (major version bump) |
| Minimal bundle 5.35 KB | < 5 KB (DevToolsIntegration removed from core path) |
| 8 micro-packages | 2 framework packages (svelte, vue) + 1 extras package |
| `form` depends on React | Framework-agnostic core + optional React subpath |
| `form-builder-react` duplicates core | Imports from core, no duplication |
| Time-travel API undecided | Documented decision (accept/reject/defer) |
| Task files stale | Updated to reflect reality |

---

## Migration Strategy

### Breaking Changes (Require Major Version Bump)

1. **Remove `batcher` and `globalActionTracker` exports**
   - Migration: Use per-store `Batcher` or `BatchProcessor`
   - Document in `MIGRATION.md`

2. **Consolidate micro-packages**
   - Old: `@nexus-state/async`, `@nexus-state/family`, etc.
   - New: `@nexus-state/extras/async`, `@nexus-state/extras/family`, etc.
   - Temporary: Old package names re-export from `@nexus-state/extras` for one minor version

3. **Remove React dependency from `form`**
   - Old: `import { useForm } from '@nexus-state/form'` (includes React hooks)
   - New: `import { useForm } from '@nexus-state/form'` (core only)
   - New: `import { useFormState } from '@nexus-state/form/react'` (React hooks)

### Non-Breaking Changes

1. **DevToolsIntegration removal from StoreImpl**
   - Internal refactoring, no API change
   - DevTools still works via `devtools()` plugin

2. **Time-travel decision**
   - Documentation only, no code change

3. **`form-builder-react` deduplication**
   - Internal refactoring, no API change
   - Still exports same functions, just imports from core

---

## Success Criteria

- [ ] `DevToolsIntegration` not statically imported in `StoreImpl`
- [ ] Minimal bundle < 5 KB gzipped (verified with `bundle:measure`)
- [ ] Zero global singletons in published code
- [ ] Time-travel fate documented (accept/reject/defer with rationale)
- [ ] 6 micro-packages consolidated into `@nexus-state/extras`
- [ ] `form` package does not depend on `@nexus-state/react` in main entry
- [ ] `form-builder-react` imports from `form-builder-core` (no duplication)
- [ ] All task files reflect actual completion status
- [ ] `MIGRATION.md` updated with breaking changes
- [ ] All existing tests pass
- [ ] Monorepo has 18 packages (down from 23)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking user code with global singletons | Medium | High | Major version bump, migration guide, deprecation period |
| `form` React removal breaks existing code | High | High | Keep React subpath, deprecation period, clear migration guide |
| Package consolidation confuses users | Medium | Medium | Clear migration guide, temporary re-exports from old names |
| DevTools dynamic import adds complexity | Low | Low | Fallback to static import if dynamic fails, thorough testing |
| Time-travel rejection disappoints users | Low | Low | Document rationale, point to `@nexus-state/time-travel` package |
| Bundle size still exceeds target | Low | Low | Profile with actual user code, adjust target if needed |

---

## Versioning Strategy

This phase includes **breaking changes**. Recommended approach:

1. **Current release (0.2.x):** Keep deprecated exports with warnings
2. **Next minor (0.3.0):** Add `@nexus-state/extras` package, add React subpath to `form`
3. **Major version (1.0.0):** Remove deprecated exports, consolidate packages, remove React from `form` main entry
4. **Migration guide:** Document all breaking changes with before/after examples
5. **Temporary re-exports:** Old package names re-export from new locations for one minor version

---

## Conclusion

Phase 14 is about **discipline, not ambition**. The architecture is sound. The foundations (ScopedRegistry, lazy subsystems, subpath exports) are in place. What's needed is:

1. Finish incomplete work (DevTools, singletons, bundle size)
2. Make a decision on time-travel (stop leaving it in limbo)
3. Consolidate over-split packages (reduce complexity)
4. Fix architectural debt (form→react, form-builder duplication)
5. Update documentation (sync task files with reality)

No new features. No new abstractions. Just completion and consolidation.

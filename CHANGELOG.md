# Changelog

All notable changes to the Nexus State monorepo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For package-specific changelogs, see individual package directories.

## [Unreleased]

### Features

- **`@nexus-state/extras`** — New consolidated package with subpath exports for async, family, immer, persist, middleware, web-worker
- **Form package framework-agnostic** — Removed React dependency from main entry, React hooks moved to `./react` subpath

### Deprecations

- **Micro-packages deprecated** — `@nexus-state/async`, `family`, `immer`, `persist`, `middleware`, `web-worker` now re-export from `@nexus-state/extras`
- **`options.devtools`** — Shows deprecation warning, use `devtools()` plugin instead

### Documentation

- Added [VERSIONING.md](planning/phase-14-cleanup-and-consolidation/VERSIONING.md) with versioning strategy
- Updated [MIGRATION.md](MIGRATION.md) with v0.3.0 and v1.0.0 migration guides
- Updated main README.md with new package structure
- Added time-travel decision document

## [0.2.2] - 2026-07-10

### Breaking Changes

#### Global Singletons Removed (v1.0.0 Preparation)

- **`batcher` removed** from `@nexus-state/core/batching`
  - Use `batch()` function instead: `import { batch } from '@nexus-state/core/batching'`
  - Global `batcher` was SSR-unsafe and caused test pollution

- **`globalActionTracker` removed** from `@nexus-state/core/utils`
  - Use per-instance `ActionTracker` instead: `import { ActionTracker } from '@nexus-state/core/utils'`
  - Global `globalActionTracker` was SSR-unsafe

- **`DevToolsIntegration` removed** from `StoreImpl`
  - Use `devtools()` plugin from `@nexus-state/core/devtools` instead
  - `options.devtools` is deprecated and has no effect
  - `store.getDevTools()` returns `null`

**Migration:** See [MIGRATION.md](MIGRATION.md) for detailed migration guide.

### Improvements

- **Minimal bundle reduced to 4.33 KB gzipped** (was 5.35 KB)
  - Removed static import of `DevToolsIntegration` from `StoreImpl`
  - DevTools code no longer included in minimal bundle
  - Tree-shaking verified for all optional features

- **Zero global singletons** in core path
  - All global state removed for SSR safety
  - Test isolation improved

### Package Changes

- **`@nexus-state/core`** — v0.2.2 (breaking changes)
- **`@nexus-state/extras`** — v0.2.1 (new package)
- **`@nexus-state/form`** — v0.2.1 (framework-agnostic)
- All other packages — v0.2.1 (no changes)

## [0.2.1] - 2026-06-05

### Features

- **ScopedRegistry architecture** — Unified atom registry per store (Phase 12)
- **Lazy subsystem initialization** — Optional subsystems created on demand (Phase 13)
- **Subpath exports** — `@nexus-state/core/batching`, `./debug`, `./devtools`, `./reactive`, `./utils`
- **PluginSystem O(1) optimization** — Early return when no plugins

### Improvements

- **Removed `AtomStateManager`** — Data now in `ScopedRegistry` only
- **Removed dead code** — `enhanced-store.ts`, `SignalBasedReactive.ts`, `reactive/config.ts`
- **Removed global `atomRegistry`** — Atoms scoped to stores

### Breaking Changes

- **Removed `createIsolatedRegistry()`** — Every store is isolated by default

## [0.2.0] - 2026-03-16

### Breaking Changes

#### CommonJS Builds Removed

All packages now ship **ESM-only** builds:
- Removed `dist/cjs/` output directories
- Removed `require` exports from `package.json`
- Updated `main` and `module` fields to point to ESM builds

**Migration:** Use dynamic `import()` instead of `require()`, or configure your bundler for ESM.

#### @nexus-state/core: Store-Based Atom Architecture

- Replaced global atom registry with scoped store-based registry
- Atoms are now registered per-store instead of globally
- `atom()` function signature unchanged, but internal behavior differs
- Store instances now manage their own atom state independently

**Affected packages:**
- `@nexus-state/devtools` — Updated to work with new store architecture
- `@nexus-state/time-travel` — Updated capture/flush to use store-specific registry
- `@nexus-state/undo-redo` — Updated for new architecture
- All framework adapters (react, vue, svelte) continue to work without changes

### New Features

#### @nexus-state/query

- Added `getQueryData<T>()` function to retrieve cached query data without suspending
- Added `setQueryData()` function to manually set query cache values
- Added `prefetchQuery()` and `prefetchQueries()` for data preloading
- Added `invalidateQuery()` for cache invalidation

### Other Changes

- **@nexus-state/web-worker** — Improved worker error handling and documentation
- **@nexus-state/query** — Fixed TypeScript type inference in test examples

## [0.1.19] - 2026-02-20

### Features

- **Benchmarks CI pipeline** — Automated benchmark runs on every PR with performance regression detection (>10% threshold)
- **Performance optimization** — Eliminate O(n) overhead and add lazy atom registration
  - Register atoms only in current store instead of iterating all stores (O(1) registration)
  - Add lazy atom registration on first `get()`/`set()` call
  - Memory savings: ~30% for unused atoms
  - Update `TimeTravelController` to force-register atoms in `capture()`

### Documentation

- Added `best-practices.md` with patterns and anti-patterns
- Updated `performance/index.md` with benchmarks and examples
- Removed internal working documents

## [0.1.12] - 2026-03-16

### Changed

- **BREAKING**: Time Travel functionality moved to `@nexus-state/time-travel`
  - `TimeTravelController`, `SimpleTimeTravel` exported from `@nexus-state/time-travel`
  - `createEnhancedStore` no longer supports `enableTimeTravel` option
  - Use `@nexus-state/time-travel` for time travel debugging
- Reduced production bundle size to ~500 KB (from ~3.9 MB)
- Updated package version to 0.1.12

### Added

- `__deprecatedTimeTravel()` helper for backward compatibility warnings
- `@nexus-state/time-travel` as peer dependency

### Removed

- `src/time-travel/` directory and all time-travel code
- `enableTimeTravel` option from `createEnhancedStore`
- Time travel methods from `EnhancedStore` interface

## [0.1.11] - 2024-03-16

### Added

- Time Travel debugging capabilities
- Snapshot serialization and deserialization
- Delta-based change tracking
- Compression strategies for snapshots
- History management with navigation

### Changed

- Improved TypeScript types for better inference
- Enhanced error messages for validation failures

### Fixed

- Fixed atom state initialization edge cases
- Fixed batch update ordering issues

## [0.1.10] - 2024-02-20

### Added

- Batch updates support
- Action tracking for DevTools

### Fixed

- Memory leak in atom subscriptions

## [0.1.0] - 2024-01-15

### Added

- Initial release
- Core atom-based state management
- Store implementation
- Basic utilities

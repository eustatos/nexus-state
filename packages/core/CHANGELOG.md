# Changelog

## 0.2.2

### Patch Changes

- Fix npm metadata and broken exports for better discoverability
  - Add missing description, keywords, homepage, repository.directory to all packages
  - Fix broken require exports (vue, svelte, query, time-travel, undo-redo)
  - Add type:module and sideEffects to form package
  - Move @nexus-state/react to peerDependencies in query package
  - Exclude deprecated packages from workspace (async, family, immer, persist, middleware, web-worker)

## 0.2.2

### Breaking Changes

- **Removed `batcher` global singleton** from `@nexus-state/core/batching`
  - Use `batch()` function instead: `import { batch } from '@nexus-state/core/batching'`
  - Global `batcher` was SSR-unsafe and caused test pollution

- **Removed `globalActionTracker` global singleton** from `@nexus-state/core/utils`
  - Use per-instance `ActionTracker` instead: `import { ActionTracker } from '@nexus-state/core/utils'`
  - Global `globalActionTracker` was SSR-unsafe

- **Removed built-in `DevToolsIntegration`** from `StoreImpl`
  - Use `devtools()` plugin from `@nexus-state/core/devtools` instead
  - `options.devtools` is deprecated and has no effect
  - `store.getDevTools()` returns `null`

**Migration:** See [MIGRATION.md](../../MIGRATION.md) for detailed migration guide.

### Improvements

- **Minimal bundle reduced to 4.33 KB gzipped** (was 5.35 KB)
  - Removed static import of `DevToolsIntegration` from `StoreImpl`
  - DevTools code no longer included in minimal bundle
  - Tree-shaking verified for all optional features

- **Zero global singletons** in core path
  - All global state removed for SSR safety
  - Test isolation improved

## 0.2.1

### Patch Changes

- fix: Replace workspace:\* with real versions for npm publish

## 0.2.0

### Minor Changes

- refactor: core store architecture and remove CommonJS builds

  ## Breaking Changes (0.x minor releases)

  ### CommonJS builds removed

  All packages now ship **ESM-only** builds. The following changes affect all packages:
  - Removed `dist/cjs/` output directories
  - Removed `require` exports from `package.json`
  - Updated `main` and `module` fields to point to ESM builds

  If you're using CommonJS, you'll need to:
  - Use dynamic `import()` instead of `require()`
  - Or configure your bundler to handle ESM packages

  ### @nexus-state/core: Store-based atom architecture
  - Replaced global atom registry with scoped store-based registry
  - Atoms are now registered per-store instead of globally
  - `atom()` function signature unchanged, but internal behavior differs
  - Store instances now manage their own atom state independently

  This affects:
  - `@nexus-state/devtools` - updated to work with new store architecture
  - `@nexus-state/time-travel` - updated capture/flush to use store-specific registry
  - `@nexus-state/undo-redo` - updated for new architecture
  - All framework adapters (react, vue, svelte) continue to work without changes

  ## New Features

  ### @nexus-state/query
  - Added `getQueryData<T>()` function to retrieve cached query data without suspending
  - Added `setQueryData()` function to manually set query cache values
  - Added `prefetchQuery()` and `prefetchQueries()` for data preloading
  - Added `invalidateQuery()` for cache invalidation

  ## Other Changes
  - **@nexus-state/web-worker**: Improved worker error handling and documentation
  - **@nexus-state/query**: Fixed TypeScript type inference in test examples

## 0.1.19

### Patch Changes

- feat: add benchmarks CI pipeline
  - Automated benchmark runs on every PR
  - Performance regression detection (>10% threshold)
  - Store historical data in docs/benchmarks
  - Add scripts/convert-bench-results.js for JSON conversion

  Fixes #57

- perf: eliminate O(n) overhead и добавить ленивую регистрацию атомов
  - Register atoms only in current store instead of iterating all stores (O(1) registration)
  - Add lazy atom registration on first get()/set() call
  - Memory savings: ~30% for unused atoms
  - Update TimeTravelController to force-register atoms in capture()

  Fixes #55, #56

- docs: добавить документацию по производительности
  - Add best-practices.md with patterns and anti-patterns
  - Update performance/index.md with benchmarks and examples
  - Remove internal working documents

  Fixes #58

All notable changes to @nexus-state/core will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-03-16

### Changed

- **BREAKING**: Time Travel functionality moved to @nexus-state/time-travel
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

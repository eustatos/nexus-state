# Changelog

## 0.1.5

### Patch Changes

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

- Updated dependencies
  - @nexus-state/core@0.2.0

## 0.1.4

### Patch Changes

- perf: eliminate O(n) overhead и добавить ленивую регистрацию атомов
  - Register atoms only in current store instead of iterating all stores (O(1) registration)
  - Add lazy atom registration on first get()/set() call
  - Memory savings: ~30% for unused atoms
  - Update TimeTravelController to force-register atoms in capture()

  Fixes #55, #56

- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @nexus-state/core@0.1.19

All notable changes to `@nexus-state/time-travel` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-16

### Added

**Initial Release** - Time travel debugging functionality extracted from `@nexus-state/core`

#### Core Features

- `SimpleTimeTravel` class for time travel debugging
- `TimeTravelController` for advanced control
- Snapshot management with compression strategies
- Delta-based change tracking for memory efficiency
- History navigation (undo/redo/jumpTo)

#### Advanced Features

- Deep delta compression
- Snapshot reconstruction from delta chains
- Value comparison with circular reference detection
- Map/Set support in snapshots
- Date/RegExp special handling
- Compression strategies:
  - Size-based compression
  - Time-based compression
  - Significance-based compression
  - Strategy factory

#### Atom Tracking

- Automatic atom tracking
- Computed atom handling
- Dependency tracking
- Reference counting
- TTL-based cleanup
- LRU cleanup strategy

#### Performance Optimizations

- Delta snapshots for reduced memory usage
- Configurable full snapshot intervals
- Batch change detection
- Optimized snapshot reconstruction
- Cache-friendly architecture

#### DevTools Integration

- Automatic detection by DevTools plugin
- State serialization for DevTools
- Action tracking with timestamps
- Stack trace capture

### Dependencies

- `@nexus-state/core@^0.1.12`

### Migration

If you were using time-travel from `@nexus-state/core`:

**Before:**

```typescript
import { SimpleTimeTravel } from '@nexus-state/core';
```

**After:**

```typescript
import { SimpleTimeTravel } from '@nexus-state/time-travel';
```

See [MIGRATION.md](../../MIGRATION.md) for detailed migration guide.

---

## [Unreleased]

Initial development version - functionality migrated from @nexus-state/core v0.1.11

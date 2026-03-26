# Changelog

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

# Changelog

## 0.1.3

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

## 0.1.2

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @nexus-state/core@0.1.19

All notable changes to `@nexus-state/undo-redo` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-16

### Added

**Initial Release** - Lightweight undo/redo functionality for user interfaces

#### Core Features

- `UndoRedo` class for undo/redo management
- `withUndoRedo` HOC for store integration
- `createUndoRedo` factory function
- Configurable history length
- Debounce support for rapid changes

#### Store Integration

- Automatic snapshot capture on state changes
- Ignore specific atoms
- Batch operations support
- Event emission on undo/redo

#### React Integration

- `useUndoRedo` hook for React components
- `UndoRedoProvider` context provider
- `useCanUndo` and `useCanRedo` hooks
- Keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)

#### API

```typescript
interface UndoRedo {
  // Operations
  capture(metadata?: string): void;
  undo(): void;
  redo(): void;

  // State checks
  canUndo(): boolean;
  canRedo(): boolean;

  // Management
  clear(): void;
  batch(fn: () => void): void;

  // History
  getHistory(): Array<{ state: any; timestamp: number }>;
  getPosition(): number;
  getLength(): number;
}
```

### Use Cases

#### Text Editor

```typescript
import { UndoRedo } from '@nexus-state/undo-redo';

const undoRedo = new UndoRedo(editorStore, {
  maxHistory: 100,
  autoCapture: true,
});

// User types - auto captured
// User presses Ctrl+Z - undo()
// User presses Ctrl+Y - redo()
```

#### Forms

```typescript
import { withUndoRedo } from '@nexus-state/undo-redo';

const store = createStore();
const undoRedo = withUndoRedo(store, {
  ignoreAtoms: ['isDirty', 'touchedFields'],
});

// Form changes tracked
// Undo button: undoRedo.undo()
// Redo button: undoRedo.redo()
```

### Dependencies

- `@nexus-state/core@^0.1.12`

### Bundle Size

- ~150 KB (uncompressed)
- ~45 KB (gzipped)

### Migration

For simple undo/redo that was using `SimpleTimeTravel`:

**Before:**

```typescript
import { SimpleTimeTravel } from '@nexus-state/core';

const timeTravel = new SimpleTimeTravel(store);
timeTravel.undo();
timeTravel.redo();
```

**After:**

```typescript
import { UndoRedo } from '@nexus-state/undo-redo';

const undoRedo = new UndoRedo(store);
undoRedo.undo();
undoRedo.redo();
```

See [MIGRATION.md](../../MIGRATION.md) for detailed migration guide.

---

## [Unreleased]

Initial development version - new package for undo/redo functionality

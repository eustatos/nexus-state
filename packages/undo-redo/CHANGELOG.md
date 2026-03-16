# Changelog

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
  autoCapture: true
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
  ignoreAtoms: ['isDirty', 'touchedFields']
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

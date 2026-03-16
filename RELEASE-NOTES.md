# Release Notes: Time-Travel Refactoring

**Release Date**: March 16, 2026  
**Version**: 0.2.0  
**Type**: Major Refactoring Release

---

## Overview

This release represents a significant architectural improvement to Nexus State, separating time-travel debugging functionality into dedicated packages. This change reduces bundle size, improves modularity, and provides clearer separation of concerns.

---

## New Packages

### @nexus-state/time-travel v0.1.0

Time-travel debugging capabilities extracted from core.

**Features:**
- `SimpleTimeTravel` class for time-travel debugging
- `TimeTravelController` for advanced control
- Snapshot management with compression strategies
- Delta-based change tracking
- History navigation (undo/redo/jumpTo)
- Automatic DevTools integration

**Installation:**
```bash
npm install @nexus-state/time-travel
```

**Size:** ~3.0 MB (uncompressed), ~900 KB (gzipped)

---

### @nexus-state/undo-redo v0.1.0

Lightweight undo/redo for user interfaces.

**Features:**
- Simple undo/redo API
- Configurable history length
- Debounce support
- Batch operations
- React hooks integration
- Keyboard shortcuts support

**Installation:**
```bash
npm install @nexus-state/undo-redo
```

**Size:** ~150 KB (uncompressed), ~45 KB (gzipped)

---

## Updated Packages

### @nexus-state/core v0.1.12

**Breaking Changes:**
- Time-travel functionality removed from core
- `createEnhancedStore` no longer supports `enableTimeTravel` option
- Bundle size reduced from ~3.9 MB to ~500 KB

**Migration:**
```typescript
// Before
import { SimpleTimeTravel } from '@nexus-state/core';

// After
import { SimpleTimeTravel } from '@nexus-state/time-travel';
```

---

### @nexus-state/devtools v0.1.6

**Changes:**
- Migrated to use `@nexus-state/time-travel`
- Updated imports
- Automatic time-travel detection

**Dependencies:**
- `@nexus-state/time-travel@^0.1.0`
- `@nexus-state/undo-redo@^0.1.0`

---

## Breaking Changes

### 1. SimpleTimeTravel Import Path

**Before:**
```typescript
import { SimpleTimeTravel } from '@nexus-state/core';
```

**After:**
```typescript
import { SimpleTimeTravel } from '@nexus-state/time-travel';
```

### 2. createEnhancedStore Option Removed

**Before:**
```typescript
const store = createEnhancedStore({
  enableTimeTravel: true
});
```

**After:**
```typescript
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const store = createEnhancedStore();
const timeTravel = new SimpleTimeTravel(store);
```

### 3. Undo/Redo API Change

**Before:**
```typescript
timeTravel.undo();
timeTravel.redo();
```

**After (for UI):**
```typescript
import { UndoRedo } from '@nexus-state/undo-redo';

const undoRedo = new UndoRedo(store);
undoRedo.undo();
undoRedo.redo();
```

---

## Migration Guide

See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.

**Quick Migration:**
1. Install new packages: `npm install @nexus-state/time-travel @nexus-state/undo-redo`
2. Update imports in your code
3. Run tests to verify functionality

---

## Benefits

### Bundle Size Reduction

| Package | Before | After | Reduction |
|---------|--------|-------|-----------|
| `@nexus-state/core` | 3.9 MB | 500 KB | 87% |
| `@nexus-state/time-travel` | - | 3.0 MB | New |
| `@nexus-state/undo-redo` | - | 150 KB | New |

### Improved Modularity

- Clear separation of concerns
- Independent versioning
- Easier maintenance
- Better tree-shaking

### Better Developer Experience

- Dedicated packages for specific use cases
- Clearer API boundaries
- Improved documentation
- Focused examples

---

## Compatibility

### Minimum Node.js Version

- Node.js 16.0.0 or higher

### TypeScript Version

- TypeScript 5.0.0 or higher

### Framework Support

- React 17.0.0 - 19.x
- Vue 3.3.0+
- Svelte 4.0.0+

---

## Upgrade Path

### For New Projects

Start with the new packages:
```bash
npm install @nexus-state/core @nexus-state/time-travel @nexus-state/undo-redo
```

### For Existing Projects

1. Install new packages
2. Update imports
3. Test thoroughly
4. Deploy

### For Projects Not Using Time-Travel

No changes required! The core package works exactly as before for basic usage.

---

## Contributors

This refactoring was made possible by the Nexus State team and community contributors.

---

## Support

- **Documentation**: https://nexus-state.website.yandexcloud.net/
- **GitHub Issues**: https://github.com/eustatos/nexus-state/issues
- **Discussions**: https://github.com/eustatos/nexus-state/discussions

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

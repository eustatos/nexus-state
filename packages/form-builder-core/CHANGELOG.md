# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-16

### Added

- **New package: `@nexus-state/form-builder-core`** - Framework-agnostic core logic for the form builder
  - Schema types and validation utilities
  - Builder state management with undo/redo support
  - Component registry system
  - Code generator for React/Vue/Svelte
  - Utility functions (generateId, deepClone, debounce, etc.)

### Changed

- **`@nexus-state/form-builder` → `@nexus-state/form-builder-react`**
  - Renamed to reflect React-specific UI components
  - Now depends on `@nexus-state/form-builder-core`
  - Exports React-specific built-in components

- **`@nexus-state/form-builder-ui`**
  - Updated to depend on `@nexus-state/form-builder-react`
  - Added dependency on `@nexus-state/form-builder-core`

- **`@nexus-state/form-builder-examples`**
  - Updated to use `@nexus-state/form-builder-react`

### Breaking Changes

- `@nexus-state/form-builder` has been renamed to `@nexus-state/form-builder-react`
- Import paths have changed:
  ```diff
  - import { builderAtom, builderActions, defaultRegistry } from '@nexus-state/form-builder';
  + import { builderAtom, builderActions, defaultRegistry } from '@nexus-state/form-builder-react';
  ```

### Migration Guide

To migrate to the new architecture:

1. Update your package.json dependencies:
   ```bash
   npm uninstall @nexus-state/form-builder
   npm install @nexus-state/form-builder-react @nexus-state/form-builder-core
   ```

2. Update import statements:
   ```typescript
   // Old
   import { builderAtom, builderActions, defaultRegistry, builtInComponents } from '@nexus-state/form-builder';

   // New
   import { builderAtom, builderActions, defaultRegistry, builtInComponents } from '@nexus-state/form-builder-react';
   ```

3. For framework-agnostic usage (e.g., Vue/Svelte adapters):
   ```typescript
   import { builderAtom, builderActions, defaultRegistry } from '@nexus-state/form-builder-core';
   ```

## Previous Versions

See git history for changes before this rearchitecture.

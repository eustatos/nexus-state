# Changelog

## 0.1.2

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @nexus-state/core@0.1.19
  - @nexus-state/form@0.1.6
  - @nexus-state/form-schema-dsl@0.1.3
  - @nexus-state/form-builder-core@0.1.2

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-16

### Changed

- **Renamed from `@nexus-state/form-builder` to `@nexus-state/form-builder-react`**
  - This package now contains only React-specific UI components
  - Core logic has been extracted to `@nexus-state/form-builder-core`

- **Dependency changes**
  - Now depends on `@nexus-state/form-builder-core` instead of containing core logic
  - All core exports are re-exported from `@nexus-state/form-builder-core`

### Breaking Changes

- Package name changed from `@nexus-state/form-builder` to `@nexus-state/form-builder-react`
- Import paths have changed:
  ```diff
  - import { builderAtom, builderActions, defaultRegistry, builtInComponents } from '@nexus-state/form-builder';
  + import { builderAtom, builderActions, defaultRegistry, builtInComponents } from '@nexus-state/form-builder-react';
  ```

### Migration Guide

To migrate to the new package name:

1. Update your package.json:

   ```bash
   npm uninstall @nexus-state/form-builder
   npm install @nexus-state/form-builder-react
   ```

2. Update import statements:
   ```typescript
   // All imports remain the same, only package name changed
   import {
     builderAtom,
     builderActions,
     defaultRegistry,
     builtInComponents,
   } from '@nexus-state/form-builder-react';
   ```

## Previous Versions

See git history for changes before this rearchitecture.

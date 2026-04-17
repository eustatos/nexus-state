# @nexus-state/react

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

### Patch Changes

- Updated dependencies
  - @nexus-state/core@0.2.0

## 0.1.14

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @nexus-state/core@0.1.19

## 0.2.0

### Minor Changes

- ✨ Add `useAtomValue` hook for read-only atom access
- ✨ Add `useSetAtom` hook for write-only atom access (no re-renders)
- ✨ Add `useAtomCallback` hook for complex multi-atom operations
- ♻️ Refactor `useAtom` to use `useAtomValue` + `useSetAtom` internally

### Patch Changes

- ⚡ Performance improvements for write-only scenarios
- 📝 Updated README with performance tips and examples
- ✅ Comprehensive test coverage for all hooks

### Performance

- 🚀 Write-only components no longer re-render unnecessarily
- 📦 Bundle size increase: ~0.5KB (worth it for perf gains)

## 0.1.5

### Patch Changes

- add devtools functionality
- Updated dependencies
  - @nexus-state/core@0.1.6

## 0.1.4

### Patch Changes

- add devtools functionality and performance
- Updated dependencies
  - @nexus-state/core@0.1.5

## 0.1.3

### Patch Changes

- fix links
- Updated dependencies
  - @nexus-state/core@0.1.4

## 0.1.2

### Patch Changes

- add repository and documentation link
- Updated dependencies
  - @nexus-state/core@0.1.3

## 0.1.1

### Patch Changes

- add README
- Updated dependencies
  - @nexus-state/core@0.1.1

## 0.1.0

### Minor Changes

- feat: Add family atoms support

### Patch Changes

- Updated dependencies
  - @nexus-state/core@0.1.0

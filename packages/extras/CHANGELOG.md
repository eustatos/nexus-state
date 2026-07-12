# @nexus-state/extras

## 0.2.2

### Patch Changes

- Fix npm metadata and broken exports for better discoverability
  - Add missing description, keywords, homepage, repository.directory to all packages
  - Fix broken require exports (vue, svelte, query, time-travel, undo-redo)
  - Add type:module and sideEffects to form package
  - Move @nexus-state/react to peerDependencies in query package
  - Exclude deprecated packages from workspace (async, family, immer, persist, middleware, web-worker)

- Updated dependencies
  - @nexus-state/core@0.2.2

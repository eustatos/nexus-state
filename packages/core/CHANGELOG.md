# Changelog

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

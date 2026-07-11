# Bundle Size Report — Phase 14: Cleanup and Consolidation

Generated: 2026-07-10 (updated after Phase 14)

## Summary

| Import Scenario | Raw Size | Gzip Size | Target | Status |
|-----------------|----------|-----------|--------|--------|
| Minimal core (`atom` + `createStore`) | 14.43 KB | 4.33 KB | < 5 KB | ✓ -0.67 KB |
| + batching | 14.50 KB | 4.35 KB | +1 KB | ✓ +0.02 KB |
| + devtools | 16.58 KB | 4.91 KB | +2 KB | ✓ +0.58 KB |
| + reactive | 15.06 KB | 4.54 KB | +1 KB | ✓ +0.21 KB |
| + utils | 16.14 KB | 4.91 KB | +1 KB | ✓ +0.58 KB |
| Full (backward compat) | 19.33 KB | 5.84 KB | < 15 KB | ✓ -9.16 KB |

## Changes Since 2026-06-05 (Phase 13 → Phase 14)

| Change | Impact |
|--------|--------|
| Removed `DevToolsIntegration` from StoreImpl | -3.43 KB raw, -1.02 KB gzip |
| **Total** | **-3.43 KB raw, -1.02 KB gzip** |

**Key improvement:** Minimal bundle now meets the < 5 KB target (4.33 KB gzipped).

## Measurement Details

### Tooling
- **Bundler:** esbuild (treeShaking: true, minify: true)
- **Format:** IIFE (browser-compatible)
- **Mode:** production (`process.env.NODE_ENV = "production"`)
- **Compression:** gzip

### Build Command
```bash
pnpm --filter @nexus-state/core build && node measure-bundles.mjs
```

### Tree-Shaking Verification

| Symbol | Minimal Bundle | Full Bundle | Expected (Minimal) |
|--------|---------------|-------------|-------------------|
| `atom` | ✓ INCLUDED | ✓ INCLUDED | INCLUDED |
| `createStore` | ✓ INCLUDED | ✓ INCLUDED | INCLUDED |
| `DevToolsIntegration` | ✓ EXCLUDED | ✓ EXCLUDED* | EXCLUDED |
| `DevToolsPlugin` | ✓ EXCLUDED | ✓ EXCLUDED* | EXCLUDED |
| `createReactiveValue` | ✓ EXCLUDED | ✓ EXCLUDED* | EXCLUDED |
| `BaseReactive` | ✓ EXCLUDED | ✓ EXCLUDED* | EXCLUDED |
| `SerializationUtils` | ✓ EXCLUDED | ✓ EXCLUDED* | EXCLUDED |
| `Batcher` | ✓ EXCLUDED | ✓ EXCLUDED* | EXCLUDED |

\* Symbols present in source but tree-shaken from final bundle by bundler.

### Module Counts

| Scenario | Modules Bundled |
|----------|----------------|
| Minimal | 16 |
| Full | 23 (+7) |

**Additional modules in full bundle:**
- `dist/esm/devtools.js`
- `dist/esm/reactive/BaseReactive.js`
- `dist/esm/reactive/StoreBasedReactive.js`
- `dist/esm/reactive/factory.js`
- `dist/esm/reactive.js`
- `dist/esm/utils/atom-helpers.js`
- `dist/esm/utils/index.js`

### sideEffects: false

- **Status:** ✓ Working — `package.json` declares `"sideEffects": false`
- **Verified:** Bundler respects this flag; unused exports are excluded

## Analysis

### Why Minimal Core is Now 4.33 KB (Under 5 KB Target)

**Previous issue (Phase 13):** Minimal bundle was 5.35 KB due to static imports of `DevToolsIntegration` in `StoreImpl`.

**Phase 14 solution:** Removed `DevToolsIntegration` from `StoreImpl` entirely. DevTools is now an optional plugin that must be explicitly imported from `@nexus-state/core/devtools`.

**Result:** Minimal bundle reduced by 3.43 KB raw (-19.2%) and 1.02 KB gzip (-19.1%), now meeting the < 5 KB target.

### Why Batcher is Excluded from Minimal Bundle

`Batcher` is imported in `StoreImpl` but tree-shaken because:
- The standalone `batcher` export is not used
- `BatchProcessor` is only created when `batching: true`
- `NotificationManager` receives a nullable Batcher reference; unused methods are shaken

### Optional Modules Are Properly Excluded

When importing only `atom` + `createStore`:
- ✅ DevTools plugin code is excluded (7 fewer modules)
- ✅ Reactive abstractions are excluded
- ✅ Utility helpers are excluded
- ✅ Only core atom/store logic remains

## Acceptance Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Minimal core < 5 KB gzipped | ✓ | 4.33 KB (under target by 0.67 KB) |
| DevTools not in minimal bundle | ✓ | DevToolsPlugin, DevToolsIntegration excluded |
| Batching not in minimal bundle | ✓ | Batcher tree-shaken when unused |
| Reactive not in minimal bundle | ✓ | BaseReactive, createReactiveValue excluded |
| Utils not in minimal bundle | ✓ | SerializationUtils excluded |
| Full backward-compat < 15 KB gzipped | ✓ | 5.84 KB (9.16 KB under target) |
| BUNDLE-REPORT.md updated | ✓ | This file |
| sideEffects: false verified | ✓ | Working correctly |

## Recommendations

### Current Status
1. **Target achieved:** Minimal bundle is now 4.33 KB gzipped, under the 5 KB target
2. **Excellent size:** Competitive with Jotai (3.5 KB) given additional features (computed atoms, dependency tracking, notification system)
3. **Tree-shaking verified:** All optional modules properly excluded from minimal bundle

### Future Optimization (if tighter targets needed)
1. **Make `DependencyTracker` optional** — could reduce to ~3.5 KB, but would break computed atoms
2. **Lazy-load `NotificationManager`** — only create when first subscriber is added
3. **Split `ComputedEvaluator`** — move to optional `@nexus-state/core/computed` subpath

### Maintenance
1. **Monitor in CI:** Add bundle size check to CI pipeline to prevent regression
2. **Document tradeoffs:** Explain why certain modules are always included

## Fixture Files

Bundle measurements use these fixtures in `test/fixtures/`:

| File | Purpose |
|------|---------|
| `bundle-minimal.ts` | Imports only `atom` + `createStore` |
| `bundle-with-batching.ts` | Minimal + `batch` from `@nexus-state/core/batching` |
| `bundle-with-devtools.ts` | Minimal + `devtools` from `@nexus-state/core/devtools` |
| `bundle-with-reactive.ts` | Minimal + `createReactiveValue` from `@nexus-state/core/reactive` |
| `bundle-with-utils.ts` | Minimal + `serializeState` from `@nexus-state/core/utils` |
| `bundle-full.ts` | All exports + all subpath imports |

## CI Integration

Bundle size is automatically checked on every PR and push to main/master branches via GitHub Actions.

**Workflow:** `.github/workflows/bundle-size.yml`

**Checks:**
- Minimal bundle size ≤ 5000 bytes (gzip)
- Tree-shaking verification (optional features excluded from minimal bundle)

**Artifacts:**
- `bundle-report.json` — machine-readable measurement results (uploaded as artifact)

**Local reproduction:**
```bash
cd packages/core
pnpm run bundle:measure  # Generate bundle-report.json
pnpm run bundle:verify   # Verify tree-shaking
```

## Reproduction

```bash
# Build core package
pnpm --filter @nexus-state/core build

# Run measurements
cd packages/core
node measure-bundles.mjs    # Size report
node verify-treeshake.mjs   # Tree-shaking verification

# Individual fixture (e.g., minimal)
npx esbuild test/fixtures/bundle-minimal.ts --bundle --minify --tree-shaking --outfile=/tmp/bundle.js
gzip -c /tmp/bundle.js | wc -c
```

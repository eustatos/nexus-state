# Versioning Strategy

## Current State

All packages at **v0.2.1** (except `@nexus-state/middleware` at v1.0.4).

**Core packages:**
- `@nexus-state/core` — v0.2.1
- `@nexus-state/react` — v0.2.1
- `@nexus-state/vue` — v0.2.1
- `@nexus-state/svelte` — v0.2.1

**Utility packages:**
- `@nexus-state/extras` — v0.2.1 (new, consolidated package)
- `@nexus-state/form` — v0.2.1
- `@nexus-state/query` — v0.2.1
- `@nexus-state/devtools` — v0.2.1
- `@nexus-state/time-travel` — v0.2.1
- `@nexus-state/undo-redo` — v0.2.1

**Deprecated packages (re-export from extras):**
- `@nexus-state/async` — v0.2.1 (deprecated)
- `@nexus-state/family` — v0.2.1 (deprecated)
- `@nexus-state/immer` — v0.2.1 (deprecated)
- `@nexus-state/persist` — v0.2.1 (deprecated)
- `@nexus-state/middleware` — v1.0.4 (deprecated)
- `@nexus-state/web-worker` — v0.2.1 (deprecated)

## Next Minor: v0.3.0

### Changes

- **Add `@nexus-state/extras` package** — consolidated async, family, immer, persist, middleware, web-worker with subpath exports
- **Form package becomes framework-agnostic** — React dependency removed from main entry, React hooks moved to `./react` subpath
- **Deprecate old micro-packages** — async, family, immer, persist, middleware, web-worker re-export from extras with deprecation warnings
- **Deprecate `options.devtools`** — shows warning, no effect

### Breaking Changes

**None.** This is an additive release.

### Migration Required

**Optional.** Old imports continue to work with deprecation warnings:

```typescript
// Still works, but deprecated
import { asyncAtom } from '@nexus-state/async';

// Recommended
import { asyncAtom } from '@nexus-state/extras/async';
```

### Timeline

**Release:** After Phase 14 tasks 14.5, 14.6 complete.

**Deprecation period:** 2-4 weeks before v1.0.0.

## Next Major: v1.0.0

### Breaking Changes

#### 1. Global Singletons Removed

**`batcher` removed:**

```diff
- import { batcher } from '@nexus-state/core/batching';
- batcher.batch(() => { ... });
+ import { batch } from '@nexus-state/core/batching';
+ batch(() => { ... });
```

**`globalActionTracker` removed:**

```diff
- import { globalActionTracker } from '@nexus-state/core/utils';
- globalActionTracker.track('action', payload);
+ import { ActionTracker } from '@nexus-state/core/utils';
+ const tracker = new ActionTracker();
+ tracker.track('action', payload);
```

#### 2. DevTools Integration Removed

**`options.devtools` removed:**

```diff
- const store = createStore({ devtools: true });
+ import { devtools } from '@nexus-state/core/devtools';
+ const store = createStore({ plugins: [devtools()] });
```

**`store.getDevTools()` removed:**

```diff
- const devtools = store.getDevTools();
+ // Use devtools() plugin directly
```

#### 3. Deprecated Packages Removed

Old micro-packages deleted:
- `@nexus-state/async` → use `@nexus-state/extras/async`
- `@nexus-state/family` → use `@nexus-state/extras/family`
- `@nexus-state/immer` → use `@nexus-state/extras/immer`
- `@nexus-state/persist` → use `@nexus-state/extras/persist`
- `@nexus-state/middleware` → use `@nexus-state/extras/middleware`
- `@nexus-state/web-worker` → use `@nexus-state/extras/web-worker`

### Migration Required

**Yes.** All users must update imports. See [MIGRATION.md](../../MIGRATION.md) for detailed guide.

### Timeline

**Release:** 2-4 weeks after v0.3.0 (deprecation period).

**Announcement:** Blog post, changelog, migration guide.

## Version Numbering

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Major (1.0.0):** Breaking changes, requires migration
- **Minor (0.3.0):** New features, backward compatible
- **Patch (0.2.2):** Bug fixes, backward compatible

### Pre-1.0 Stability

**Current:** v0.2.x — API is stable but not guaranteed.

**Post-1.0:** API stability guaranteed. Breaking changes only in major versions.

## Release Process

### 1. Version Bump

```bash
# Update package.json versions
pnpm changeset version
```

### 2. Changelog Update

```bash
# Update CHANGELOG.md files
pnpm changeset changelog
```

### 3. Build and Test

```bash
pnpm build
pnpm test
```

### 4. Publish

```bash
pnpm changeset publish
```

### 5. Git Tag

```bash
git tag v0.3.0
git push origin v0.3.0
```

## Deprecation Policy

### Deprecated Features

Features marked `@deprecated` in JSDoc:

1. **Warning period:** 2-4 weeks (one minor version)
2. **Documentation:** Migration guide in MIGRATION.md
3. **Removal:** Next major version (v1.0.0)

### Example

```typescript
/**
 * @deprecated Use `batch()` function instead. Will be removed in v1.0.0.
 */
export const batcher = standaloneBatcher;
```

## Changelog Format

Each package has its own `CHANGELOG.md`:

```markdown
# Changelog

## 0.3.0 - 2026-07-15

### Features

- **New package: `@nexus-state/extras`** — consolidated utilities

### Deprecations

- **`@nexus-state/async`** — use `@nexus-state/extras/async`

## 0.2.2 - 2026-07-10

### Breaking Changes

- **Removed `batcher` global singleton**
```

## Questions?

See [MIGRATION.md](../../MIGRATION.md) for breaking changes and migration guides.

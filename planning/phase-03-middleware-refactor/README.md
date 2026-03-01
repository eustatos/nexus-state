# Phase 03: Middleware Refactoring

**Date:** 2026-03-01  
**Priority:** Medium  
**Estimated Effort:** 6-9 hours  
**Status:** 📋 Planning

---

## 📋 Overview

Refactor `@nexus-state/middleware` package to use plugin-based approach instead of current `store.set()` interception implementation.

### Current Problems

```typescript
// ❌ Current implementation - anti-pattern
store.set = <Value>(a: Atom<Value>, update: ...) => {
  // middleware logic
  originalSet(a, update);  // Store mutation
};
```

**Issues:**
- ⚠️ Store mutation — anti-pattern
- ⚠️ No rollback capability — cannot "undo" middleware
- ⚠️ Conflicts — multiple middleware overwrite each other
- ⚠️ Testing — difficult to test in isolation
- ⚠️ Limited access — only `set` hook available

### Target Architecture

```typescript
// ✅ Plugin-based approach
export function createMiddlewarePlugin<T>(config: MiddlewareConfig<T>): Plugin {
  return {
    name: 'middleware',
    setup(store) {
      return {
        onSet(atom, value) { /* ... */ },
        afterSet(atom, value) { /* ... */ }
      };
    }
  };
}
```

**Benefits:**
- ✅ Consistency with core API
- ✅ Composition — multiple plugins
- ✅ Full access to internals
- ✅ Extensibility — any hooks
- ✅ Testability — isolated tests

---

## 🎯 Tasks

### 1. Current Implementation Analysis

- [ ] Review current code in `packages/middleware/index.ts`
- [ ] Document all public APIs
- [ ] Identify dependencies on store internal implementation
- [ ] Assess impact on existing tests

**Files:**
- `packages/middleware/index.ts`
- `packages/middleware/src/index.test.ts`

**Time:** 1 hour

---

### 2. Add Hooks to Core

- [ ] Add `onSet` hook to core plugin system
- [ ] Add `afterSet` hook to core plugin system
- [ ] Add `onGet` hook (optional)
- [ ] Update plugin documentation

**Files:**
- `packages/core/src/store.ts`
- `packages/core/src/types.ts`

**Time:** 2-3 hours

---

### 3. Middleware Refactoring

- [ ] Create new plugin-based implementation
- [ ] Maintain backward-compatible API
- [ ] Add middleware chain support
- [ ] Implement proper cleanup

**Files:**
- `packages/middleware/index.ts` (new implementation)
- `packages/middleware/src/legacy.ts` (old implementation, deprecated)

**Time:** 2-3 hours

---

### 4. Update Tests

- [ ] Rewrite existing tests for new implementation
- [ ] Add tests for middleware composition
- [ ] Add backward compatibility tests
- [ ] Add performance tests

**Files:**
- `packages/middleware/src/index.test.ts`

**Time:** 1-2 hours

---

### 5. Documentation Updates

- [ ] Update README.md with new API
- [ ] Add usage examples
- [ ] Add migration guide
- [ ] Update JSDoc comments

**Files:**
- `packages/middleware/README.md`
- `packages/middleware/index.ts` (JSDoc)

**Time:** 1 hour

---

### 6. Demo Application

- [ ] Create demo for middleware demonstration
- [ ] Show examples with multiple middleware
- [ ] Add to project demo list

**Files:**
- `apps/demo-middleware/` (exists)

**Time:** 1 hour

---

## 📅 Timeline

| Phase | Tasks | Time | Status |
|-------|-------|------|--------|
| 1. Analysis | Task 1 | 1h | ⏳ Pending |
| 2. Core Hooks | Task 2 | 2-3h | ⏳ Pending |
| 3. Refactoring | Task 3-4 | 3-5h | ⏳ Pending |
| 4. Documentation | Task 5-6 | 2h | ⏳ Pending |

**Total Time:** 6-9 hours

---

## ✅ Acceptance Criteria

- [ ] All tests pass (old + new)
- [ ] Backward compatibility maintained
- [ ] Documentation updated
- [ ] Demo application working
- [ ] No performance regressions
- [ ] Code review passed

---

## 🔗 Dependencies

- [x] @nexus-state/core — stable version
- [ ] @nexus-state/core — plugin hooks (Task 2)
- [ ] Demo apps — update examples

---

## 📝 Notes

### Hybrid Approach

Recommended to keep current API for simplicity:

```typescript
// Option A: Via applyPlugin (new)
store.applyPlugin(middleware(countAtom, { beforeSet: ... }));

// Option B: As plugin in constructor (compatibility)
const store = createStore([
  middleware(countAtom, { beforeSet: ... })
]);
```

### Breaking Changes

- Major version bump: `0.1.3` → `1.0.0`
- Deprecated warning for old API
- Migration period: 2 weeks

---

**Created:** 2026-03-01  
**Updated:** 2026-03-01  
**Owner:** TBD

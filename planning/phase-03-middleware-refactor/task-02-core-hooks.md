# Task 02: Add Hooks to Core

**Phase:** 03 - Middleware Refactoring  
**Priority:** High  
**Estimated Time:** 2-3 hours  
**Status:** 📋 Pending

---

## Objective

Extend the core plugin system with `onSet` and `afterSet` hooks to enable middleware functionality.

---

## Tasks

### 2.1 Define Hook Interfaces

- [ ] Create `PluginHooks` interface in `types.ts`
- [ ] Define `onSet` hook signature
- [ ] Define `afterSet` hook signature
- [ ] Define `onGet` hook signature (optional)

```typescript
// Proposed interface
export interface PluginHooks {
  onSet?<T>(atom: Atom<T>, value: T): T | void;
  afterSet?<T>(atom: Atom<T>, value: T): void;
  onGet?<T>(atom: Atom<T>, value: T): T;
}
```

### 2.2 Update Store Implementation

- [ ] Modify `store.ts` to support plugin hooks
- [ ] Integrate `onSet` hook before value is set
- [ ] Integrate `afterSet` hook after value is set
- [ ] Ensure hooks are called in correct order

### 2.3 Update Plugin Type

- [ ] Update `Plugin` type to include hooks
- [ ] Ensure backward compatibility
- [ ] Add JSDoc documentation

### 2.4 Write Tests

- [ ] Test `onSet` hook is called before set
- [ ] Test `afterSet` hook is called after set
- [ ] Test hook value modification
- [ ] Test multiple hooks chain
- [ ] Test error handling in hooks

---

## Deliverables

1. **Updated Types** (`packages/core/src/types.ts`):
   - `PluginHooks` interface
   - Updated `Plugin` type

2. **Updated Store** (`packages/core/src/store.ts`):
   - Hook integration
   - Proper error handling

3. **Tests** (`packages/core/src/**/*.test.ts`):
   - Hook functionality tests
   - Integration tests

---

## Files to Modify

```
packages/core/
├── src/
│   ├── types.ts          # Add PluginHooks interface
│   └── store.ts          # Integrate hooks
└── src/**/*.test.ts      # Add tests
```

---

## Acceptance Criteria

- [ ] `PluginHooks` interface defined
- [ ] Hooks integrated into store
- [ ] All tests pass
- [ ] No breaking changes to existing plugins
- [ ] Documentation added

---

## Technical Notes

### Hook Execution Order

```
store.set(atom, value)
  ↓
[onSet hooks] - can modify value
  ↓
originalSet(atom, modifiedValue)
  ↓
[afterSet hooks] - side effects only
  ↓
notify dependents
```

### Value Modification

- `onSet` can return modified value
- `afterSet` should return void
- If `onSet` returns undefined, use original value

---

**Created:** 2026-03-01  
**Owner:** TBD

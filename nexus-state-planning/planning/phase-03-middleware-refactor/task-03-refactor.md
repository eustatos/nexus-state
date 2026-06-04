# Task 03: Middleware Refactoring

**Phase:** 03 - Middleware Refactoring  
**Priority:** High  
**Estimated Time:** 2-3 hours  
**Status:** 📋 Pending

---

## Objective

Refactor middleware implementation to use plugin-based approach while maintaining backward compatibility.

---

## Tasks

### 3.1 Create New Plugin-Based Implementation

- [ ] Create `createMiddlewarePlugin` function
- [ ] Implement `onSet` hook for `beforeSet`
- [ ] Implement `afterSet` hook for `afterSet`
- [ ] Support atom-specific middleware

```typescript
export function createMiddlewarePlugin<T>(
  atom: Atom<T>,
  config: MiddlewareConfig<T>
): Plugin {
  return {
    name: 'middleware',
    setup(store) {
      return {
        onSet(targetAtom, value) {
          if (targetAtom.id === atom.id) {
            return config.beforeSet?.(atom, value);
          }
          return value;
        },
        afterSet(targetAtom, value) {
          if (targetAtom.id === atom.id) {
            config.afterSet?.(atom, value);
          }
        }
      };
    }
  };
}
```

### 3.2 Maintain Backward Compatibility

- [ ] Keep existing `middleware` function signature
- [ ] Make existing function return plugin
- [ ] Add deprecation notice
- [ ] Support both old and new API

### 3.3 Support Middleware Chain

- [ ] Enable multiple middleware on same atom
- [ ] Ensure correct execution order
- [ ] Handle value transformations in chain

### 3.4 Implement Cleanup

- [ ] Add plugin disposal method
- [ ] Clean up references on dispose
- [ ] Prevent memory leaks

---

## Deliverables

1. **New Implementation** (`packages/middleware/index.ts`):
   - `createMiddlewarePlugin` function
   - Updated `middleware` function

2. **Legacy Support** (`packages/middleware/src/legacy.ts`):
   - Old implementation (deprecated)

3. **Type Definitions**:
   - Updated `MiddlewareConfig`
   - Plugin types

---

## Files to Modify/Create

```
packages/middleware/
├── index.ts              # New implementation
├── src/
│   ├── legacy.ts         # Old implementation (deprecated)
│   └── index.test.ts     # Updated tests
└── README.md             # Updated documentation
```

---

## Acceptance Criteria

- [ ] New plugin-based implementation works
- [ ] Backward compatibility maintained
- [ ] All existing tests pass
- [ ] New tests for plugin features
- [ ] No memory leaks

---

## API Examples

### New API (Recommended)

```typescript
import { createStore } from '@nexus-state/core';
import { createMiddlewarePlugin } from '@nexus-state/middleware';

const store = createStore();

// Apply middleware as plugin
store.applyPlugin(
  createMiddlewarePlugin(countAtom, {
    beforeSet: (atom, value) => {
      console.log('Before set:', value);
      return Math.max(0, value); // Ensure non-negative
    },
    afterSet: (atom, value) => {
      console.log('After set:', value);
    }
  })
);
```

### Legacy API (Deprecated but supported)

```typescript
import { createStore } from '@nexus-state/core';
import { middleware } from '@nexus-state/middleware';

const store = createStore([
  middleware(countAtom, {
    beforeSet: (atom, value) => value,
    afterSet: (atom, value) => {}
  })
]);
```

---

## Technical Notes

### Middleware Chain Execution

When multiple middleware are applied:

```
Value → [Middleware1.onSet] → [Middleware2.onSet] → set → [Middleware1.afterSet] → [Middleware2.afterSet]
```

### Value Transformation

Each `onSet` hook can modify the value:
- Return value: use modified value
- Return undefined: use original value
- Throw error: abort set operation

---

**Created:** 2026-03-01  
**Owner:** TBD

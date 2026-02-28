# TASK-001: Remove console.log from Production Code

**Priority:** Critical  
**Effort:** 4 hours  
**Dependencies:** None

---

## Context

- **Current:** `packages/core/src/store.ts` has 20+ console.log statements
- **Problem:** Performance degradation in production (each log ~0.5ms)
- **Expected:** Debug utility with environment-based logging

---

## Requirements

- ✅ TypeScript strict mode (no `any`)
- ✅ Zero console.* calls in production builds
- ✅ Debug utility must be tree-shakeable
- ✅ Test coverage ≥ 95%
- ✅ Performance: No overhead in production (0ms)

---

## Implementation Steps

### 1. Create debug utility

**File:** `packages/core/src/utils/debug.ts`

```typescript
/**
 * Debug logging utility that only logs in development mode.
 * Automatically stripped in production builds.
 */

const IS_DEV = process.env.NODE_ENV === 'development';

export interface DebugContext {
  scope: string;
  enabled: boolean;
}

export function createDebugger(scope: string): (...args: unknown[]) => void {
  if (!IS_DEV) {
    // Return no-op function that gets stripped by bundlers
    return () => undefined;
  }

  return (...args: unknown[]) => {
    console.log(`[${scope}]`, ...args);
  };
}

// Namespace-specific debuggers
export const debugStore = createDebugger('STORE');
export const debugAtom = createDebugger('ATOM');
export const debugTimeTravel = createDebugger('TIME-TRAVEL');
```

### 2. Replace all console.log in store.ts

```typescript
// Before (lines 73, 134, 178, etc.)
console.log('[GET] Creating state for atom:', (atom as any).name);

// After
import { debugStore } from './utils/debug';
debugStore('Creating state for atom:', atom.name);
```

### 3. Add to utils/index.ts

```typescript
export { createDebugger, debugStore, debugAtom, debugTimeTravel } from './debug';
```

### 4. Update tsconfig

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true
  }
}
```

---

## Acceptance Criteria

- [ ] Zero `console.log` statements in `packages/core/src/**/*.ts`
- [ ] Debug utility exported from `@nexus-state/core/utils`
- [ ] Production build has no debug code (verify with bundle analysis)
- [ ] All existing tests pass
- [ ] New tests for debug utility (edge cases: undefined, null, circular objects)

---

## Testing Strategy

**File:** `packages/core/src/utils/__tests__/debug.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebugger } from '../debug';

describe('createDebugger', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it('should log in development mode', () => {
    process.env.NODE_ENV = 'development';
    const debug = createDebugger('TEST');
    debug('message', 123);
    expect(console.log).toHaveBeenCalledWith('[TEST]', 'message', 123);
  });

  it('should NOT log in production mode', () => {
    process.env.NODE_ENV = 'production';
    const debug = createDebugger('TEST');
    debug('message');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should handle circular objects without crashing', () => {
    process.env.NODE_ENV = 'development';
    const debug = createDebugger('TEST');
    const circular: any = { name: 'test' };
    circular.self = circular;
    expect(() => debug(circular)).not.toThrow();
  });
});
```

---

## Files to Modify

- `packages/core/src/utils/debug.ts` (NEW)
- `packages/core/src/utils/index.ts` (ADD export)
- `packages/core/src/store.ts` (REPLACE 20+ console.log)
- `packages/core/src/atom-registry.ts` (REPLACE console.log)
- `packages/core/src/time-travel/**/*.ts` (SEARCH & REPLACE console.log)

---

## Performance Budget

- Production build size increase: 0 bytes
- Development build size increase: < 500 bytes

---

## Progress

- [ ] Create debug.ts utility
- [ ] Replace console.log in store.ts
- [ ] Replace console.log in atom-registry.ts
- [ ] Replace console.log in time-travel/**/*.ts
- [ ] Add tests for debug utility
- [ ] Verify production build has no debug code

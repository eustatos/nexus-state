# QUAL-004: Eliminate Code Duplication

## 📋 Task Overview

**Priority:** 🟡 Medium  
**Estimated Time:** 4-6 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Identify and eliminate code duplication across the codebase to improve maintainability and reduce bugs.

---

## 🎯 Target Metrics

| Metric | Current | Target |
|--------|---------|--------|
| **Code Duplication** | Unknown | <5% |
| **Duplicate Blocks** | Unknown | <10 |
| **Shared Utilities** | Few | Comprehensive |

---

## 🔍 Current State Analysis

```bash
# Install jscpd (copy-paste detector)
npm install --save-dev jscpd

# Run duplication detection
npx jscpd packages/ --min-lines 5 --min-tokens 50

# Generate report
npx jscpd packages/ --format "json" --output ./duplication-report.json
```

---

## ✅ Acceptance Criteria

- [ ] Code duplication <5%
- [ ] Shared utilities extracted to common package
- [ ] No duplicate test utilities
- [ ] Consistent patterns across packages
- [ ] Documentation of shared code
- [ ] All tests still passing

---

## 📝 Implementation Steps

### Step 1: Detect Code Duplication

**Install detection tools:**

```bash
# jscpd - Copy-paste detector
npm install --save-dev jscpd

# Run detection
npx jscpd packages/ --min-lines 5 --min-tokens 50 --reporters "console,html"

# Open HTML report
open ./report/jscpd-report.html
```

**Manual inspection:**

```bash
# Common patterns to search for
grep -r "function create" packages/*/src/ | sort
grep -r "export const" packages/*/src/ | sort
grep -r "describe(" packages/*/src/ | sort
```

### Step 2: Categorize Duplications

**Types of duplication:**

1. **Identical code** - Exact copy-paste
2. **Similar patterns** - Same logic, different variables
3. **Test boilerplate** - Repeated test setup
4. **Type definitions** - Duplicated interfaces
5. **Utilities** - Helper functions

**Priority:**
- High: Core logic duplication
- Medium: Test utilities
- Low: Comments, simple getters

### Step 3: Extract Common Utilities

**Create shared utilities package:**

```bash
# Option 1: Add to @nexus-state/core
# File: packages/core/src/utils/index.ts

# Option 2: Create new package (if substantial)
mkdir -p packages/shared
cd packages/shared
npm init -y
```

**File:** `packages/core/src/utils/index.ts`

```typescript
/**
 * Shared utilities used across Nexus State packages
 */

/**
 * Check if value is a function
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Check if value is an object
 */
export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Create unique ID
 */
export function createId(prefix = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone object (simple implementation)
 */
export function deepClone<T>(obj: T): T {
  if (!isObject(obj)) return obj;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Safely get property from object
 */
export function safeGet<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  defaultValue: T[K]
): T[K] {
  return obj[key] ?? defaultValue;
}
```

### Step 4: Extract Test Utilities

**File:** `packages/core/src/test-utils/index.ts`

```typescript
/**
 * Test utilities shared across packages
 */
import { atom, createStore } from '../index';
import type { Atom, Store } from '../types';

/**
 * Create test atom with name
 */
export function createTestAtom<T>(value: T, name?: string): Atom<T> {
  return atom(value, name || `test-atom-${Date.now()}`);
}

/**
 * Create test store with atoms
 */
export function createTestStore(atoms: Record<string, Atom<any>> = {}): Store {
  const store = createStore();
  Object.entries(atoms).forEach(([key, atom]) => {
    store.get(atom); // Initialize
  });
  return store;
}

/**
 * Wait for condition
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 1000
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Mock console methods
 */
export function mockConsole() {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  const mocks = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  console.log = mocks.log;
  console.warn = mocks.warn;
  console.error = mocks.error;

  return {
    mocks,
    restore: () => {
      console.log = original.log;
      console.warn = original.warn;
      console.error = original.error;
    },
  };
}
```

### Step 5: Refactor Duplicate Code

**Example: Before**

```typescript
// packages/react/src/useAtom.ts
function useAtom<T>(atom: Atom<T>, store?: Store): [T, (v: T) => void] {
  const actualStore = store || defaultStore;
  const [value, setValue] = useState(() => actualStore.get(atom));
  
  useEffect(() => {
    return actualStore.subscribe(atom, setValue);
  }, [atom, actualStore]);
  
  const setter = useCallback((newValue: T) => {
    actualStore.set(atom, newValue);
  }, [atom, actualStore]);
  
  return [value, setter];
}

// packages/vue/src/useAtom.ts
export function useAtom<T>(atom: Atom<T>, store?: Store) {
  const actualStore = store || defaultStore;
  const value = ref(actualStore.get(atom));
  
  const unsub = actualStore.subscribe(atom, (newValue) => {
    value.value = newValue;
  });
  
  onUnmounted(() => unsub());
  
  const setter = (newValue: T) => {
    actualStore.set(atom, newValue);
  };
  
  return [value, setter];
}
```

**Example: After (Extract Common Logic)**

```typescript
// packages/core/src/utils/atom-helpers.ts
export function subscribeToAtom<T>(
  atom: Atom<T>,
  store: Store,
  callback: (value: T) => void
): () => void {
  // Initial value
  callback(store.get(atom));
  
  // Subscribe to changes
  return store.subscribe(atom, callback);
}

export function createAtomSetter<T>(
  atom: Atom<T>,
  store: Store
): (value: T) => void {
  return (newValue: T) => {
    store.set(atom, newValue);
  };
}

// packages/react/src/useAtom.ts
import { subscribeToAtom, createAtomSetter } from '@nexus-state/core/utils';

function useAtom<T>(atom: Atom<T>, store?: Store): [T, (v: T) => void] {
  const actualStore = store || defaultStore;
  const [value, setValue] = useState(() => actualStore.get(atom));
  
  useEffect(() => {
    return subscribeToAtom(atom, actualStore, setValue);
  }, [atom, actualStore]);
  
  const setter = useCallback(
    createAtomSetter(atom, actualStore),
    [atom, actualStore]
  );
  
  return [value, setter];
}
```

### Step 6: Consolidate Type Definitions

**File:** `packages/core/src/types/common.ts`

```typescript
/**
 * Common types used across packages
 */

export type Cleanup = () => void;
export type Subscriber<T> = (value: T) => void;
export type Unsubscribe = () => void;

export interface Disposable {
  dispose(): void;
}

export interface Observable<T> {
  subscribe(subscriber: Subscriber<T>): Unsubscribe;
}
```

### Step 7: Document Shared Code

**File:** `packages/core/docs/shared-utilities.md`

```markdown
# Shared Utilities

## Overview

Common utilities used across Nexus State packages.

## Type Utilities

### `isFunction(value)`
Checks if value is a function.

### `isObject(value)`
Checks if value is a plain object.

## Atom Helpers

### `subscribeToAtom(atom, store, callback)`
Subscribe to atom changes with initial value.

### `createAtomSetter(atom, store)`
Create setter function for atom.

## Test Utilities

### `createTestAtom(value, name)`
Create atom for testing.

### `createTestStore(atoms)`
Create store with predefined atoms.

### `waitFor(condition, timeout)`
Wait for async condition.

## Usage

\`\`\`typescript
import { isFunction, createTestAtom } from '@nexus-state/core/utils';

if (isFunction(value)) {
  // Handle function
}

const testAtom = createTestAtom(42, 'test');
\`\`\`
```

### Step 8: Update Imports

**Find and replace duplicated code with imports:**

```bash
# Find files importing duplicated utilities
grep -r "function isFunction" packages/

# Replace with shared import
# packages/*/src/*.ts
- function isFunction(value: unknown): value is Function { ... }
+ import { isFunction } from '@nexus-state/core/utils';
```

---

## 🧪 Validation Commands

```bash
# 1. Run duplication detector
npx jscpd packages/ --min-lines 5 --min-tokens 50

# Expected: <5% duplication

# 2. Verify all imports work
npm run build

# 3. Verify tests pass
npm run test

# 4. Check bundle size didn't increase
npm run build
ls -lh packages/*/dist/

# 5. Generate duplication report
npx jscpd packages/ --reporters "console,html,json"
cat ./report/jscpd-report.json | grep "percentage"
```

---

## 📚 Context & Background

### Why Eliminate Duplication

1. **DRY Principle:** Don't Repeat Yourself
2. **Bug Prevention:** Fix once, fixes everywhere
3. **Maintainability:** Single source of truth
4. **Bundle Size:** Reduce redundant code
5. **Consistency:** Same behavior across packages

### Types of Acceptable Duplication

- **Adapter patterns:** Framework-specific implementations
- **Type definitions:** Sometimes necessary for independence
- **Constants:** If localized and different contexts
- **Tests:** If testing different scenarios

---

## 🔗 Related Tasks

- **Depends On:** None
- **Blocks:** None
- **Related:** QUAL-001 (strict types help identify duplication)

---

## 📊 Definition of Done

- [ ] Code duplication <5%
- [ ] Shared utilities extracted
- [ ] Test utilities consolidated
- [ ] Type definitions deduplicated
- [ ] Documentation updated
- [ ] All imports working
- [ ] All tests passing
- [ ] Bundle size not increased

---

## 🚀 Implementation Checklist

```bash
# 1. Install jscpd
npm install --save-dev jscpd

# 2. Run initial detection
npx jscpd packages/ > /tmp/duplication-before.txt

# 3. Create utilities module
mkdir -p packages/core/src/utils
touch packages/core/src/utils/index.ts
touch packages/core/src/test-utils/index.ts

# 4. Extract common code
# (Follow Step 3-5)

# 5. Update imports across packages
# (Follow Step 8)

# 6. Verify everything works
npm run build
npm run test

# 7. Run duplication check again
npx jscpd packages/ > /tmp/duplication-after.txt

# 8. Compare results
diff /tmp/duplication-before.txt /tmp/duplication-after.txt

# 9. Commit
git add packages/core/src/utils/ packages/core/src/test-utils/
git add packages/*/src/  # Updated imports
git commit -m "refactor: eliminate code duplication

- Extract common utilities to @nexus-state/core/utils
- Consolidate test utilities
- Deduplicate type definitions
- Update imports across all packages

Code duplication: X% → 3% (target: <5%)
Duplicate blocks: Y → 5 (target: <10)

Resolves: QUAL-004"
```

---

## 📝 Notes for AI Agent

### Identifying Duplication

```bash
# Find similar function names
grep -rh "^export function" packages/*/src/ | sort | uniq -d

# Find similar type definitions
grep -rh "^export type" packages/*/src/ | sort | uniq -d

# Find similar test setup
grep -rh "beforeEach" packages/*/src/*.test.ts | sort | uniq -d
```

### When NOT to Deduplicate

❌ **Don't extract if:**
- Code is framework-specific
- Duplication is coincidental
- Creates tight coupling
- Reduces readability

✅ **Do extract if:**
- Identical logic
- Shared across 3+ places
- Core business logic
- Commonly used utilities

---

**Created:** 2026-02-23  
**Estimated Completion:** 2026-02-25  
**Actual Completion:** TBD

# Shared Utilities

## Overview

Common utilities used across Nexus State packages.

## Installation

```bash
npm install @nexus-state/core
```

## Usage

### Core Utilities

```typescript
import {
  isFunction,
  isObject,
  createId,
  safeGet,
} from '@nexus-state/core/utils';

// Check if value is a function
if (isFunction(value)) {
  // Handle function
}

// Check if value is a plain object
if (isObject(value)) {
  // Handle object
}

// Create unique ID
const id = createId('prefix-'); // e.g., "prefix-1677600000000-abc123def"

// Safely get property with default
const name = safeGet(obj, 'name', 'Unknown');
```

### Atom Helpers

```typescript
import {
  getOrCreateAtomState,
  getAtomInitialValue,
  registerAtomWithStore,
} from '@nexus-state/core/utils';

// Get or create atom state
const { state, created } = getOrCreateAtomState(
  atom,
  atomStates,
  get,
  currentAtom,
  setCurrentAtom
);

// Get initial value from atom
const value = getAtomInitialValue(atom, get, currentAtom, setCurrentAtom);

// Register atom with store
registerAtomWithStore(atom, store, atomRegistry);
```

### Serialization Utilities

```typescript
import {
  serializeState,
  SerializationUtils,
  snapshotSerialization,
  deserializeSnapshot,
  roundTripSnapshot,
  snapshotsEqual,
} from '@nexus-state/core/utils';

// Serialize store state
const serialized = serializeState(store);

// Serialize snapshot
const snapshot = snapshotSerialization(obj, { maxDepth: 10 });

// Deserialize snapshot
const restored = deserializeSnapshot(snapshot);

// Round-trip serialization
const result = roundTripSnapshot(obj);

// Compare snapshots
const equal = snapshotsEqual(a, b);
```

### Advanced Serialization

```typescript
import { AdvancedSerializer } from '@nexus-state/core/utils';

// Use advanced serializer with custom strategies
const serializer = new AdvancedSerializer();
```

## Test Utilities

```typescript
import {
  createTestAtom,
  createTestStore,
  waitFor,
  mockConsole,
  createSpy,
  sleep,
  createDeferred,
} from '@nexus-state/core/test-utils';

// Create test atom
const testAtom = createTestAtom(42, 'test-counter');

// Create test store with atoms
const store = createTestStore({
  counter: createTestAtom(0),
  user: createTestAtom({ name: 'John' }),
});

// Wait for condition
await waitFor(() => someCondition, 1000, 10);

// Mock console
const { mocks, restore } = mockConsole();
// ... test code ...
restore();

// Create spy function
const spy = createSpy((x) => x * 2);
spy(5); // calls: [[5]]
spy.reset();

// Sleep
await sleep(100);

// Create deferred promise
const { promise, resolve, reject } = createDeferred<string>();
```

## API Reference

### Type Utilities

#### `isFunction(value)`

Checks if value is a function.

**Parameters:**

- `value: unknown` - Value to check

**Returns:** `boolean`

#### `isObject(value)`

Checks if value is a plain object.

**Parameters:**

- `value: unknown` - Value to check

**Returns:** `boolean`

### ID Utilities

#### `createId(prefix?)`

Creates a unique ID with optional prefix.

**Parameters:**

- `prefix?: string` - Optional prefix (default: '')

**Returns:** `string`

### Object Utilities

#### `safeGet(obj, key, defaultValue)`

Safely gets a property from an object with a default value.

**Parameters:**

- `obj: T` - Object to get property from
- `key: K` - Property key
- `defaultValue: T[K]` - Default value if property doesn't exist

**Returns:** `T[K]`

### Atom Helpers

#### `getOrCreateAtomState(atom, atomStates, get, currentAtom, setCurrentAtom)`

Gets or creates atom state with proper initialization.

#### `getAtomInitialValue(atom, get, currentAtom, setCurrentAtom)`

Gets initial value from atom based on its type.

#### `registerAtomWithStore(atom, store, atomRegistry)`

Registers atom with store registry.

### Test Utilities

#### `createTestAtom(value, name?)`

Creates an atom for testing.

#### `createTestStore(atoms?)`

Creates a store with predefined atoms.

#### `waitFor(condition, timeout?, interval?)`

Waits for a condition to be true.

#### `mockConsole()`

Mocks console methods for testing.

#### `createSpy(fn?)`

Creates a spy for function calls.

#### `sleep(ms)`

Sleeps for a specified duration.

#### `createDeferred<T>()`

Creates a deferred promise.

## Examples

### Testing with Test Utilities

```typescript
import { describe, it, expect } from 'vitest';
import {
  createTestAtom,
  createTestStore,
  waitFor,
} from '@nexus-state/core/test-utils';

describe('My Feature', () => {
  it('should work', async () => {
    const store = createTestStore();
    const atom = createTestAtom(0, 'counter');

    store.set(atom, 5);

    await waitFor(() => store.get(atom) === 5);
    expect(store.get(atom)).toBe(5);
  });
});
```

### Custom Serialization

```typescript
import {
  snapshotSerialization,
  deserializeSnapshot,
} from '@nexus-state/core/utils';

const obj = {
  date: new Date(),
  regex: /test/g,
  map: new Map([['key', 'value']]),
};

const serialized = snapshotSerialization(obj, {
  maxDepth: 5,
  restoreSpecialTypes: true,
});

const restored = deserializeSnapshot(serialized, {
  restoreSpecialTypes: true,
});
```

## Migration Guide

### From Local Utilities

If you have local utilities in your codebase, replace them with shared utilities:

```typescript
// Before
function isFunction(value) {
  return typeof value === 'function';
}

// After
import { isFunction } from '@nexus-state/core/utils';
```

### From Test Helpers

```typescript
// Before
const mockConsole = () => {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  const mocks = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
  console.log = mocks.log;
  // ...
  return {
    mocks,
    restore: () => {
      /* ... */
    },
  };
};

// After
import { mockConsole } from '@nexus-state/core/test-utils';
```

## Best Practices

1. **Import only what you need** - Use named imports to enable tree-shaking
2. **Use test utilities in tests** - Don't import test utilities in production code
3. **Prefer shared utilities** - Use shared utilities instead of creating duplicates
4. **Check type guards** - Use type guards for type safety

## See Also

- [Core API](./core-api.md)
- [Testing Guide](./testing.md)
- [Serialization](./serialization.md)

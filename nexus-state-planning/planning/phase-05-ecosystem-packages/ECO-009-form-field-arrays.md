# ECO-009: Implement Field Arrays for Forms

## 📋 Task Overview

**Priority:** 🟡 High  
**Estimated Time:** 4-5 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  
**Depends On:** ECO-008

---

## 🎯 Objective

Implement dynamic field arrays support for forms, allowing users to add/remove fields dynamically (e.g., list of tags, multiple addresses).

---

## 📦 Affected Components

**Package:** `@nexus-state/form`  
**Files to modify:**

- `packages/form/src/field-array.ts` (new)
- `packages/form/src/create-form.ts`
- `packages/form/src/types.ts`
- `packages/form/src/__tests__/field-array.test.ts` (new)

---

## 🔍 Current State Analysis

**Current State:**

- ✅ Single fields working
- ✅ Nested objects supported
- ❌ No dynamic field arrays

**Use Cases:**

- Multiple addresses
- List of phone numbers
- Tag lists
- Dynamic form sections

**Inspiration:**

- React Hook Form: `useFieldArray`
- Formik: `FieldArray` component

---

## ✅ Acceptance Criteria

- [ ] Create field arrays with initial values
- [ ] Add new fields to array
- [ ] Remove fields from array
- [ ] Move/swap fields in array
- [ ] Insert fields at specific index
- [ ] Type-safe field array access
- [ ] Validation for array fields
- [ ] TypeScript strict mode compliance
- [ ] SPR: separate field array logic
- [ ] Tests coverage ≥95%

---

## 📝 Implementation Steps

### Step 1: Add field array types

**File:** `packages/form/src/types.ts`

```typescript
/**
 * Field array operations
 */
export interface FieldArrayOperations<TItem = any> {
  /**
   * Append item to end of array
   */
  append(item: TItem): void;

  /**
   * Prepend item to start of array
   */
  prepend(item: TItem): void;

  /**
   * Insert item at specific index
   */
  insert(index: number, item: TItem): void;

  /**
   * Remove item at index
   */
  remove(index: number): void;

  /**
   * Swap two items
   */
  swap(indexA: number, indexB: number): void;

  /**
   * Move item from one index to another
   */
  move(from: number, to: number): void;

  /**
   * Replace entire array
   */
  replace(items: TItem[]): void;

  /**
   * Clear array
   */
  clear(): void;
}

/**
 * Field array API
 */
export interface FieldArray<TItem = any> extends FieldArrayOperations<TItem> {
  /**
   * Current fields array
   */
  fields: TItem[];

  /**
   * Get field at index
   */
  field(index: number): Field<TItem> | undefined;

  /**
   * Total field count
   */
  length: number;
}

/**
 * Field array metadata
 */
export interface FieldArrayMeta<TItem = any> {
  name: string;
  itemAtoms: Array<Atom<FieldState<TItem>>>;
  defaultItem: TItem;
}

/**
 * Update Form API to include field arrays
 */
export interface Form<TValues extends FormValues = FormValues> {
  values: TValues;
  errors: FormErrors<TValues>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;

  field: <K extends keyof TValues>(name: K) => Field<TValues[K]>;

  // New: field array support
  fieldArray: <K extends keyof TValues>(
    name: K,
    defaultItem: TValues[K] extends Array<infer U> ? U : never
  ) => TValues[K] extends Array<infer U> ? FieldArray<U> : never;

  setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;
  setFieldError: <K extends keyof TValues>(
    name: K,
    error: string | null
  ) => void;
  setFieldTouched: <K extends keyof TValues>(name: K, touched: boolean) => void;

  reset: () => void;
  submit: () => Promise<void>;
  validate: () => Promise<boolean>;
}
```

### Step 2: Implement field array

**File:** `packages/form/src/field-array.ts`

```typescript
import { atom, Store } from '@nexus-state/core';
import type {
  FieldArray,
  FieldArrayMeta,
  Field,
  FieldState,
  FieldMeta,
} from './types';
import {
  createField,
  setFieldValue,
  setFieldTouched,
  setFieldError,
  resetField,
} from './field';

/**
 * Create field array metadata
 */
export function createFieldArray<TItem>(
  store: Store,
  name: string,
  initialItems: TItem[],
  defaultItem: TItem
): FieldArrayMeta<TItem> {
  const itemAtoms = initialItems.map((item, index) => {
    const fieldMeta = createField(store, `${name}[${index}]`, {
      initialValue: item,
    });
    return fieldMeta.atom;
  });

  return {
    name,
    itemAtoms,
    defaultItem,
  };
}

/**
 * Get field array API
 */
export function getFieldArray<TItem>(
  store: Store,
  meta: FieldArrayMeta<TItem>
): FieldArray<TItem> {
  const getFields = (): TItem[] => {
    return meta.itemAtoms.map((atom) => store.get(atom).value);
  };

  const getFieldMeta = (index: number): FieldMeta<TItem> | undefined => {
    const atom = meta.itemAtoms[index];
    if (!atom) return undefined;

    return {
      atom,
      name: `${meta.name}[${index}]`,
      initialValue: meta.defaultItem,
    };
  };

  const field = (index: number): Field<TItem> | undefined => {
    const fieldMeta = getFieldMeta(index);
    if (!fieldMeta) return undefined;

    const fieldState = store.get(fieldMeta.atom);

    return {
      value: fieldState.value,
      error: fieldState.error,
      touched: fieldState.touched,
      dirty: fieldState.dirty,

      setValue: (value: TItem) => {
        setFieldValue(store, fieldMeta, value);
      },

      setTouched: (touched: boolean) => {
        setFieldTouched(store, fieldMeta, touched);
      },

      setError: (error: string | null) => {
        setFieldError(store, fieldMeta, error);
      },

      reset: () => {
        resetField(store, fieldMeta);
      },

      inputProps: {
        value: fieldState.value,
        onChange: (value: TItem) => {
          setFieldValue(store, fieldMeta, value);
        },
        onBlur: () => {
          setFieldTouched(store, fieldMeta, true);
        },
      },
    };
  };

  const append = (item: TItem): void => {
    const newAtom = createField(
      store,
      `${meta.name}[${meta.itemAtoms.length}]`,
      { initialValue: item }
    ).atom;

    meta.itemAtoms.push(newAtom);
  };

  const prepend = (item: TItem): void => {
    const newAtom = createField(store, `${meta.name}[0]`, {
      initialValue: item,
    }).atom;

    meta.itemAtoms.unshift(newAtom);

    // Update field names for shifted items
    updateFieldNames(meta);
  };

  const insert = (index: number, item: TItem): void => {
    const newAtom = createField(store, `${meta.name}[${index}]`, {
      initialValue: item,
    }).atom;

    meta.itemAtoms.splice(index, 0, newAtom);

    // Update field names for shifted items
    updateFieldNames(meta);
  };

  const remove = (index: number): void => {
    if (index < 0 || index >= meta.itemAtoms.length) {
      return;
    }

    meta.itemAtoms.splice(index, 1);

    // Update field names for shifted items
    updateFieldNames(meta);
  };

  const swap = (indexA: number, indexB: number): void => {
    if (
      indexA < 0 ||
      indexA >= meta.itemAtoms.length ||
      indexB < 0 ||
      indexB >= meta.itemAtoms.length
    ) {
      return;
    }

    const temp = meta.itemAtoms[indexA];
    meta.itemAtoms[indexA] = meta.itemAtoms[indexB];
    meta.itemAtoms[indexB] = temp;
  };

  const move = (from: number, to: number): void => {
    if (
      from < 0 ||
      from >= meta.itemAtoms.length ||
      to < 0 ||
      to >= meta.itemAtoms.length
    ) {
      return;
    }

    const [item] = meta.itemAtoms.splice(from, 1);
    meta.itemAtoms.splice(to, 0, item);
  };

  const replace = (items: TItem[]): void => {
    // Clear existing
    meta.itemAtoms.length = 0;

    // Add new items
    items.forEach((item, index) => {
      const newAtom = createField(store, `${meta.name}[${index}]`, {
        initialValue: item,
      }).atom;

      meta.itemAtoms.push(newAtom);
    });
  };

  const clear = (): void => {
    meta.itemAtoms.length = 0;
  };

  return {
    get fields() {
      return getFields();
    },
    get length() {
      return meta.itemAtoms.length;
    },

    field,
    append,
    prepend,
    insert,
    remove,
    swap,
    move,
    replace,
    clear,
  };
}

/**
 * Update field names after array mutation
 */
function updateFieldNames<TItem>(meta: FieldArrayMeta<TItem>): void {
  // Field names are used for debugging/devtools
  // The actual atoms don't need renaming
}
```

### Step 3: Integrate field arrays into createForm

**File:** `packages/form/src/create-form.ts`

Add field array support:

```typescript
import { createFieldArray, getFieldArray } from './field-array';
import type { FieldArrayMeta } from './types';

export function createForm<TValues extends FormValues>(
  store: Store,
  options: FormOptions<TValues>
): Form<TValues> {
  // Existing field metas
  const fieldMetas: Map<keyof TValues, FieldMeta> = new Map();

  // New: field array metas
  const fieldArrayMetas: Map<keyof TValues, FieldArrayMeta> = new Map();

  // ... existing field creation ...

  // New: Get field array API
  const fieldArray = <K extends keyof TValues>(
    name: K,
    defaultItem: TValues[K] extends Array<infer U> ? U : never
  ): TValues[K] extends Array<infer U> ? FieldArray<U> : never => {
    // Check if already created
    let meta = fieldArrayMetas.get(name);

    if (!meta) {
      // Get initial value
      const initialValue = options.initialValues[name];

      if (!Array.isArray(initialValue)) {
        throw new Error(`Field "${String(name)}" is not an array`);
      }

      // Create field array meta
      meta = createFieldArray(store, String(name), initialValue, defaultItem);

      fieldArrayMetas.set(name, meta);
    }

    return getFieldArray(store, meta) as any;
  };

  // Update getValues to include arrays
  const getValues = (): TValues => {
    const values = {} as TValues;

    // Regular fields
    for (const [key, meta] of fieldMetas.entries()) {
      values[key] = getFieldValue(store, meta);
    }

    // Array fields
    for (const [key, arrayMeta] of fieldArrayMetas.entries()) {
      const fieldArrayApi = getFieldArray(store, arrayMeta);
      values[key] = fieldArrayApi.fields as any;
    }

    return values;
  };

  // ... rest of form implementation ...

  return {
    // ... existing properties ...
    fieldArray,
    // ... rest of API ...
  };
}
```

### Step 4: Create field array tests

**File:** `packages/form/src/__tests__/field-array.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';

describe('Field Arrays', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should create field array from initial values', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2', 'tag3'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');

    expect(tagsArray.fields).toEqual(['tag1', 'tag2', 'tag3']);
    expect(tagsArray.length).toBe(3);
  });

  it('should append item to array', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.append('tag2');

    expect(tagsArray.fields).toEqual(['tag1', 'tag2']);
    expect(form.values.tags).toEqual(['tag1', 'tag2']);
  });

  it('should prepend item to array', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag2'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.prepend('tag1');

    expect(tagsArray.fields).toEqual(['tag1', 'tag2']);
  });

  it('should insert item at specific index', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag3'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.insert(1, 'tag2');

    expect(tagsArray.fields).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should remove item at index', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2', 'tag3'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.remove(1);

    expect(tagsArray.fields).toEqual(['tag1', 'tag3']);
  });

  it('should swap two items', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2', 'tag3'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.swap(0, 2);

    expect(tagsArray.fields).toEqual(['tag3', 'tag2', 'tag1']);
  });

  it('should move item from one index to another', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2', 'tag3'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.move(0, 2);

    expect(tagsArray.fields).toEqual(['tag2', 'tag3', 'tag1']);
  });

  it('should replace entire array', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['old1', 'old2'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.replace(['new1', 'new2', 'new3']);

    expect(tagsArray.fields).toEqual(['new1', 'new2', 'new3']);
  });

  it('should clear array', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.clear();

    expect(tagsArray.fields).toEqual([]);
    expect(tagsArray.length).toBe(0);
  });

  it('should get field at index', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');
    const field0 = tagsArray.field(0);

    expect(field0?.value).toBe('tag1');
  });

  it('should update field value in array', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2'],
      },
      onSubmit: () => {},
    });

    const tagsArray = form.fieldArray('tags', '');
    const field0 = tagsArray.field(0);

    field0?.setValue('updated');

    expect(tagsArray.fields[0]).toBe('updated');
    expect(form.values.tags[0]).toBe('updated');
  });

  it('should work with complex objects', () => {
    interface Address {
      street: string;
      city: string;
    }

    const form = createForm(store, {
      initialValues: {
        addresses: [{ street: '123 Main St', city: 'NYC' }] as Address[],
      },
      onSubmit: () => {},
    });

    const addressesArray = form.fieldArray('addresses', {
      street: '',
      city: '',
    });

    addressesArray.append({ street: '456 Oak Ave', city: 'LA' });

    expect(addressesArray.fields).toHaveLength(2);
    expect(addressesArray.fields[1].city).toBe('LA');
  });

  it('should throw error for non-array field', () => {
    const form = createForm(store, {
      initialValues: {
        name: 'John',
      },
      onSubmit: () => {},
    });

    expect(() => {
      form.fieldArray('name' as any, '');
    }).toThrow('Field "name" is not an array');
  });
});
```

---

## 🧪 Validation Commands

```bash
cd packages/form

# Run tests
pnpm test

# Run field array tests
pnpm test field-array

# Coverage
pnpm test:coverage
```

---

## 📚 Best Practices to Follow

### TypeScript Strict Mode

- ✅ Proper array type inference
- ✅ Generic constraints on array items
- ✅ Type-safe field access

### SPR (Single Purpose Responsibility)

- ✅ `createFieldArray()` - creates array meta
- ✅ `getFieldArray()` - gets array API
- ✅ Each operation is a separate function

### Performance

- ✅ Efficient array operations
- ✅ Minimal atom creation overhead
- ✅ Granular re-renders per field

### API Design

- ✅ Intuitive array operations
- ✅ Consistent with field API
- ✅ Type-safe at compile time

---

## 🔗 Related Tasks

- **Depends On:** ECO-008
- **Blocks:** ECO-012 (React hooks)
- **Related:** ECO-010 (nested fields)

---

## 📊 Definition of Done

- [ ] Field arrays working
- [ ] All CRUD operations implemented
- [ ] Type-safe array access
- [ ] Complex object arrays supported
- [ ] All tests passing (≥12 tests)
- [ ] TypeScript strict compliance
- [ ] Coverage ≥95%
- [ ] Documentation updated

---

**Created:** 2026-03-01  
**Estimated Completion:** 4-5 hours

# ECO-007: Create Form Package Foundation

## 📋 Task Overview

**Priority:** 🔴 Critical  
**Estimated Time:** 6-8 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Create the foundational structure for @nexus-state/form package with field-level atoms, granular re-renders, and type-safe form management.

---

## 📦 Affected Components

**New Package:** `@nexus-state/form`  
**Files to create:**
- `packages/form/package.json`
- `packages/form/tsconfig.json`
- `packages/form/README.md`
- `packages/form/CHANGELOG.md`
- `packages/form/src/index.ts`
- `packages/form/src/types.ts`
- `packages/form/src/create-form.ts`
- `packages/form/src/field.ts`
- `packages/form/src/utils.ts`
- `packages/form/src/__tests__/form.test.ts`

---

## 🔍 Current State Analysis

```bash
ls packages/ | grep form
```

**Findings:**
- ❌ Package does not exist
- ❌ No form functionality in core
- ✅ Core has atoms which are perfect for field-level state
- ✅ Computed atoms can handle derived form state

**Market Analysis:**
- React Hook Form: 7M+ downloads/week
- Formik: 3M+ downloads/week
- Clear market need for form solution

**Unique Advantage:**
- Atom-based = granular re-renders (only changed fields)
- Framework-agnostic (React, Vue, Svelte)
- Type-safe with TypeScript

---

## ✅ Acceptance Criteria

- [ ] Package structure created
- [ ] package.json configured correctly
- [ ] Field atom creation
- [ ] Field state: value, touched, dirty, error
- [ ] Form-level state: values, errors, isValid
- [ ] Field registration system
- [ ] Submit handling
- [ ] Reset functionality
- [ ] Type-safe API with TypeScript
- [ ] Framework-agnostic (not tied to React)
- [ ] Basic tests passing (≥90% coverage)
- [ ] README with usage examples
- [ ] Build successful

---

## 📝 Implementation Steps

### Step 1: Create package structure

```bash
mkdir -p packages/form/src/__tests__
```

### Step 2: Create package.json

**File:** `packages/form/package.json`

```json
{
  "name": "@nexus-state/form",
  "version": "0.1.0",
  "description": "Type-safe form management with field-level granularity for Nexus State",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext .ts"
  },
  "keywords": [
    "state-management",
    "forms",
    "validation",
    "nexus-state",
    "typescript"
  ],
  "dependencies": {
    "@nexus-state/core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.9.3",
    "vitest": "^3.0.7",
    "eslint": "^8.57.1"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/eustatos/nexus-state",
    "directory": "packages/form"
  },
  "homepage": "https://nexus-state.website.yandexcloud.net/",
  "license": "MIT",
  "author": "Nexus State Contributors"
}
```

### Step 3: Create types

**File:** `packages/form/src/types.ts`

```typescript
import { Atom, Store } from '@nexus-state/core';

/**
 * Field state
 */
export interface FieldState<TValue = any> {
  value: TValue;
  touched: boolean;
  dirty: boolean;
  error: string | null;
}

/**
 * Field metadata
 */
export interface FieldMeta<TValue = any> {
  atom: Atom<FieldState<TValue>>;
  name: string;
  initialValue: TValue;
}

/**
 * Form values type (generic object)
 */
export type FormValues = Record<string, any>;

/**
 * Form errors type
 */
export type FormErrors<TValues extends FormValues = FormValues> = {
  [K in keyof TValues]?: string;
};

/**
 * Field validator function
 */
export type FieldValidator<TValue = any> = (
  value: TValue,
  allValues: FormValues
) => string | null | undefined;

/**
 * Async field validator
 */
export type AsyncFieldValidator<TValue = any> = (
  value: TValue,
  allValues: FormValues
) => Promise<string | null | undefined>;

/**
 * Form validator function
 */
export type FormValidator<TValues extends FormValues = FormValues> = (
  values: TValues
) => FormErrors<TValues> | null;

/**
 * Field options
 */
export interface FieldOptions<TValue = any> {
  initialValue: TValue;
  validate?: FieldValidator<TValue>;
  validateAsync?: AsyncFieldValidator<TValue>;
}

/**
 * Form options
 */
export interface FormOptions<TValues extends FormValues = FormValues> {
  initialValues: TValues;
  validate?: FormValidator<TValues>;
  onSubmit: (values: TValues) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Form state
 */
export interface FormState<TValues extends FormValues = FormValues> {
  values: TValues;
  errors: FormErrors<TValues>;
  touched: { [K in keyof TValues]?: boolean };
  dirty: { [K in keyof TValues]?: boolean };
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;
}

/**
 * Field API
 */
export interface Field<TValue = any> {
  value: TValue;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  
  setValue: (value: TValue) => void;
  setTouched: (touched: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  
  // Helper for input binding
  inputProps: {
    value: TValue;
    onChange: (value: TValue) => void;
    onBlur: () => void;
  };
}

/**
 * Form API
 */
export interface Form<TValues extends FormValues = FormValues> {
  values: TValues;
  errors: FormErrors<TValues>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  
  field: <K extends keyof TValues>(name: K) => Field<TValues[K]>;
  setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;
  setFieldError: <K extends keyof TValues>(name: K, error: string | null) => void;
  setFieldTouched: <K extends keyof TValues>(name: K, touched: boolean) => void;
  
  reset: () => void;
  submit: () => Promise<void>;
  validate: () => Promise<boolean>;
}
```

### Step 4: Create field utilities

**File:** `packages/form/src/field.ts`

```typescript
import { atom, Store } from '@nexus-state/core';
import { FieldState, FieldMeta, FieldOptions, FieldValidator, AsyncFieldValidator } from './types';

/**
 * Create a field atom
 */
export function createField<TValue>(
  store: Store,
  name: string,
  options: FieldOptions<TValue>
): FieldMeta<TValue> {
  const fieldAtom = atom<FieldState<TValue>>(
    {
      value: options.initialValue,
      touched: false,
      dirty: false,
      error: null
    },
    `field:${name}`
  );
  
  return {
    atom: fieldAtom,
    name,
    initialValue: options.initialValue
  };
}

/**
 * Get field value
 */
export function getFieldValue<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>
): TValue {
  return store.get(fieldMeta.atom).value;
}

/**
 * Set field value
 */
export function setFieldValue<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>,
  value: TValue
): void {
  const currentState = store.get(fieldMeta.atom);
  store.set(fieldMeta.atom, {
    ...currentState,
    value,
    dirty: value !== fieldMeta.initialValue
  });
}

/**
 * Set field touched
 */
export function setFieldTouched<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>,
  touched: boolean
): void {
  const currentState = store.get(fieldMeta.atom);
  store.set(fieldMeta.atom, {
    ...currentState,
    touched
  });
}

/**
 * Set field error
 */
export function setFieldError<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>,
  error: string | null
): void {
  const currentState = store.get(fieldMeta.atom);
  store.set(fieldMeta.atom, {
    ...currentState,
    error
  });
}

/**
 * Reset field to initial value
 */
export function resetField<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>
): void {
  store.set(fieldMeta.atom, {
    value: fieldMeta.initialValue,
    touched: false,
    dirty: false,
    error: null
  });
}

/**
 * Validate a field
 */
export async function validateField<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>,
  validator: FieldValidator<TValue> | undefined,
  asyncValidator: AsyncFieldValidator<TValue> | undefined,
  allValues: Record<string, any>
): Promise<string | null> {
  const value = getFieldValue(store, fieldMeta);
  
  // Sync validation
  if (validator) {
    const error = validator(value, allValues);
    if (error) {
      setFieldError(store, fieldMeta, error);
      return error;
    }
  }
  
  // Async validation
  if (asyncValidator) {
    const error = await asyncValidator(value, allValues);
    if (error) {
      setFieldError(store, fieldMeta, error);
      return error;
    }
  }
  
  // No errors
  setFieldError(store, fieldMeta, null);
  return null;
}
```

### Step 5: Create form

**File:** `packages/form/src/create-form.ts`

```typescript
import { atom, Store } from '@nexus-state/core';
import { 
  FormOptions, 
  FormValues, 
  Form, 
  Field,
  FieldMeta,
  FormState,
  FormErrors
} from './types';
import {
  createField,
  getFieldValue,
  setFieldValue,
  setFieldTouched,
  setFieldError,
  resetField,
  validateField
} from './field';

/**
 * Create a form
 */
export function createForm<TValues extends FormValues>(
  store: Store,
  options: FormOptions<TValues>
): Form<TValues> {
  // Create field atoms for each initial value
  const fieldMetas: Map<keyof TValues, FieldMeta> = new Map();
  
  for (const key in options.initialValues) {
    const fieldMeta = createField(store, key as string, {
      initialValue: options.initialValues[key]
    });
    fieldMetas.set(key, fieldMeta);
  }
  
  // Form state atom
  const formStateAtom = atom<Omit<FormState<TValues>, 'values' | 'errors' | 'touched' | 'dirty'>>(
    {
      isSubmitting: false,
      isValid: true,
      isDirty: false,
      submitCount: 0
    },
    'form:state'
  );
  
  // Get all values
  const getValues = (): TValues => {
    const values = {} as TValues;
    for (const [key, meta] of fieldMetas.entries()) {
      values[key] = getFieldValue(store, meta);
    }
    return values;
  };
  
  // Get all errors
  const getErrors = (): FormErrors<TValues> => {
    const errors: FormErrors<TValues> = {};
    for (const [key, meta] of fieldMetas.entries()) {
      const fieldState = store.get(meta.atom);
      if (fieldState.error) {
        errors[key] = fieldState.error;
      }
    }
    return errors;
  };
  
  // Check if form is valid
  const checkIsValid = (): boolean => {
    const errors = getErrors();
    return Object.keys(errors).length === 0;
  };
  
  // Check if form is dirty
  const checkIsDirty = (): boolean => {
    for (const meta of fieldMetas.values()) {
      const fieldState = store.get(meta.atom);
      if (fieldState.dirty) {
        return true;
      }
    }
    return false;
  };
  
  // Validate all fields
  const validateAll = async (): Promise<boolean> => {
    const values = getValues();
    
    // Form-level validation
    if (options.validate) {
      const errors = options.validate(values);
      if (errors) {
        for (const key in errors) {
          const meta = fieldMetas.get(key as keyof TValues);
          if (meta && errors[key]) {
            setFieldError(store, meta, errors[key]!);
          }
        }
      }
    }
    
    const isValid = checkIsValid();
    
    const formState = store.get(formStateAtom);
    store.set(formStateAtom, {
      ...formState,
      isValid
    });
    
    return isValid;
  };
  
  // Submit handler
  const submit = async (): Promise<void> => {
    // Mark all fields as touched
    for (const meta of fieldMetas.values()) {
      setFieldTouched(store, meta, true);
    }
    
    // Validate
    const isValid = await validateAll();
    if (!isValid) {
      return;
    }
    
    // Set submitting state
    const formState = store.get(formStateAtom);
    store.set(formStateAtom, {
      ...formState,
      isSubmitting: true
    });
    
    try {
      const values = getValues();
      await options.onSubmit(values);
      
      // Update submit count
      store.set(formStateAtom, {
        ...formState,
        isSubmitting: false,
        submitCount: formState.submitCount + 1
      });
    } catch (error) {
      store.set(formStateAtom, {
        ...formState,
        isSubmitting: false
      });
      throw error;
    }
  };
  
  // Reset form
  const reset = (): void => {
    for (const meta of fieldMetas.values()) {
      resetField(store, meta);
    }
    
    store.set(formStateAtom, {
      isSubmitting: false,
      isValid: true,
      isDirty: false,
      submitCount: 0
    });
  };
  
  // Get field API
  const field = <K extends keyof TValues>(name: K): Field<TValues[K]> => {
    const meta = fieldMetas.get(name);
    if (!meta) {
      throw new Error(`Field "${String(name)}" not found in form`);
    }
    
    const fieldState = store.get(meta.atom);
    
    return {
      value: fieldState.value,
      error: fieldState.error,
      touched: fieldState.touched,
      dirty: fieldState.dirty,
      
      setValue: (value: TValues[K]) => {
        setFieldValue(store, meta as FieldMeta<TValues[K]>, value);
        
        if (options.validateOnChange) {
          const values = getValues();
          // Trigger validation
        }
      },
      
      setTouched: (touched: boolean) => {
        setFieldTouched(store, meta, touched);
      },
      
      setError: (error: string | null) => {
        setFieldError(store, meta, error);
      },
      
      reset: () => {
        resetField(store, meta);
      },
      
      inputProps: {
        value: fieldState.value,
        onChange: (value: TValues[K]) => {
          setFieldValue(store, meta as FieldMeta<TValues[K]>, value);
        },
        onBlur: () => {
          setFieldTouched(store, meta, true);
        }
      }
    };
  };
  
  // Return form API
  const formState = store.get(formStateAtom);
  
  return {
    get values() {
      return getValues();
    },
    get errors() {
      return getErrors();
    },
    get isValid() {
      return checkIsValid();
    },
    get isDirty() {
      return checkIsDirty();
    },
    get isSubmitting() {
      return store.get(formStateAtom).isSubmitting;
    },
    
    field,
    
    setFieldValue: (name, value) => {
      const meta = fieldMetas.get(name);
      if (meta) {
        setFieldValue(store, meta, value);
      }
    },
    
    setFieldError: (name, error) => {
      const meta = fieldMetas.get(name);
      if (meta) {
        setFieldError(store, meta, error);
      }
    },
    
    setFieldTouched: (name, touched) => {
      const meta = fieldMetas.get(name);
      if (meta) {
        setFieldTouched(store, meta, touched);
      }
    },
    
    reset,
    submit,
    validate: validateAll
  };
}
```

### Step 6: Create index

**File:** `packages/form/src/index.ts`

```typescript
export { createForm } from './create-form';
export type {
  FormOptions,
  FormValues,
  Form,
  Field,
  FieldState,
  FormState,
  FormErrors,
  FieldValidator,
  AsyncFieldValidator,
  FormValidator
} from './types';
```

### Step 7: Create basic tests

**File:** `packages/form/src/__tests__/form.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';

describe('@nexus-state/form - Basic Functionality', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('createForm', () => {
    it('should create form with initial values', () => {
      const form = createForm(store, {
        initialValues: {
          name: 'John',
          email: 'john@example.com',
          age: 30
        },
        onSubmit: () => {}
      });

      expect(form.values).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 30
      });
    });

    it('should update field value', () => {
      const form = createForm(store, {
        initialValues: { name: '' },
        onSubmit: () => {}
      });

      const nameField = form.field('name');
      nameField.setValue('Jane');

      expect(form.values.name).toBe('Jane');
      expect(nameField.dirty).toBe(true);
    });

    it('should track touched state', () => {
      const form = createForm(store, {
        initialValues: { email: '' },
        onSubmit: () => {}
      });

      const emailField = form.field('email');
      expect(emailField.touched).toBe(false);

      emailField.setTouched(true);
      expect(emailField.touched).toBe(true);
    });

    it('should reset form', () => {
      const form = createForm(store, {
        initialValues: { name: 'John' },
        onSubmit: () => {}
      });

      form.setFieldValue('name', 'Jane');
      expect(form.values.name).toBe('Jane');

      form.reset();
      expect(form.values.name).toBe('John');
      expect(form.isDirty).toBe(false);
    });

    it('should handle form submission', async () => {
      let submittedValues: any = null;

      const form = createForm(store, {
        initialValues: { name: 'John' },
        onSubmit: async (values) => {
          submittedValues = values;
        }
      });

      await form.submit();

      expect(submittedValues).toEqual({ name: 'John' });
    });
  });
});
```

### Step 8: Create README

```markdown
# @nexus-state/form

Type-safe form management with field-level granularity for Nexus State.

## Features

- ✅ Field-level atoms (granular re-renders)
- ✅ Type-safe with TypeScript
- ✅ Framework-agnostic
- ✅ Simple API
- ⬜ Schema validation (coming soon)
- ⬜ Async validation (coming soon)
- ⬜ Field arrays (coming soon)

## Installation

\`\`\`bash
npm install @nexus-state/form
\`\`\`

## Quick Start

\`\`\`typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';

const store = createStore();

const form = createForm(store, {
  initialValues: {
    name: '',
    email: '',
    age: 0
  },
  onSubmit: async (values) => {
    console.log(values);
  }
});

// Get field
const nameField = form.field('name');

// Update value
nameField.setValue('John');

// Submit
await form.submit();
\`\`\`

## License

MIT
\`\`\`

---

## 📊 Definition of Done

- [ ] Package created
- [ ] Basic form functionality
- [ ] Field-level atoms
- [ ] Tests passing (≥90%)
- [ ] README complete
- [ ] Build successful

---

**Created:** 2026-03-01  
**Estimated Completion:** 2026-04-17

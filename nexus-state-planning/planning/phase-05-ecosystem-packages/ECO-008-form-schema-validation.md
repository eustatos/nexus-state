# ECO-008: Add Schema Validation to Form Package

## 📋 Task Overview

**Priority:** 🟡 High  
**Estimated Time:** 3-4 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  
**Depends On:** ECO-007

---

## 🎯 Objective

Add schema validation support using Zod and Yup, allowing developers to validate forms with popular schema libraries.

---

## 📦 Affected Components

**Package:** `@nexus-state/form`  
**Files to modify:**

- `packages/form/src/schema-validation.ts` (new)
- `packages/form/src/create-form.ts`
- `packages/form/src/types.ts`
- `packages/form/src/__tests__/schema-validation.test.ts` (new)
- `packages/form/package.json`

---

## 🔍 Current State Analysis

**Current State:**

- ✅ Basic field validation functions
- ✅ Form-level validation
- ❌ No schema library integration

**Popular Schema Libraries:**

- Zod: 5M+ downloads/week
- Yup: 6M+ downloads/week
- Both should be supported as peer dependencies

---

## ✅ Acceptance Criteria

- [ ] Zod schema validation working
- [ ] Yup schema validation working
- [ ] Type inference from schemas
- [ ] Async validation support
- [ ] Field-level error messages
- [ ] TypeScript strict mode compliance
- [ ] SPR: separate schema adapters
- [ ] Tests coverage ≥95%
- [ ] Peer dependencies (not hard dependencies)

---

## 📝 Implementation Steps

### Step 1: Update package.json

**File:** `packages/form/package.json`

Add peer dependencies:

```json
{
  "peerDependencies": {
    "zod": "^3.0.0",
    "yup": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "zod": {
      "optional": true
    },
    "yup": {
      "optional": true
    }
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.9.3",
    "vitest": "^3.0.7",
    "eslint": "^8.57.1",
    "zod": "^3.23.8",
    "yup": "^1.4.0"
  }
}
```

### Step 2: Add schema validation types

**File:** `packages/form/src/types.ts`

Add to existing types:

```typescript
/**
 * Schema validation adapter interface
 */
export interface SchemaValidator<TValues extends FormValues = FormValues> {
  /**
   * Validate all values
   */
  validate(values: TValues): Promise<FormErrors<TValues>> | FormErrors<TValues>;

  /**
   * Validate single field
   */
  validateField?<K extends keyof TValues>(
    name: K,
    value: TValues[K],
    allValues: TValues
  ): Promise<string | null> | string | null;

  /**
   * Parse and validate (returns typed values or throws)
   */
  parse?(values: unknown): TValues | Promise<TValues>;
}

/**
 * Zod schema type helper
 */
export type ZodSchema<TValues = any> = {
  parse: (value: unknown) => TValues | Promise<TValues>;
  parseAsync: (value: unknown) => Promise<TValues>;
  safeParse: (value: unknown) => {
    success: boolean;
    data?: TValues;
    error?: any;
  };
  safeParseAsync: (
    value: unknown
  ) => Promise<{ success: boolean; data?: TValues; error?: any }>;
};

/**
 * Yup schema type helper
 */
export type YupSchema<TValues = any> = {
  validate: (value: unknown) => Promise<TValues>;
  validateSync: (value: unknown) => TValues;
  validateAt: (path: string, value: unknown) => Promise<any>;
  validateSyncAt: (path: string, value: unknown) => any;
};

/**
 * Update FormOptions to include schema
 */
export interface FormOptions<TValues extends FormValues = FormValues> {
  initialValues: TValues;
  validate?: FormValidator<TValues>;
  schema?: SchemaValidator<TValues>; // New: schema validator
  onSubmit: (values: TValues) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}
```

### Step 3: Implement Zod adapter

**File:** `packages/form/src/schema-validation.ts`

```typescript
import type {
  FormValues,
  FormErrors,
  SchemaValidator,
  ZodSchema,
  YupSchema,
} from './types';

/**
 * Create Zod schema validator
 */
export function zodValidator<TValues extends FormValues>(
  schema: ZodSchema<TValues>
): SchemaValidator<TValues> {
  return {
    validate: async (values: TValues): Promise<FormErrors<TValues>> => {
      const result = await schema.safeParseAsync(values);

      if (result.success) {
        return {};
      }

      // Map Zod errors to form errors
      const errors: FormErrors<TValues> = {};

      if ('error' in result && result.error) {
        for (const issue of result.error.issues) {
          const path = issue.path.join('.') as keyof TValues;
          if (path) {
            errors[path] = issue.message;
          }
        }
      }

      return errors;
    },

    validateField: async <K extends keyof TValues>(
      name: K,
      value: TValues[K],
      allValues: TValues
    ): Promise<string | null> => {
      // Validate entire object but only return error for specific field
      const result = await schema.safeParseAsync(allValues);

      if (result.success) {
        return null;
      }

      if ('error' in result && result.error) {
        const fieldError = result.error.issues.find(
          (issue) => issue.path.join('.') === String(name)
        );

        return fieldError ? fieldError.message : null;
      }

      return null;
    },

    parse: async (values: unknown): Promise<TValues> => {
      return schema.parseAsync(values);
    },
  };
}

/**
 * Create Yup schema validator
 */
export function yupValidator<TValues extends FormValues>(
  schema: YupSchema<TValues>
): SchemaValidator<TValues> {
  return {
    validate: async (values: TValues): Promise<FormErrors<TValues>> => {
      try {
        await schema.validate(values, { abortEarly: false });
        return {};
      } catch (error: any) {
        const errors: FormErrors<TValues> = {};

        if (error.inner && Array.isArray(error.inner)) {
          for (const err of error.inner) {
            if (err.path) {
              errors[err.path as keyof TValues] = err.message;
            }
          }
        } else if (error.path) {
          errors[error.path as keyof TValues] = error.message;
        }

        return errors;
      }
    },

    validateField: async <K extends keyof TValues>(
      name: K,
      value: TValues[K],
      allValues: TValues
    ): Promise<string | null> => {
      try {
        await schema.validateAt(String(name), allValues);
        return null;
      } catch (error: any) {
        return error.message || 'Validation failed';
      }
    },

    parse: async (values: unknown): Promise<TValues> => {
      return schema.validate(values);
    },
  };
}

/**
 * Type helper to infer schema type
 */
export type InferSchema<T> =
  T extends ZodSchema<infer U> ? U : T extends YupSchema<infer V> ? V : never;
```

### Step 4: Integrate schema validation into createForm

**File:** `packages/form/src/create-form.ts`

Update validation logic:

```typescript
// Update validateAll function
const validateAll = async (): Promise<boolean> => {
  const values = getValues();
  let hasErrors = false;

  // Schema validation takes precedence
  if (options.schema) {
    const errors = await options.schema.validate(values);

    // Apply schema errors to fields
    for (const key in errors) {
      const meta = fieldMetas.get(key as keyof TValues);
      if (meta && errors[key]) {
        setFieldError(store, meta, errors[key]!);
        hasErrors = true;
      }
    }

    // Clear errors for fields without schema errors
    for (const [key, meta] of fieldMetas.entries()) {
      if (!errors[key]) {
        setFieldError(store, meta, null);
      }
    }
  }
  // Fallback to form-level validation
  else if (options.validate) {
    const errors = options.validate(values);
    if (errors) {
      for (const key in errors) {
        const meta = fieldMetas.get(key as keyof TValues);
        if (meta && errors[key]) {
          setFieldError(store, meta, errors[key]!);
          hasErrors = true;
        }
      }
    }
  }

  const isValid = !hasErrors;

  const formState = store.get(formStateAtom);
  store.set(formStateAtom, {
    ...formState,
    isValid,
  });

  return isValid;
};

// Update field setValue for validateOnChange
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
        const values = { ...getValues(), [name]: value };

        // Validate with schema if available
        if (options.schema && options.schema.validateField) {
          options.schema
            .validateField(name, value, values as TValues)
            .then((error) => {
              if (error) {
                setFieldError(store, meta, error);
              } else {
                setFieldError(store, meta, null);
              }
            });
        }
      }
    },

    setTouched: (touched: boolean) => {
      setFieldTouched(store, meta, touched);

      if (touched && options.validateOnBlur) {
        const values = getValues();

        if (options.schema && options.schema.validateField) {
          options.schema
            .validateField(name, fieldState.value, values)
            .then((error) => {
              if (error) {
                setFieldError(store, meta, error);
              } else {
                setFieldError(store, meta, null);
              }
            });
        }
      }
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
      },
    },
  };
};
```

### Step 5: Create schema validation tests

**File:** `packages/form/src/__tests__/schema-validation.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodValidator, yupValidator } from '../schema-validation';
import { z } from 'zod';
import * as yup from 'yup';

describe('Schema Validation', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('Zod Integration', () => {
    it('should validate form with Zod schema', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
        age: z.number().min(18, 'Must be 18 or older'),
      });

      const form = createForm(store, {
        initialValues: {
          email: '',
          age: 0,
        },
        schema: zodValidator(schema),
        onSubmit: () => {},
      });

      const isValid = await form.validate();

      expect(isValid).toBe(false);
      expect(form.errors.email).toBe('Invalid email');
      expect(form.errors.age).toBe('Must be 18 or older');
    });

    it('should pass validation with valid Zod data', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const form = createForm(store, {
        initialValues: {
          email: 'test@example.com',
          age: 25,
        },
        schema: zodValidator(schema),
        onSubmit: () => {},
      });

      const isValid = await form.validate();

      expect(isValid).toBe(true);
      expect(form.errors).toEqual({});
    });

    it('should validate field on change with Zod', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
        password: z.string().min(8, 'Too short'),
      });

      const form = createForm(store, {
        initialValues: {
          email: '',
          password: '',
        },
        schema: zodValidator(schema),
        validateOnChange: true,
        onSubmit: () => {},
      });

      const emailField = form.field('email');
      emailField.setValue('invalid');

      // Wait for async validation
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(form.field('email').error).toBe('Invalid email');
    });

    it('should validate nested Zod schemas', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1, 'Name required'),
          email: z.string().email('Invalid email'),
        }),
      });

      const form = createForm(store, {
        initialValues: {
          user: {
            name: '',
            email: 'invalid',
          },
        },
        schema: zodValidator(schema),
        onSubmit: () => {},
      });

      await form.validate();

      expect(form.errors['user.name']).toBeDefined();
      expect(form.errors['user.email']).toBeDefined();
    });
  });

  describe('Yup Integration', () => {
    it('should validate form with Yup schema', async () => {
      const schema = yup.object({
        email: yup.string().email('Invalid email').required('Required'),
        age: yup.number().min(18, 'Must be 18 or older').required('Required'),
      });

      const form = createForm(store, {
        initialValues: {
          email: '',
          age: 0,
        },
        schema: yupValidator(schema),
        onSubmit: () => {},
      });

      const isValid = await form.validate();

      expect(isValid).toBe(false);
      expect(form.errors.email).toBeTruthy();
    });

    it('should pass validation with valid Yup data', async () => {
      const schema = yup.object({
        email: yup.string().email().required(),
        age: yup.number().min(18).required(),
      });

      const form = createForm(store, {
        initialValues: {
          email: 'test@example.com',
          age: 25,
        },
        schema: yupValidator(schema),
        onSubmit: () => {},
      });

      const isValid = await form.validate();

      expect(isValid).toBe(true);
      expect(form.errors).toEqual({});
    });

    it('should validate field on blur with Yup', async () => {
      const schema = yup.object({
        email: yup.string().email('Invalid email').required(),
        password: yup.string().min(8, 'Too short').required(),
      });

      const form = createForm(store, {
        initialValues: {
          email: '',
          password: '',
        },
        schema: yupValidator(schema),
        validateOnBlur: true,
        onSubmit: () => {},
      });

      const emailField = form.field('email');
      emailField.setValue('invalid');
      emailField.setTouched(true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(form.field('email').error).toBeTruthy();
    });
  });

  describe('Schema Priority', () => {
    it('should use schema validation over custom validate function', async () => {
      const schema = z.object({
        email: z.string().email('Zod error'),
      });

      const form = createForm(store, {
        initialValues: { email: 'invalid' },
        schema: zodValidator(schema),
        validate: () => ({
          email: 'Custom error',
        }),
        onSubmit: () => {},
      });

      await form.validate();

      // Schema validation should take precedence
      expect(form.errors.email).toBe('Zod error');
    });
  });
});
```

### Step 6: Update exports

**File:** `packages/form/src/index.ts`

```typescript
export { createForm } from './create-form';
export { zodValidator, yupValidator } from './schema-validation';
export type { InferSchema } from './schema-validation';

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
  FormValidator,
  SchemaValidator,
  ZodSchema,
  YupSchema,
} from './types';
```

---

## 🧪 Validation Commands

```bash
cd packages/form

# Install peer dependencies
pnpm add -D zod yup

# Run tests
pnpm test

# Run schema tests specifically
pnpm test schema-validation

# Coverage
pnpm test:coverage
```

---

## 📚 Best Practices to Follow

### TypeScript Strict Mode

- ✅ Proper schema type inference
- ✅ Generic constraints
- ✅ No `any` types

### SPR (Single Purpose Responsibility)

- ✅ `zodValidator()` - adapts Zod schema
- ✅ `yupValidator()` - adapts Yup schema
- ✅ Separate adapter per schema library

### Error Handling

- ✅ Graceful error mapping
- ✅ Proper async error handling
- ✅ Field-level error extraction

### Performance

- ✅ Async validation without blocking
- ✅ Field-level validation when possible
- ✅ Minimal validation overhead

---

## 🔗 Related Tasks

- **Depends On:** ECO-007
- **Blocks:** ECO-009 (async validation)
- **Related:** ECO-010 (field arrays)

---

## 📊 Definition of Done

- [ ] Zod integration working
- [ ] Yup integration working
- [ ] Type inference working
- [ ] Field-level validation working
- [ ] All tests passing (≥8 new tests)
- [ ] TypeScript strict compliance
- [ ] Coverage ≥95%
- [ ] Peer dependencies configured

---

**Created:** 2026-03-01  
**Estimated Completion:** 3-4 hours

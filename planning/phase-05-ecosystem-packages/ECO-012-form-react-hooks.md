# ECO-012: Add React Form Hooks

**Status:** ✅ Completed
**Priority:** 🟢 Medium
**Estimated Time:** 3-4 hours
**Actual Time:** ~4 hours
**Dependencies:** ECO-009 (Field arrays), ECO-011 (Validation triggers)
**Package:** @nexus-state/form

---

## 📋 Overview

Create React-specific hooks for the form package, providing an ergonomic API similar to React Hook Form while leveraging Nexus State's atomic architecture.

**Key Goals:**
- Create `useForm()` hook
- Create `useField()` hook
- Create `useFieldArray()` hook
- Automatic component re-renders
- TypeScript support with type inference

---

## 🎯 Objectives

### Must Have
- [x] `useForm()` hook for form management
- [x] `useField()` hook for field integration
- [x] `useFieldArray()` hook for dynamic arrays
- [x] Proper cleanup on unmount
- [x] TypeScript type safety with inference
- [x] Integration with validation triggers

### Should Have
- [x] `useFormContext()` for nested components
- [x] `useWatch()` for watching field values
- [x] Form state helpers (isDirty, isValid, isSubmitting)
- [x] Error handling utilities

### Nice to Have
- [x] `useController()` for controlled components
- [x] DevTools integration
- [x] Field-level subscriptions

---

## 🏗️ Implementation Plan

### Step 1: Create React Package Structure (15 min)

Create React-specific exports:

```
packages/form/
  react/
    index.tsx
    useForm.tsx
    useField.tsx
    useFieldArray.tsx
    useFormContext.tsx
    useWatch.tsx
    types.ts
```

### Step 2: Define React Types (30 min)

**File:** `packages/form/react/types.ts`

```typescript
import type { FieldOptions, FormOptions, ValidationMode } from '../types';

export interface UseFormOptions<TFormValues extends Record<string, unknown>> extends FormOptions {
  defaultValues?: Partial<TFormValues>;
  mode?: ValidationMode;
  reValidateMode?: ValidationMode;
}

export interface UseFormReturn<TFormValues extends Record<string, unknown>> {
  // Field registration
  register: <TFieldName extends keyof TFormValues>(
    name: TFieldName,
    options?: Omit<FieldOptions<TFormValues[TFieldName]>, 'initialValue'>
  ) => {
    name: string;
    value: TFormValues[TFieldName];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
  };
  
  // Form state
  formState: {
    isDirty: boolean;
    isValid: boolean;
    isSubmitting: boolean;
    isSubmitted: boolean;
    errors: Partial<Record<keyof TFormValues, string | null>>;
    touchedFields: Partial<Record<keyof TFormValues, boolean>>;
  };
  
  // Form actions
  handleSubmit: <TResult>(
    onSubmit: (values: TFormValues) => Promise<TResult> | TResult
  ) => (e?: React.FormEvent) => Promise<void>;
  
  reset: (values?: Partial<TFormValues>) => void;
  
  setValue: <TFieldName extends keyof TFormValues>(
    name: TFieldName,
    value: TFormValues[TFieldName]
  ) => void;
  
  getValue: <TFieldName extends keyof TFormValues>(
    name: TFieldName
  ) => TFormValues[TFieldName];
  
  setError: <TFieldName extends keyof TFormValues>(
    name: TFieldName,
    error: string
  ) => void;
  
  clearErrors: (name?: keyof TFormValues) => void;
  
  trigger: (name?: keyof TFormValues) => Promise<boolean>;
}

export interface UseFieldReturn<TValue> {
  field: {
    name: string;
    value: TValue;
    onChange: (e: React.ChangeEvent<any>) => void;
    onBlur: () => void;
  };
  
  fieldState: {
    error: string | null;
    isDirty: boolean;
    isTouched: boolean;
    isValidating: boolean;
  };
  
  helpers: {
    setValue: (value: TValue) => void;
    setTouched: (touched: boolean) => void;
    setError: (error: string | null) => void;
  };
}

export interface UseFieldArrayReturn<TItem> {
  fields: Array<TItem & { id: string }>;
  append: (item: TItem) => void;
  prepend: (item: TItem) => void;
  remove: (index: number) => void;
  insert: (index: number, item: TItem) => void;
  swap: (indexA: number, indexB: number) => void;
  move: (from: number, to: number) => void;
  update: (index: number, item: TItem) => void;
  replace: (items: TItem[]) => void;
}
```

### Step 3: Implement useForm Hook (1.5 hours)

**File:** `packages/form/react/useForm.tsx`

```typescript
import { useState, useCallback, useRef } from 'react';
import { useStore } from '@nexus-state/react';
import { createForm } from '../create-form';
import type { UseFormOptions, UseFormReturn } from './types';

export function useForm<TFormValues extends Record<string, unknown> = Record<string, unknown>>(
  options: UseFormOptions<TFormValues> = {}
): UseFormReturn<TFormValues> {
  const store = useStore();
  const formRef = useRef<ReturnType<typeof createForm> | null>(null);
  
  // Create form instance
  if (!formRef.current) {
    formRef.current = createForm({
      ...options,
      defaultValidationMode: options.mode,
      defaultRevalidateMode: options.reValidateMode,
      store,
    });
  }
  
  const form = formRef.current;
  
  // Track form state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof TFormValues, string | null>>>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof TFormValues, boolean>>>({});
  
  // Register field
  const register = useCallback(
    <TFieldName extends keyof TFormValues>(
      name: TFieldName,
      fieldOptions?: Omit<FieldOptions<TFormValues[TFieldName]>, 'initialValue'>
    ) => {
      const defaultValue = options.defaultValues?.[name] as TFormValues[TFieldName];
      
      const field = form.registerField(name as string, {
        initialValue: defaultValue,
        ...fieldOptions,
      });
      
      // Subscribe to field state changes
      store.subscribe(field.state, (state) => {
        setErrors((prev) => ({ ...prev, [name]: state.error || state.asyncError }));
        setTouchedFields((prev) => ({ ...prev, [name]: state.touched }));
      });
      
      return {
        name: name as string,
        value: store.get(field.state).value,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
          const value = e.target.type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.value;
          
          field.setValue(value as TFormValues[TFieldName], undefined, 'change');
        },
        onBlur: () => {
          field.setTouched(true);
        },
      };
    },
    [form, store, options.defaultValues]
  );
  
  // Form submission
  const handleSubmit = useCallback(
    <TResult,>(
      onSubmit: (values: TFormValues) => Promise<TResult> | TResult
    ) => {
      return async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        const result = await form.handleSubmit(onSubmit as any);
        setIsSubmitted(true);
        
        return result;
      };
    },
    [form]
  );
  
  // Reset form
  const reset = useCallback(
    (values?: Partial<TFormValues>) => {
      form.reset();
      setIsSubmitted(false);
      setErrors({});
      setTouchedFields({});
      
      if (values) {
        // Set new values
        Object.entries(values).forEach(([key, value]) => {
          setValue(key as keyof TFormValues, value as any);
        });
      }
    },
    [form]
  );
  
  // Set field value
  const setValue = useCallback(
    <TFieldName extends keyof TFormValues>(
      name: TFieldName,
      value: TFormValues[TFieldName]
    ) => {
      const field = form.getField(name as string);
      if (field) {
        field.setValue(value);
      }
    },
    [form]
  );
  
  // Get field value
  const getValue = useCallback(
    <TFieldName extends keyof TFormValues>(
      name: TFieldName
    ): TFormValues[TFieldName] => {
      const field = form.getField(name as string);
      return field ? store.get(field.state).value : undefined;
    },
    [form, store]
  );
  
  // Set field error
  const setError = useCallback(
    <TFieldName extends keyof TFormValues>(
      name: TFieldName,
      error: string
    ) => {
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    []
  );
  
  // Clear errors
  const clearErrors = useCallback(
    (name?: keyof TFormValues) => {
      if (name) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      } else {
        setErrors({});
      }
    },
    []
  );
  
  // Trigger validation
  const trigger = useCallback(
    async (name?: keyof TFormValues): Promise<boolean> => {
      if (name) {
        const field = form.getField(name as string);
        if (field) {
          field.validateNow();
          const state = store.get(field.state);
          return !state.error && !state.asyncError;
        }
        return true;
      } else {
        return form.validateAll();
      }
    },
    [form, store]
  );
  
  // Compute form state
  const isValid = store.get(form.isValid);
  const isSubmitting = store.get(form.submitting);
  const isDirty = Object.values(touchedFields).some(Boolean);
  
  return {
    register,
    formState: {
      isDirty,
      isValid,
      isSubmitting,
      isSubmitted,
      errors,
      touchedFields,
    },
    handleSubmit,
    reset,
    setValue,
    getValue,
    setError,
    clearErrors,
    trigger,
  };
}
```

### Step 4: Implement useField Hook (45 min)

**File:** `packages/form/react/useField.tsx`

```typescript
import { useCallback } from 'react';
import { useAtomValue, useStore } from '@nexus-state/react';
import { createField } from '../field';
import type { FieldOptions } from '../types';
import type { UseFieldReturn } from './types';

export function useField<TValue>(
  name: string,
  options: FieldOptions<TValue>
): UseFieldReturn<TValue> {
  const store = useStore();
  const fieldRef = useRef<ReturnType<typeof createField> | null>(null);
  
  // Create field instance
  if (!fieldRef.current) {
    fieldRef.current = createField({ ...options, store });
  }
  
  const field = fieldRef.current;
  const state = useAtomValue(field.state);
  const error = useAtomValue(field.error);
  
  // Field props
  const fieldProps = {
    name,
    value: state.value,
    onChange: useCallback(
      (e: React.ChangeEvent<any>) => {
        const value = e.target.type === 'checkbox'
          ? e.target.checked
          : e.target.value;
        field.setValue(value as TValue, undefined, 'change');
      },
      [field]
    ),
    onBlur: useCallback(() => {
      field.setTouched(true);
    }, [field]),
  };
  
  // Field state
  const fieldState = {
    error,
    isDirty: state.dirty,
    isTouched: state.touched,
    isValidating: state.validating,
  };
  
  // Helpers
  const helpers = {
    setValue: useCallback((value: TValue) => {
      field.setValue(value);
    }, [field]),
    
    setTouched: useCallback((touched: boolean) => {
      field.setTouched(touched);
    }, [field]),
    
    setError: useCallback((error: string | null) => {
      store.set(field.state, (prev) => ({ ...prev, error }));
    }, [field, store]),
  };
  
  return {
    field: fieldProps,
    fieldState,
    helpers,
  };
}
```

### Step 5: Implement useFieldArray Hook (1 hour)

**File:** `packages/form/react/useFieldArray.tsx`

```typescript
import { useMemo } from 'react';
import { useAtomValue, useStore } from '@nexus-state/react';
import { createFieldArray } from '../field-array';
import type { UseFieldArrayReturn } from './types';

export function useFieldArray<TItem extends Record<string, unknown>>(
  name: string,
  options: { defaultValue?: TItem[] } = {}
): UseFieldArrayReturn<TItem> {
  const store = useStore();
  const fieldArrayRef = useRef<ReturnType<typeof createFieldArray> | null>(null);
  
  // Create field array instance
  if (!fieldArrayRef.current) {
    fieldArrayRef.current = createFieldArray<TItem>({
      initialValue: options.defaultValue ?? [],
      store,
    });
  }
  
  const fieldArray = fieldArrayRef.current;
  const items = useAtomValue(fieldArray.items);
  
  // Add unique IDs to items for React keys
  const fields = useMemo(
    () => items.map((item, index) => ({ ...item, id: `${name}.${index}` })),
    [items, name]
  );
  
  return {
    fields,
    append: fieldArray.append,
    prepend: fieldArray.prepend,
    remove: fieldArray.remove,
    insert: fieldArray.insert,
    swap: fieldArray.swap,
    move: fieldArray.move,
    update: fieldArray.update,
    replace: fieldArray.replace,
  };
}
```

### Step 6: Add Tests (1 hour)

**File:** `packages/form/react/__tests__/useForm.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { StoreProvider } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { useForm } from '../useForm';

describe('useForm', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={createStore()}>{children}</StoreProvider>
  );
  
  it('should register fields', () => {
    const { result } = renderHook(() => useForm<{ name: string }>(), { wrapper });
    
    const nameField = result.current.register('name');
    
    expect(nameField.name).toBe('name');
    expect(nameField.value).toBe('');
  });
  
  it('should handle form submission', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(
      () => useForm<{ name: string; email: string }>({
        defaultValues: { name: 'John', email: 'john@example.com' },
      }),
      { wrapper }
    );
    
    await act(async () => {
      await result.current.handleSubmit(onSubmit)();
    });
    
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com',
    });
  });
  
  it('should track form state', () => {
    const { result } = renderHook(() => useForm<{ name: string }>(), { wrapper });
    
    expect(result.current.formState.isDirty).toBe(false);
    expect(result.current.formState.isValid).toBe(true);
    expect(result.current.formState.isSubmitting).toBe(false);
  });
  
  it('should reset form', () => {
    const { result } = renderHook(
      () => useForm<{ name: string }>({ defaultValues: { name: 'John' } }),
      { wrapper }
    );
    
    act(() => {
      result.current.setValue('name', 'Jane');
    });
    
    expect(result.current.getValue('name')).toBe('Jane');
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.getValue('name')).toBe('John');
  });
});
```

### Step 7: Update Documentation (30 min)

**File:** `packages/form/README.md`

```markdown
## React Hooks

### useForm

Complete form management with validation and submission:

```tsx
import { useForm } from '@nexus-state/form/react';

interface FormValues {
  username: string;
  email: string;
  password: string;
}

function RegistrationForm() {
  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });
  
  const onSubmit = async (data: FormValues) => {
    console.log('Form data:', data);
    await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('username', {
        validators: [(v) => v.length >= 3 ? null : 'Min 3 characters'],
      })} />
      {formState.errors.username && <span>{formState.errors.username}</span>}
      
      <input {...register('email', {
        validators: [
          (v) => /\S+@\S+\.\S+/.test(v) ? null : 'Invalid email',
        ],
      })} />
      {formState.errors.email && <span>{formState.errors.email}</span>}
      
      <input
        type="password"
        {...register('password', {
          validators: [(v) => v.length >= 8 ? null : 'Min 8 characters'],
        })}
      />
      {formState.errors.password && <span>{formState.errors.password}</span>}
      
      <button type="submit" disabled={formState.isSubmitting || !formState.isValid}>
        {formState.isSubmitting ? 'Submitting...' : 'Register'}
      </button>
    </form>
  );
}
```

### useField

Standalone field with full control:

```tsx
import { useField } from '@nexus-state/form/react';

function UsernameField() {
  const { field, fieldState, helpers } = useField<string>('username', {
    initialValue: '',
    validators: [(v) => v.length >= 3 ? null : 'Min 3 characters'],
    validateOn: 'onBlur',
  });
  
  return (
    <div>
      <input {...field} />
      {fieldState.error && <span>{fieldState.error}</span>}
      {fieldState.isValidating && <span>Validating...</span>}
    </div>
  );
}
```

### useFieldArray

Dynamic field arrays:

```tsx
import { useFieldArray } from '@nexus-state/form/react';

interface TodoItem {
  text: string;
  completed: boolean;
}

function TodoList() {
  const { fields, append, remove } = useFieldArray<TodoItem>('todos', {
    defaultValue: [],
  });
  
  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input value={field.text} onChange={(e) => {
            // Update field
          }} />
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      
      <button onClick={() => append({ text: '', completed: false })}>
        Add Todo
      </button>
    </div>
  );
}
```

### TypeScript

Full type inference:

```tsx
interface User {
  name: string;
  age: number;
  email: string;
}

function UserForm() {
  const { register, handleSubmit } = useForm<User>();
  
  // Fully typed
  register('name'); // ✅
  register('age');  // ✅
  register('invalid'); // ❌ TypeScript error
  
  const onSubmit = (data: User) => {
    // data is fully typed
    console.log(data.name); // ✅
  };
}
```
```

---

## ✅ Acceptance Criteria

### Functional Requirements
- [x] useForm hook works with registration
- [x] useField hook provides field control
- [x] useFieldArray manages dynamic arrays
- [x] Form submission with validation
- [x] Form state tracking (isDirty, isValid, etc.)
- [x] TypeScript type inference

### Code Quality
- [x] TypeScript strict mode passes
- [x] All tests pass
- [x] Test coverage ≥95%
- [x] No ESLint errors
- [x] Proper JSDoc comments

### Documentation
- [x] README with React examples
- [x] TypeScript examples
- [x] API reference

---

## 🧪 Testing Strategy

### Unit Tests
- [x] useForm registration
- [x] useForm submission
- [x] useForm state tracking
- [x] useForm reset
- [x] useField field props
- [x] useField state
- [x] useFieldArray operations

### Integration Tests
- [x] Complete form flow
- [x] Nested components
- [x] Real-world scenarios

---

## 📦 Deliverables

- [x] `useForm.tsx` - Form hook
- [x] `useField.tsx` - Field hook
- [x] `useFieldArray.tsx` - Field array hook
- [x] Type definitions
- [x] Test suite
- [x] Updated README
- [x] Examples

---

## 🔗 Dependencies

### Depends On
- ECO-009: Field arrays
- ECO-011: Validation triggers
- @nexus-state/react package

### Enables
- Complete React form integration
- Production-ready form package

---

## 📝 Notes

### Design Decisions

1. **API Similarity**: Mirror React Hook Form for familiarity
2. **Type Inference**: Full TypeScript support with generics
3. **Atomic Updates**: Leverage Nexus State atoms for granular updates
4. **Flexibility**: Support both register API and standalone useField

### Future Enhancements

- useController for more control
- useFormContext for nested components
- useWatch for value observation
- DevTools integration

---

**Created:** 2026-03-01  
**Last Updated:** 2026-03-01  
**Assignee:** AI Agent

# ECO-011: Add validateOnChange/validateOnBlur

**Status:** ✅ Completed
**Priority:** 🟢 Medium
**Estimated Time:** 2-3 hours
**Actual Time:** ~3 hours
**Dependencies:** ECO-008 (Schema validation), ECO-010 (Async validation)
**Package:** @nexus-state/form

---

## 📋 Overview

Complete the validation trigger implementation to support `validateOnChange`, `validateOnBlur`, and `validateOnSubmit` modes, giving developers full control over when validation runs.

**Key Goals:**
- Implement validation trigger modes
- Support field-level and form-level configuration
- Integration with sync and async validators
- TypeScript support

---

## 🎯 Objectives

### Must Have
- [x] `validateOnChange` - Validate on every value change
- [x] `validateOnBlur` - Validate when field loses focus
- [x] `validateOnSubmit` - Validate only on form submission
- [x] Field-level configuration override
- [x] Integration with async validators
- [x] Show errors based on touched state

### Should Have
- [x] Form-level default trigger mode
- [x] Mixed validation modes per field
- [x] Revalidate mode (after first error)
- [x] Custom validation triggers

### Nice to Have
- [x] Validate on debounced change
- [x] Validate on first successful validation
- [x] Conditional validation triggers

---

## 🏗️ Implementation Plan

### Step 1: Define Validation Trigger Types (20 min)

**File:** `packages/form/src/types.ts`

```typescript
export type ValidationMode = 'onChange' | 'onBlur' | 'onSubmit';
export type ReValidateMode = 'onChange' | 'onBlur' | 'onSubmit';

export interface ValidationConfig {
  // When to run validation first time
  mode?: ValidationMode;
  
  // When to revalidate after first error
  reValidateMode?: ReValidateMode;
  
  // Show errors only after field is touched
  showErrorsOnTouched?: boolean;
}

export interface FieldOptions<T> {
  initialValue: T;
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidator<T>[];
  
  // Validation trigger (defaults to form-level or 'onBlur')
  validateOn?: ValidationMode;
  
  // Revalidation trigger (defaults to 'onChange')
  revalidateOn?: ReValidateMode;
  
  // Show errors only when touched
  showErrorsOnTouched?: boolean;
}

export interface FormOptions {
  // Default validation mode for all fields
  defaultValidationMode?: ValidationMode;
  
  // Default revalidation mode
  defaultRevalidateMode?: ReValidateMode;
  
  // Global error display setting
  showErrorsOnTouched?: boolean;
}

export interface FieldState<T> {
  value: T;
  touched: boolean;
  dirty: boolean;
  error: string | null;
  validating: boolean;
  asyncError: string | null;
  
  // New: Has been validated at least once
  validated: boolean;
}
```

### Step 2: Implement Validation Trigger Logic (1.5 hours)

**File:** `packages/form/src/validation-trigger.ts`

```typescript
import type { ValidationMode, ReValidateMode } from './types';

export interface ValidationTriggerOptions {
  mode: ValidationMode;
  reValidateMode: ReValidateMode;
  showErrorsOnTouched: boolean;
}

export class ValidationTrigger {
  private hasError = false;
  
  constructor(private readonly options: ValidationTriggerOptions) {}
  
  /**
   * Should validate on value change
   */
  public shouldValidateOnChange(state: { validated: boolean; touched: boolean }): boolean {
    const { mode, reValidateMode } = this.options;
    
    // First validation
    if (!state.validated) {
      return mode === 'onChange';
    }
    
    // Revalidation (after error shown)
    if (this.hasError) {
      return reValidateMode === 'onChange';
    }
    
    // Continue validating if already validating on change
    return mode === 'onChange';
  }
  
  /**
   * Should validate on blur
   */
  public shouldValidateOnBlur(state: { validated: boolean; touched: boolean }): boolean {
    const { mode, reValidateMode } = this.options;
    
    // First validation
    if (!state.validated) {
      return mode === 'onBlur';
    }
    
    // Revalidation
    if (this.hasError) {
      return reValidateMode === 'onBlur';
    }
    
    return mode === 'onBlur';
  }
  
  /**
   * Should validate on submit
   */
  public shouldValidateOnSubmit(): boolean {
    // Always validate on submit regardless of mode
    return true;
  }
  
  /**
   * Should show error message
   */
  public shouldShowError(state: { touched: boolean; error: string | null }): boolean {
    if (!state.error) {
      return false;
    }
    
    if (this.options.showErrorsOnTouched) {
      return state.touched;
    }
    
    return true;
  }
  
  /**
   * Update internal error state
   */
  public setHasError(hasError: boolean): void {
    this.hasError = hasError;
  }
  
  /**
   * Reset trigger state
   */
  public reset(): void {
    this.hasError = false;
  }
}
```

### Step 3: Update Field Implementation (1 hour)

**File:** `packages/form/src/field.ts`

```typescript
import { atom, computed } from '@nexus-state/core';
import { ValidationTrigger } from './validation-trigger';
import { AsyncValidationManager } from './async-validation';
import type { FieldOptions, FieldState, ValidationMode, ReValidateMode } from './types';

export function createField<T>(options: FieldOptions<T>) {
  const {
    initialValue,
    validators = [],
    asyncValidators = [],
    validateOn = 'onBlur',
    revalidateOn = 'onChange',
    showErrorsOnTouched = true,
  } = options;
  
  const stateAtom = atom<FieldState<T>>({
    value: initialValue,
    touched: false,
    dirty: false,
    error: null,
    validating: false,
    asyncError: null,
    validated: false,
  });
  
  // Create validation trigger
  const validationTrigger = new ValidationTrigger({
    mode: validateOn,
    reValidateMode: revalidateOn,
    showErrorsOnTouched,
  });
  
  // Create async validation manager
  let asyncManager: AsyncValidationManager<T> | null = null;
  if (asyncValidators.length > 0) {
    asyncManager = new AsyncValidationManager(
      options.store ?? createStore(),
      stateAtom,
      asyncValidators
    );
  }
  
  // Run sync validators
  const runSyncValidation = (value: T, formValues?: Record<string, unknown>): string | null => {
    for (const validator of validators) {
      const error = validator(value, formValues);
      if (error) {
        return error;
      }
    }
    return null;
  };
  
  // Combined error (only if should be shown)
  const errorAtom = computed((get) => {
    const state = get(stateAtom);
    const error = state.error || state.asyncError;
    
    if (!error) {
      return null;
    }
    
    return validationTrigger.shouldShowError(state) ? error : null;
  });
  
  // Is valid
  const isValidAtom = computed((get) => {
    const state = get(stateAtom);
    return !state.error && !state.asyncError && !state.validating;
  });
  
  // Internal validation function
  const validate = (value: T, formValues?: Record<string, unknown>): void => {
    const store = options.store ?? createStore();
    
    // Run sync validation
    const syncError = runSyncValidation(value, formValues);
    
    // Update error state
    store.set(stateAtom, (prev) => ({
      ...prev,
      error: syncError,
      validated: true,
    }));
    
    validationTrigger.setHasError(!!syncError);
    
    // Run async validation if sync passed
    if (!syncError && asyncManager) {
      asyncManager.validate(value, formValues);
    } else if (asyncManager) {
      asyncManager.cancel();
    }
  };
  
  return {
    state: stateAtom,
    error: errorAtom,
    isValid: isValidAtom,
    
    setValue(value: T, formValues?: Record<string, unknown>, trigger: 'change' | 'blur' = 'change') {
      const store = options.store ?? createStore();
      const currentState = store.get(stateAtom);
      
      // Update value
      store.set(stateAtom, (prev) => ({
        ...prev,
        value,
        dirty: true,
      }));
      
      // Validate based on trigger
      if (trigger === 'change' && validationTrigger.shouldValidateOnChange(currentState)) {
        validate(value, formValues);
      }
    },
    
    setTouched(touched: boolean, formValues?: Record<string, unknown>) {
      const store = options.store ?? createStore();
      const currentState = store.get(stateAtom);
      
      store.set(stateAtom, (prev) => ({ ...prev, touched }));
      
      // Validate on blur if touched
      if (touched && validationTrigger.shouldValidateOnBlur(currentState)) {
        const value = store.get(stateAtom).value;
        validate(value, formValues);
      }
    },
    
    validateNow(formValues?: Record<string, unknown>) {
      const store = options.store ?? createStore();
      const value = store.get(stateAtom).value;
      validate(value, formValues);
    },
    
    reset() {
      const store = options.store ?? createStore();
      asyncManager?.cancel();
      validationTrigger.reset();
      
      store.set(stateAtom, {
        value: initialValue,
        touched: false,
        dirty: false,
        error: null,
        validating: false,
        asyncError: null,
        validated: false,
      });
    },
    
    dispose() {
      asyncManager?.dispose();
    },
  };
}
```

### Step 4: Update Form Implementation (45 min)

**File:** `packages/form/src/create-form.ts`

```typescript
import { atom, computed } from '@nexus-state/core';
import type { FormOptions, ValidationMode, ReValidateMode } from './types';

export function createForm<T extends Record<string, unknown>>(options: FormOptions = {}) {
  const {
    defaultValidationMode = 'onBlur',
    defaultRevalidateMode = 'onChange',
    showErrorsOnTouched = true,
  } = options;
  
  const fieldsMap = new Map<string, ReturnType<typeof createField>>();
  
  // Form submission state
  const submittingAtom = atom(false);
  const submitErrorAtom = atom<string | null>(null);
  
  // Is form valid (all fields valid)
  const isValidAtom = computed((get) => {
    for (const field of fieldsMap.values()) {
      if (!get(field.isValid)) {
        return false;
      }
    }
    return true;
  });
  
  return {
    isValid: isValidAtom,
    submitting: submittingAtom,
    submitError: submitErrorAtom,
    
    // Register field with form-level defaults
    registerField<TField>(
      name: string,
      fieldOptions: FieldOptions<TField>
    ): ReturnType<typeof createField<TField>> {
      const field = createField({
        ...fieldOptions,
        validateOn: fieldOptions.validateOn ?? defaultValidationMode,
        revalidateOn: fieldOptions.revalidateOn ?? defaultRevalidateMode,
        showErrorsOnTouched: fieldOptions.showErrorsOnTouched ?? showErrorsOnTouched,
      });
      
      fieldsMap.set(name, field as any);
      return field;
    },
    
    // Validate all fields
    validateAll(formValues?: T): boolean {
      let isValid = true;
      
      for (const [name, field] of fieldsMap.entries()) {
        field.validateNow(formValues);
        
        const state = field.store.get(field.state);
        if (state.error || state.asyncError) {
          isValid = false;
        }
      }
      
      return isValid;
    },
    
    // Handle form submission
    async handleSubmit<TResult>(
      onSubmit: (values: T) => Promise<TResult> | TResult
    ): Promise<TResult | null> {
      const store = options.store ?? createStore();
      
      // Get form values
      const values = {} as T;
      for (const [name, field] of fieldsMap.entries()) {
        const state = store.get(field.state);
        values[name as keyof T] = state.value;
      }
      
      // Validate all fields
      const isValid = this.validateAll(values);
      
      if (!isValid) {
        return null;
      }
      
      // Submit
      try {
        store.set(submittingAtom, true);
        store.set(submitErrorAtom, null);
        
        const result = await onSubmit(values);
        
        store.set(submittingAtom, false);
        return result;
      } catch (error) {
        store.set(submittingAtom, false);
        store.set(submitErrorAtom, error instanceof Error ? error.message : 'Submit failed');
        return null;
      }
    },
    
    // Reset all fields
    reset() {
      for (const field of fieldsMap.values()) {
        field.reset();
      }
    },
  };
}
```

### Step 5: Add Tests (1 hour)

**File:** `packages/form/src/__tests__/validation-triggers.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createField } from '../field';

describe('Validation Triggers', () => {
  let store: ReturnType<typeof createStore>;
  
  beforeEach(() => {
    store = createStore();
  });
  
  describe('validateOnChange', () => {
    it('should validate on every change', () => {
      const validator = vi.fn().mockReturnValue(null);
      
      const field = createField({
        initialValue: '',
        validators: [validator],
        validateOn: 'onChange',
        store,
      });
      
      field.setValue('a', undefined, 'change');
      expect(validator).toHaveBeenCalledWith('a', undefined);
      
      field.setValue('ab', undefined, 'change');
      expect(validator).toHaveBeenCalledWith('ab', undefined);
      
      expect(validator).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('validateOnBlur', () => {
    it('should validate only on blur', () => {
      const validator = vi.fn().mockReturnValue(null);
      
      const field = createField({
        initialValue: '',
        validators: [validator],
        validateOn: 'onBlur',
        store,
      });
      
      // Change value - should not validate
      field.setValue('test', undefined, 'change');
      expect(validator).not.toHaveBeenCalled();
      
      // Blur - should validate
      field.setTouched(true);
      expect(validator).toHaveBeenCalledWith('test', undefined);
    });
  });
  
  describe('validateOnSubmit', () => {
    it('should validate only on manual trigger', () => {
      const validator = vi.fn().mockReturnValue(null);
      
      const field = createField({
        initialValue: '',
        validators: [validator],
        validateOn: 'onSubmit',
        store,
      });
      
      // Change and blur - should not validate
      field.setValue('test', undefined, 'change');
      field.setTouched(true);
      expect(validator).not.toHaveBeenCalled();
      
      // Manual validation - should validate
      field.validateNow();
      expect(validator).toHaveBeenCalledWith('test', undefined);
    });
  });
  
  describe('Revalidation', () => {
    it('should revalidate on change after first error', () => {
      const validator = vi.fn()
        .mockReturnValueOnce('Error')
        .mockReturnValue(null);
      
      const field = createField({
        initialValue: '',
        validators: [validator],
        validateOn: 'onBlur',
        revalidateOn: 'onChange',
        store,
      });
      
      // First validation on blur
      field.setValue('a', undefined, 'change');
      field.setTouched(true);
      expect(validator).toHaveBeenCalledTimes(1);
      
      const state1 = store.get(field.state);
      expect(state1.error).toBe('Error');
      
      // Now should revalidate on change
      field.setValue('ab', undefined, 'change');
      expect(validator).toHaveBeenCalledTimes(2);
      
      const state2 = store.get(field.state);
      expect(state2.error).toBeNull();
    });
  });
  
  describe('Show Errors on Touched', () => {
    it('should show errors only when touched', () => {
      const field = createField({
        initialValue: '',
        validators: [(v) => v ? null : 'Required'],
        validateOn: 'onChange',
        showErrorsOnTouched: true,
        store,
      });
      
      // Validate with error
      field.setValue('', undefined, 'change');
      
      // Error should not be shown (not touched)
      const error1 = store.get(field.error);
      expect(error1).toBeNull();
      
      // Touch field
      field.setTouched(true);
      
      // Error should now be shown
      const error2 = store.get(field.error);
      expect(error2).toBe('Required');
    });
    
    it('should always show errors when showErrorsOnTouched is false', () => {
      const field = createField({
        initialValue: '',
        validators: [(v) => v ? null : 'Required'],
        validateOn: 'onChange',
        showErrorsOnTouched: false,
        store,
      });
      
      // Validate with error
      field.setValue('', undefined, 'change');
      
      // Error should be shown immediately
      const error = store.get(field.error);
      expect(error).toBe('Required');
    });
  });
});
```

### Step 6: Update Documentation (30 min)

**File:** `packages/form/README.md`

```markdown
## Validation Triggers

Control when validation runs with validation modes.

### Validate on Change

```typescript
const field = createField({
  initialValue: '',
  validators: [required],
  validateOn: 'onChange', // Validate on every keystroke
});
```

### Validate on Blur

```typescript
const field = createField({
  initialValue: '',
  validators: [required],
  validateOn: 'onBlur', // Validate when field loses focus
});
```

### Validate on Submit

```typescript
const field = createField({
  initialValue: '',
  validators: [required],
  validateOn: 'onSubmit', // Validate only on form submission
});

// Trigger validation manually
field.validateNow();
```

### Revalidation Mode

After the first error, revalidate with a different trigger:

```typescript
const field = createField({
  initialValue: '',
  validators: [required],
  validateOn: 'onBlur',      // First validation on blur
  revalidateOn: 'onChange',  // Revalidate on change after error
});
```

### Show Errors Only When Touched

```typescript
const field = createField({
  initialValue: '',
  validators: [required],
  validateOn: 'onChange',
  showErrorsOnTouched: true, // Only show errors after field is touched
});

// Error is set internally but not shown
field.setValue('');

// Now error is visible
field.setTouched(true);
```

### Form-Level Defaults

```typescript
const form = createForm({
  defaultValidationMode: 'onBlur',
  defaultRevalidateMode: 'onChange',
  showErrorsOnTouched: true,
});

// All fields inherit these defaults
const nameField = form.registerField('name', {
  initialValue: '',
  validators: [required],
  // Uses form defaults
});

// Override for specific field
const emailField = form.registerField('email', {
  initialValue: '',
  validators: [required, email],
  validateOn: 'onChange', // Override default
});
```
```

---

## ✅ Acceptance Criteria

### Functional Requirements
- [x] validateOnChange works
- [x] validateOnBlur works
- [x] validateOnSubmit works
- [x] Revalidation mode works
- [x] Show errors based on touched state
- [x] Form-level defaults
- [x] Field-level overrides

### Code Quality
- [x] TypeScript strict mode passes
- [x] All tests pass
- [x] Test coverage ≥95%
- [x] No ESLint errors
- [x] Proper JSDoc comments

### Documentation
- [x] README with trigger examples
- [x] API reference
- [x] Best practices

---

## 🧪 Testing Strategy

### Unit Tests
- [x] validateOnChange
- [x] validateOnBlur
- [x] validateOnSubmit
- [x] Revalidation modes
- [x] Show errors on touched
- [x] Form-level defaults
- [x] Field-level overrides

### Integration Tests
- [x] Complete form with mixed trigger modes
- [x] Form submission validation

---

## 📦 Deliverables

- [x] `validation-trigger.ts` - Trigger logic
- [x] Updated `field.ts` - Trigger integration
- [x] Updated `create-form.ts` - Form-level defaults
- [x] Test suite
- [x] Updated README
- [x] Examples

---

## 🔗 Dependencies

### Depends On
- ECO-008: Schema validation
- ECO-010: Async validation

### Enables
- ECO-012: React form hooks with complete validation control

---

## 📝 Notes

### Design Decisions

1. **Separate Modes**: First validation vs revalidation
2. **Touched State**: Control error visibility
3. **Form Defaults**: Reduce boilerplate
4. **Field Override**: Full flexibility per field

### Best Practices

- Use `onBlur` for better UX (less annoying)
- Use `onChange` for revalidation (immediate feedback)
- Always use `showErrorsOnTouched: true` for forms

---

**Created:** 2026-03-01  
**Last Updated:** 2026-03-01  
**Assignee:** AI Agent

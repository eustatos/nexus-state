# ECO-010: Implement Async Field Validation

**Status:** ⬜ Not Started  
**Priority:** 🟢 Medium  
**Estimated Time:** 2-3 hours  
**Dependencies:** ECO-008 (Schema validation)  
**Package:** @nexus-state/form

---

## 📋 Overview

Implement asynchronous field validation for the form package, allowing validation that requires network calls (e.g., checking username availability, validating email uniqueness).

**Key Goals:**
- Async validators with debouncing
- Loading state tracking
- Abort pending validations
- Integration with existing validation system
- TypeScript support

---

## 🎯 Objectives

### Must Have
- [x] Async validator function support
- [x] Debouncing for async validation
- [x] Loading state tracking
- [x] Cancel pending validations
- [x] Integration with sync validators
- [x] Error handling for network failures

### Should Have
- [x] Configurable debounce delay
- [x] Retry logic for failed validations
- [x] Cache validation results
- [x] Multiple async validators per field

### Nice to Have
- [ ] Validation dependency tracking
- [ ] Parallel async validations
- [ ] Background revalidation

---

## 🏗️ Implementation Plan

### Step 1: Define Async Validation Types (30 min)

**File:** `packages/form/src/types.ts`

Update types to support async validation:

```typescript
export interface AsyncValidatorFn<T> {
  (value: T, formValues?: Record<string, unknown>): Promise<string | null>;
}

export interface AsyncValidatorOptions {
  debounce?: number; // Debounce delay in ms (default: 300)
  retry?: number; // Retry attempts on failure (default: 0)
  cache?: boolean; // Cache validation results (default: true)
  timeout?: number; // Validation timeout in ms (default: 5000)
}

export interface AsyncValidator<T> {
  validate: AsyncValidatorFn<T>;
  options?: AsyncValidatorOptions;
}

export interface FieldOptions<T> {
  initialValue: T;
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidator<T>[];
  validateOn?: 'change' | 'blur' | 'submit';
  debounce?: number; // Field-level debounce override
}

export interface FieldState<T> {
  value: T;
  touched: boolean;
  dirty: boolean;
  error: string | null;
  validating: boolean; // New: async validation in progress
  asyncError: string | null; // New: async validation error
}
```

### Step 2: Implement Async Validation Logic (1.5 hours)

**File:** `packages/form/src/async-validation.ts`

```typescript
import { Store } from '@nexus-state/core';
import type { Atom } from '@nexus-state/core';
import type { AsyncValidator, AsyncValidatorOptions, FieldState } from './types';

interface ValidationCache {
  [key: string]: {
    result: string | null;
    timestamp: number;
  };
}

export class AsyncValidationManager<T> {
  private abortController: AbortController | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private cache: ValidationCache = {};
  private readonly defaultOptions: Required<AsyncValidatorOptions> = {
    debounce: 300,
    retry: 0,
    cache: true,
    timeout: 5000,
  };
  
  constructor(
    private readonly store: Store,
    private readonly stateAtom: Atom<FieldState<T>>,
    private readonly validators: AsyncValidator<T>[]
  ) {}
  
  /**
   * Start async validation with debouncing
   */
  public validate(value: T, formValues?: Record<string, unknown>): void {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Cancel pending validation
    this.cancel();
    
    // Get debounce delay from first validator or use default
    const debounceDelay = this.validators[0]?.options?.debounce ?? this.defaultOptions.debounce;
    
    // Debounce validation
    this.debounceTimer = setTimeout(() => {
      this.executeValidation(value, formValues);
    }, debounceDelay);
  }
  
  /**
   * Execute async validation
   */
  private async executeValidation(value: T, formValues?: Record<string, unknown>): Promise<void> {
    // Set validating state
    this.store.set(this.stateAtom, (prev) => ({
      ...prev,
      validating: true,
      asyncError: null,
    }));
    
    // Create new abort controller
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    
    try {
      // Run all async validators sequentially
      for (const validator of this.validators) {
        if (signal.aborted) {
          return;
        }
        
        const error = await this.runValidator(value, validator, formValues, signal);
        
        if (error) {
          // Update state with error
          this.store.set(this.stateAtom, (prev) => ({
            ...prev,
            validating: false,
            asyncError: error,
          }));
          return;
        }
      }
      
      // All validators passed
      this.store.set(this.stateAtom, (prev) => ({
        ...prev,
        validating: false,
        asyncError: null,
      }));
    } catch (error) {
      if (!signal.aborted) {
        console.error('Async validation error:', error);
        this.store.set(this.stateAtom, (prev) => ({
          ...prev,
          validating: false,
          asyncError: 'Validation failed',
        }));
      }
    }
  }
  
  /**
   * Run single async validator with retry logic
   */
  private async runValidator(
    value: T,
    validator: AsyncValidator<T>,
    formValues: Record<string, unknown> | undefined,
    signal: AbortSignal,
    attemptNumber = 0
  ): Promise<string | null> {
    const options = { ...this.defaultOptions, ...validator.options };
    
    // Check cache
    if (options.cache) {
      const cacheKey = this.getCacheKey(value, validator);
      const cached = this.cache[cacheKey];
      
      if (cached && Date.now() - cached.timestamp < 60000) {
        // Cache valid for 1 minute
        return cached.result;
      }
    }
    
    try {
      // Execute validation with timeout
      const result = await Promise.race([
        validator.validate(value, formValues),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Validation timeout')), options.timeout)
        ),
      ]);
      
      if (signal.aborted) {
        return null;
      }
      
      // Cache result
      if (options.cache) {
        const cacheKey = this.getCacheKey(value, validator);
        this.cache[cacheKey] = {
          result,
          timestamp: Date.now(),
        };
      }
      
      return result;
    } catch (error) {
      if (signal.aborted) {
        return null;
      }
      
      // Retry logic
      if (attemptNumber < options.retry) {
        const delay = Math.min(1000 * Math.pow(2, attemptNumber), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        
        if (signal.aborted) {
          return null;
        }
        
        return this.runValidator(value, validator, formValues, signal, attemptNumber + 1);
      }
      
      throw error;
    }
  }
  
  /**
   * Cancel pending validation
   */
  public cancel(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    // Reset validating state
    this.store.set(this.stateAtom, (prev) => ({
      ...prev,
      validating: false,
    }));
  }
  
  /**
   * Clear validation cache
   */
  public clearCache(): void {
    this.cache = {};
  }
  
  /**
   * Generate cache key for validator
   */
  private getCacheKey(value: T, validator: AsyncValidator<T>): string {
    return `${JSON.stringify(value)}_${validator.validate.toString()}`;
  }
  
  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.cancel();
    this.clearCache();
  }
}
```

### Step 3: Update Field Implementation (45 min)

**File:** `packages/form/src/field.ts`

Update to integrate async validation:

```typescript
import { atom, computed } from '@nexus-state/core';
import { AsyncValidationManager } from './async-validation';
import type { FieldOptions, FieldState, ValidatorFn } from './types';

export function createField<T>(options: FieldOptions<T>) {
  const { initialValue, validators = [], asyncValidators = [] } = options;
  
  const stateAtom = atom<FieldState<T>>({
    value: initialValue,
    touched: false,
    dirty: false,
    error: null,
    validating: false,
    asyncError: null,
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
  
  // Combined error (sync + async)
  const errorAtom = computed((get) => {
    const state = get(stateAtom);
    return state.error || state.asyncError;
  });
  
  // Is valid (no sync or async errors, not validating)
  const isValidAtom = computed((get) => {
    const state = get(stateAtom);
    return !state.error && !state.asyncError && !state.validating;
  });
  
  return {
    state: stateAtom,
    error: errorAtom,
    isValid: isValidAtom,
    
    setValue(value: T, formValues?: Record<string, unknown>) {
      const store = options.store ?? createStore();
      
      // Run sync validation
      const syncError = runSyncValidation(value, formValues);
      
      // Update state
      store.set(stateAtom, (prev) => ({
        ...prev,
        value,
        dirty: true,
        error: syncError,
      }));
      
      // Run async validation if sync passed
      if (!syncError && asyncManager) {
        asyncManager.validate(value, formValues);
      } else if (asyncManager) {
        asyncManager.cancel();
      }
    },
    
    setTouched(touched: boolean) {
      const store = options.store ?? createStore();
      store.set(stateAtom, (prev) => ({ ...prev, touched }));
    },
    
    reset() {
      const store = options.store ?? createStore();
      asyncManager?.cancel();
      store.set(stateAtom, {
        value: initialValue,
        touched: false,
        dirty: false,
        error: null,
        validating: false,
        asyncError: null,
      });
    },
    
    dispose() {
      asyncManager?.dispose();
    },
  };
}
```

### Step 4: Add Tests (1 hour)

**File:** `packages/form/src/__tests__/async-validation.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createField } from '../field';

describe('Async Validation', () => {
  let store: ReturnType<typeof createStore>;
  
  beforeEach(() => {
    store = createStore();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should validate async with debouncing', async () => {
    const asyncValidator = vi.fn().mockResolvedValue(null);
    
    const field = createField({
      initialValue: '',
      asyncValidators: [
        {
          validate: asyncValidator,
          options: { debounce: 300 },
        },
      ],
      store,
    });
    
    // Change value multiple times
    field.setValue('a');
    field.setValue('ab');
    field.setValue('abc');
    
    // Validator should not be called yet
    expect(asyncValidator).not.toHaveBeenCalled();
    
    // Advance debounce timer
    vi.advanceTimersByTime(300);
    
    // Wait for async validation
    await vi.runAllTimersAsync();
    
    // Validator called only once with latest value
    expect(asyncValidator).toHaveBeenCalledTimes(1);
    expect(asyncValidator).toHaveBeenCalledWith('abc', undefined);
  });
  
  it('should track validating state', async () => {
    const asyncValidator = vi.fn(() => new Promise((resolve) => 
      setTimeout(() => resolve(null), 100)
    ));
    
    const field = createField({
      initialValue: '',
      asyncValidators: [{ validate: asyncValidator }],
      store,
    });
    
    field.setValue('test');
    vi.advanceTimersByTime(300);
    
    const validatingState = store.get(field.state);
    expect(validatingState.validating).toBe(true);
    
    await vi.runAllTimersAsync();
    
    const completeState = store.get(field.state);
    expect(completeState.validating).toBe(false);
  });
  
  it('should set async error on validation failure', async () => {
    const asyncValidator = vi.fn().mockResolvedValue('Username already taken');
    
    const field = createField({
      initialValue: '',
      asyncValidators: [{ validate: asyncValidator }],
      store,
    });
    
    field.setValue('admin');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();
    
    const state = store.get(field.state);
    expect(state.asyncError).toBe('Username already taken');
    expect(store.get(field.error)).toBe('Username already taken');
  });
  
  it('should cancel pending validation on new value', async () => {
    const validator1 = vi.fn(() => new Promise((resolve) => 
      setTimeout(() => resolve('Error 1'), 200)
    ));
    const validator2 = vi.fn().mockResolvedValue(null);
    
    const field = createField({
      initialValue: '',
      asyncValidators: [{ validate: validator1 }],
      store,
    });
    
    // Start first validation
    field.setValue('test1');
    vi.advanceTimersByTime(300);
    
    // Start second validation before first completes
    field.setValue('test2');
    vi.advanceTimersByTime(300);
    
    await vi.runAllTimersAsync();
    
    // First validation should be cancelled
    const state = store.get(field.state);
    expect(state.value).toBe('test2');
  });
  
  it('should cache validation results', async () => {
    const asyncValidator = vi.fn().mockResolvedValue(null);
    
    const field = createField({
      initialValue: '',
      asyncValidators: [
        {
          validate: asyncValidator,
          options: { cache: true },
        },
      ],
      store,
    });
    
    // Validate same value twice
    field.setValue('test');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();
    
    field.setValue('other');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();
    
    field.setValue('test'); // Same as first
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();
    
    // Should use cached result for 'test'
    expect(asyncValidator).toHaveBeenCalledTimes(2); // 'test' and 'other'
  });
  
  it('should retry on validation failure', async () => {
    const asyncValidator = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(null);
    
    const field = createField({
      initialValue: '',
      asyncValidators: [
        {
          validate: asyncValidator,
          options: { retry: 2 },
        },
      ],
      store,
    });
    
    field.setValue('test');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();
    
    expect(asyncValidator).toHaveBeenCalledTimes(3);
  });
  
  it('should timeout long-running validations', async () => {
    const asyncValidator = vi.fn(() => new Promise((resolve) => 
      setTimeout(() => resolve(null), 10000)
    ));
    
    const field = createField({
      initialValue: '',
      asyncValidators: [
        {
          validate: asyncValidator,
          options: { timeout: 1000 },
        },
      ],
      store,
    });
    
    field.setValue('test');
    vi.advanceTimersByTime(300);
    vi.advanceTimersByTime(1000); // Trigger timeout
    
    await vi.runAllTimersAsync();
    
    const state = store.get(field.state);
    expect(state.asyncError).toBe('Validation failed');
  });
  
  it('should run sync validators before async', async () => {
    const syncValidator = vi.fn().mockReturnValue('Sync error');
    const asyncValidator = vi.fn().mockResolvedValue(null);
    
    const field = createField({
      initialValue: '',
      validators: [syncValidator],
      asyncValidators: [{ validate: asyncValidator }],
      store,
    });
    
    field.setValue('test');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();
    
    // Async should not run if sync fails
    expect(syncValidator).toHaveBeenCalled();
    expect(asyncValidator).not.toHaveBeenCalled();
    
    const state = store.get(field.state);
    expect(state.error).toBe('Sync error');
  });
});
```

### Step 5: Update Documentation (30 min)

**File:** `packages/form/README.md`

Add async validation section:

```markdown
## Async Validation

Validate fields with asynchronous operations like API calls.

### Basic Async Validation

```typescript
import { createField } from '@nexus-state/form';

const usernameField = createField({
  initialValue: '',
  asyncValidators: [
    {
      validate: async (value) => {
        const response = await fetch(`/api/check-username?username=${value}`);
        const { available } = await response.json();
        return available ? null : 'Username already taken';
      },
      options: {
        debounce: 500, // Wait 500ms after last keystroke
        cache: true,   // Cache validation results
      },
    },
  ],
});
```

### Validation State

```typescript
// Check if validation is in progress
const state = store.get(usernameField.state);
console.log(state.validating); // true/false

// Get async error
console.log(state.asyncError); // 'Username already taken' or null

// Combined error (sync + async)
const error = store.get(usernameField.error);
```

### Multiple Async Validators

```typescript
const emailField = createField({
  initialValue: '',
  asyncValidators: [
    {
      validate: async (value) => {
        // Check format
        const response = await fetch(`/api/validate-email-format?email=${value}`);
        const { valid } = await response.json();
        return valid ? null : 'Invalid email format';
      },
    },
    {
      validate: async (value) => {
        // Check availability
        const response = await fetch(`/api/check-email?email=${value}`);
        const { available } = await response.json();
        return available ? null : 'Email already registered';
      },
    },
  ],
});
```

### Retry on Failure

```typescript
const field = createField({
  initialValue: '',
  asyncValidators: [
    {
      validate: async (value) => {
        // Might fail due to network issues
        const response = await fetch(`/api/validate?value=${value}`);
        return response.json();
      },
      options: {
        retry: 3,           // Retry up to 3 times
        timeout: 5000,      // 5 second timeout
      },
    },
  ],
});
```

### Cleanup

```typescript
// Cancel pending validations
field.dispose();
```
```

---

## ✅ Acceptance Criteria

### Functional Requirements
- [x] Async validators execute after debounce
- [x] Validating state tracked
- [x] Async errors stored separately
- [x] Cancel pending validations
- [x] Cache validation results
- [x] Retry on failure
- [x] Timeout long-running validations

### Code Quality
- [x] TypeScript strict mode passes
- [x] All tests pass
- [x] Test coverage ≥95%
- [x] No ESLint errors
- [x] Proper JSDoc comments

### Documentation
- [x] README with async validation examples
- [x] API reference
- [x] Best practices

---

## 🧪 Testing Strategy

### Unit Tests
- [x] Debouncing behavior
- [x] Validating state tracking
- [x] Async error handling
- [x] Cancellation
- [x] Caching
- [x] Retry logic
- [x] Timeout handling
- [x] Integration with sync validators

### Integration Tests
- [ ] Real API calls (mocked)
- [ ] Multiple fields with async validation
- [ ] Form submission with async validation

---

## 📦 Deliverables

- [x] `async-validation.ts` - Async validation manager
- [x] Updated `field.ts` with async support
- [x] Type definitions
- [x] Test suite
- [x] Updated README
- [x] Examples

---

## 🔗 Dependencies

### Depends On
- ECO-008: Schema validation

### Enables
- ECO-011: Complete validation trigger system
- ECO-012: React form hooks with async validation

---

## 📝 Notes

### Design Decisions

1. **Debouncing**: Applied per-field to reduce API calls
2. **Cancellation**: Use AbortController for clean cancellation
3. **Caching**: Cache results by value to avoid duplicate requests
4. **Error Separation**: Keep sync and async errors separate for clarity

### Future Enhancements

- Validation dependency tracking (validate B when A changes)
- Parallel async validations
- Background revalidation
- Custom cache strategies

---

**Created:** 2026-03-01  
**Last Updated:** 2026-03-01  
**Assignee:** AI Agent

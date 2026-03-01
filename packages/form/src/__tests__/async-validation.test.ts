import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [
        {
          validate: asyncValidator,
          options: { debounce: 300 },
        },
      ],
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

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [{ validate: asyncValidator }],
    });

    field.setValue('test');
    vi.advanceTimersByTime(300);

    const validatingState = store.get(field.atom);
    expect(validatingState.validating).toBe(true);

    await vi.runAllTimersAsync();

    const completeState = store.get(field.atom);
    expect(completeState.validating).toBe(false);
  });

  it('should set async error on validation failure', async () => {
    const asyncValidator = vi.fn().mockResolvedValue('Username already taken');

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [{ validate: asyncValidator }],
    });

    field.setValue('admin');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    const state = store.get(field.atom);
    expect(state.asyncError).toBe('Username already taken');
    expect(store.get(field.error)).toBe('Username already taken');
  });

  it('should cancel pending validation on new value', async () => {
    const validator1 = vi.fn(() => new Promise((resolve) =>
      setTimeout(() => resolve('Error 1'), 200)
    ));

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [{ validate: validator1 }],
    });

    // Start first validation
    field.setValue('test1');
    vi.advanceTimersByTime(300);

    // Start second validation before first completes
    field.setValue('test2');
    vi.advanceTimersByTime(300);

    await vi.runAllTimersAsync();

    // First validation should be cancelled
    const state = store.get(field.atom);
    expect(state.value).toBe('test2');
  });

  it('should cache validation results', async () => {
    const asyncValidator = vi.fn().mockResolvedValue(null);

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [
        {
          validate: asyncValidator,
          options: { cache: true },
        },
      ],
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

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [
        {
          validate: asyncValidator,
          options: { retry: 2 },
        },
      ],
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

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [
        {
          validate: asyncValidator,
          options: { timeout: 1000 },
        },
      ],
    });

    field.setValue('test');
    vi.advanceTimersByTime(300);
    vi.advanceTimersByTime(1000); // Trigger timeout

    await vi.runAllTimersAsync();

    const state = store.get(field.atom);
    expect(state.asyncError).toBe('Validation failed');
  });

  it('should run sync validators before async', async () => {
    const syncValidator = vi.fn().mockReturnValue('Sync error');
    const asyncValidator = vi.fn().mockResolvedValue(null);

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      validators: [syncValidator],
      asyncValidators: [{ validate: asyncValidator }],
    });

    field.setValue('test');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    // Async should not run if sync fails
    expect(syncValidator).toHaveBeenCalled();
    expect(asyncValidator).not.toHaveBeenCalled();

    const state = store.get(field.atom);
    expect(state.error).toBe('Sync error');
  });

  it('should run async validation when sync passes', async () => {
    const syncValidator = vi.fn().mockReturnValue(null);
    const asyncValidator = vi.fn().mockResolvedValue(null);

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      validators: [syncValidator],
      asyncValidators: [{ validate: asyncValidator }],
    });

    field.setValue('test');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    expect(syncValidator).toHaveBeenCalled();
    expect(asyncValidator).toHaveBeenCalled();

    const state = store.get(field.atom);
    expect(state.error).toBe(null);
    expect(state.asyncError).toBe(null);
  });

  it('should combine sync and async errors correctly', async () => {
    const syncValidator = vi.fn().mockReturnValue(null);
    const asyncValidator = vi.fn().mockResolvedValue('Async error');

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      validators: [syncValidator],
      asyncValidators: [{ validate: asyncValidator }],
    });

    field.setValue('test');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    const state = store.get(field.atom);
    expect(store.get(field.error)).toBe('Async error');
    expect(state.error).toBe(null);
    expect(state.asyncError).toBe('Async error');
  });

  it('should clear async error when value changes', async () => {
    let callCount = 0;
    const asyncValidator = vi.fn(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? 'Error' : null);
    });

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [{ validate: asyncValidator }],
    });

    // First validation with error
    field.setValue('test1');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    expect(store.get(field.atom).asyncError).toBe('Error');

    // Second validation without error
    field.setValue('test2');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    expect(store.get(field.atom).asyncError).toBe(null);
  });

  it('should handle multiple async validators sequentially', async () => {
    // Track call order
    const callOrder: number[] = [];

    const validator1 = vi.fn().mockImplementation(async () => {
      callOrder.push(1);
      // Add small delay to ensure sequential execution
      await Promise.resolve();
      return null;
    });

    const validator2 = vi.fn().mockImplementation(async () => {
      callOrder.push(2);
      await Promise.resolve();
      return null;
    });

    const field = createField(store, 'email', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [
        {
          validate: validator1,
          options: { timeout: 0, cache: false }
        },
        {
          validate: validator2,
          options: { timeout: 0, cache: false }
        },
      ],
    });

    // Set value and wait for debounce
    field.setValue('test@example.com');
    vi.advanceTimersByTime(300);

    // Run all timers and wait for async validation
    await vi.runAllTimersAsync();

    // Give microtasks time to complete
    await Promise.resolve();
    await Promise.resolve();

    // Both validators should be called sequentially
    expect(validator1).toHaveBeenCalledTimes(1);
    expect(validator2).toHaveBeenCalledTimes(1);

    // validator2 should be called AFTER validator1 (sequential)
    expect(callOrder).toEqual([1, 2]);

    // No errors
    expect(store.get(field.error)).toBe(null);
  });

  it('should stop at first failing async validator', async () => {
    const validator1 = vi.fn().mockResolvedValue('First error');
    const validator2 = vi.fn().mockResolvedValue(null);

    const field = createField(store, 'email', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [
        { validate: validator1 },
        { validate: validator2 },
      ],
    });

    field.setValue('invalid@example.com');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    expect(validator1).toHaveBeenCalled();
    expect(validator2).not.toHaveBeenCalled();
    expect(store.get(field.error)).toBe('First error');
  });

  it('should reset validating state on dispose', () => {
    const asyncValidator = vi.fn(() => new Promise(() => {}));

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [{ validate: asyncValidator }],
    });

    field.setValue('test');
    vi.advanceTimersByTime(300);

    expect(store.get(field.atom).validating).toBe(true);

    field.dispose();

    expect(store.get(field.atom).validating).toBe(false);
  });

  it('should use field-level debounce override', async () => {
    const asyncValidator = vi.fn().mockResolvedValue(null);

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [{ validate: asyncValidator }],
      debounce: 500,
    });

    field.setValue('test');
    vi.advanceTimersByTime(300);

    expect(asyncValidator).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    await vi.runAllTimersAsync();

    expect(asyncValidator).toHaveBeenCalledTimes(1);
  });

  it('should handle plain function async validators', async () => {
    const asyncValidator = vi.fn().mockResolvedValue(null);

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [asyncValidator],
    });

    field.setValue('test');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    expect(asyncValidator).toHaveBeenCalledTimes(1);
  });

  it('should track isValid state correctly', async () => {
    const asyncValidator = vi.fn().mockResolvedValue(null);

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [{ validate: asyncValidator }],
    });

    // Before validation
    expect(store.get(field.isValid)).toBe(true);

    // During validation
    field.setValue('test');
    vi.advanceTimersByTime(300);

    // Should be false while validating
    expect(store.get(field.isValid)).toBe(false);

    // After successful validation
    await vi.runAllTimersAsync();
    expect(store.get(field.isValid)).toBe(true);
  });

  it('should track isValid as false when async error exists', async () => {
    const asyncValidator = vi.fn().mockResolvedValue('Error');

    const field = createField(store, 'username', {
      initialValue: '',
      validateOn: 'onChange',
      showErrorsOnTouched: false,
      asyncValidators: [{ validate: asyncValidator }],
    });

    field.setValue('test');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    expect(store.get(field.isValid)).toBe(false);
  });
});

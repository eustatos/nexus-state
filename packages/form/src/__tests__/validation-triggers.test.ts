import { describe, it, expect, vi, beforeEach } from 'vitest';
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

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onChange',
        showErrorsOnTouched: false,
      });

      field.setValue('a');
      expect(validator).toHaveBeenCalledWith('a', undefined);

      field.setValue('ab');
      expect(validator).toHaveBeenCalledWith('ab', undefined);

      expect(validator).toHaveBeenCalledTimes(2);
    });

    it('should not validate on change when mode is onBlur', () => {
      const validator = vi.fn().mockReturnValue(null);

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onBlur',
        showErrorsOnTouched: false,
      });

      field.setValue('test');
      expect(validator).not.toHaveBeenCalled();
    });
  });

  describe('validateOnBlur', () => {
    it('should validate only on blur', () => {
      const validator = vi.fn().mockReturnValue(null);

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onBlur',
        showErrorsOnTouched: false,
      });

      // Change value - should not validate
      field.setValue('test');
      expect(validator).not.toHaveBeenCalled();

      // Blur - should validate
      field.setTouched(true);
      expect(validator).toHaveBeenCalledWith('test', undefined);
    });

    it('should not validate on blur when mode is onChange', () => {
      const validator = vi.fn().mockReturnValue(null);

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onChange',
        showErrorsOnTouched: false,
      });

      field.setValue('test');
      validator.mockClear();

      field.setTouched(true);
      expect(validator).not.toHaveBeenCalled();
    });
  });

  describe('validateOnSubmit', () => {
    it('should validate only on manual trigger', () => {
      const validator = vi.fn().mockReturnValue(null);

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onSubmit',
        showErrorsOnTouched: false,
      });

      // Change and blur - should not validate
      field.setValue('test');
      field.setTouched(true);
      expect(validator).not.toHaveBeenCalled();

      // Manual validation - should validate
      field.validateNow();
      expect(validator).toHaveBeenCalledWith('test', undefined);
    });

    it('should validate on submit regardless of other settings', () => {
      const validator = vi.fn().mockReturnValue(null);

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onSubmit',
        showErrorsOnTouched: false,
      });

      field.setValue('test');
      field.setTouched(true);

      // validateNow simulates submit validation
      field.validateNow();
      expect(validator).toHaveBeenCalledTimes(1);
    });
  });

  describe('Revalidation', () => {
    it('should revalidate on change after first error', () => {
      const validator = vi.fn()
        .mockReturnValueOnce('Error')
        .mockReturnValue(null);

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onBlur',
        revalidateOn: 'onChange',
        showErrorsOnTouched: false,
      });

      // First validation on blur
      field.setValue('a');
      field.setTouched(true);
      expect(validator).toHaveBeenCalledTimes(1);

      const state1 = store.get(field.atom);
      expect(state1.error).toBe('Error');

      // Now should revalidate on change
      field.setValue('ab');
      expect(validator).toHaveBeenCalledTimes(2);

      const state2 = store.get(field.atom);
      expect(state2.error).toBeNull();
    });

    it('should not revalidate on change when revalidateOn is onBlur', () => {
      const validator = vi.fn()
        .mockReturnValueOnce('Error')
        .mockReturnValue(null);

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onBlur',
        revalidateOn: 'onBlur',
        showErrorsOnTouched: false,
      });

      // First validation on blur
      field.setValue('a');
      field.setTouched(true);
      expect(validator).toHaveBeenCalledTimes(1);

      // Should not revalidate on change
      field.setValue('ab');
      expect(validator).toHaveBeenCalledTimes(1);

      // Should revalidate on blur
      field.setTouched(false);
      field.setTouched(true);
      expect(validator).toHaveBeenCalledTimes(2);
    });
  });

  describe('Show Errors on Touched', () => {
    it('should show errors only when touched', () => {
      const field = createField(store, 'name', {
        initialValue: '',
        validators: [(v) => v ? null : 'Required'],
        validateOn: 'onChange',
        showErrorsOnTouched: true,
      });

      // Validate with error
      field.setValue('');

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
      const field = createField(store, 'name', {
        initialValue: '',
        validators: [(v) => v ? null : 'Required'],
        validateOn: 'onChange',
        showErrorsOnTouched: false,
      });

      // Validate with error
      field.setValue('');

      // Error should be shown immediately
      const error = store.get(field.error);
      expect(error).toBe('Required');
    });

    it('should hide error when field becomes valid', () => {
      const field = createField(store, 'name', {
        initialValue: '',
        validators: [(v) => v.length >= 3 ? null : 'Min 3 chars'],
        validateOn: 'onChange',
        showErrorsOnTouched: true,
      });

      // Set invalid value and touch
      field.setValue('ab');
      field.setTouched(true);

      expect(store.get(field.error)).toBe('Min 3 chars');

      // Fix the error
      field.setValue('abc');

      expect(store.get(field.error)).toBeNull();
    });
  });

  describe('Field reset', () => {
    it('should reset validation state', () => {
      const validator = vi.fn().mockReturnValue('Error');

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onChange',
        showErrorsOnTouched: false,
      });

      field.setValue('test');
      expect(validator).toHaveBeenCalled();

      field.reset();

      const state = store.get(field.atom);
      expect(state.value).toBe('');
      expect(state.error).toBeNull();
      expect(state.validated).toBe(false);
      expect(state.touched).toBe(false);
    });

    it('should reset validation trigger state', () => {
      const validator = vi.fn().mockReturnValue('Error');

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onChange',
        showErrorsOnTouched: false,
      });

      field.setValue('test');
      field.reset();

      validator.mockReturnValue(null);

      // After reset, should validate again as first time
      field.setValue('test2');
      expect(validator).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateNow', () => {
    it('should trigger validation immediately', () => {
      const validator = vi.fn().mockReturnValue(null);

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onSubmit',
        showErrorsOnTouched: false,
      });

      field.setValue('test');
      expect(validator).not.toHaveBeenCalled();

      field.validateNow();
      expect(validator).toHaveBeenCalledWith('test', undefined);
    });

    it('should pass formValues to validator', () => {
      const validator = vi.fn().mockReturnValue(null);

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onSubmit',
        showErrorsOnTouched: false,
      });

      const formValues = { email: 'test@example.com' };
      field.setValue('test');
      field.validateNow(formValues);

      expect(validator).toHaveBeenCalledWith('test', formValues);
    });
  });

  describe('Error state tracking', () => {
    it('should track validated state', () => {
      const validator = vi.fn().mockReturnValue(null);

      const field = createField(store, 'name', {
        initialValue: '',
        validators: [validator],
        validateOn: 'onChange',
        showErrorsOnTouched: false,
      });

      const state1 = store.get(field.atom);
      expect(state1.validated).toBe(false);

      field.setValue('test');

      const state2 = store.get(field.atom);
      expect(state2.validated).toBe(true);
    });

    it('should set validated to false on reset', () => {
      const field = createField(store, 'name', {
        initialValue: '',
        validateOn: 'onChange',
        showErrorsOnTouched: false,
      });

      field.setValue('test');
      expect(store.get(field.atom).validated).toBe(true);

      field.reset();
      expect(store.get(field.atom).validated).toBe(false);
    });
  });
});

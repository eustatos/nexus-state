import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore, atom } from '@nexus-state/core';
import {
  required,
  email,
  minLength,
  maxLength,
  minValue,
  maxValue,
  pattern,
  composeValidators,
  debounceAsyncValidator,
  getFormValues,
  getFormErrors,
  areAllFieldsTouched,
  isAnyFieldDirty
} from '../utils';
import { createField } from '../field';
import type { FieldMeta, FormValues } from '../types';

describe('Utils', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('required', () => {
    it('should return error for null value', () => {
      expect(required(null)).toBe('Required');
    });

    it('should return error for undefined value', () => {
      expect(required(undefined)).toBe('Required');
    });

    it('should return error for empty string', () => {
      expect(required('')).toBe('Required');
    });

    it('should return error for whitespace-only string', () => {
      expect(required('   ')).toBe('Required');
    });

    it('should return null for valid value', () => {
      expect(required('hello')).toBeNull();
      expect(required(0)).toBeNull();
      expect(required(false)).toBeNull();
    });
  });

  describe('email', () => {
    it('should return null for empty value', () => {
      expect(email('')).toBeNull();
    });

    it('should return error for invalid email', () => {
      expect(email('invalid')).toBe('Invalid email address');
      expect(email('test@')).toBe('Invalid email address');
      expect(email('@example.com')).toBe('Invalid email address');
    });

    it('should return null for valid email', () => {
      expect(email('test@example.com')).toBeNull();
      expect(email('user.name@domain.org')).toBeNull();
    });
  });

  describe('minLength', () => {
    it('should return null for empty value', () => {
      const validator = minLength(5);
      expect(validator('')).toBeNull();
    });

    it('should return error for too short string', () => {
      const validator = minLength(5);
      expect(validator('abc')).toBe('Must be at least 5 characters');
    });

    it('should return null for valid length', () => {
      const validator = minLength(3);
      expect(validator('abc')).toBeNull();
      expect(validator('abcd')).toBeNull();
    });
  });

  describe('maxLength', () => {
    it('should return null for empty value', () => {
      const validator = maxLength(5);
      expect(validator('')).toBeNull();
    });

    it('should return error for too long string', () => {
      const validator = maxLength(3);
      expect(validator('abcde')).toBe('Must be at most 3 characters');
    });

    it('should return null for valid length', () => {
      const validator = maxLength(5);
      expect(validator('abc')).toBeNull();
      expect(validator('abcde')).toBeNull();
    });
  });

  describe('minValue', () => {
    it('should return null for null/undefined', () => {
      const validator = minValue(5);
      expect(validator(null as any)).toBeNull();
      expect(validator(undefined as any)).toBeNull();
    });

    it('should return error for value below minimum', () => {
      const validator = minValue(5);
      expect(validator(3)).toBe('Must be at least 5');
    });

    it('should return null for valid value', () => {
      const validator = minValue(5);
      expect(validator(5)).toBeNull();
      expect(validator(10)).toBeNull();
    });
  });

  describe('maxValue', () => {
    it('should return null for null/undefined', () => {
      const validator = maxValue(5);
      expect(validator(null as any)).toBeNull();
      expect(validator(undefined as any)).toBeNull();
    });

    it('should return error for value above maximum', () => {
      const validator = maxValue(5);
      expect(validator(10)).toBe('Must be at most 5');
    });

    it('should return null for valid value', () => {
      const validator = maxValue(5);
      expect(validator(5)).toBeNull();
      expect(validator(3)).toBeNull();
    });
  });

  describe('pattern', () => {
    it('should return null for empty value', () => {
      const validator = pattern(/^[0-9]+$/);
      expect(validator('')).toBeNull();
    });

    it('should return error for non-matching value', () => {
      const validator = pattern(/^[0-9]+$/, 'Must be numeric');
      expect(validator('abc')).toBe('Must be numeric');
    });

    it('should return null for matching value', () => {
      const validator = pattern(/^[0-9]+$/);
      expect(validator('123')).toBeNull();
    });

    it('should use custom message', () => {
      const validator = pattern(/^[A-Z]+$/, 'Uppercase only');
      expect(validator('abc')).toBe('Uppercase only');
    });
  });

  describe('composeValidators', () => {
    it('should return null when all validators pass', () => {
      const validator = composeValidators(
        required,
        (value: string) => (value.length < 3 ? 'Too short' : null)
      );
      expect(validator('hello', {})).toBeNull();
    });

    it('should return first error', () => {
      const validator = composeValidators(
        required,
        (value: string) => (value.length < 3 ? 'Too short' : null)
      );
      expect(validator('', {})).toBe('Required');
    });

    it('should return error from second validator', () => {
      const validator = composeValidators(
        () => null,
        (value: string) => (value.length < 3 ? 'Too short' : null)
      );
      expect(validator('ab', {})).toBe('Too short');
    });
  });

  describe('debounceAsyncValidator', () => {
    it('should debounce async validation', async () => {
      vi.useFakeTimers();

      const mockValidator = vi.fn().mockResolvedValue(null);
      const debouncedValidator = debounceAsyncValidator(mockValidator, 100);

      // Call multiple times quickly
      debouncedValidator('value1', {});
      debouncedValidator('value2', {});
      debouncedValidator('value3', {});

      // Should not have called yet
      expect(mockValidator).not.toHaveBeenCalled();

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(100);

      // Should have called once with last value
      expect(mockValidator).toHaveBeenCalledTimes(1);
      expect(mockValidator).toHaveBeenCalledWith('value3', {});

      vi.useRealTimers();
    });

    it('should return validation error', async () => {
      vi.useFakeTimers();

      const mockValidator = vi.fn().mockResolvedValue('Error message');
      const debouncedValidator = debounceAsyncValidator(mockValidator, 50);

      const promise = debouncedValidator('test', {});
      await vi.advanceTimersByTimeAsync(50);

      const result = await promise;
      expect(result).toBe('Error message');

      vi.useRealTimers();
    });
  });

  describe('getFormValues', () => {
    it('should extract values from field metas', () => {
      const field1 = createField(store, 'name', { initialValue: 'John' });
      const field2 = createField(store, 'age', { initialValue: 30 });

      const fieldMetas = new Map<string, FieldMeta<any>>([
        ['name', field1],
        ['age', field2]
      ]);

      const values = getFormValues(fieldMetas as any, store);

      expect(values).toEqual({ name: 'John', age: 30 });
    });

    it('should return empty object for empty map', () => {
      const values = getFormValues(new Map(), store);
      expect(values).toEqual({});
    });
  });

  describe('getFormErrors', () => {
    it('should extract errors from field metas', () => {
      const field1 = createField(store, 'email', { initialValue: '' });
      const field2 = createField(store, 'password', { initialValue: '' });

      // Set error on first field
      store.set(field1.atom, {
        ...store.get(field1.atom),
        error: 'Required'
      });

      const fieldMetas = new Map<string, FieldMeta<any>>([
        ['email', field1],
        ['password', field2]
      ]);

      const errors = getFormErrors(fieldMetas as any, store);

      expect(errors).toEqual({ email: 'Required' });
    });

    it('should return empty object when no errors', () => {
      const field = createField(store, 'name', { initialValue: 'John' });
      const fieldMetas = new Map<string, FieldMeta<any>>([['name', field]]);

      const errors = getFormErrors(fieldMetas as any, store);
      expect(errors).toEqual({});
    });
  });

  describe('areAllFieldsTouched', () => {
    it('should return true when all fields are touched', () => {
      const field1 = createField(store, 'name', { initialValue: '' });
      const field2 = createField(store, 'email', { initialValue: '' });

      store.set(field1.atom, { ...store.get(field1.atom), touched: true });
      store.set(field2.atom, { ...store.get(field2.atom), touched: true });

      const fieldMetas = new Map<string, FieldMeta<any>>([
        ['name', field1],
        ['email', field2]
      ]);

      expect(areAllFieldsTouched(fieldMetas as any, store)).toBe(true);
    });

    it('should return false when any field is not touched', () => {
      const field1 = createField(store, 'name', { initialValue: '' });
      const field2 = createField(store, 'email', { initialValue: '' });

      store.set(field1.atom, { ...store.get(field1.atom), touched: true });
      // field2 not touched

      const fieldMetas = new Map<string, FieldMeta<any>>([
        ['name', field1],
        ['email', field2]
      ]);

      expect(areAllFieldsTouched(fieldMetas as any, store)).toBe(false);
    });
  });

  describe('isAnyFieldDirty', () => {
    it('should return true when any field is dirty', () => {
      const field1 = createField(store, 'name', { initialValue: '' });
      const field2 = createField(store, 'email', { initialValue: '' });

      store.set(field1.atom, { ...store.get(field1.atom), dirty: true });
      // field2 not dirty

      const fieldMetas = new Map<string, FieldMeta<any>>([
        ['name', field1],
        ['email', field2]
      ]);

      expect(isAnyFieldDirty(fieldMetas as any, store)).toBe(true);
    });

    it('should return false when no fields are dirty', () => {
      const field1 = createField(store, 'name', { initialValue: '' });
      const field2 = createField(store, 'email', { initialValue: '' });

      const fieldMetas = new Map<string, FieldMeta<any>>([
        ['name', field1],
        ['email', field2]
      ]);

      expect(isAnyFieldDirty(fieldMetas as any, store)).toBe(false);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';

describe('FieldArray validation', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('validation API', () => {
    it('should provide validation API', () => {
      const form = createForm(store, {
        initialValues: { emails: ['test@example.com'] }
      });

      const emailsArray = form.fieldArray('emails', '', {
        validate: (email) => {
          if (!email) return 'Email is required';
          return null;
        }
      });

      // API should be available
      expect(emailsArray.errors).toBeDefined();
      expect(emailsArray.getError).toBeDefined();
      expect(emailsArray.isValid).toBeDefined();
      expect(emailsArray.isvalid).toBeDefined();
    });

    it('should return null errors when no validator', () => {
      const form = createForm(store, {
        initialValues: { items: ['item1', 'item2'] }
      });

      const array = form.fieldArray('items', '');

      expect(array.errors).toEqual([null, null]);
      expect(array.isvalid).toBe(true);
      expect(array.isValid(0)).toBe(true);
    });
  });

  describe('validation with manual error setting', () => {
    it('should track errors for items', () => {
      const form = createForm(store, {
        initialValues: { emails: ['test@example.com'] }
      });

      const emailsArray = form.fieldArray('emails', '', {
        validate: (email) => {
          if (!email) return 'Email is required';
          return null;
        }
      });

      // Manually set error
      emailsArray.field(0)?.setError('Manual error');
      expect(emailsArray.getError(0)).toBe('Manual error');
      expect(emailsArray.isValid(0)).toBe(false);
    });

    it('should clear errors', () => {
      const form = createForm(store, {
        initialValues: { emails: ['test@example.com'] }
      });

      const emailsArray = form.fieldArray('emails', '', {
        validate: (email) => {
          if (!email) return 'Email is required';
          return null;
        }
      });

      // Set and clear error
      emailsArray.field(0)?.setError('Error');
      expect(emailsArray.getError(0)).toBe('Error');

      emailsArray.field(0)?.setError(null);
      expect(emailsArray.getError(0)).toBe(null);
      expect(emailsArray.isValid(0)).toBe(true);
    });
  });
});

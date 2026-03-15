import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../../../create-form';
import { defaultSchemaRegistry } from '../../registry';
import {
  required,
  minLength,
  maxLength,
  email,
  pattern,
  minValue,
  oneOf,
  matchesField,
  conditional,
  custom,
} from '@nexus-state/form-schema-dsl';

describe('E2E: DSL Plugin Integration', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  describe('Basic Validation', () => {
    it('should validate with built-in validators', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          name: [required, minLength(3)],
          email: [required, email()],
        },
        initialValues: { name: '', email: '' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.name).toBeDefined();
      expect(form.errors.email).toBeDefined();
    });

    it('should pass validation with valid data', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          name: [required, minLength(3)],
          email: [required, email()],
        },
        initialValues: { name: 'John', email: 'john@example.com' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(true);
      expect(form.errors.name).toBeUndefined();
      expect(form.errors.email).toBeUndefined();
    });
  });

  describe('String Validators', () => {
    it('should validate string length', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          username: [minLength(3), maxLength(20)],
        },
        initialValues: { username: 'ab' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.username).toBeDefined();
    });

    it('should validate pattern', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          phone: [pattern(/^\+?[\d\s-()]{10,}$/)],
        },
        initialValues: { phone: 'invalid' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.phone).toBeDefined();
    });
  });

  describe('Number Validators', () => {
    it('should validate minimum value', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          age: [minValue(18)],
        },
        initialValues: { age: 10 },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.age).toBeDefined();
    });
  });

  describe('Enum Validators', () => {
    it('should validate oneOf', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          role: [oneOf(['admin', 'user', 'guest'])],
        },
        initialValues: { role: 'invalid' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.role).toBeDefined();
    });
  });

  describe('Cross-field Validation', () => {
    it('should validate matching fields', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          password: [required, minLength(8)],
          confirmPassword: [required, matchesField('password', 'Passwords do not match')],
        },
        initialValues: { password: 'password123', confirmPassword: 'different' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.confirmPassword).toBeDefined();
    });

    it('should pass when fields match', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          password: [required, minLength(8)],
          confirmPassword: [required, matchesField('password')],
        },
        initialValues: { password: 'password123', confirmPassword: 'password123' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(true);
      expect(form.errors.confirmPassword).toBeUndefined();
    });
  });

  describe('Conditional Validation', () => {
    it('should validate conditionally', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          accountType: [required],
          company: [
            conditional(
              (_value, allValues) => (allValues as any)?.accountType === 'business',
              [required]
            ),
          ],
        },
        initialValues: { accountType: 'business', company: '' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.company).toBeDefined();
    });

    it('should skip validation when condition is false', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          accountType: [required],
          company: [
            conditional(
              (_value, allValues) => (allValues as any)?.accountType === 'business',
              [required]
            ),
          ],
        },
        initialValues: { accountType: 'personal', company: '' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(true);
      expect(form.errors.company).toBeUndefined();
    });
  });

  describe('Custom Validators', () => {
    it('should use custom validator', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          color: [
            custom(
              (value) => {
                if (!value) return null;
                const hexRegex = /^#[0-9A-Fa-f]{6}$/;
                return hexRegex.test(value as string) ? null : 'Invalid hex color';
              },
              'Invalid color',
              'color_format'
            ),
          ],
        },
        initialValues: { color: 'invalid' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.color).toBeDefined();
    });

    it('should pass custom validator', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          color: [
            custom(
              (value) => {
                if (!value) return null;
                const hexRegex = /^#[0-9A-Fa-f]{6}$/;
                return hexRegex.test(value as string) ? null : 'Invalid hex color';
              },
              'Invalid color',
              'color_format'
            ),
          ],
        },
        initialValues: { color: '#FF5733' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(true);
      expect(form.errors.color).toBeUndefined();
    });
  });

  describe('Form Submission', () => {
    it('should prevent submission when invalid', async () => {
      let submitCalled = false;

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          email: [required, email()],
        },
        initialValues: { email: '' },
        onSubmit: async () => {
          submitCalled = true;
        },
      });

      await form.submit();
      expect(submitCalled).toBe(false);
      expect(form.errors.email).toBeDefined();
    });

    it('should allow submission when valid', async () => {
      let submitCalled = false;
      let submittedValues: unknown;

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          email: [required, email()],
        },
        initialValues: { email: 'test@example.com' },
        onSubmit: async (values) => {
          submitCalled = true;
          submittedValues = values;
        },
      });

      await form.submit();
      expect(submitCalled).toBe(true);
      expect(submittedValues).toEqual({ email: 'test@example.com' });
    });
  });

  describe('Full Registration Form', () => {
    it('should validate complete registration form', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          username: [
            required,
            minLength(3, 'Username must be at least 3 characters'),
            maxLength(20, 'Username must be at most 20 characters'),
            pattern(/^[a-zA-Z0-9_]+$/, 'Invalid username format'),
          ],
          email: [
            required,
            email('Invalid email address'),
          ],
          password: [
            required,
            minLength(8, 'Password must be at least 8 characters'),
          ],
          confirmPassword: [
            required,
            matchesField('password', 'Passwords do not match'),
          ],
          age: [
            required,
            minValue(18, 'You must be at least 18 years old'),
          ],
          accountType: [
            required,
            oneOf(['personal', 'business'], 'Invalid account type'),
          ],
          terms: [
            required,
            oneOf([true], 'You must accept the terms'),
          ],
        },
        initialValues: {
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          age: 0,
          accountType: 'personal',
          terms: false,
        },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.username).toBeDefined();
      expect(form.errors.email).toBeDefined();
      expect(form.errors.password).toBeDefined();
      expect(form.errors.confirmPassword).toBeDefined();
      expect(form.errors.age).toBeDefined();
      expect(form.errors.terms).toBeDefined();
    });

    it('should pass complete registration form', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          username: [required, minLength(3), maxLength(20), pattern(/^[a-zA-Z0-9_]+$/)],
          email: [required, email()],
          password: [required, minLength(8)],
          confirmPassword: [required, matchesField('password')],
          age: [required, minValue(18)],
          accountType: [required, oneOf(['personal', 'business'])],
          terms: [required, oneOf([true])],
        },
        initialValues: {
          username: 'john_doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          age: 25,
          accountType: 'personal',
          terms: true,
        },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(true);
      expect(form.errors.username).toBeUndefined();
      expect(form.errors.email).toBeUndefined();
      expect(form.errors.password).toBeUndefined();
      expect(form.errors.confirmPassword).toBeUndefined();
      expect(form.errors.age).toBeUndefined();
      expect(form.errors.terms).toBeUndefined();
    });
  });

  describe('Field-level Validation', () => {
    it('should validate single field on change', async () => {
      const store = createStore();
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          email: [required, email()],
        },
        initialValues: { email: '' },
        validateOnChange: true,
      });

      const field = form.field('email');
      field.setValue('invalid');
      
      // Wait for async validation
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      expect(form.errors.email).toBeDefined();
    });
  });
});

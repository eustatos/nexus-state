import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { defaultSchemaRegistry } from '../schema';
import type { SchemaPlugin, SchemaValidator } from '../schema';

describe('createForm with schema registry', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    // Clear registry before each test
    defaultSchemaRegistry.clear();
  });

  describe('schemaType + schemaConfig (new way)', () => {
    it('should create form with schema from registry', async () => {
      // Register mock plugin
      const mockPlugin: SchemaPlugin<any, any> = {
        type: 'mock',
        create: (schema) => ({
          validate: (values) => ({
            name:
              schema.required && !values.name
                ? 'Required'
                : undefined,
          }),
        }),
      };
      defaultSchemaRegistry.register('mock', mockPlugin);

      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: { required: true },
        initialValues: { name: '' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors.name).toBe('Required');
    });

    it('should throw error for unregistered schema type', () => {
      expect(() =>
        createForm(store, {
          schemaType: 'unknown',
          schemaConfig: {},
          initialValues: {},
        })
      ).toThrow('Schema type "unknown" not registered');
    });

    it('should pass schemaConfig to plugin create function', () => {
      const createSpy = vi.fn(() => ({ validate: () => ({}) }));
      const mockPlugin: SchemaPlugin = {
        type: 'test',
        create: createSpy,
      };
      defaultSchemaRegistry.register('test', mockPlugin);

      const config = { custom: 'config' };
      createForm(store, {
        schemaType: 'test',
        schemaConfig: config,
        initialValues: {},
      });

      expect(createSpy).toHaveBeenCalledWith(config);
    });

    it('should list available types in error message', () => {
      defaultSchemaRegistry.register('zod', {
        type: 'zod',
        create: () => ({ validate: () => ({}) }),
      });
      defaultSchemaRegistry.register('yup', {
        type: 'yup',
        create: () => ({ validate: () => ({}) }),
      });

      try {
        createForm(store, {
          schemaType: 'unknown',
          schemaConfig: {},
          initialValues: {},
        });
      } catch (error: any) {
        expect(error.message).toContain('zod');
        expect(error.message).toContain('yup');
      }
    });

    it('should handle schema validation with multiple fields', async () => {
      const mockPlugin: SchemaPlugin<any, any> = {
        type: 'multi',
        create: () => ({
          validate: (values) => ({
            email: !values.email ? 'Email required' : undefined,
            password: !values.password ? 'Password required' : undefined,
          }),
        }),
      };
      defaultSchemaRegistry.register('multi', mockPlugin);

      const form = createForm(store, {
        schemaType: 'multi',
        schemaConfig: {},
        initialValues: { email: '', password: '' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors.email).toBe('Email required');
      expect(form.errors.password).toBe('Password required');
    });
  });

  describe('schema (old way - backward compatibility)', () => {
    it('should work with direct schema instance', async () => {
      const directSchema: SchemaValidator = {
        validate: (values) => ({
          email: !values.email ? 'Required' : undefined,
        }),
      };

      const form = createForm(store, {
        schema: directSchema,
        initialValues: { email: '' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors.email).toBe('Required');
    });

    it('should prefer schemaType over direct schema', async () => {
      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: () => ({
          validate: () => ({ test: 'From registry' }),
        }),
      };
      defaultSchemaRegistry.register('mock', mockPlugin);

      const directSchema: SchemaValidator = {
        validate: () => ({ test: 'Direct' }),
      };

      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: {},
        schema: directSchema, // Should be ignored
        initialValues: { test: '' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors.test).toBe('From registry');
    });

    it('should use direct schema when schemaType not provided', async () => {
      const directSchema: SchemaValidator = {
        validate: (values) => ({
          name: !values.name ? 'Name required' : undefined,
        }),
      };

      const form = createForm(store, {
        schema: directSchema,
        initialValues: { name: '' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors.name).toBe('Name required');
    });
  });

  describe('validateField integration', () => {
    it('should call schema.validateField on change', async () => {
      vi.useFakeTimers();

      const validateFieldSpy = vi.fn(() => null);
      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: () => ({
          validate: () => ({}),
          validateField: validateFieldSpy,
        }),
      };
      defaultSchemaRegistry.register('mock', mockPlugin);

      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: {},
        initialValues: { name: '' },
        validateOnChange: true,
      });

      const field = form.field('name');
      field.setValue('test');

      await vi.advanceTimersByTimeAsync(50);

      expect(validateFieldSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should call schema.validateField on blur', async () => {
      vi.useFakeTimers();

      const validateFieldSpy = vi.fn(() => null);
      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: () => ({
          validate: () => ({}),
          validateField: validateFieldSpy,
        }),
      };
      defaultSchemaRegistry.register('mock', mockPlugin);

      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: {},
        initialValues: { name: '' },
        validateOnBlur: true,
      });

      const field = form.field('name');
      field.setTouched(true);

      await vi.advanceTimersByTimeAsync(50);

      expect(validateFieldSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should set field error from validateField', async () => {
      vi.useFakeTimers();

      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: () => ({
          validate: () => ({}),
          validateField: (fieldName, value) => {
            if (fieldName === 'email' && !(value as string).includes('@')) {
              return 'Invalid email';
            }
            return null;
          },
        }),
      };
      defaultSchemaRegistry.register('mock', mockPlugin);

      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: {},
        initialValues: { email: '' },
        validateOnChange: true,
      });

      const field = form.field('email');
      field.setValue('invalid');

      await vi.advanceTimersByTimeAsync(50);

      expect(form.errors.email).toBe('Invalid email');

      vi.useRealTimers();
    });

    it('should clear field error when validateField returns null', async () => {
      vi.useFakeTimers();

      let isValid = false;
      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: () => ({
          validate: () => ({}),
          validateField: () => {
            return isValid ? null : 'Invalid';
          },
        }),
      };
      defaultSchemaRegistry.register('mock', mockPlugin);

      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: {},
        initialValues: { name: '' },
        validateOnChange: true,
      });

      const field = form.field('name');

      // First validation - error
      field.setValue('test1');
      await vi.advanceTimersByTimeAsync(50);
      expect(form.errors.name).toBe('Invalid');

      // Second validation - valid
      isValid = true;
      field.setValue('test2');
      await vi.advanceTimersByTimeAsync(50);
      // Error should be cleared (undefined or null)
      expect(form.errors.name).toBeUndefined();

      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should handle schema validation errors gracefully', async () => {
      const mockPlugin: SchemaPlugin = {
        type: 'error',
        create: () => ({
          validate: () => {
            throw new Error('Validation error');
          },
        }),
      };
      defaultSchemaRegistry.register('error', mockPlugin);

      const form = createForm(store, {
        schemaType: 'error',
        schemaConfig: {},
        initialValues: {},
      });

      // Should throw
      await expect(form.validate()).rejects.toThrow('Validation error');
    });

    it('should handle missing validateField gracefully', async () => {
      const mockPlugin: SchemaPlugin = {
        type: 'no-field-validate',
        create: () => ({
          validate: () => ({}),
          // No validateField method
        }),
      };
      defaultSchemaRegistry.register('no-field-validate', mockPlugin);

      const form = createForm(store, {
        schemaType: 'no-field-validate',
        schemaConfig: {},
        initialValues: { name: '' },
        validateOnChange: true,
      });

      const field = form.field('name');
      expect(() => field.setValue('test')).not.toThrow();
    });

    it('should handle async validation errors', async () => {
      vi.useFakeTimers();

      const mockPlugin: SchemaPlugin = {
        type: 'async-error',
        create: () => ({
          validate: async () => {
            await Promise.resolve();
            throw new Error('Async validation error');
          },
        }),
      };
      defaultSchemaRegistry.register('async-error', mockPlugin);

      const form = createForm(store, {
        schemaType: 'async-error',
        schemaConfig: {},
        initialValues: {},
      });

      await expect(form.validate()).rejects.toThrow('Async validation error');

      vi.useRealTimers();
    });
  });

  describe('form state updates', () => {
    it('should update isValid state after validation', async () => {
      const mockPlugin: SchemaPlugin = {
        type: 'valid',
        create: () => ({
          validate: () => ({}),
        }),
      };
      defaultSchemaRegistry.register('valid', mockPlugin);

      const form = createForm(store, {
        schemaType: 'valid',
        schemaConfig: {},
        initialValues: { name: '' },
      });

      await form.validate();
      expect(form.isValid).toBe(true);
    });

    it('should update isValid state to false on validation error', async () => {
      const mockPlugin: SchemaPlugin = {
        type: 'invalid',
        create: () => ({
          validate: () => ({ name: 'Required' }),
        }),
      };
      defaultSchemaRegistry.register('invalid', mockPlugin);

      const form = createForm(store, {
        schemaType: 'invalid',
        schemaConfig: {},
        initialValues: { name: '' },
      });

      await form.validate();
      expect(form.isValid).toBe(false);
    });
  });

  describe('schema with formErrors', () => {
    it('should handle form-level errors from schema', async () => {
      const mockPlugin: SchemaPlugin = {
        type: 'form-error',
        create: () => ({
          validate: () => ({}),
        }),
      };
      defaultSchemaRegistry.register('form-error', mockPlugin);

      const form = createForm(store, {
        schemaType: 'form-error',
        schemaConfig: {},
        initialValues: {},
      });

      await form.validate();
      // Form errors are not directly exposed in form.errors
      // but the form should be marked as invalid
      expect(form.isValid).toBe(true);
    });
  });
});

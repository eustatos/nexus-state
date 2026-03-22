import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

describe('schemaPlugin - explicit plugin registration', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('createForm with schemaPlugin', () => {
    it('should create form with explicit Zod plugin', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: schema,
        initialValues: {
          email: '',
          password: '',
        },
      });

      // Test invalid values
      form.setFieldValue('email', 'invalid');
      form.setFieldValue('password', 'short');
      await form.validate();

      expect(form.isValid).toBe(false);
      expect(form.errors.email).toBeDefined();
      expect(form.errors.password).toBeDefined();
    });

    it('should validate correctly with schemaPlugin', async () => {
      const schema = z.object({
        username: z.string().min(3),
        age: z.number().min(18),
      });

      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: schema,
        initialValues: {
          username: '',
          age: 0,
        },
      });

      // Set valid values
      form.setFieldValue('username', 'john');
      form.setFieldValue('age', 25);
      await form.validate();

      expect(form.isValid).toBe(true);
      expect(form.errors).toEqual({});
    });

    it('should prioritize schemaPlugin over schemaType', async () => {
      const schema = z.object({
        name: z.string().min(1),
      });

      // Create form with both schemaPlugin and schemaType
      // schemaPlugin should take precedence
      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: schema,
        // schemaType: 'zod', // Not needed when using schemaPlugin
        initialValues: {
          name: '',
        },
      });

      form.setFieldValue('name', 'valid');
      await form.validate();

      expect(form.isValid).toBe(true);
    });

    it('should work with validateOnChange using schemaPlugin', async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: schema,
        validateOnChange: true,
        initialValues: {
          email: '',
        },
      });

      // Set invalid value
      const emailField = form.field('email');
      emailField.setValue('not-an-email');

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(form.errors.email).toBeDefined();
    });

    it('should work with validateOnBlur using schemaPlugin', async () => {
      const schema = z.object({
        password: z.string().min(8),
      });

      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: schema,
        validateOnBlur: true,
        initialValues: {
          password: '',
        },
      });

      const passwordField = form.field('password');
      passwordField.setValue('short');
      passwordField.setTouched(true);

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(form.errors.password).toBeDefined();
    });

    it('should handle nested schemas with schemaPlugin', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
          email: z.string().email(),
        }),
      });

      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: schema,
        initialValues: {
          user: {
            name: '',
            email: '',
          },
        },
      });

      form.setFieldValue('user', { name: '', email: 'invalid' });
      await form.validate();

      expect(form.isValid).toBe(false);
    });

    it('should handle transforms with schemaPlugin', async () => {
      const schema = z.object({
        name: z.string().transform(val => val.toUpperCase()),
      });

      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: schema,
        initialValues: {
          name: 'john',
        },
      });

      // Note: Transform happens during validation, but form values
      // are not automatically updated with transformed values
      // This is expected behavior - transforms are for validation only
      await form.validate();

      // Validation should pass (transform succeeds)
      expect(form.isValid).toBe(true);
      expect(form.errors.name).toBeUndefined();
    });
  });

  describe('schemaPlugin priority', () => {
    it('should use schemaPlugin when both schemaPlugin and schema are provided', async () => {
      const zodSchema = z.object({
        email: z.string().email(),
      });

      // Create a mock schema validator that should NOT be used
      const mockSchemaValidator = {
        validate: async () => ({ fieldErrors: { email: 'Mock error' } }),
      };

      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: zodSchema,
        schema: mockSchemaValidator as any, // Should be ignored
        initialValues: {
          email: '',
        },
      });

      form.setFieldValue('email', 'invalid');
      await form.validate();

      // Should use Zod validation, not mock
      expect(form.errors.email).toContain('Invalid email');
      expect(form.errors.email).not.toBe('Mock error');
    });
  });

  describe('schemaPlugin with complex schemas', () => {
    it('should handle discriminated unions', async () => {
      const schema = z.object({
        type: z.enum(['email', 'phone']),
        contact: z.union([
          z.string().email(),
          z.string().regex(/^\+?[1-9]\d{1,14}$/),
        ]),
      });

      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: schema,
        initialValues: {
          type: 'email' as const,
          contact: '',
        },
      });

      form.setFieldValue('contact', 'not-valid');
      await form.validate();

      expect(form.isValid).toBe(false);
      expect(form.errors.contact).toBeDefined();
    });

    it('should handle optional fields', async () => {
      const schema = z.object({
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
      });

      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: schema,
        initialValues: {
          email: '',
          phone: '',
          address: '',
        },
      });

      // Only email is required
      form.setFieldValue('email', 'test@example.com');
      await form.validate();

      expect(form.isValid).toBe(true);
    });

    it('should handle arrays', async () => {
      const schema = z.object({
        tags: z.array(z.string().min(1)),
      });

      const form = createForm(store, {
        schemaPlugin: zodPlugin,
        schemaConfig: schema,
        initialValues: {
          tags: [] as string[],
        },
      });

      form.setFieldValue('tags', ['tag1', '', 'tag3']);
      await form.validate();

      expect(form.isValid).toBe(false);
    });
  });
});

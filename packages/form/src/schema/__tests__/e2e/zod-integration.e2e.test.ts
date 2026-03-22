import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { createStore } from '@nexus-state/core';
import { createForm } from '../../../create-form';
import { defaultSchemaRegistry } from '../../registry';
import { zodPlugin } from '@nexus-state/form-schema-zod';

describe('E2E: Zod Plugin Integration', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
    defaultSchemaRegistry.register('zod', zodPlugin);
  });

  describe('Basic Validation', () => {
    it('should validate simple schema', async () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'zod',
        schemaConfig: schema,
        initialValues: { name: '', email: '' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors.name).toBeDefined();
      expect(form.errors.email).toBeDefined();
    });

    it('should pass validation with valid data', async () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'zod',
        schemaConfig: schema,
        initialValues: { name: 'John', email: 'john@example.com' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(true);
      expect(form.errors.name).toBeUndefined();
      expect(form.errors.email).toBeUndefined();
    });
  });

  describe('Complex Schema', () => {
    it('should validate nested objects', async () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1),
            bio: z.string().max(500),
          }),
        }),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'zod',
        schemaConfig: schema,
        initialValues: { user: { profile: { name: '', bio: '' } } },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors['user.profile.name']).toBeDefined();
    });

    it('should validate arrays', async () => {
      const schema = z.object({
        tags: z.array(z.string().min(1)),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'zod',
        schemaConfig: schema,
        initialValues: { tags: ['valid', ''] },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors['tags.1']).toBeDefined();
    });
  });

  describe('Transformations', () => {
    it('should handle transformations', async () => {
      const schema = z.object({
        email: z
          .string()
          .email()
          .transform((val) => val.toLowerCase()),
        name: z.string().transform((val) => val.trim()),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'zod',
        schemaConfig: schema,
        initialValues: { email: 'TEST@EXAMPLE.COM', name: '  John  ' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(true);
    });
  });

  describe('Refine and SuperRefine', () => {
    it('should handle refine validation', async () => {
      const schema = z
        .object({
          password: z.string().min(8),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'zod',
        schemaConfig: schema,
        initialValues: {
          password: 'password123',
          confirmPassword: 'different',
        },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors.confirmPassword).toBeDefined();
    });
  });

  describe('Optional and Nullable', () => {
    it('should handle optional fields', async () => {
      const schema = z.object({
        name: z.string(),
        nickname: z.string().optional(),
        bio: z.string().nullable(),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'zod',
        schemaConfig: schema,
        initialValues: { name: 'John', nickname: undefined, bio: null },
      });

      const result = await form.validate();
      expect(result.valid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should prevent submission when invalid', async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      let submitCalled = false;

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'zod',
        schemaConfig: schema,
        initialValues: { email: 'invalid' },
        onSubmit: async () => {
          submitCalled = true;
        },
      });

      await form.submit();
      expect(submitCalled).toBe(false);
      expect(form.errors.email).toBeDefined();
    });

    it('should allow submission when valid', async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      let submitCalled = false;
      let submittedValues: unknown;

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'zod',
        schemaConfig: schema,
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

  describe('Field-level Validation', () => {
    it('should validate single field on change', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'zod',
        schemaConfig: schema,
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

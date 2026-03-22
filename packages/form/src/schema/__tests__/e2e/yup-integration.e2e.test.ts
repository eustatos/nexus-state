import { describe, it, expect, beforeEach } from 'vitest';
import * as yup from 'yup';
import { createStore } from '@nexus-state/core';
import { createForm } from '../../../create-form';
import { defaultSchemaRegistry } from '../../registry';
import { yupPlugin } from '@nexus-state/form-schema-yup';

describe('E2E: Yup Plugin Integration', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
    defaultSchemaRegistry.register('yup', yupPlugin);
  });

  describe('Basic Validation', () => {
    it('should validate simple schema', async () => {
      const schema = yup.object({
        name: yup.string().required('Name is required'),
        email: yup.string().email('Invalid email').required(),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
        schemaConfig: schema,
        initialValues: { name: '', email: '' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors.name).toBeDefined();
      expect(form.errors.email).toBeDefined();
    });

    it('should pass validation with valid data', async () => {
      const schema = yup.object({
        name: yup.string().required(),
        email: yup.string().email().required(),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
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
      const schema = yup.object({
        user: yup.object({
          profile: yup.object({
            name: yup.string().required(),
            bio: yup.string().max(500),
          }),
        }),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
        schemaConfig: schema,
        initialValues: { user: { profile: { name: '', bio: '' } } },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors['user.profile.name']).toBeDefined();
    });

    it('should validate arrays', async () => {
      const schema = yup.object({
        tags: yup.array().of(yup.string().min(1)),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
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
      const schema = yup.object({
        email: yup
          .string()
          .email()
          .transform((val) => val?.toLowerCase()),
        name: yup.string().transform((val) => val?.trim()),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
        schemaConfig: schema,
        initialValues: { email: 'TEST@EXAMPLE.COM', name: '  John  ' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(true);
    });
  });

  describe('OneOf (Enum)', () => {
    it('should validate enum values', async () => {
      const schema = yup.object({
        role: yup.string().oneOf(['admin', 'user', 'guest']).required(),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
        schemaConfig: schema,
        initialValues: { role: 'invalid' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors.role).toBeDefined();
    });
  });

  describe('MatchesField (oneOf with ref)', () => {
    it('should validate password confirmation', async () => {
      const schema = yup.object({
        password: yup.string().min(8).required(),
        confirmPassword: yup
          .string()
          .oneOf([yup.ref('password')], 'Passwords must match')
          .required(),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
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
      const schema = yup.object({
        name: yup.string().required(),
        nickname: yup.string(),
        bio: yup.string().nullable(),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
        schemaConfig: schema,
        initialValues: { name: 'John', nickname: undefined, bio: null },
      });

      const result = await form.validate();
      expect(result.valid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should prevent submission when invalid', async () => {
      const schema = yup.object({
        email: yup.string().email().required(),
      });

      let submitCalled = false;

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
        schemaConfig: schema,
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
      const schema = yup.object({
        email: yup.string().email().required(),
      });

      let submitCalled = false;
      let submittedValues: unknown;

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
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

  describe('Conditional Validation (when)', () => {
    it('should validate conditionally', async () => {
      const schema = yup.object({
        accountType: yup.string().oneOf(['personal', 'business']).required(),
        company: yup.string().when('accountType', {
          is: 'business',
          then: (schema) => schema.required('Company is required'),
          otherwise: (schema) => schema,
        }),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
        schemaConfig: schema,
        initialValues: { accountType: 'business', company: '' },
      });

      const result = await form.validate();
      expect(result.valid).toBe(false);
      expect(form.errors.company).toBeDefined();
    });
  });

  describe('Field-level Validation', () => {
    it('should validate single field on change', async () => {
      const schema = yup.object({
        email: yup.string().email('Invalid email').required(),
      });

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'yup',
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

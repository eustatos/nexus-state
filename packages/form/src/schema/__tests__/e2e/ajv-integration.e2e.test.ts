import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../../../create-form';
import { defaultSchemaRegistry } from '../../registry';
import { ajvPlugin } from '@nexus-state/form-schema-ajv';

describe('E2E: AJV Plugin Integration', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
    defaultSchemaRegistry.register('ajv', ajvPlugin);
  });

  describe('Basic Validation', () => {
    it('should validate simple schema', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
        },
        required: ['name', 'email'],
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
        initialValues: { name: '', email: '' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.name).toBeDefined();
      expect(form.errors.email).toBeDefined();
    });

    it('should pass validation with valid data', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['name', 'email'],
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
        initialValues: { name: 'John', email: 'john@example.com' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(true);
      expect(form.errors.name).toBeUndefined();
      expect(form.errors.email).toBeUndefined();
    });
  });

  describe('Complex Schema', () => {
    it('should validate nested objects', async () => {
      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              profile: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1 },
                  bio: { type: 'string', maxLength: 500 },
                },
                required: ['name'],
              },
            },
          },
        },
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
        initialValues: { user: { profile: { name: '', bio: '' } } },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors['user.profile.name']).toBeDefined();
    });

    it('should validate arrays', async () => {
      const schema = {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
          },
        },
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
        initialValues: { tags: ['valid', ''] },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors['tags.1']).toBeDefined();
    });
  });

  describe('Enum Validation', () => {
    it('should validate enum values', async () => {
      const schema = {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['admin', 'user', 'guest'] },
        },
        required: ['role'],
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
        initialValues: { role: 'invalid' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.role).toBeDefined();
    });
  });

  describe('Pattern Validation', () => {
    it('should validate pattern', async () => {
      const schema = {
        type: 'object',
        properties: {
          phone: { type: 'string', pattern: '^\\+?[\\d\\s-()]{10,}$' },
        },
        required: ['phone'],
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
        initialValues: { phone: 'invalid' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.phone).toBeDefined();
    });
  });

  describe('Number Validation', () => {
    it('should validate number range', async () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'integer', minimum: 18, maximum: 120 },
        },
        required: ['age'],
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
        initialValues: { age: 10 },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.age).toBeDefined();
    });

    it('should pass valid number', async () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'integer', minimum: 18, maximum: 120 },
        },
        required: ['age'],
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
        initialValues: { age: 25 },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(true);
    });
  });

  describe('Optional Fields', () => {
    it('should handle optional fields', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          nickname: { type: 'string' },
          bio: { type: ['string', 'null'] },
        },
        required: ['name'],
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
        initialValues: { name: 'John', nickname: undefined, bio: null },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should prevent submission when invalid', async () => {
      const schema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      };

      let submitCalled = false;

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
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
      const schema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      };

      let submitCalled = false;
      let submittedValues: unknown;

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
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

  describe('Conditional Validation (if/then/else)', () => {
    it('should validate conditionally', async () => {
      const schema = {
        type: 'object',
        properties: {
          accountType: { type: 'string', enum: ['personal', 'business'] },
          company: { type: 'string', minLength: 1 },
        },
        required: ['accountType'],
        if: {
          properties: {
            accountType: { const: 'business' },
          },
        },
        then: {
          required: ['company'],
        },
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
        initialValues: { accountType: 'business', company: '' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.company).toBeDefined();
    });
  });

  describe('Custom Formats', () => {
    it('should validate with custom formats', async () => {
      const schema = {
        type: 'object',
        properties: {
          website: { type: 'string', format: 'uri' },
        },
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: {
          schema,
          formats: {
            uri: /^https?:\/\//,
          },
        },
        initialValues: { website: 'not-a-url' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.website).toBeDefined();
    });
  });

  describe('Field-level Validation', () => {
    it('should validate single field on change', async () => {
      const schema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      };

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'ajv',
        schemaConfig: { schema },
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

import { beforeEach, describe, expect, it } from 'vitest';
import { compileRule, compileSchema, dslPlugin } from '../index';
import type { DSLRule, DSLSchema } from '../types';
import { defaultSchemaRegistry } from '@nexus-state/form/schema';

describe('dslPlugin', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(dslPlugin.meta.name).toBe('@nexus-state/form-schema-dsl');
      expect(dslPlugin.type).toBe('dsl');
      expect(dslPlugin.meta.version).toBe('0.1.0');
      expect(dslPlugin.meta.description).toBe(
        'Custom DSL schema validator for Nexus State forms'
      );
    });
  });

  describe('supports()', () => {
    it('should recognize valid DSL schema', () => {
      const schema: DSLSchema = {
        name: { validate: (v) => (v ? null : 'Required') },
      };
      expect(dslPlugin.supports(schema)).toBe(true);
    });

    it('should recognize DSL schema with array rules', () => {
      const schema: DSLSchema = {
        name: [
          { validate: (v) => (v ? null : 'Required') },
          { validate: (v) => (v.length >= 3 ? null : 'Too short') },
        ],
      };
      expect(dslPlugin.supports(schema)).toBe(true);
    });

    it('should reject invalid schema', () => {
      expect(dslPlugin.supports({})).toBe(false);
      expect(dslPlugin.supports(null)).toBe(false);
      expect(dslPlugin.supports(undefined)).toBe(false);
      expect(dslPlugin.supports({ name: 'invalid' })).toBe(false);
      expect(dslPlugin.supports('string')).toBe(false);
      expect(dslPlugin.supports(123)).toBe(false);
    });
  });

  describe('compileRule', () => {
    it('should compile a simple rule', async () => {
      const rule: DSLRule = {
        validate: (v) => (v ? null : 'Required'),
      };
      const compiled = compileRule(rule);

      const error = await compiled.validate('test');
      expect(error).toBeNull();

      const error2 = await compiled.validate('');
      expect(error2?.message).toBe('Required');
    });

    it('should override message', async () => {
      const rule: DSLRule = {
        validate: (v) => (v ? null : 'Original'),
        message: 'Overridden',
      };
      const compiled = compileRule(rule);

      const error = await compiled.validate('');
      expect(error?.message).toBe('Overridden');
    });

    it('should override code', async () => {
      const rule: DSLRule = {
        validate: (v) => (v ? null : 'Error'),
        code: 'custom_code',
      };
      const compiled = compileRule(rule);

      const error = await compiled.validate('');
      expect(error?.code).toBe('custom_code');
    });

    it('should handle async validation', async () => {
      const rule: DSLRule = {
        validate: async (v) => {
          await new Promise((r) => setTimeout(r, 10));
          return v ? null : 'Required';
        },
        async: true,
      };
      const compiled = compileRule(rule);

      const error = await compiled.validate('test');
      expect(error).toBeNull();
    });

    it('should handle retry option', async () => {
      let attempts = 0;
      const rule: DSLRule = {
        validate: () => {
          attempts++;
          return attempts >= 3 ? null : 'Error';
        },
        options: { retry: 3 },
      };
      const compiled = compileRule(rule);

      const error = await compiled.validate('');
      expect(error).toBeNull();
      expect(attempts).toBe(3);
    });
  });

  describe('compileSchema', () => {
    it('should compile schema with single rules', () => {
      const schema: DSLSchema = {
        name: { validate: (v) => (v ? null : 'Required') },
      };
      const compiled = compileSchema(schema);

      expect(compiled.name).toHaveLength(1);
    });

    it('should compile schema with array rules', () => {
      const schema: DSLSchema = {
        name: [
          { validate: (v) => (v ? null : 'Required') },
          { validate: (v) => (v.length >= 3 ? null : 'Short') },
        ],
      };
      const compiled = compileSchema(schema);

      expect(compiled.name).toHaveLength(2);
    });

    it('should compile schema with multiple fields', () => {
      const schema: DSLSchema = {
        name: { validate: (v) => (v ? null : 'Required') },
        email: { validate: (v) => (v?.includes('@') ? null : 'Invalid') },
      };
      const compiled = compileSchema(schema);

      expect(compiled.name).toBeDefined();
      expect(compiled.email).toBeDefined();
    });
  });

  describe('validate()', () => {
    it('should pass valid data', async () => {
      const validator = dslPlugin.create({
        name: { validate: (v) => (v ? null : 'Required') },
      });

      const result = await validator.validate({ name: 'Test' });
      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should return errors for invalid data', async () => {
      const validator = dslPlugin.create({
        name: { validate: (v) => (v ? null : 'Required') },
      });

      const result = await validator.validate({ name: '' });
      expect(result.fieldErrors.name).toBeDefined();
    });

    it('should stop on first error (not validate further rules)', async () => {
      const validator = dslPlugin.create({
        name: [
          { validate: (v) => (v ? null : 'Required') },
          { validate: (v) => (v.length >= 3 ? null : 'Short') },
        ],
      });

      const result = await validator.validate({ name: '' });

      // Only first error
      expect(result.fieldErrors.name?.message).toBe('Required');
    });

    it('should handle multiple field errors', async () => {
      const validator = dslPlugin.create({
        name: { validate: (v) => (v ? null : 'Required') },
        email: { validate: (v) => (v?.includes('@') ? null : 'Invalid email') },
      });

      const result = await validator.validate({ name: '', email: 'invalid' });

      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
    });

    it('should handle async validation', async () => {
      const validator = dslPlugin.create({
        username: {
          validate: async (v) => {
            await new Promise((r) => setTimeout(r, 10));
            return v === 'taken' ? 'Username taken' : null;
          },
          async: true,
        },
      });

      const result = await validator.validate({ username: 'taken' });
      expect(result.fieldErrors.username).toBeDefined();
    });

    it('should handle optional fields', async () => {
      const validator = dslPlugin.create({
        name: { validate: (v) => (v ? null : 'Required') },
      });

      // Empty object means field is undefined, which fails validation
      const result = await validator.validate({});
      expect(result.fieldErrors.name).toBeDefined();
    });

    it('should handle empty schema', async () => {
      const validator = dslPlugin.create({});

      const result = await validator.validate({ name: '' });
      expect(result).toEqual({ fieldErrors: {} });
    });
  });

  describe('validateField()', () => {
    it('should return error for invalid email', async () => {
      const validator = dslPlugin.create({
        email: { validate: (v) => (v?.includes('@') ? null : 'Invalid') },
      });

      const error = await validator.validateField('email', 'invalid', { email: 'invalid' });
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Invalid');
    });

    it('should return null for valid field', async () => {
      const validator = dslPlugin.create({
        email: { validate: (v) => (v?.includes('@') ? null : 'Invalid') },
      });

      const error = await validator.validateField('email', 'valid@example.com', { email: 'valid@example.com' });
      expect(error).toBeNull();
    });

    it('should return null for unknown field', async () => {
      const validator = dslPlugin.create({
        email: { validate: (v) => (v?.includes('@') ? null : 'Invalid') },
      });

      const error = await validator.validateField('unknown', 'value', {});
      expect(error).toBeNull();
    });

    it('should return error for cross-field validation', async () => {
      const validator = dslPlugin.create({
        password: {
          validate: (v, allValues) => {
            return v === allValues?.confirmPassword ? null : 'Passwords do not match';
          },
        },
      });

      const error = await validator.validateField(
        'password',
        'pass123',
        { password: 'pass123', confirmPassword: 'pass456' }
      );
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Passwords do not match');
    });
  });

  describe('integration with registry', () => {
    it('should be creatable from registry', async () => {
      defaultSchemaRegistry.register('dsl', dslPlugin);

      const validator = defaultSchemaRegistry.create('dsl', {
        name: { validate: (v) => (v ? null : 'Required') },
      });

      expect(validator).toBeDefined();

      const result = await validator!.validate({ name: 'Test' });
      expect(result.fieldErrors).toEqual({});
    });

    it('should work with createForm integration', () => {
      defaultSchemaRegistry.register('dsl', dslPlugin);

      const validator = defaultSchemaRegistry.create('dsl', {
        name: { validate: (v) => (v ? null : 'Required') },
      });

      expect(validator).toBeDefined();
      expect(typeof validator?.validate).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle validation that throws', async () => {
      const validator = dslPlugin.create({
        name: {
          validate: () => {
            throw new Error('Validation error');
          },
        },
      });

      await expect(validator.validate({ name: 'test' })).rejects.toThrow('Validation error');
    });

    it('should handle null values', async () => {
      const validator = dslPlugin.create({
        name: { validate: (v) => (v ? null : 'Required') },
      });

      const result = await validator.validate({ name: null });
      expect(result.fieldErrors.name).toBeDefined();
    });

    it('should handle undefined values', async () => {
      const validator = dslPlugin.create({
        name: { validate: (v) => (v ? null : 'Required') },
      });

      const result = await validator.validate({ name: undefined });
      expect(result.fieldErrors.name).toBeDefined();
    });
  });
});

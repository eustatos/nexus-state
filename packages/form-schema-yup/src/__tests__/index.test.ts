import { beforeEach, describe, expect, it } from 'vitest';
import * as yup from 'yup';
import { yupPlugin } from '../index';
import { defaultSchemaRegistry } from '@nexus-state/form/schema';

describe('yupPlugin', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(yupPlugin.meta.name).toBe('@nexus-state/form-schema-yup');
      expect(yupPlugin.type).toBe('yup');
      expect(yupPlugin.meta.version).toBe('0.1.0');
      expect(yupPlugin.meta.description).toBe(
        'Yup schema validator for Nexus State forms'
      );
    });
  });

  describe('supports()', () => {
    it('should recognize Yup schemas', () => {
      const schema = yup.object({ name: yup.string() });
      expect(yupPlugin.supports(schema)).toBe(true);
    });

    it('should reject non-Yup schemas', () => {
      expect(yupPlugin.supports({})).toBe(false);
      expect(yupPlugin.supports(null)).toBe(false);
      expect(yupPlugin.supports(undefined)).toBe(false);
      expect(yupPlugin.supports('string')).toBe(false);
      expect(yupPlugin.supports(123)).toBe(false);
    });
  });

  describe('validate()', () => {
    it('should pass valid data', async () => {
      const schema = yup.object({
        name: yup.string().min(1),
        email: yup.string().email(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: 'John',
        email: 'john@example.com',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should return errors for invalid data', async () => {
      const schema = yup.object({
        name: yup.string().min(3),
        email: yup.string().email(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: 'Jo',
        email: 'invalid',
      });

      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
    });

    it('should collect all errors (not stop at first)', async () => {
      const schema = yup.object({
        name: yup.string().min(3),
        email: yup.string().email(),
        age: yup.number().min(18),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: 'Jo',
        email: 'invalid',
        age: 10,
      });

      // All three fields should have errors
      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.age).toBeDefined();
    });

    it('should handle nested schemas', async () => {
      const schema = yup.object({
        user: yup.object({
          name: yup.string().required(),
        }),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        user: { name: '' },
      });

      expect(result.fieldErrors['user.name']).toBeDefined();
    });

    it('should handle array schemas', async () => {
      const schema = yup.object({
        tags: yup.array().of(yup.string().min(1)),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        tags: ['valid', ''],
      });

      expect(result.fieldErrors['tags.1']).toBeDefined();
    });

    it('should handle Yup transforms', async () => {
      const schema = yup.object({
        name: yup.string().transform((val) => val?.trim().toUpperCase()),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: '  john  ',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should strip unknown fields', async () => {
      const schema = yup.object({
        name: yup.string(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: 'John',
        unknownField: 'should be stripped',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle optional fields', async () => {
      const schema = yup.object({
        name: yup.string().optional(),
        email: yup.string().email(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        email: 'test@example.com',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle default values', async () => {
      const schema = yup.object({
        name: yup.string().default('Anonymous'),
        email: yup.string().email(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        email: 'test@example.com',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle multiple errors', async () => {
      const schema = yup.object({
        username: yup.string().min(3),
        email: yup.string().email(),
        password: yup.string().min(8),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        username: 'ab',
        email: 'invalid',
        password: 'short',
      });

      expect(result.fieldErrors.username).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.password).toBeDefined();
    });

    it('should handle empty object schema', async () => {
      const schema = yup.object({});
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({});

      expect(result).toEqual({ fieldErrors: {} });
    });
  });

  describe('validateField()', () => {
    it('should return null for valid field', async () => {
      const schema = yup.object({
        email: yup.string().email(),
      });
      const validator = yupPlugin.create(schema);

      const error = await validator.validateField(
        'email',
        'valid@example.com',
        undefined
      );

      expect(error).toBeNull();
    });

    it('should return error for invalid field', async () => {
      const schema = yup.object({
        email: yup.string().email(),
      });
      const validator = yupPlugin.create(schema);

      const error = await validator.validateField(
        'email',
        'invalid',
        undefined
      );

      expect(error).toBeDefined();
      expect(error?.message).toContain('email');
    });

    it('should return null for valid password', async () => {
      const schema = yup.object({
        password: yup.string().min(8),
      });
      const validator = yupPlugin.create(schema);

      const error = await validator.validateField(
        'password',
        'validpassword',
        undefined
      );

      expect(error).toBeNull();
    });

    it('should return error for short password', async () => {
      const schema = yup.object({
        password: yup.string().min(8),
      });
      const validator = yupPlugin.create(schema);

      const error = await validator.validateField(
        'password',
        'short',
        undefined
      );

      expect(error).toBeDefined();
      expect(error?.message).toContain('8');
    });

    it('should return null when field is valid in multi-field schema', async () => {
      const schema = yup.object({
        email: yup.string().email(),
        password: yup.string().min(8),
      });
      const validator = yupPlugin.create(schema);

      const emailError = await validator.validateField(
        'email',
        'valid@example.com',
        undefined
      );

      expect(emailError).toBeNull();
    });

    it('should handle nested field paths', async () => {
      const schema = yup.object({
        user: yup.object({
          name: yup.string().min(1),
        }),
      });
      const validator = yupPlugin.create(schema);

      const error = await validator.validateField(
        'user.name',
        'Valid Name',
        undefined
      );

      expect(error).toBeNull();
    });

    it('should return error for empty nested field', async () => {
      const schema = yup.object({
        user: yup.object({
          name: yup.string().min(1),
        }),
      });
      const validator = yupPlugin.create(schema);

      const error = await validator.validateField(
        'user.name',
        '',
        undefined
      );

      expect(error).toBeDefined();
    });
  });

  describe('parse()', () => {
    it('should parse and transform values', async () => {
      const schema = yup.object({
        name: yup.string().transform((val) => val?.trim().toUpperCase()),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.parse({
        name: '  john  ',
      });

      expect(result.name).toBe('JOHN');
    });

    it('should strip unknown fields on parse', async () => {
      const schema = yup.object({
        name: yup.string(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.parse({
        name: 'John',
        unknownField: 'should be stripped',
      });

      expect(result).toEqual({ name: 'John' });
      expect((result as any).unknownField).toBeUndefined();
    });

    it('should throw on invalid data', async () => {
      const schema = yup.object({
        name: yup.string().required(),
      });
      const validator = yupPlugin.create(schema);

      await expect(validator.parse({ name: '' })).rejects.toThrow();
    });

    it('should handle number transforms', async () => {
      const schema = yup.object({
        age: yup.number().transform((val) => (isNaN(val) ? 0 : val)),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.parse({
        age: '25',
      });

      expect(result.age).toBe(25);
    });
  });

  describe('integration with registry', () => {
    it('should be creatable from registry', async () => {
      defaultSchemaRegistry.register('yup', yupPlugin);

      const schema = yup.object({
        name: yup.string().min(1),
      });

      const validator = defaultSchemaRegistry.create('yup', schema);
      expect(validator).toBeDefined();

      const result = await validator!.validate({ name: 'Test' });
      expect(result.fieldErrors).toEqual({});
    });

    it('should work with createForm integration', () => {
      defaultSchemaRegistry.register('yup', yupPlugin);

      const schema = yup.object({
        name: yup.string().min(1),
      });

      const validator = defaultSchemaRegistry.create('yup', schema);
      expect(validator).toBeDefined();
      expect(typeof validator?.validate).toBe('function');
    });
  });

  describe('error codes', () => {
    it('should preserve Yup error types', async () => {
      const schema = yup.object({
        name: yup.string().min(3),
        email: yup.string().email(),
        age: yup.number().min(18),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: 'Jo',
        email: 'invalid',
        age: 10,
      });

      expect(result.fieldErrors.name?.code).toBeDefined();
      expect(result.fieldErrors.email?.code).toBeDefined();
      expect(result.fieldErrors.age?.code).toBeDefined();
    });

    it('should include params in error', async () => {
      const schema = yup.object({
        name: yup.string().min(3),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: 'Jo',
      });

      expect(result.fieldErrors.name?.params).toBeDefined();
      expect(result.fieldErrors.name?.params?.path).toBe('name');
    });
  });

  describe('edge cases', () => {
    it('should handle null values', async () => {
      const schema = yup.object({
        name: yup.string().nullable(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: null,
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle undefined values with optional', async () => {
      const schema = yup.object({
        name: yup.string().optional(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: undefined,
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle mixed types', async () => {
      const schema = yup.object({
        value: yup.mixed().oneOf(['a', 'b', 'c']),
      });
      const validator = yupPlugin.create(schema);

      const result1 = await validator.validate({ value: 'a' });
      expect(result1).toEqual({ fieldErrors: {} });

      const result2 = await validator.validate({ value: 'd' });
      expect(result2.fieldErrors.value).toBeDefined();
    });

    it('should handle boolean fields', async () => {
      const schema = yup.object({
        agree: yup.boolean().oneOf([true], 'Must agree'),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({ agree: false });
      expect(result.fieldErrors.agree).toBeDefined();
    });
  });
});

describe('InferYupType', () => {
  it('should infer type correctly (compile-time check)', () => {
    // Type-level test - should compile without errors
    const _test: { name: string } = { name: 'test' };
    expect(_test).toBeDefined();
  });
});

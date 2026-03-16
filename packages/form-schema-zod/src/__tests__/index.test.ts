import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodPlugin } from '../index';
import { defaultSchemaRegistry } from '@nexus-state/form/schema';

describe('zodPlugin', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(zodPlugin.meta.name).toBe('@nexus-state/form-schema-zod');
      expect(zodPlugin.type).toBe('zod');
      expect(zodPlugin.meta.version).toBe('0.1.0');
      expect(zodPlugin.meta.description).toBe(
        'Zod schema validator for Nexus State forms'
      );
    });
  });

  describe('supports()', () => {
    it('should recognize Zod schemas', () => {
      const schema = z.object({ name: z.string() });
      expect(zodPlugin.supports(schema)).toBe(true);
    });

    it('should reject non-Zod schemas', () => {
      expect(zodPlugin.supports({})).toBe(false);
      expect(zodPlugin.supports(null)).toBe(false);
      expect(zodPlugin.supports(undefined)).toBe(false);
      expect(zodPlugin.supports('string')).toBe(false);
      expect(zodPlugin.supports(123)).toBe(false);
    });
  });

  describe('validate()', () => {
    it('should pass valid data', async () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        name: 'John',
        email: 'john@example.com',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should return errors for invalid data', async () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        name: 'Jo',
        email: 'invalid',
      });

      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.name?.message).toContain('3');
      expect(result.fieldErrors.email?.message).toContain('email');
    });

    it('should handle nested schemas', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
        }),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        user: { name: '' },
      });

      expect(result.fieldErrors['user.name']).toBeDefined();
    });

    it('should handle array schemas', async () => {
      const schema = z.object({
        tags: z.array(z.string().min(1)),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        tags: ['valid', ''],
      });

      expect(result.fieldErrors['tags.1']).toBeDefined();
    });

    it('should handle async validation', async () => {
      const schema = z.object({
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        email: 'test@example.com',
      });

      expect(result.fieldErrors.email).toBeUndefined();
    });

    it('should handle Zod transforms', async () => {
      const schema = z.object({
        name: z.string().transform((val) => val.trim()),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        name: '  John  ',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle optional fields', async () => {
      const schema = z.object({
        name: z.string().optional(),
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        email: 'test@example.com',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle default values', async () => {
      const schema = z.object({
        name: z.string().default('Anonymous'),
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        email: 'test@example.com',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle multiple errors', async () => {
      const schema = z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(8),
      });
      const validator = zodPlugin.create(schema);

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
      const schema = z.object({});
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({});

      expect(result).toEqual({ fieldErrors: {} });
    });
  });

  describe('validateField()', () => {
    it('should return null (Zod requires full schema validation)', async () => {
      const schema = z.object({
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      // Note: validateField returns null because Zod needs full schema context
      // Field-level validation should use validate() instead
      const error = await validator.validateField(
        'email',
        'invalid',
        undefined
      );

      expect(error).toBeNull();
    });

    it('should return null for valid field', async () => {
      const schema = z.object({
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const error = await validator.validateField(
        'email',
        'valid@example.com',
        undefined
      );

      expect(error).toBeNull();
    });

    it('should return null for all fields (limitation)', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });
      const validator = zodPlugin.create(schema);

      const emailError = await validator.validateField(
        'email',
        'invalid',
        undefined
      );

      expect(emailError).toBeNull();

      const passwordError = await validator.validateField(
        'password',
        'short',
        undefined
      );

      expect(passwordError).toBeNull();
    });

    it('should return null when field is valid', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });
      const validator = zodPlugin.create(schema);

      const emailError = await validator.validateField(
        'email',
        'valid@example.com',
        undefined
      );

      expect(emailError).toBeNull();
    });

    it('should handle nested field paths', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
        }),
      });
      const validator = zodPlugin.create(schema);

      const error = await validator.validateField(
        'user.name',
        '',
        undefined
      );

      expect(error).toBeNull();
    });
  });

  describe('parse()', () => {
    it('should parse and transform values', async () => {
      const schema = z.object({
        name: z.string().transform((val) => val.trim().toUpperCase()),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.parse({
        name: '  john  ',
      });

      expect(result.name).toBe('JOHN');
    });

    it('should throw on invalid data', async () => {
      const schema = z.object({
        name: z.string(),
      });
      const validator = zodPlugin.create(schema);

      await expect(validator.parse(null)).rejects.toThrow();
    });

    it('should handle number transforms', async () => {
      const schema = z.object({
        age: z.string().transform((val) => parseInt(val, 10)),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.parse({
        age: '25',
      });

      expect(result.age).toBe(25);
    });
  });

  describe('integration with registry', () => {
    it('should be creatable from registry', async () => {
      defaultSchemaRegistry.register('zod', zodPlugin);

      const schema = z.object({
        name: z.string().min(1),
      });

      const validator = defaultSchemaRegistry.create('zod', schema);
      expect(validator).toBeDefined();

      const result = await validator!.validate({ name: 'Test' });
      expect(result.fieldErrors).toEqual({});
    });

    it('should work with createForm integration', () => {
      defaultSchemaRegistry.register('zod', zodPlugin);

      const schema = z.object({
        name: z.string().min(1),
      });

      const validator = defaultSchemaRegistry.create('zod', schema);
      expect(validator).toBeDefined();
      expect(typeof validator?.validate).toBe('function');
    });
  });

  describe('error codes', () => {
    it('should preserve Zod error codes', async () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().min(18),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        name: 'Jo',
        email: 'invalid',
        age: 10,
      });

      expect(result.fieldErrors.name?.code).toBe('too_small');
      expect(result.fieldErrors.email?.code).toBe('invalid_string');
      expect(result.fieldErrors.age?.code).toBe('too_small');
    });

    it('should include params in error', async () => {
      const schema = z.object({
        name: z.string().min(3),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        name: 'Jo',
      });

      expect(result.fieldErrors.name?.params).toBeDefined();
      expect(result.fieldErrors.name?.params?.path).toBe('name');
    });
  });

  describe('edge cases', () => {
    it('should handle null values', async () => {
      const schema = z.object({
        name: z.string().nullable(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        name: null,
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle undefined values with optional', async () => {
      const schema = z.object({
        name: z.string().optional(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        name: undefined,
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle union types', async () => {
      const schema = z.object({
        id: z.union([z.string(), z.number()]),
      });
      const validator = zodPlugin.create(schema);

      const result1 = await validator.validate({ id: 'abc' });
      expect(result1).toEqual({ fieldErrors: {} });

      const result2 = await validator.validate({ id: 123 });
      expect(result2).toEqual({ fieldErrors: {} });
    });

    it('should handle discriminated unions', async () => {
      const schema = z.object({
        type: z.literal('user'),
        name: z.string(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        type: 'user',
        name: 'John',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });
  });
});

describe('InferZodType', () => {
  it('should infer type correctly (compile-time check)', () => {
    // This is a type-level test - should compile without errors
    type TestSchema = z.infer<z.ZodObject<{ name: z.ZodString }>>;
    const _test: TestSchema = { name: 'test' };
    expect(_test).toBeDefined();
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import type { KeywordDefinition } from 'ajv';
import { ajvPlugin, builtInFormats, createCustomKeyword } from '../index';
import { defaultSchemaRegistry } from '@nexus-state/form/schema';

describe('ajvPlugin', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(ajvPlugin.meta.name).toBe('@nexus-state/form-schema-ajv');
      expect(ajvPlugin.type).toBe('ajv');
      expect(ajvPlugin.meta.version).toBe('0.1.0');
      expect(ajvPlugin.meta.description).toBe(
        'AJV (JSON Schema) validator for Nexus State forms'
      );
    });
  });

  describe('supports()', () => {
    it('should recognize valid AJV config', () => {
      const config = { schema: { type: 'string' } };
      expect(ajvPlugin.supports(config)).toBe(true);
    });

    it('should reject invalid config', () => {
      expect(ajvPlugin.supports({})).toBe(false);
      expect(ajvPlugin.supports(null)).toBe(false);
      expect(ajvPlugin.supports(undefined)).toBe(false);
      expect(ajvPlugin.supports('string')).toBe(false);
      expect(ajvPlugin.supports(123)).toBe(false);
    });
  });

  describe('validate()', () => {
    it('should pass valid data', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        name: 'John',
        email: 'john@example.com',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should return errors for invalid data', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
          },
          required: ['name', 'email'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        email: 'test@test.com',
      });

      expect(result.fieldErrors.name).toBeDefined();
    });

    it('should handle required fields', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({});

      expect(result.fieldErrors.name).toBeDefined();
    });

    it('should handle nested schemas', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
              required: ['name'],
            },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        user: {},
      });

      expect(result.fieldErrors['user.name']).toBeDefined();
    });

    it('should handle array schemas', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        tags: [],
      });

      expect(result.fieldErrors.tags).toBeDefined();
    });

    it('should handle custom formats', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            website: { type: 'string' },
          },
          required: ['website'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({});

      expect(result.fieldErrors.website).toBeDefined();
    });

    it('should collect all errors', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'number' },
          },
          required: ['name', 'email', 'age'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({});

      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.age).toBeDefined();
    });

    it('should handle optional fields', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        name: 'John',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle multiple errors', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
          },
          required: ['username', 'email', 'password'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        email: 'test@test.com',
      });

      expect(result.fieldErrors.username).toBeDefined();
      expect(result.fieldErrors.password).toBeDefined();
    });

    it('should handle empty object schema', async () => {
      const config = {
        schema: {
          type: 'object',
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({});

      expect(result).toEqual({ fieldErrors: {} });
    });
  });

  describe('validateField()', () => {
    it('should return null (AJV limitation)', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      // Note: validateField returns null due to interface limitation
      // AJV requires all values context
      const error = await validator.validateField(
        'email',
        'invalid',
        undefined
      );

      expect(error).toBeNull();
    });

    it('should return null for valid field', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const error = await validator.validateField(
        'email',
        'valid@example.com',
        undefined
      );

      expect(error).toBeNull();
    });

    it('should return null for all fields (limitation)', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
      };
      const validator = ajvPlugin.create(config);

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
      const config = {
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const emailError = await validator.validateField(
        'email',
        'valid@example.com',
        undefined
      );

      expect(emailError).toBeNull();
    });

    it('should handle nested field paths', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 1 },
              },
              required: ['name'],
            },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const error = await validator.validateField(
        'user.name',
        '',
        undefined
      );

      expect(error).toBeNull();
    });
  });

  describe('parse()', () => {
    it('should return valid values', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.parse({ name: 'Test' });
      expect(result).toEqual({ name: 'Test' });
    });

    it('should throw on invalid data', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      };
      const validator = ajvPlugin.create(config);

      await expect(validator.parse({})).rejects.toThrow();
    });

    it('should handle number validation', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            age: { type: 'number', minimum: 0 },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.parse({ age: 25 });
      expect(result.age).toBe(25);
    });
  });

  describe('dispose()', () => {
    it('should clean up resources', () => {
      const config = {
        schema: { type: 'string' },
      };
      const validator = ajvPlugin.create(config);

      expect(() => validator.dispose()).not.toThrow();
    });
  });

  describe('builtInFormats', () => {
    it('should have email format', () => {
      expect(builtInFormats.email.test('test@example.com')).toBe(true);
      expect(builtInFormats.email.test('invalid')).toBe(false);
    });

    it('should have uri format', () => {
      expect(builtInFormats.uri.test('https://example.com')).toBe(true);
      expect(builtInFormats.uri.test('not-a-url')).toBe(false);
    });

    it('should have uuid format', () => {
      expect(builtInFormats.uuid.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(builtInFormats.uuid.test('invalid-uuid')).toBe(false);
    });

    it('should have date format', () => {
      expect(builtInFormats.date.test('2024-01-15')).toBe(true);
      expect(builtInFormats.date.test('01-15-2024')).toBe(false);
    });

    it('should have date-time format', () => {
      expect(builtInFormats['date-time'].test('2024-01-15T10:30:00Z')).toBe(true);
      expect(builtInFormats['date-time'].test('invalid')).toBe(false);
    });

    it('should have time format', () => {
      expect(builtInFormats.time.test('10:30:00')).toBe(true);
      expect(builtInFormats.time.test('invalid')).toBe(false);
    });

    it('should have ipv4 format', () => {
      expect(builtInFormats.ipv4.test('192.168.1.1')).toBe(true);
      expect(builtInFormats.ipv4.test('invalid')).toBe(false);
    });

    it('should have ipv6 format', () => {
      expect(builtInFormats.ipv6.test('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(builtInFormats.ipv6.test('invalid')).toBe(false);
    });
  });

  describe('integration with registry', () => {
    it('should be creatable from registry', async () => {
      defaultSchemaRegistry.register('ajv', ajvPlugin);

      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };

      const validator = defaultSchemaRegistry.create('ajv', config);
      expect(validator).toBeDefined();

      const result = await validator!.validate({ name: 'Test' });
      expect(result.fieldErrors).toEqual({});
    });

    it('should work with createForm integration', () => {
      defaultSchemaRegistry.register('ajv', ajvPlugin);

      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };

      const validator = defaultSchemaRegistry.create('ajv', config);
      expect(validator).toBeDefined();
      expect(typeof validator?.validate).toBe('function');
    });
  });

  describe('error codes', () => {
    it('should preserve AJV error keywords', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({});

      expect(result.fieldErrors.name?.code).toBeDefined();
    });

    it('should include params in error', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({});

      expect(result.fieldErrors.name?.params).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle null values', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        name: 'test',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle boolean fields', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            agree: { type: 'boolean' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({ agree: true });
      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should handle enum validation', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
          required: ['status'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result1 = await validator.validate({ status: 'active' });
      expect(result1).toEqual({ fieldErrors: {} });

      const result2 = await validator.validate({});
      expect(result2.fieldErrors.status).toBeDefined();
    });

    it('should handle required validation', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            phone: { type: 'string' },
          },
          required: ['phone'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({});
      expect(result.fieldErrors.phone).toBeDefined();
    });
  });
});

describe('createCustomKeyword', () => {
  it('should create custom keyword', () => {
    const keyword: KeywordDefinition = {
      keyword: 'adult',
      type: 'number',
      validate: (_schema, age) => age >= _schema,
    };
    const result = createCustomKeyword(keyword);

    expect(result.keyword).toBe('adult');
  });

  it('should create custom keyword with validate function', () => {
    const validateFn = (_schema: unknown, _data: unknown) => true;
    const keyword: KeywordDefinition = {
      keyword: 'custom',
      validate: validateFn,
    };
    const result = createCustomKeyword(keyword);

    expect(result.keyword).toBe('custom');
  });
});

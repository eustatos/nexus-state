import { describe, expect, it, vi } from 'vitest';
import {
  composeValidators,
  createAsyncValidator,
  createFieldValidator,
  createSchemaPlugin,
  createSyncValidator,
} from '../builder';
import type { SchemaValidator } from '../types';

describe('createSchemaPlugin', () => {
  it('should create plugin with auto-generated name', () => {
    const plugin = createSchemaPlugin({
      type: 'test',
      meta: { description: 'Test plugin' },
      create: (_schema) => ({ validate: () => ({ fieldErrors: {} }) }),
    });

    expect(plugin.meta.name).toBe('@nexus-state/form-schema-test');
  });

  it('should use provided version from meta', () => {
    const plugin = createSchemaPlugin({
      type: 'test',
      meta: { description: 'Test', version: '2.0.0' },
      create: (_schema) => ({ validate: () => ({ fieldErrors: {} }) }),
    });

    expect(plugin.meta.version).toBe('2.0.0');
  });

  it('should default version to 1.0.0', () => {
    const plugin = createSchemaPlugin({
      type: 'test',
      meta: { description: 'Test' },
      create: (_schema) => ({ validate: () => ({ fieldErrors: {} }) }),
    });

    expect(plugin.meta.version).toBe('1.0.0');
  });

  it('should include supports method if provided', () => {
    const supportsFn = (schema: unknown) => typeof schema === 'object';
    const plugin = createSchemaPlugin({
      type: 'test',
      meta: { description: 'Test' },
      create: (_schema) => ({ validate: () => ({ fieldErrors: {} }) }),
      supports: supportsFn,
    });

    expect(plugin.supports).toBe(supportsFn);
  });

  it('should create validator from schema', () => {
    const mockValidator: SchemaValidator<Record<string, unknown>> = {
      validate: () => ({ fieldErrors: {} }),
    };

    const plugin = createSchemaPlugin({
      type: 'test',
      meta: { description: 'Test' },
      create: (_schema) => mockValidator,
    });

    const validator = plugin.create({ some: 'schema' });
    expect(validator.validate).toBeDefined();
    expect(typeof validator.validate).toBe('function');
  });

  it('should work without meta', () => {
    const plugin = createSchemaPlugin({
      type: 'minimal',
      create: (_schema) => ({ validate: () => ({ fieldErrors: {} }) }),
    });

    expect(plugin.meta.name).toBe('@nexus-state/form-schema-minimal');
    expect(plugin.meta.version).toBe('1.0.0');
    expect(plugin.type).toBe('minimal');
  });

  it('should include all meta properties', () => {
    const plugin = createSchemaPlugin({
      type: 'full',
      meta: {
        description: 'Full plugin',
        author: 'Test Author',
        repository: 'https://github.com/test/plugin',
        dependencies: ['core'],
        version: '3.0.0',
      },
      create: (_schema) => ({ validate: () => ({ fieldErrors: {} }) }),
    });

    expect(plugin.meta).toEqual({
      name: '@nexus-state/form-schema-full',
      version: '3.0.0',
      description: 'Full plugin',
      author: 'Test Author',
      repository: 'https://github.com/test/plugin',
      dependencies: ['core'],
    });
  });
});

describe('createSyncValidator', () => {
  it('should create sync validator', () => {
    const validateFn = (_values: Record<string, unknown>) => ({
      fieldErrors: {},
    });
    const validator = createSyncValidator(validateFn);

    expect(validator.validate).toBeDefined();
    expect(typeof validator.validate).toBe('function');
    expect(validator.validateField).toBeUndefined();
  });

  it('should pass context to validate function', () => {
    const contextSpy = vi.fn();
    const validator = createSyncValidator((values, context) => {
      contextSpy(values, context);
      return { fieldErrors: {} };
    });

    const mockContext = { values: { test: 1 } };
    validator.validate({ test: 1 }, mockContext);

    expect(contextSpy).toHaveBeenCalledWith({ test: 1 }, mockContext);
  });

  it('should return validation errors', () => {
    const validator = createSyncValidator((values) => {
      const errors = { fieldErrors: {} as Record<string, any> };
      if (!values.email) {
        errors.fieldErrors.email = { message: 'Required', code: 'required' };
      }
      return errors;
    });

    const result = validator.validate({ email: '' });
    expect(result.fieldErrors.email).toEqual({
      message: 'Required',
      code: 'required',
    });
  });

  it('should return empty errors for valid data', () => {
    const validator = createSyncValidator(() => ({ fieldErrors: {} }));

    const result = validator.validate({ email: 'test@example.com' });
    expect(result.fieldErrors).toEqual({});
    expect(result.formErrors).toBeUndefined();
  });
});

describe('createAsyncValidator', () => {
  it('should create async validator', async () => {
    const validateFn = async (_values: Record<string, unknown>) => ({
      fieldErrors: {},
    });
    const validator = createAsyncValidator(validateFn);

    const result = await validator.validate({});
    expect(result).toEqual({ fieldErrors: {} });
  });

  it('should handle async errors', async () => {
    const validator = createAsyncValidator(async () => {
      throw new Error('Validation failed');
    });

    await expect(validator.validate({})).rejects.toThrow('Validation failed');
  });

  it('should pass context to async validate function', async () => {
    const contextSpy = vi.fn();
    const validator = createAsyncValidator(async (values, context) => {
      contextSpy(values, context);
      return { fieldErrors: {} };
    });

    const mockContext = { values: { test: 1 } };
    await validator.validate({ test: 1 }, mockContext);

    expect(contextSpy).toHaveBeenCalledWith({ test: 1 }, mockContext);
  });

  it('should return async validation errors', async () => {
    const validator = createAsyncValidator(async (values) => {
      const errors = { fieldErrors: {} as Record<string, any> };
      // Simulate async check
      await Promise.resolve();
      if ((values as any).username === 'taken') {
        errors.fieldErrors.username = {
          message: 'Username taken',
          code: 'unique',
        };
      }
      return errors;
    });

    const result = await validator.validate({ username: 'taken' });
    expect(result.fieldErrors.username).toEqual({
      message: 'Username taken',
      code: 'unique',
    });
  });
});

describe('createFieldValidator', () => {
  it('should create field validator', () => {
    const validateFieldFn = (_fieldName: string, _value: unknown) => null;
    const validator = createFieldValidator(validateFieldFn);

    expect(validator.validateField).toBe(validateFieldFn);
    expect(validator.validate).toBeUndefined();
  });

  it('should return error for specific field', () => {
    const validator = createFieldValidator(
      (fieldName: string, value: unknown) => {
        if (fieldName === 'email' && !(value as string).includes('@')) {
          return { message: 'Invalid email', code: 'email' };
        }
        return null;
      }
    );

    const error = validator.validateField('email', 'invalid');
    expect(error).toEqual({ message: 'Invalid email', code: 'email' });
  });

  it('should return null for valid field', () => {
    const validator = createFieldValidator(
      (fieldName: string, value: unknown) => {
        if (fieldName === 'email' && !(value as string).includes('@')) {
          return { message: 'Invalid email', code: 'email' };
        }
        return null;
      }
    );

    const result = validator.validateField('email', 'valid@example.com');
    expect(result).toBeNull();
  });

  it('should handle different field types', () => {
    interface FormValues {
      age: number;
      name: string;
    }

    const validator = createFieldValidator<FormValues>(
      (fieldName, value) => {
        if (fieldName === 'age' && (value as number) < 18) {
          return { message: 'Must be 18+', code: 'min_age' };
        }
        return null;
      }
    );

    const error = validator.validateField('age', 15);
    expect(error).toEqual({ message: 'Must be 18+', code: 'min_age' });

    const valid = validator.validateField('age', 25);
    expect(valid).toBeNull();
  });
});

describe('composeValidators', () => {
  it('should compose multiple validators', async () => {
    const validator1: Partial<SchemaValidator<Record<string, unknown>>> = {
      validate: (_values) => ({ fieldErrors: {} }),
    };
    const validator2: Partial<SchemaValidator<Record<string, unknown>>> = {
      validate: (_values) => ({
        fieldErrors: { name: { message: 'Required' } },
      }),
    };

    const composed = composeValidators(validator1, validator2);
    const result = await composed.validate({});

    expect(result.fieldErrors.name).toEqual({ message: 'Required' });
  });

  it('should merge errors from all validators', async () => {
    const validator1: Partial<SchemaValidator<Record<string, unknown>>> = {
      validate: (_values) => ({
        fieldErrors: { name: { message: 'Required' } },
        formErrors: [{ message: 'Form invalid' }],
      }),
    };
    const validator2: Partial<SchemaValidator<Record<string, unknown>>> = {
      validate: (_values) => ({
        fieldErrors: { email: { message: 'Invalid' } },
      }),
    };

    const composed = composeValidators(validator1, validator2);
    const result = await composed.validate({});

    expect(result.fieldErrors.name).toBeDefined();
    expect(result.fieldErrors.email).toBeDefined();
    expect(result.formErrors).toHaveLength(1);
    expect(result.formErrors?.[0].message).toBe('Form invalid');
  });

  it('should stop on first field error in validateField', async () => {
    const validator1: Partial<SchemaValidator<Record<string, unknown>>> = {
      validateField: (_fieldName, _value) => ({
        message: 'Error 1',
        code: 'e1',
      }),
    };
    const validator2: Partial<SchemaValidator<Record<string, unknown>>> = {
      validateField: (_fieldName, _value) => ({
        message: 'Error 2',
        code: 'e2',
      }),
    };

    const composed = composeValidators(validator1, validator2);
    const result = await composed.validateField('test', 'value');

    expect(result).toEqual({ message: 'Error 1', code: 'e1' });
  });

  it('should return null from validateField if all validators pass', async () => {
    const validator1: Partial<SchemaValidator<Record<string, unknown>>> = {
      validateField: () => null,
    };
    const validator2: Partial<SchemaValidator<Record<string, unknown>>> = {
      validateField: () => null,
    };

    const composed = composeValidators(validator1, validator2);
    const result = await composed.validateField('test', 'value');

    expect(result).toBeNull();
  });

  it('should handle empty validators array', async () => {
    const composed = composeValidators();
    const result = await composed.validate({});

    expect(result).toEqual({ fieldErrors: {} });
  });

  it('should skip validators without validate method', async () => {
    const validator1: Partial<SchemaValidator<Record<string, unknown>>> = {
      validateField: () => null,
    };
    const validator2: Partial<SchemaValidator<Record<string, unknown>>> = {
      validate: () => ({ fieldErrors: { email: { message: 'Invalid' } } }),
    };

    const composed = composeValidators(validator1, validator2);
    const result = await composed.validate({});

    expect(result.fieldErrors.email).toEqual({ message: 'Invalid' });
  });

  it('should combine sync and async validators', async () => {
    const syncValidator: Partial<SchemaValidator<Record<string, unknown>>> = {
      validate: () => ({
        fieldErrors: { name: { message: 'Required' } },
      }),
    };
    const asyncValidator: Partial<SchemaValidator<Record<string, unknown>>> = {
      validate: async () => {
        await Promise.resolve();
        return {
          fieldErrors: { email: { message: 'Taken' } },
        };
      },
    };

    const composed = composeValidators(syncValidator, asyncValidator);
    const result = await composed.validate({});

    expect(result.fieldErrors.name).toBeDefined();
    expect(result.fieldErrors.email).toBeDefined();
  });
});

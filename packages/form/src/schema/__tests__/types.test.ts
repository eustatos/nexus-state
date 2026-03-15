import { describe, expect, it } from 'vitest';
import type {
  FieldError,
  SchemaPlugin,
  SchemaPluginMeta,
  SchemaPluginWithMeta,
  SchemaType,
  SchemaValidator,
  ValidationContext,
  ValidationErrors,
} from '../types';

describe('SchemaPlugin types', () => {
  it('should accept valid plugin implementation', () => {
    const mockPlugin: SchemaPlugin<unknown, unknown> = {
      type: 'mock',
      create: () => ({
        validate: () => ({ fieldErrors: {} }),
      }),
    };
    expect(mockPlugin).toBeDefined();
    expect(mockPlugin.type).toBe('mock');
  });

  it('should accept validator with all optional methods', () => {
    const mockValidator: SchemaValidator<Record<string, unknown>> = {
      validate: () => ({ fieldErrors: {} }),
      validateField: () => null,
      parse: (values) => values as Record<string, unknown>,
      dispose: () => {},
    };
    expect(mockValidator).toBeDefined();
    expect(typeof mockValidator.validate).toBe('function');
    expect(typeof mockValidator.validateField).toBe('function');
    expect(typeof mockValidator.parse).toBe('function');
    expect(typeof mockValidator.dispose).toBe('function');
  });

  it('should accept validator with only required methods', () => {
    const minimalValidator: SchemaValidator<Record<string, unknown>> = {
      validate: () => ({ fieldErrors: {} }),
    };
    expect(minimalValidator).toBeDefined();
    expect(typeof minimalValidator.validate).toBe('function');
  });

  it('should accept plugin with supports method', () => {
    const pluginWithSupports: SchemaPlugin<unknown, unknown> = {
      type: 'custom',
      create: () => ({
        validate: () => ({ fieldErrors: {} }),
      }),
      supports: (schema): schema is unknown => {
        return schema !== null && schema !== undefined;
      },
    };
    expect(pluginWithSupports).toBeDefined();
    expect(pluginWithSupports.supports).toBeDefined();
    expect(pluginWithSupports.supports?.({})).toBe(true);
    expect(pluginWithSupports.supports?.(null)).toBe(false);
  });

  it('should accept plugin with version', () => {
    const pluginWithVersion: SchemaPlugin<unknown, unknown> = {
      type: 'versioned',
      version: '1.0.0',
      create: () => ({
        validate: () => ({ fieldErrors: {} }),
      }),
    };
    expect(pluginWithVersion).toBeDefined();
    expect(pluginWithVersion.version).toBe('1.0.0');
  });
});

describe('ValidationErrors', () => {
  it('should accept empty errors', () => {
    const errors: ValidationErrors = { fieldErrors: {} };
    expect(errors.fieldErrors).toEqual({});
  });

  it('should accept field errors with all properties', () => {
    const errors: ValidationErrors = {
      fieldErrors: {
        username: {
          message: 'Required',
          code: 'required',
          params: {},
        },
      },
      formErrors: [{ message: 'Form invalid', code: 'invalid' }],
    };
    expect(errors.fieldErrors.username).toBeDefined();
    expect(errors.fieldErrors.username?.message).toBe('Required');
    expect(errors.fieldErrors.username?.code).toBe('required');
    expect(errors.formErrors).toHaveLength(1);
  });

  it('should accept null field errors', () => {
    const errors: ValidationErrors<{ username: string; email: string }> = {
      fieldErrors: {
        username: null,
        email: { message: 'Invalid email', code: 'email' },
      },
    };
    expect(errors.fieldErrors.username).toBeNull();
    expect(errors.fieldErrors.email).toBeDefined();
  });

  it('should accept errors without formErrors', () => {
    const errors: ValidationErrors = {
      fieldErrors: {
        name: { message: 'Required' },
      },
    };
    expect(errors.fieldErrors.name).toBeDefined();
    expect(errors.formErrors).toBeUndefined();
  });

  it('should accept generic values type', () => {
    interface FormValues {
      firstName: string;
      lastName: string;
      age: number;
    }

    const errors: ValidationErrors<FormValues> = {
      fieldErrors: {
        firstName: { message: 'Required', code: 'required' },
        lastName: null,
        age: { message: 'Must be positive', code: 'min' },
      },
    };
    expect(errors.fieldErrors.firstName?.message).toBe('Required');
    expect(errors.fieldErrors.lastName).toBeNull();
    expect(errors.fieldErrors.age?.code).toBe('min');
  });
});

describe('FieldError', () => {
  it('should accept error with only message', () => {
    const error: FieldError = { message: 'Required' };
    expect(error.message).toBe('Required');
    expect(error.code).toBeUndefined();
    expect(error.params).toBeUndefined();
  });

  it('should accept error with code and params', () => {
    const error: FieldError = {
      message: 'Must be at least {min} characters',
      code: 'min_length',
      params: { min: 5 },
    };
    expect(error.message).toBe('Must be at least {min} characters');
    expect(error.code).toBe('min_length');
    expect(error.params).toEqual({ min: 5 });
  });
});

describe('ValidationContext', () => {
  it('should accept context with only values', () => {
    const context: ValidationContext = {
      values: { username: 'test' },
    };
    expect(context.values).toEqual({ username: 'test' });
    expect(context.fieldName).toBeUndefined();
    expect(context.form).toBeUndefined();
    expect(context.signal).toBeUndefined();
  });

  it('should accept full context', () => {
    const mockForm = { submit: () => {} };
    const mockSignal = new AbortController().signal;

    const context: ValidationContext = {
      values: { username: 'test' },
      fieldName: 'username',
      form: mockForm,
      signal: mockSignal,
    };
    expect(context.values).toEqual({ username: 'test' });
    expect(context.fieldName).toBe('username');
    expect(context.form).toBe(mockForm);
    expect(context.signal).toBe(mockSignal);
  });
});

describe('SchemaPluginMeta', () => {
  it('should accept meta with required fields only', () => {
    const meta: SchemaPluginMeta = {
      name: 'Test Plugin',
      version: '1.0.0',
    };
    expect(meta.name).toBe('Test Plugin');
    expect(meta.version).toBe('1.0.0');
    expect(meta.description).toBeUndefined();
    expect(meta.author).toBeUndefined();
    expect(meta.repository).toBeUndefined();
    expect(meta.dependencies).toBeUndefined();
  });

  it('should accept full meta', () => {
    const meta: SchemaPluginMeta = {
      name: 'Zod Plugin',
      description: 'Zod validation schema plugin',
      version: '2.0.0',
      author: 'Nexus State Team',
      repository: 'https://github.com/nexus-state/zod-plugin',
      dependencies: ['core'],
    };
    expect(meta.name).toBe('Zod Plugin');
    expect(meta.description).toBe('Zod validation schema plugin');
    expect(meta.version).toBe('2.0.0');
    expect(meta.author).toBe('Nexus State Team');
    expect(meta.repository).toBe(
      'https://github.com/nexus-state/zod-plugin'
    );
    expect(meta.dependencies).toEqual(['core']);
  });
});

describe('SchemaPluginWithMeta', () => {
  it('should accept plugin with meta', () => {
    const plugin: SchemaPluginWithMeta<unknown, unknown> = {
      type: 'yup',
      meta: {
        name: 'Yup Plugin',
        version: '1.0.0',
      },
      create: () => ({
        validate: () => ({ fieldErrors: {} }),
      }),
    };
    expect(plugin.type).toBe('yup');
    expect(plugin.meta.name).toBe('Yup Plugin');
    expect(plugin.meta.version).toBe('1.0.0');
  });

  it('should accept plugin with full meta', () => {
    const plugin: SchemaPluginWithMeta<unknown, unknown> = {
      type: 'ajv',
      version: '1.0.0',
      meta: {
        name: 'AJV Plugin',
        description: 'JSON Schema validation with AJV',
        version: '1.0.0',
        author: 'Team',
        repository: 'https://github.com/nexus-state/ajv-plugin',
        dependencies: [],
      },
      create: () => ({
        validate: () => ({ fieldErrors: {} }),
        dispose: () => {},
      }),
      supports: (schema): schema is unknown => typeof schema === 'object',
    };
    expect(plugin.type).toBe('ajv');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.meta.name).toBe('AJV Plugin');
    expect(plugin.meta.description).toBe('JSON Schema validation with AJV');
    expect(typeof plugin.create).toBe('function');
    expect(typeof plugin.supports).toBe('function');
  });
});

describe('SchemaValidator async', () => {
  it('should accept async validate method', async () => {
    const asyncValidator: SchemaValidator<{ name: string }> = {
      validate: async () => {
        await Promise.resolve();
        return { fieldErrors: {} };
      },
    };

    const result = await asyncValidator.validate({ name: 'test' });
    expect(result.fieldErrors).toEqual({});
  });

  it('should accept async validateField method', async () => {
    const asyncValidator: SchemaValidator<{ name: string }> = {
      validate: () => ({ fieldErrors: {} }),
      validateField: async () => {
        await Promise.resolve();
        return null;
      },
    };

    const result = await asyncValidator.validateField?.('name', 'test');
    expect(result).toBeNull();
  });

  it('should accept async parse method', async () => {
    const asyncValidator: SchemaValidator<{ name: string }> = {
      validate: () => ({ fieldErrors: {} }),
      parse: async () => {
        await Promise.resolve();
        return { name: 'test' };
      },
    };

    const result = await asyncValidator.parse?.({ name: 'test' });
    expect(result).toEqual({ name: 'test' });
  });
});

describe('SchemaType', () => {
  it('should accept string as SchemaType', () => {
    const zodType: SchemaType = 'zod';
    const yupType: SchemaType = 'yup';
    const customType: SchemaType = 'my-custom-schema';

    expect(zodType).toBe('zod');
    expect(yupType).toBe('yup');
    expect(customType).toBe('my-custom-schema');
  });
});

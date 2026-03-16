import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defaultSchemaRegistry, SchemaRegistry } from '../../registry';
import type { SchemaPlugin, SchemaValidator } from '../../types';

describe('E2E: Schema Registry', () => {
  let registry: SchemaRegistry;

  beforeEach(() => {
    registry = new SchemaRegistry({ autoRegisterBuiltins: false });
    defaultSchemaRegistry.clear();
  });

  describe('Plugin Registration', () => {
    it('should register and create plugins', async () => {
      const mockPlugin: SchemaPlugin<any, any> = {
        type: 'mock',
        meta: { name: 'Mock Plugin', version: '1.0.0' },
        create: (_schema) => ({
          validate: async (_values) => ({ fieldErrors: {} }),
          validateField: async () => null,
        }),
        supports: () => true,
      };

      registry.register('mock', mockPlugin);

      const validator = registry.create('mock', {});
      expect(validator).toBeDefined();

      const errors = await validator!.validate({});
      expect(errors.fieldErrors).toEqual({});
    });

    it('should throw on duplicate registration in strict mode', () => {
      const strictRegistry = new SchemaRegistry({ 
        autoRegisterBuiltins: false,
        strict: true 
      });

      const plugin: SchemaPlugin = {
        type: 'dup',
        meta: { name: 'Dup Plugin', version: '1.0.0' },
        create: () => ({ validate: async () => ({ fieldErrors: {} }), validateField: async () => null }),
        supports: () => true,
      };

      strictRegistry.register('dup', plugin);

      expect(() => strictRegistry.register('dup', plugin)).toThrow('already registered');
    });

    it('should warn on duplicate registration in non-strict mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const plugin: SchemaPlugin = {
        type: 'dup',
        meta: { name: 'Dup Plugin', version: '1.0.0' },
        create: () => ({ validate: async () => ({ fieldErrors: {} }), validateField: async () => null }),
        supports: () => true,
      };

      registry.register('dup', plugin);
      registry.register('dup', plugin);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered')
      );

      consoleSpy.mockRestore();
    });

    it('should return null for unknown plugin', () => {
      const plugin = registry.get('unknown');
      expect(plugin).toBeNull();
    });

    it('should return null when creating unknown plugin', () => {
      const validator = registry.create('unknown', {});
      expect(validator).toBeNull();
    });

    it('should check if plugin exists', () => {
      const plugin: SchemaPlugin = {
        type: 'test',
        meta: { name: 'Test Plugin', version: '1.0.0' },
        create: () => ({ validate: async () => ({ fieldErrors: {} }), validateField: async () => null }),
        supports: () => true,
      };

      expect(registry.has('test')).toBe(false);
      registry.register('test', plugin);
      expect(registry.has('test')).toBe(true);
    });

    it('should get registered types', () => {
      registry.register('a', {
        type: 'a',
        meta: { name: 'A', version: '1.0.0' },
        create: () => ({ validate: async () => ({ fieldErrors: {} }), validateField: async () => null }),
        supports: () => true,
      });

      registry.register('b', {
        type: 'b',
        meta: { name: 'B', version: '1.0.0' },
        create: () => ({ validate: async () => ({ fieldErrors: {} }), validateField: async () => null }),
        supports: () => true,
      });

      const types = registry.getRegisteredTypes();
      expect(types).toEqual(['a', 'b']);
    });

    it('should clear all plugins', () => {
      registry.register('test', {
        type: 'test',
        meta: { name: 'Test', version: '1.0.0' },
        create: () => ({ validate: async () => ({ fieldErrors: {} }), validateField: async () => null }),
        supports: () => true,
      });

      expect(registry.has('test')).toBe(true);
      registry.clear();
      expect(registry.has('test')).toBe(false);
    });

    it('should get stats', () => {
      registry.register('a', {
        type: 'a',
        meta: { name: 'A', version: '1.0.0' },
        create: () => ({ validate: async () => ({ fieldErrors: {} }), validateField: async () => null }),
        supports: () => true,
      });

      const stats = registry.getStats();
      expect(stats.pluginCount).toBe(1);
      expect(stats.types).toEqual(['a']);
    });
  });

  describe('Validator Functionality', () => {
    it('should validate with custom plugin', async () => {
      const mockPlugin: SchemaPlugin<any, any> = {
        type: 'custom',
        meta: { name: 'Custom Plugin', version: '1.0.0' },
        create: (_schema) => ({
          validate: async (values: Record<string, unknown>) => ({
            fieldErrors: {
              name: !values.name ? { message: 'Name is required', code: 'required' } : null,
            },
          }),
          validateField: async (fieldName, value) => {
            if (fieldName === 'name' && !value) {
              return { message: 'Name is required', code: 'required' };
            }
            return null;
          },
        }),
        supports: () => true,
      };

      registry.register('custom', mockPlugin);
      const validator = registry.create('custom', {}) as SchemaValidator<{ name?: string }>;

      // Test invalid data
      const errors1 = await validator.validate({});
      expect(errors1.fieldErrors.name).toBeDefined();

      // Test valid data
      const errors2 = await validator.validate({ name: 'Test' });
      expect(errors2.fieldErrors.name).toBeNull();
    });

    it('should support async validation', async () => {
      const asyncPlugin: SchemaPlugin<any, any> = {
        type: 'async',
        meta: { name: 'Async Plugin', version: '1.0.0' },
        create: (_schema) => ({
          validate: async (values) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return {
              fieldErrors: {
                username: values.username === 'taken' 
                  ? { message: 'Username taken', code: 'unique' } 
                  : null,
              },
            };
          },
          validateField: async () => null,
        }),
        supports: () => true,
      };

      registry.register('async', asyncPlugin);
      const validator = registry.create('async', {}) as SchemaValidator<{ username?: string }>;

      const errors1 = await validator.validate({ username: 'taken' });
      expect(errors1.fieldErrors.username).toBeDefined();

      const errors2 = await validator.validate({ username: 'available' });
      expect(errors2.fieldErrors.username).toBeNull();
    });

    it('should support field-level validation', async () => {
      const fieldPlugin: SchemaPlugin<any, any> = {
        type: 'field',
        meta: { name: 'Field Plugin', version: '1.0.0' },
        create: (_schema) => ({
          validate: async () => ({ fieldErrors: {} }),
          validateField: async <K extends keyof Record<string, unknown>>(
            fieldName: K,
            value: Record<string, unknown>[K]
          ) => {
            if (fieldName === 'email' && typeof value === 'string' && !value.includes('@')) {
              return { message: 'Invalid email', code: 'email' };
            }
            return null;
          },
        }),
        supports: () => true,
      };

      registry.register('field', fieldPlugin);
      const validator = registry.create('field', {}) as SchemaValidator<{ email?: string }>;

      const error = await validator.validateField('email', 'invalid', undefined);
      expect(error).toBeDefined();
      expect(error?.message).toBe('Invalid email');

      const validError = await validator.validateField('email', 'valid@example.com', undefined);
      expect(validError).toBeNull();
    });
  });

  describe('Default Registry', () => {
    it('should be an instance of SchemaRegistry', () => {
      expect(defaultSchemaRegistry).toBeInstanceOf(SchemaRegistry);
    });

    it('should allow plugin registration', () => {
      const plugin: SchemaPlugin = {
        type: 'test',
        meta: { name: 'Test', version: '1.0.0' },
        create: () => ({ validate: async () => ({ fieldErrors: {} }), validateField: async () => null }),
        supports: () => true,
      };

      expect(() => defaultSchemaRegistry.register('test', plugin)).not.toThrow();
      expect(defaultSchemaRegistry.has('test')).toBe(true);
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSchemaRegistry, SchemaRegistry } from '../registry';
import type { SchemaPlugin, SchemaValidator } from '../types';

describe('SchemaRegistry', () => {
  let registry: SchemaRegistry;

  beforeEach(() => {
    registry = new SchemaRegistry({ autoRegisterBuiltins: false });
  });

  describe('register()', () => {
    it('should register a plugin successfully', () => {
      const mockPlugin: SchemaPlugin<unknown, Record<string, unknown>> = {
        type: 'mock',
        create: (_schema) => ({ validate: () => ({ fieldErrors: {} }) }),
      };

      expect(() => registry.register('mock', mockPlugin)).not.toThrow();
      expect(registry.has('mock')).toBe(true);
    });

    it('should throw in strict mode when duplicate registration', () => {
      const strictRegistry = new SchemaRegistry({
        autoRegisterBuiltins: false,
        strict: true,
      });
      const mockPlugin: SchemaPlugin<unknown, Record<string, unknown>> = {
        type: 'mock',
        create: () => ({ validate: () => ({ fieldErrors: {} }) }),
      };

      strictRegistry.register('mock', mockPlugin);
      expect(() => strictRegistry.register('mock', mockPlugin)).toThrow(
        'already registered'
      );
    });

    it('should warn in non-strict mode when duplicate registration', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockPlugin: SchemaPlugin<unknown, Record<string, unknown>> = {
        type: 'mock',
        create: () => ({ validate: () => ({ fieldErrors: {} }) }),
      };

      registry.register('mock', mockPlugin);
      registry.register('mock', mockPlugin);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('get()', () => {
    it('should return plugin by type', () => {
      const mockPlugin: SchemaPlugin<unknown, Record<string, unknown>> = {
        type: 'mock',
        create: (_schema) => ({ validate: () => ({ fieldErrors: {} }) }),
      };

      registry.register('mock', mockPlugin);
      const retrieved = registry.get('mock');

      expect(retrieved).toBe(mockPlugin);
    });

    it('should return null for unknown type', () => {
      const result = registry.get('unknown');
      expect(result).toBeNull();
    });
  });

  describe('has()', () => {
    it('should return true for registered plugin', () => {
      registry.register('mock', {
        type: 'mock',
        create: () => ({ validate: () => ({ fieldErrors: {} }) }),
      });
      expect(registry.has('mock')).toBe(true);
    });

    it('should return false for unknown plugin', () => {
      expect(registry.has('unknown')).toBe(false);
    });
  });

  describe('create()', () => {
    it('should create validator from schema', () => {
      const mockValidator: SchemaValidator<Record<string, unknown>> = {
        validate: () => ({ fieldErrors: {} }),
      };
      const mockPlugin: SchemaPlugin<unknown, Record<string, unknown>> = {
        type: 'mock',
        create: (_schema) => mockValidator,
      };

      registry.register('mock', mockPlugin);
      const validator = registry.create('mock', { some: 'schema' });

      expect(validator).toBe(mockValidator);
    });

    it('should return null for unknown type', () => {
      const result = registry.create('unknown', {});
      expect(result).toBeNull();
    });
  });

  describe('getRegisteredTypes()', () => {
    it('should return array of registered types', () => {
      registry.register('zod', {
        type: 'zod',
        create: () => ({ validate: () => ({ fieldErrors: {} }) }),
      });
      registry.register('yup', {
        type: 'yup',
        create: () => ({ validate: () => ({ fieldErrors: {} }) }),
      });

      const types = registry.getRegisteredTypes();
      expect(types).toEqual(['zod', 'yup']);
    });

    it('should return empty array when no plugins', () => {
      expect(registry.getRegisteredTypes()).toEqual([]);
    });
  });

  describe('clear()', () => {
    it('should remove all plugins', () => {
      registry.register('mock', {
        type: 'mock',
        create: () => ({ validate: () => ({ fieldErrors: {} }) }),
      });
      registry.clear();
      expect(registry.has('mock')).toBe(false);
    });

    it('should allow re-registration after clear', () => {
      registry.register('mock', {
        type: 'mock',
        create: () => ({ validate: () => ({ fieldErrors: {} }) }),
      });
      registry.clear();
      expect(() =>
        registry.register('mock', {
          type: 'mock',
          create: () => ({ validate: () => ({ fieldErrors: {} }) }),
        })
      ).not.toThrow();
      expect(registry.has('mock')).toBe(true);
    });
  });

  describe('getStats()', () => {
    it('should return correct statistics', () => {
      registry.register('zod', {
        type: 'zod',
        create: () => ({ validate: () => ({ fieldErrors: {} }) }),
      });
      registry.register('yup', {
        type: 'yup',
        create: () => ({ validate: () => ({ fieldErrors: {} }) }),
      });

      const stats = registry.getStats();
      expect(stats).toEqual({
        pluginCount: 2,
        types: ['zod', 'yup'],
      });
    });

    it('should return empty statistics when no plugins', () => {
      const stats = registry.getStats();
      expect(stats).toEqual({
        pluginCount: 0,
        types: [],
      });
    });
  });

  describe('constructor', () => {
    it('should use default config when no options provided', () => {
      const defaultRegistry = new SchemaRegistry();
      expect(defaultRegistry).toBeInstanceOf(SchemaRegistry);
    });

    it('should respect autoRegisterBuiltins option', () => {
      const registryWithoutBuiltins = new SchemaRegistry({
        autoRegisterBuiltins: false,
      });
      expect(registryWithoutBuiltins.getRegisteredTypes()).toEqual([]);
    });

    it('should respect strict option', () => {
      const strictRegistry = new SchemaRegistry({ strict: true });
      strictRegistry.register('test', {
        type: 'test',
        create: () => ({ validate: () => ({ fieldErrors: {} }) }),
      });

      expect(() =>
        strictRegistry.register('test', {
          type: 'test',
          create: () => ({ validate: () => ({ fieldErrors: {} }) }),
        })
      ).toThrow();
    });
  });
});

describe('defaultSchemaRegistry', () => {
  it('should be instance of SchemaRegistry', () => {
    expect(defaultSchemaRegistry).toBeInstanceOf(SchemaRegistry);
  });

  it('should allow plugin registration', () => {
    defaultSchemaRegistry.register('test-default', {
      type: 'test-default',
      create: () => ({ validate: () => ({ fieldErrors: {} }) }),
    });
    expect(defaultSchemaRegistry.has('test-default')).toBe(true);
  });
});

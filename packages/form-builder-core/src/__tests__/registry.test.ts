/**
 * Component Registry Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockComponents, ComponentRegistry, defaultRegistry } from '../registry';
import type { ComponentDefinition } from '@nexus-state/form-builder-core';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  describe('register()', () => {
    it('should register a component', () => {
      const component: ComponentDefinition = {
        type: 'test',
        label: 'Test Component',
        icon: '🧪',
        category: 'input',
        defaultProps: {},
        configSchema: {},
        renderPreview: () => null as any,
        renderField: () => null as any,
      };

      registry.register(component);
      expect(registry.has('test')).toBe(true);
    });

    it('should warn on duplicate registration', () => {
      const component: ComponentDefinition = {
        type: 'test',
        label: 'Test Component',
        icon: '🧪',
        category: 'input',
        defaultProps: {},
        configSchema: {},
        renderPreview: () => null as any,
        renderField: () => null as any,
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      registry.register(component);
      registry.register(component);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered')
      );
      consoleSpy.mockRestore();
    });

    it('should register component with all properties', () => {
      const component: ComponentDefinition = {
        type: 'custom',
        label: 'Custom Component',
        icon: '⭐',
        category: 'advanced',
        description: 'A custom component',
        defaultProps: {
          type: 'custom',
          label: 'Custom',
          required: false,
        },
        configSchema: {
          label: { type: 'string', label: 'Label', required: true },
          maxItems: { type: 'number', label: 'Max Items', defaultValue: 5 },
        },
        renderPreview: () => null as any,
        renderField: () => null as any,
        supportsValidation: true,
        supportsConditional: true,
      };

      registry.register(component);
      const retrieved = registry.get('custom');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.label).toBe('Custom Component');
      expect(retrieved?.supportsValidation).toBe(true);
      expect(retrieved?.supportsConditional).toBe(true);
    });
  });

  describe('registerMany()', () => {
    it('should register multiple components', () => {
      const components: ComponentDefinition[] = [
        {
          type: 'test1',
          label: 'Test 1',
          icon: '🧪',
          category: 'input',
          defaultProps: {},
          configSchema: {},
          renderPreview: () => null as any,
          renderField: () => null as any,
        },
        {
          type: 'test2',
          label: 'Test 2',
          icon: '🧪',
          category: 'input',
          defaultProps: {},
          configSchema: {},
          renderPreview: () => null as any,
          renderField: () => null as any,
        },
      ];

      registry.registerMany(components);
      expect(registry.size).toBe(2);
    });

    it('should handle empty array', () => {
      registry.registerMany([]);
      expect(registry.size).toBe(0);
    });
  });

  describe('get()', () => {
    it('should return component by type', () => {
      const component: ComponentDefinition = {
        type: 'test',
        label: 'Test Component',
        icon: '🧪',
        category: 'input',
        defaultProps: {},
        configSchema: {},
        renderPreview: () => null as any,
        renderField: () => null as any,
      };

      registry.register(component);
      const retrieved = registry.get('test');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.label).toBe('Test Component');
    });

    it('should return undefined for unknown type', () => {
      const retrieved = registry.get('unknown');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getByCategory()', () => {
    it('should return components by category', () => {
      registry.registerMany(mockComponents);
      const inputComponents = registry.getByCategory('input');
      
      expect(inputComponents.length).toBeGreaterThan(0);
      expect(inputComponents.every(c => c.category === 'input')).toBe(true);
    });

    it('should return empty array for category with no components', () => {
      registry.registerMany(mockComponents);
      const layoutComponents = registry.getByCategory('layout');
      
      expect(layoutComponents).toEqual([]);
    });
  });

  describe('getGroupedByCategory()', () => {
    it('should return components grouped by category', () => {
      registry.registerMany(mockComponents);
      const grouped = registry.getGroupedByCategory();
      
      expect(grouped.input).toBeDefined();
      expect(grouped.select).toBeDefined();
      expect(grouped.layout).toBeDefined();
      expect(grouped.advanced).toBeDefined();
    });

    it('should have correct counts', () => {
      registry.registerMany(mockComponents);
      const grouped = registry.getGroupedByCategory();
      
      const totalCount = 
        grouped.input.length + 
        grouped.select.length + 
        grouped.layout.length + 
        grouped.advanced.length;
      
      expect(totalCount).toBe(mockComponents.length);
    });
  });

  describe('unregister()', () => {
    it('should remove component', () => {
      const component: ComponentDefinition = {
        type: 'test',
        label: 'Test Component',
        icon: '🧪',
        category: 'input',
        defaultProps: {},
        configSchema: {},
        renderPreview: () => null as any,
        renderField: () => null as any,
      };

      registry.register(component);
      expect(registry.has('test')).toBe(true);

      const result = registry.unregister('test');
      expect(result).toBe(true);
      expect(registry.has('test')).toBe(false);
    });

    it('should return false for non-existent component', () => {
      const result = registry.unregister('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should remove all components', () => {
      registry.registerMany(mockComponents);
      expect(registry.size).toBeGreaterThan(0);

      registry.clear();
      expect(registry.size).toBe(0);
    });
  });

  describe('getAll()', () => {
    it('should return all registered components', () => {
      registry.registerMany(mockComponents);
      const all = registry.getAll();
      
      expect(all.length).toBe(mockComponents.length);
    });

    it('should return empty array when no components', () => {
      const all = registry.getAll();
      expect(all).toEqual([]);
    });
  });

  describe('has()', () => {
    it('should return true for registered component', () => {
      registry.register({
        type: 'test',
        label: 'Test',
        icon: '🧪',
        category: 'input',
        defaultProps: {},
        configSchema: {},
        renderPreview: () => null as any,
        renderField: () => null as any,
      });
      
      expect(registry.has('test')).toBe(true);
    });

    it('should return false for non-existent component', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return correct component count', () => {
      expect(registry.size).toBe(0);
      
      registry.register({
        type: 'test',
        label: 'Test',
        icon: '🧪',
        category: 'input',
        defaultProps: {},
        configSchema: {},
        renderPreview: () => null as any,
        renderField: () => null as any,
      });
      
      expect(registry.size).toBe(1);
    });
  });

  describe('mockComponents', () => {
    it('should have all built-in components', () => {
      expect(mockComponents.length).toBeGreaterThan(0);
      
      const types = mockComponents.map(c => c.type);
      expect(types).toContain('text');
      expect(types).toContain('email');
      expect(types).toContain('select');
      expect(types).toContain('checkbox');
    });

    it('should have valid component definitions', () => {
      mockComponents.forEach(component => {
        expect(component.type).toBeDefined();
        expect(component.label).toBeDefined();
        expect(component.icon).toBeDefined();
        expect(component.category).toBeDefined();
        expect(component.defaultProps).toBeDefined();
        expect(component.configSchema).toBeDefined();
        expect(component.renderPreview).toBeDefined();
        expect(component.renderField).toBeDefined();
      });
    });

    it('should have unique types', () => {
      const types = mockComponents.map(c => c.type);
      const uniqueTypes = new Set(types);
      
      expect(types.length).toBe(uniqueTypes.size);
    });

    it('should have valid categories', () => {
      const validCategories = ['input', 'select', 'layout', 'advanced'];
      
      mockComponents.forEach(component => {
        expect(validCategories).toContain(component.category);
      });
    });
  });

  describe('defaultRegistry', () => {
    it('should have built-in components registered', () => {
      defaultRegistry.registerMany(mockComponents);
      expect(defaultRegistry.size).toBe(mockComponents.length);
    });

    it('should allow getting built-in components', () => {
      defaultRegistry.registerMany(mockComponents);
      const textComponent = defaultRegistry.get('text');
      expect(textComponent).toBeDefined();
      expect(textComponent?.label).toBe('Text Input');
    });
  });

  describe('Component rendering', () => {
    beforeEach(() => {
      defaultRegistry.registerMany(mockComponents);
    });

    it('should have working renderPreview', () => {
      const component = defaultRegistry.get('text');
      expect(component).toBeDefined();

      const preview = component!.renderPreview({
        type: 'text',
        label: 'Test',
        placeholder: 'Test placeholder',
      });

      expect(preview).toBeDefined();
    });

    it('should have working renderField', () => {
      const component = defaultRegistry.get('text');
      expect(component).toBeDefined();

      const field = component!.renderField({
        id: 'test_field',
        type: 'text',
        name: 'test',
        label: 'Test',
        placeholder: 'Test placeholder',
      });

      expect(field).toBeDefined();
    });
  });
});

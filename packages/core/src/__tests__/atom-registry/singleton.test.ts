/**
 * Tests for AtomRegistry: Singleton and basic initialization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AtomRegistry } from '../../atom-registry';

describe('AtomRegistry', () => {
  describe('Singleton', () => {
    it('should return the same instance on getInstance() calls', () => {
      const instance1 = AtomRegistry.getInstance();
      const instance2 = AtomRegistry.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should preserve state between getInstance() calls', () => {
      const registry = AtomRegistry.getInstance();
      registry.clear();

      const mockAtom = { id: Symbol('test'), type: 'primitive' as const };
      registry.register(mockAtom, 'test-atom');

      const registry2 = AtomRegistry.getInstance();
      expect(registry2.size()).toBe(1);
      expect(registry2.getByName('test-atom')).toBeDefined();
    });
  });

  describe('Initialization', () => {
    let registry: AtomRegistry;

    beforeEach(() => {
      registry = AtomRegistry.getInstance();
      registry.clear();
    });

    it('should create an empty registry on initialization', () => {
      expect(registry.size()).toBe(0);
      expect(registry.getAll().size).toBe(0);
    });

    it('should have an empty stores map on initialization', () => {
      expect(registry.getStoresMap().size).toBe(0);
    });

    it('should reset counter on clear()', () => {
      // Register several atoms to increment counter
      for (let i = 0; i < 5; i++) {
        registry.register({ id: Symbol(`atom-${i}`), type: 'primitive' as const });
      }

      registry.clear();
      expect(registry.size()).toBe(0);
    });
  });

  describe('size()', () => {
    let registry: AtomRegistry;

    beforeEach(() => {
      registry = AtomRegistry.getInstance();
      registry.clear();
    });

    it('should return 0 for empty registry', () => {
      expect(registry.size()).toBe(0);
    });

    it('should increase size on atom registration', () => {
      registry.register({ id: Symbol('test'), type: 'primitive' as const });
      expect(registry.size()).toBe(1);
    });

    it('should correctly count atoms', () => {
      registry.register({ id: Symbol('atom1'), type: 'primitive' as const });
      registry.register({ id: Symbol('atom2'), type: 'computed' as const });
      registry.register({ id: Symbol('atom3'), type: 'writable' as const });

      expect(registry.size()).toBe(3);
    });

    it('should not increase size on duplicate ID', () => {
      const id = Symbol('duplicate');
      registry.register({ id, type: 'primitive' as const });
      registry.register({ id, type: 'computed' as const });

      expect(registry.size()).toBe(1);
    });
  });
});

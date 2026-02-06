// tests/unit/time-travel/computed-atom-handler.test.ts
/** 
 * Unit tests for computed atom handler functionality
 * Implements requirements from TASK-004-IMPLEMENT-TIME-TRAVEL
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComputedAtomHandler } from '../../../packages/core/time-travel/computed-atom-handler';
import { atom } from '../../../packages/core/atom';
import { createMockStore } from '../../fixtures/mock-devtools';

describe('ComputedAtomHandler', () => {
  let handler: ComputedAtomHandler;
  let mockStore: any;

  beforeEach(() => {
    mockStore = createMockStore();
    handler = new ComputedAtomHandler(mockStore);
  });

  describe('Dependency Tracking', () => {
    it('should track dependencies for computed atoms', () => {
      const primitiveAtom = atom(42);
      const computedAtom = atom((get) => get(primitiveAtom) * 2);
      
      // Simulate dependency tracking
      handler.trackDependencies(computedAtom, [primitiveAtom]);
      
      const dependencies = handler.getDependencies(computedAtom);
      expect(dependencies).toContain(primitiveAtom);
    });

    it('should handle multiple dependencies', () => {
      const atom1 = atom(1);
      const atom2 = atom(2);
      const computedAtom = atom((get) => get(atom1) + get(atom2));
      
      handler.trackDependencies(computedAtom, [atom1, atom2]);
      
      const dependencies = handler.getDependencies(computedAtom);
      expect(dependencies).toContain(atom1);
      expect(dependencies).toContain(atom2);
      expect(dependencies).toHaveLength(2);
    });

    it('should clear dependencies', () => {
      const primitiveAtom = atom(42);
      const computedAtom = atom((get) => get(primitiveAtom) * 2);
      
      handler.trackDependencies(computedAtom, [primitiveAtom]);
      expect(handler.getDependencies(computedAtom)).toHaveLength(1);
      
      handler.clearDependencies(computedAtom);
      expect(handler.getDependencies(computedAtom)).toHaveLength(0);
    });
  });

  describe('State Restoration', () => {
    it('should restore computed atom values', () => {
      const computedAtom = atom((get) => 42);
      const restoredValue = 100;
      
      const success = handler.restoreComputedValue(computedAtom, restoredValue);
      expect(success).toBe(true);
    });

    it('should handle restoration with null values', () => {
      const computedAtom = atom((get) => 42);
      const success = handler.restoreComputedValue(computedAtom, null);
      expect(success).toBe(true);
    });

    it('should handle restoration with undefined values', () => {
      const computedAtom = atom((get) => 42);
      const success = handler.restoreComputedValue(computedAtom, undefined);
      expect(success).toBe(true);
    });
  });

  describe('Invalidation', () => {
    it('should invalidate computed atoms', () => {
      const computedAtom = atom((get) => 42);
      const success = handler.invalidate(computedAtom);
      expect(success).toBe(true);
    });

    it('should invalidate multiple computed atoms', () => {
      const computedAtom1 = atom((get) => 42);
      const computedAtom2 = atom((get) => 24);
      
      const success1 = handler.invalidate(computedAtom1);
      const success2 = handler.invalidate(computedAtom2);
      
      expect(success1).toBe(true);
      expect(success2).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should clear all cached computed values', () => {
      // Setup some computed atoms
      const computedAtom1 = atom((get) => 42);
      const computedAtom2 = atom((get) => 24);
      
      handler.trackDependencies(computedAtom1, []);
      handler.trackDependencies(computedAtom2, []);
      
      // Clear cache
      handler.clearCache();
      
      // All caches should be cleared
      expect(handler.getDependencies(computedAtom1)).toHaveLength(0);
      expect(handler.getDependencies(computedAtom2)).toHaveLength(0);
    });

    it('should handle cache clearing when empty', () => {
      expect(() => handler.clearCache()).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should handle complex dependency graphs', () => {
      // Create a complex dependency graph
      const rootAtom = atom(1);
      
      const level1Atom1 = atom((get) => get(rootAtom) * 2);
      const level1Atom2 = atom((get) => get(rootAtom) * 3);
      
      const level2Atom = atom((get) => get(level1Atom1) + get(level1Atom2));
      
      // Track dependencies
      handler.trackDependencies(level1Atom1, [rootAtom]);
      handler.trackDependencies(level1Atom2, [rootAtom]);
      handler.trackDependencies(level2Atom, [level1Atom1, level1Atom2]);
      
      // Verify dependency tracking
      expect(handler.getDependencies(level1Atom1)).toContain(rootAtom);
      expect(handler.getDependencies(level1Atom2)).toContain(rootAtom);
      expect(handler.getDependencies(level2Atom)).toContain(level1Atom1);
      expect(handler.getDependencies(level2Atom)).toContain(level1Atom2);
    });

    it('should handle circular dependencies gracefully', () => {
      // Create atoms with circular dependency potential
      const atom1 = atom(1);
      const atom2 = atom(2);
      
      // Track dependencies
      handler.trackDependencies(atom1, [atom2]);
      handler.trackDependencies(atom2, [atom1]);
      
      // Should not throw
      expect(handler.getDependencies(atom1)).toContain(atom2);
      expect(handler.getDependencies(atom2)).toContain(atom1);
    });
  });
});
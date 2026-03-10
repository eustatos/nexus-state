/**
 * AtomRegistryAdapter tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AtomRegistryAdapter } from '../AtomRegistryAdapter';
import { atomRegistry } from '../../../../atom-registry';
import { atom } from '../../../../index';

describe('AtomRegistryAdapter', () => {
  let adapter: AtomRegistryAdapter;

  beforeEach(() => {
    adapter = new AtomRegistryAdapter();
  });

  afterEach(() => {
    atomRegistry.clear();
  });

  describe('getAll', () => {
    it('should return empty map when no atoms', () => {
      const atoms = adapter.getAll();
      expect(atoms.size).toBe(0);
    });

    it('should return all registered atoms', () => {
      const testAtom = atom(42, 'test');
      const atoms = adapter.getAll();

      expect(atoms.size).toBeGreaterThan(0);
    });
  });

  describe('get', () => {
    it('should return undefined for unknown atom', () => {
      const atomId = Symbol('unknown');
      const result = adapter.get(atomId);

      expect(result).toBeUndefined();
    });

    it('should return atom by ID', () => {
      const testAtom = atom(42, 'test');
      const result = adapter.get(testAtom.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testAtom.id);
    });
  });
});

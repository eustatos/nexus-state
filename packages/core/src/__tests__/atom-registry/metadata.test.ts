/**
 * Tests for AtomRegistry: metadata
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AtomRegistry } from '../../atom-registry';
import { createPrimitiveAtom, createComputedAtom, createWritableAtom } from './fixtures/test-atoms';

describe('AtomRegistry: metadata', () => {
  let registry: AtomRegistry;

  beforeEach(() => {
    registry = AtomRegistry.getInstance();
    registry.clear();
  });

  describe('getMetadata()', () => {
    it('should return metadata for registered atom', () => {
      const atom = createPrimitiveAtom(42, 'count');
      registry.register(atom, 'count');

      const metadata = registry.getMetadata(atom);

      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('count');
      expect(metadata?.type).toBe('primitive');
      expect(metadata?.createdAt).toBeDefined();
    });

    it('should return undefined for unregistered atom', () => {
      const atom = createPrimitiveAtom(42, 'count');
      const metadata = registry.getMetadata(atom);

      expect(metadata).toBeUndefined();
    });

    it('should preserve createdAt timestamp', () => {
      const before = Date.now();
      const atom = createPrimitiveAtom(42, 'count');
      registry.register(atom, 'count');
      const after = Date.now();

      const metadata = registry.getMetadata(atom);

      expect(metadata?.createdAt).toBeGreaterThanOrEqual(before);
      expect(metadata?.createdAt).toBeLessThanOrEqual(after);
    });

    it('should preserve atom type', () => {
      const primitiveAtom = createPrimitiveAtom(42, 'prim');
      const computedAtom = createComputedAtom(() => 84, 'comp');
      const writableAtom = createWritableAtom(
        0,
        (get) => get({} as any),
        (get, set, val) => set({} as any, val),
        'writ'
      );

      registry.register(primitiveAtom, 'prim');
      registry.register(computedAtom, 'comp');
      registry.register(writableAtom, 'writ');

      expect(registry.getMetadata(primitiveAtom)?.type).toBe('primitive');
      expect(registry.getMetadata(computedAtom)?.type).toBe('computed');
      expect(registry.getMetadata(writableAtom)?.type).toBe('writable');
    });

    it('should update name on re-registration', () => {
      const atom = createPrimitiveAtom(42, 'original');
      registry.register(atom, 'original');

      expect(registry.getMetadata(atom)?.name).toBe('original');

      registry.register(atom, 'updated');

      expect(registry.getMetadata(atom)?.name).toBe('updated');
    });

    it('should preserve createdAt on name update', () => {
      const atom = createPrimitiveAtom(42, 'original');
      registry.register(atom, 'original');
      const originalCreatedAt = registry.getMetadata(atom)?.createdAt;

      vi.useFakeTimers();
      vi.advanceTimersByTime(10000);

      registry.register(atom, 'updated');

      const newMetadata = registry.getMetadata(atom);
      expect(newMetadata?.createdAt).toBe(originalCreatedAt);

      vi.useRealTimers();
    });
  });

  describe('metadata preservation after clear()', () => {
    it('should clear metadata on clear()', () => {
      const atom = createPrimitiveAtom(42, 'count');
      registry.register(atom, 'count');

      registry.clear();

      const metadata = registry.getMetadata(atom);
      expect(metadata).toBeUndefined();
    });
  });
});

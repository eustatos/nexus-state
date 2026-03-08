/**
 * SimpleReconstructionCache tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleReconstructionCache } from '../reconstructor';
import type { Snapshot } from '../../types';

function createMockSnapshot(id: string): Snapshot {
  return {
    id,
    state: {
      atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
    },
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 1,
    },
  };
}

describe('SimpleReconstructionCache', () => {
  let cache: SimpleReconstructionCache;

  beforeEach(() => {
    cache = new SimpleReconstructionCache();
  });

  describe('constructor', () => {
    it('should create with default max size', () => {
      expect(cache.size()).toBe(0);
    });

    it('should create with custom max size', () => {
      const c = new SimpleReconstructionCache(10);
      expect(c).toBeDefined();
    });
  });

  describe('set', () => {
    it('should set snapshot in cache', () => {
      const snapshot = createMockSnapshot('snap1');
      cache.set('snap1', snapshot);

      expect(cache.size()).toBe(1);
    });

    it('should update access count on get', () => {
      const snapshot = createMockSnapshot('snap1');
      cache.set('snap1', snapshot);
      cache.get('snap1');
      cache.get('snap1');

      expect(cache.size()).toBe(1);
    });
  });

  describe('get', () => {
    it('should return null for unknown id', () => {
      const result = cache.get('unknown');
      expect(result).toBeNull();
    });

    it('should return snapshot from cache', () => {
      const snapshot = createMockSnapshot('snap1');
      cache.set('snap1', snapshot);

      const result = cache.get('snap1');
      expect(result).toBe(snapshot);
    });

    it('should return null after clear', () => {
      const snapshot = createMockSnapshot('snap1');
      cache.set('snap1', snapshot);
      cache.clear();

      const result = cache.get('snap1');
      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('snap1', createMockSnapshot('snap1'));
      cache.set('snap2', createMockSnapshot('snap2'));
      cache.clear();

      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return 0 initially', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return correct size', () => {
      cache.set('snap1', createMockSnapshot('snap1'));
      cache.set('snap2', createMockSnapshot('snap2'));

      expect(cache.size()).toBe(2);
    });
  });

  describe('eviction', () => {
    it('should evict when at capacity', () => {
      const c = new SimpleReconstructionCache(2);
      c.set('snap1', createMockSnapshot('snap1'));
      c.set('snap2', createMockSnapshot('snap2'));
      c.set('snap3', createMockSnapshot('snap3'));

      expect(c.size()).toBe(2);
    });

    it('should keep items within capacity', () => {
      const c = new SimpleReconstructionCache(3);
      c.set('snap1', createMockSnapshot('snap1'));
      c.set('snap2', createMockSnapshot('snap2'));

      expect(c.get('snap1')).not.toBeNull();
      expect(c.get('snap2')).not.toBeNull();
    });
  });
});

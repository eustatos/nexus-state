/**
 * ReconstructionCache tests
 */

import { describe, it, expect } from 'vitest';
import { ReconstructionCache } from '../ReconstructionCache';
import type { Snapshot } from '../../../types';

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

describe('ReconstructionCache', () => {
  describe('constructor', () => {
    it('should create with default max size', () => {
      const cache = new ReconstructionCache();
      expect(cache).toBeDefined();
    });

    it('should create with custom max size', () => {
      const cache = new ReconstructionCache(50);
      expect(cache).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return null for unknown id', () => {
      const cache = new ReconstructionCache();
      const result = cache.get('unknown');
      expect(result).toBeNull();
    });

    it('should return snapshot from cache', () => {
      const cache = new ReconstructionCache();
      const snapshot = createMockSnapshot('test');
      cache.set('test', snapshot);

      const result = cache.get('test');
      expect(result).toBe(snapshot);
    });

    it('should update access count on get', () => {
      const cache = new ReconstructionCache();
      const snapshot = createMockSnapshot('test');
      cache.set('test', snapshot);

      cache.get('test');
      cache.get('test');

      const stats = cache.getStats();
      expect(stats.size).toBe(1);
    });
  });

  describe('set', () => {
    it('should set snapshot in cache', () => {
      const cache = new ReconstructionCache();
      const snapshot = createMockSnapshot('test');

      cache.set('test', snapshot);

      expect(cache.size()).toBe(1);
    });

    it('should evict oldest when at capacity', () => {
      const cache = new ReconstructionCache(2);

      cache.set('snap1', createMockSnapshot('snap1'));
      cache.set('snap2', createMockSnapshot('snap2'));
      cache.set('snap3', createMockSnapshot('snap3'));

      expect(cache.size()).toBe(2);
      expect(cache.get('snap1')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      const cache = new ReconstructionCache();

      cache.set('snap1', createMockSnapshot('snap1'));
      cache.set('snap2', createMockSnapshot('snap2'));
      cache.clear();

      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return 0 initially', () => {
      const cache = new ReconstructionCache();
      expect(cache.size()).toBe(0);
    });

    it('should return correct size', () => {
      const cache = new ReconstructionCache();

      cache.set('snap1', createMockSnapshot('snap1'));
      cache.set('snap2', createMockSnapshot('snap2'));

      expect(cache.size()).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return size and maxSize', () => {
      const cache = new ReconstructionCache(100);
      const stats = cache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(100);
    });
  });

  describe('getCachedIds', () => {
    it('should return empty array initially', () => {
      const cache = new ReconstructionCache();
      expect(cache.getCachedIds()).toEqual([]);
    });

    it('should return all cached IDs', () => {
      const cache = new ReconstructionCache();

      cache.set('snap1', createMockSnapshot('snap1'));
      cache.set('snap2', createMockSnapshot('snap2'));

      const ids = cache.getCachedIds();
      expect(ids).toContain('snap1');
      expect(ids).toContain('snap2');
    });
  });

  describe('remove', () => {
    it('should remove entry from cache', () => {
      const cache = new ReconstructionCache();
      const snapshot = createMockSnapshot('test');

      cache.set('test', snapshot);
      const removed = cache.remove('test');

      expect(removed).toBe(true);
      expect(cache.get('test')).toBeNull();
    });

    it('should return false for unknown id', () => {
      const cache = new ReconstructionCache();
      const removed = cache.remove('unknown');

      expect(removed).toBe(false);
    });
  });

  describe('has', () => {
    it('should return false for unknown id', () => {
      const cache = new ReconstructionCache();
      expect(cache.has('unknown')).toBe(false);
    });

    it('should return true for cached id', () => {
      const cache = new ReconstructionCache();
      cache.set('test', createMockSnapshot('test'));

      expect(cache.has('test')).toBe(true);
    });
  });
});

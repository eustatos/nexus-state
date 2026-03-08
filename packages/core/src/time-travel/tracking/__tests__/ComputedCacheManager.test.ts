/**
 * Tests for ComputedCacheManager
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComputedCacheManager } from '../ComputedCacheManager';

describe('ComputedCacheManager', () => {
  let cacheManager: ComputedCacheManager;

  beforeEach(() => {
    cacheManager = new ComputedCacheManager();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(cacheManager).toBeDefined();
      expect(cacheManager.getConfig().defaultTTL).toBe(5000);
      expect(cacheManager.getConfig().maxSize).toBe(100);
    });

    it('should create with custom config', () => {
      const customCache = new ComputedCacheManager({
        defaultTTL: 10000,
        maxSize: 50,
      });

      expect(customCache.getConfig().defaultTTL).toBe(10000);
      expect(customCache.getConfig().maxSize).toBe(50);
    });

    it('should create with partial config', () => {
      const partialCache = new ComputedCacheManager({
        defaultTTL: 10000,
      });

      expect(partialCache.getConfig().defaultTTL).toBe(10000);
      expect(partialCache.getConfig().maxSize).toBe(100); // default
    });
  });

  describe('get', () => {
    it('should return null for missing key', () => {
      const result = cacheManager.get(Symbol('unknown'));
      expect(result).toBeNull();
    });

    it('should return cached value', () => {
      const key = Symbol('test');
      cacheManager.set(key, 'value123');

      const result = cacheManager.get(key);
      expect(result).toBe('value123');
    });

    it('should return null for expired cache', async () => {
      const fastCache = new ComputedCacheManager({ defaultTTL: 10 });
      const key = Symbol('test');
      fastCache.set(key, 'value123');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 20));

      const result = fastCache.get(key);
      expect(result).toBeNull();
    });

    it('should use custom TTL when provided', async () => {
      const cache = new ComputedCacheManager({ defaultTTL: 10 });
      const key = Symbol('test');
      cache.set(key, 'value123');

      // Custom TTL of 100ms should still be valid after 50ms
      await new Promise((resolve) => setTimeout(resolve, 50));

      const result = cache.get(key, 100);
      expect(result).toBe('value123');
    });

    it('should update access count on get', () => {
      const key = Symbol('test');
      cacheManager.set(key, 'value');

      cacheManager.get(key);
      cacheManager.get(key);
      cacheManager.get(key);

      const metadata = cacheManager.getEntryMetadata(key);
      expect(metadata?.accessCount).toBe(4); // 1 set + 3 gets
    });

    it('should track cache misses', () => {
      cacheManager.get(Symbol('miss1'));
      cacheManager.get(Symbol('miss2'));

      const stats = cacheManager.getStats();
      expect(stats.misses).toBe(2);
    });
  });

  describe('set', () => {
    it('should set value in cache', () => {
      const key = Symbol('test');
      cacheManager.set(key, 'value123');

      const result = cacheManager.get(key);
      expect(result).toBe('value123');
    });

    it('should evict oldest entry when cache is full', () => {
      const smallCache = new ComputedCacheManager({ maxSize: 3 });

      // Fill cache
      smallCache.set(Symbol('key1'), 'value1');
      smallCache.set(Symbol('key2'), 'value2');
      smallCache.set(Symbol('key3'), 'value3');

      // Add new entry
      smallCache.set(Symbol('key4'), 'value4');

      expect(smallCache.getSize()).toBeLessThanOrEqual(3);
    });

    it('should not evict when updating existing key', () => {
      const smallCache = new ComputedCacheManager({ maxSize: 2 });

      const key1 = Symbol('key1');
      const key2 = Symbol('key2');

      smallCache.set(key1, 'value1');
      smallCache.set(key2, 'value2');

      // Update existing key should not trigger eviction
      smallCache.set(key1, 'updated');

      // Both keys should still exist
      expect(smallCache.getSize()).toBe(2);
      expect(smallCache.has(key1)).toBe(true);
      expect(smallCache.has(key2)).toBe(true);
    });

    it('should store dependencies version', () => {
      const key = Symbol('test');
      cacheManager.set(key, 'value', 42);

      const metadata = cacheManager.getEntryMetadata(key);
      expect(metadata?.dependenciesVersion).toBe(42);
    });
  });

  describe('has', () => {
    it('should return false for missing key', () => {
      expect(cacheManager.has(Symbol('unknown'))).toBe(false);
    });

    it('should return true for valid cache entry', () => {
      const key = Symbol('test');
      cacheManager.set(key, 'value');

      expect(cacheManager.has(key)).toBe(true);
    });

    it('should return false for expired cache', async () => {
      const fastCache = new ComputedCacheManager({ defaultTTL: 10 });
      const key = Symbol('test');
      fastCache.set(key, 'value');

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(fastCache.has(key)).toBe(false);
    });

    it('should use custom TTL when provided', async () => {
      const cache = new ComputedCacheManager({ defaultTTL: 10 });
      const key = Symbol('test');
      cache.set(key, 'value');

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Custom TTL should still be valid
      expect(cache.has(key, 100)).toBe(true);
    });
  });

  describe('invalidate', () => {
    it('should remove entry from cache', () => {
      const key = Symbol('test');
      cacheManager.set(key, 'value');

      const result = cacheManager.invalidate(key);
      expect(result).toBe(true);
      expect(cacheManager.get(key)).toBeNull();
    });

    it('should return false for missing key', () => {
      const result = cacheManager.invalidate(Symbol('unknown'));
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries when no key provided', () => {
      cacheManager.set(Symbol('key1'), 'value1');
      cacheManager.set(Symbol('key2'), 'value2');

      cacheManager.clear();

      expect(cacheManager.getSize()).toBe(0);
      expect(cacheManager.getStats().hits).toBe(0);
      expect(cacheManager.getStats().misses).toBe(0);
    });

    it('should clear specific entry when key provided', () => {
      const key1 = Symbol('key1');
      const key2 = Symbol('key2');
      cacheManager.set(key1, 'value1');
      cacheManager.set(key2, 'value2');

      cacheManager.clear(key1);

      expect(cacheManager.get(key1)).toBeNull();
      expect(cacheManager.get(key2)).toBe('value2');
    });
  });

  describe('getStats', () => {
    it('should return statistics for empty cache', () => {
      const stats = cacheManager.getStats();

      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should return statistics with hits and misses', () => {
      const key = Symbol('test');
      cacheManager.set(key, 'value');

      // 2 misses
      cacheManager.get(Symbol('miss1'));
      cacheManager.get(Symbol('miss2'));

      // 3 hits
      cacheManager.get(key);
      cacheManager.get(key);
      cacheManager.get(key);

      const stats = cacheManager.getStats();

      expect(stats.size).toBe(1);
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.6); // 3/5
    });
  });

  describe('getAllKeys', () => {
    it('should return empty array for empty cache', () => {
      expect(cacheManager.getAllKeys()).toEqual([]);
    });

    it('should return all cached keys', () => {
      const key1 = Symbol('key1');
      const key2 = Symbol('key2');
      cacheManager.set(key1, 'value1');
      cacheManager.set(key2, 'value2');

      const keys = cacheManager.getAllKeys();
      expect(keys.length).toBe(2);
      expect(keys).toContain(key1);
      expect(keys).toContain(key2);
    });
  });

  describe('getSize', () => {
    it('should return 0 for empty cache', () => {
      expect(cacheManager.getSize()).toBe(0);
    });

    it('should return correct size', () => {
      cacheManager.set(Symbol('key1'), 'value1');
      cacheManager.set(Symbol('key2'), 'value2');
      cacheManager.set(Symbol('key3'), 'value3');

      expect(cacheManager.getSize()).toBe(3);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      cacheManager.configure({ defaultTTL: 10000 });

      expect(cacheManager.getConfig().defaultTTL).toBe(10000);
    });

    it('should merge partial configuration', () => {
      cacheManager.configure({ defaultTTL: 10000 });
      cacheManager.configure({ maxSize: 50 });

      const config = cacheManager.getConfig();
      expect(config.defaultTTL).toBe(10000);
      expect(config.maxSize).toBe(50);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = cacheManager.getConfig();

      expect(config.defaultTTL).toBe(5000);
      expect(config.maxSize).toBe(100);
    });

    it('should return copy of configuration', () => {
      const config1 = cacheManager.getConfig();
      config1.defaultTTL = 9999;

      const config2 = cacheManager.getConfig();
      expect(config2.defaultTTL).toBe(5000);
    });
  });

  describe('isExpired', () => {
    it('should return true for missing key', () => {
      expect(cacheManager.isExpired(Symbol('unknown'))).toBe(true);
    });

    it('should return false for valid cache', () => {
      const key = Symbol('test');
      cacheManager.set(key, 'value');

      expect(cacheManager.isExpired(key)).toBe(false);
    });

    it('should return true for expired cache', async () => {
      const fastCache = new ComputedCacheManager({ defaultTTL: 10 });
      const key = Symbol('test');
      fastCache.set(key, 'value');

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(fastCache.isExpired(key)).toBe(true);
    });
  });

  describe('getEntryMetadata', () => {
    it('should return null for missing key', () => {
      expect(cacheManager.getEntryMetadata(Symbol('unknown'))).toBeNull();
    });

    it('should return metadata for cached entry', () => {
      const key = Symbol('test');
      cacheManager.set(key, 'value', 42);

      const metadata = cacheManager.getEntryMetadata(key);
      expect(metadata).toBeDefined();
      expect(metadata?.accessCount).toBe(1);
      expect(metadata?.dependenciesVersion).toBe(42);
      expect(metadata?.age).toBeGreaterThanOrEqual(0);
    });
  });

  describe('warmup', () => {
    it('should warm up cache with multiple entries', () => {
      const entries = [
        { atomId: Symbol('key1'), value: 'value1' },
        { atomId: Symbol('key2'), value: 'value2' },
        { atomId: Symbol('key3'), value: 'value3', dependenciesVersion: 5 },
      ];

      cacheManager.warmup(entries);

      expect(cacheManager.getSize()).toBe(3);
      expect(cacheManager.get(entries[0].atomId)).toBe('value1');
      expect(cacheManager.get(entries[1].atomId)).toBe('value2');
      expect(cacheManager.get(entries[2].atomId)).toBe('value3');
    });

    it('should handle empty entries array', () => {
      cacheManager.warmup([]);
      expect(cacheManager.getSize()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      const key = Symbol('test');
      cacheManager.set(key, null);

      const result = cacheManager.get(key);
      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      const key = Symbol('test');
      cacheManager.set(key, undefined);

      const result = cacheManager.get(key);
      expect(result).toBeUndefined();
    });

    it('should handle large values', () => {
      const key = Symbol('test');
      const largeValue = { data: new Array(1000).fill('x') };

      cacheManager.set(key, largeValue);

      const result = cacheManager.get(key);
      expect(result).toEqual(largeValue);
    });

    it('should handle many entries', () => {
      const cache = new ComputedCacheManager({ maxSize: 1000 });

      for (let i = 0; i < 500; i++) {
        cache.set(Symbol(`key${i}`), `value${i}`);
      }

      expect(cache.getSize()).toBe(500);
    });
  });
});

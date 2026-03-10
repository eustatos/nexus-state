/**
 * Compression strategy tests
 */

import { describe, it, expect } from 'vitest';
import {
  BaseCompressionStrategy,
  NoCompressionStrategy,
} from '../strategy';
import type { Snapshot } from '../../types';

function createMockSnapshot(id: string, timestamp?: number): Snapshot {
  return {
    id,
    state: {
      atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
    },
    metadata: {
      timestamp: timestamp ?? Date.now(),
      action: 'test',
      atomCount: 1,
    },
  };
}

describe('CompressionStrategy', () => {
  describe('NoCompressionStrategy', () => {
    it('should create with default config', () => {
      const strategy = new NoCompressionStrategy();
      expect(strategy.name).toBe('none');
    });

    it('should create with custom config', () => {
      const strategy = new NoCompressionStrategy({
        minSnapshots: 5,
        enabled: true,
      });
      const config = strategy.getConfig();
      expect(config.minSnapshots).toBe(5);
    });

    it('should never compress', () => {
      const strategy = new NoCompressionStrategy();
      const history = [
        createMockSnapshot('s1'),
        createMockSnapshot('s2'),
        createMockSnapshot('s3'),
      ];

      const result = strategy.compress(history);

      expect(result).toEqual(history);
      expect(result).not.toBe(history); // Should be a copy
    });

    it('should return false for shouldCompress', () => {
      const strategy = new NoCompressionStrategy();
      const history = [
        createMockSnapshot('s1'),
        createMockSnapshot('s2'),
        createMockSnapshot('s3'),
      ];

      expect(strategy.shouldCompress(history, 2)).toBe(false);
    });

    it('should return null metadata', () => {
      const strategy = new NoCompressionStrategy();
      expect(strategy.getMetadata()).toBeNull();
    });
  });

  describe('BaseCompressionStrategy', () => {
    it('should create with default config', () => {
      const strategy = new NoCompressionStrategy();
      const config = strategy.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.minSnapshots).toBe(10);
    });

    it('should create with custom config', () => {
      const strategy = new NoCompressionStrategy({
        minSnapshots: 5,
        enabled: true,
      });
      const config = strategy.getConfig();
      expect(config.minSnapshots).toBe(5);
    });

    it('should return false when disabled', () => {
      const strategy = new NoCompressionStrategy({ enabled: false });
      const history = Array(20).fill(null).map((_, i) =>
        createMockSnapshot(`s${i}`)
      );

      expect(strategy.shouldCompress(history, 19)).toBe(false);
    });

    it('should return false when history is short', () => {
      const strategy = new NoCompressionStrategy({
        minSnapshots: 10,
        enabled: true,
      });
      const history = Array(5).fill(null).map((_, i) =>
        createMockSnapshot(`s${i}`)
      );

      expect(strategy.shouldCompress(history, 4)).toBe(false);
    });

    it('should return true when history is long and enabled', () => {
      // Use a strategy that can compress
      const strategy = new TestCompressionStrategy({
        minSnapshots: 5,
        enabled: true,
      });
      const history = Array(10).fill(null).map((_, i) =>
        createMockSnapshot(`s${i}`)
      );

      expect(strategy.shouldCompress(history, 9)).toBe(true);
    });

    it('should record metadata on compress', () => {
      const strategy = new TestCompressionStrategy();
      const history = Array(10).fill(null).map((_, i) =>
        createMockSnapshot(`s${i}`)
      );

      strategy.compress(history);

      const metadata = strategy.getMetadata();
      expect(metadata).not.toBeNull();
      expect(metadata?.originalCount).toBe(10);
      expect(metadata?.compressedCount).toBe(5);
      expect(metadata?.removedCount).toBe(5);
    });

    it('should reset metadata on reset', () => {
      const strategy = new TestCompressionStrategy();
      const history = Array(10).fill(null).map((_, i) =>
        createMockSnapshot(`s${i}`)
      );

      strategy.compress(history);
      strategy.reset();

      expect(strategy.getMetadata()).toBeNull();
    });
  });
});

/**
 * Test implementation of BaseCompressionStrategy
 */
class TestCompressionStrategy extends BaseCompressionStrategy {
  name = 'test';

  compress(history: Snapshot[]): Snapshot[] {
    const originalCount = history.length;
    // Remove half of the history
    const compressed = history.slice(0, Math.ceil(history.length / 2));
    const removedCount = originalCount - compressed.length;

    this.recordMetadata(originalCount, compressed.length, removedCount);
    return compressed;
  }
}

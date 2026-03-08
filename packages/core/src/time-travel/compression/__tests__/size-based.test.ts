/**
 * Size-based compression tests
 */

import { describe, it, expect } from 'vitest';
import { SizeBasedCompression } from '../size-based';
import type { Snapshot } from '../../types';

function createMockSnapshot(id: string): Snapshot {
  return {
    id,
    state: {
      atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
    },
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 1,
    },
  };
}

describe('SizeBasedCompression', () => {
  describe('constructor', () => {
    it('should create with default config', () => {
      const strategy = new SizeBasedCompression();
      expect(strategy.name).toBe('size');
      expect(strategy.getMaxSnapshots()).toBe(50);
      expect(strategy.getKeepEvery()).toBe(5);
    });

    it('should create with custom config', () => {
      const strategy = new SizeBasedCompression({
        maxSnapshots: 100,
        keepEvery: 10,
        minSnapshots: 20,
      });
      expect(strategy.getMaxSnapshots()).toBe(100);
      expect(strategy.getKeepEvery()).toBe(10);
    });
  });

  describe('shouldCompress', () => {
    it('should return false when disabled', () => {
      const strategy = new SizeBasedCompression({ enabled: false });
      const history = Array(100)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`));

      expect(strategy.shouldCompress(history, 99)).toBe(false);
    });

    it('should return false when history is short', () => {
      const strategy = new SizeBasedCompression({ maxSnapshots: 50 });
      const history = Array(30)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`));

      expect(strategy.shouldCompress(history, 29)).toBe(false);
    });

    it('should return true when history exceeds max', () => {
      const strategy = new SizeBasedCompression({ maxSnapshots: 50 });
      const history = Array(60)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`));

      expect(strategy.shouldCompress(history, 59)).toBe(true);
    });
  });

  describe('compress', () => {
    it('should return copy when within limits', () => {
      const strategy = new SizeBasedCompression({ maxSnapshots: 50 });
      const history = Array(30)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`));

      const result = strategy.compress(history);

      expect(result.length).toBe(30);
      expect(result).not.toBe(history);
    });

    it('should compress when exceeds max', () => {
      const strategy = new SizeBasedCompression({
        maxSnapshots: 50,
        keepEvery: 5,
      });
      const history = Array(100)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`));

      const result = strategy.compress(history);

      expect(result.length).toBeLessThan(100);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should keep first snapshot', () => {
      const strategy = new SizeBasedCompression({
        maxSnapshots: 50,
        keepEvery: 5,
      });
      const history = Array(60)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`));

      const result = strategy.compress(history);

      expect(result[0].id).toBe('s0');
    });

    it('should keep last snapshot', () => {
      const strategy = new SizeBasedCompression({
        maxSnapshots: 50,
        keepEvery: 5,
      });
      const history = Array(60)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`));

      const result = strategy.compress(history);

      expect(result[result.length - 1].id).toBe('s59');
    });

    it('should record metadata', () => {
      const strategy = new SizeBasedCompression({ maxSnapshots: 50 });
      const history = Array(100)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`));

      strategy.compress(history);

      const metadata = strategy.getMetadata();
      expect(metadata).not.toBeNull();
      expect(metadata?.originalCount).toBe(100);
      expect(metadata?.compressedCount).toBeLessThan(100);
    });

    it('should return empty array for empty history', () => {
      const strategy = new SizeBasedCompression();
      const result = strategy.compress([]);
      expect(result).toEqual([]);
    });
  });

  describe('getMaxSnapshots', () => {
    it('should return configured value', () => {
      const strategy = new SizeBasedCompression({ maxSnapshots: 100 });
      expect(strategy.getMaxSnapshots()).toBe(100);
    });
  });

  describe('getKeepEvery', () => {
    it('should return configured value', () => {
      const strategy = new SizeBasedCompression({ keepEvery: 10 });
      expect(strategy.getKeepEvery()).toBe(10);
    });
  });
});

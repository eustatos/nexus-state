/**
 * Time-based compression tests
 */

import { describe, it, expect } from 'vitest';
import { TimeBasedCompression } from '../time-based';
import type { Snapshot } from '../../types';

function createMockSnapshot(id: string, ageMs: number = 0): Snapshot {
  return {
    id,
    state: {
      atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
    },
    metadata: {
      timestamp: Date.now() - ageMs,
      action: 'test',
      atomCount: 1,
    },
  };
}

describe('TimeBasedCompression', () => {
  describe('constructor', () => {
    it('should create with default config', () => {
      const strategy = new TimeBasedCompression();
      expect(strategy.name).toBe('time');
      expect(strategy.getKeepRecentForMs()).toBe(5 * 60 * 1000);
      expect(strategy.getKeepEvery()).toBe(5);
    });

    it('should create with custom config', () => {
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 60000,
        keepEvery: 3,
        minSnapshots: 5,
      });
      expect(strategy.getKeepRecentForMs()).toBe(60000);
      expect(strategy.getKeepEvery()).toBe(3);
    });
  });

  describe('shouldCompress', () => {
    it('should return false when disabled', () => {
      const strategy = new TimeBasedCompression({ enabled: false });
      const history = [createMockSnapshot('s1', 100000)];

      expect(strategy.shouldCompress(history, 0)).toBe(false);
    });

    it('should return false when history is short', () => {
      const strategy = new TimeBasedCompression({ minSnapshots: 10 });
      const history = [createMockSnapshot('s1', 1000)];

      expect(strategy.shouldCompress(history, 0)).toBe(false);
    });

    it('should return false when all snapshots are recent', () => {
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 60000,
        minSnapshots: 5,
      });
      const history = Array(10)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`, 1000));

      expect(strategy.shouldCompress(history, 9)).toBe(false);
    });

    it('should return true when there are old snapshots', () => {
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 60000,
        minSnapshots: 5,
      });
      const history = [
        ...Array(5)
          .fill(null)
          .map((_, i) => createMockSnapshot(`s${i}`, 1000)),
        ...Array(5)
          .fill(null)
          .map((_, i) => createMockSnapshot(`s${i + 5}`, 100000)),
      ];

      expect(strategy.shouldCompress(history, 9)).toBe(true);
    });
  });

  describe('compress', () => {
    it('should keep all recent snapshots', () => {
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 60000,
        keepEvery: 2,
      });
      const history = Array(5)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`, 1000));

      const result = strategy.compress(history);

      expect(result.length).toBe(5);
    });

    it('should compress old snapshots', () => {
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 60000,
        keepEvery: 2,
      });
      const history = [
        ...Array(3)
          .fill(null)
          .map((_, i) => createMockSnapshot(`recent${i}`, 1000)),
        ...Array(6)
          .fill(null)
          .map((_, i) => createMockSnapshot(`old${i}`, 100000)),
      ];

      const result = strategy.compress(history);

      // 3 recent + every 2nd old (6/2 = 3)
      expect(result.length).toBe(6);
    });

    it('should preserve order (recent first, then old)', () => {
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 60000,
        keepEvery: 1,
      });
      const history = [
        createMockSnapshot('old1', 100000),
        createMockSnapshot('recent1', 1000),
        createMockSnapshot('old2', 100000),
        createMockSnapshot('recent2', 1000),
      ];

      const result = strategy.compress(history);

      // Recent should come first
      expect(result[0].id).toContain('recent');
      expect(result[1].id).toContain('recent');
    });

    it('should record metadata', () => {
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 60000,
        keepEvery: 2,
      });
      const history = Array(10)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`, 100000));

      strategy.compress(history);

      const metadata = strategy.getMetadata();
      expect(metadata).not.toBeNull();
      expect(metadata?.originalCount).toBe(10);
      expect(metadata?.compressedCount).toBeLessThan(10);
    });

    it('should return empty array for empty history', () => {
      const strategy = new TimeBasedCompression();
      const result = strategy.compress([]);
      expect(result).toEqual([]);
    });
  });

  describe('getKeepRecentForMs', () => {
    it('should return configured value', () => {
      const strategy = new TimeBasedCompression({ keepRecentForMs: 120000 });
      expect(strategy.getKeepRecentForMs()).toBe(120000);
    });
  });

  describe('getKeepEvery', () => {
    it('should return configured value', () => {
      const strategy = new TimeBasedCompression({ keepEvery: 10 });
      expect(strategy.getKeepEvery()).toBe(10);
    });
  });
});

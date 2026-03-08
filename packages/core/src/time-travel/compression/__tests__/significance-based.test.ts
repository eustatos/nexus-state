/**
 * Significance-based compression tests
 */

import { describe, it, expect } from 'vitest';
import {
  SignificanceBasedCompression,
  compareSnapshots,
} from '../significance-based';
import type { Snapshot } from '../../types';

function createMockSnapshot(
  id: string,
  value: number = 1
): Snapshot {
  return {
    id,
    state: {
      atom1: { value, type: 'primitive', name: 'atom1', atomId: '1' },
    },
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 1,
    },
  };
}

describe('SignificanceBasedCompression', () => {
  describe('compareSnapshots', () => {
    it('should return different=true for different values', () => {
      const a = createMockSnapshot('s1', 1);
      const b = createMockSnapshot('s2', 2);

      const result = compareSnapshots(a, b);

      expect(result.different).toBe(true);
      expect(result.changedAtoms).toBe(1);
    });

    it('should return different=false for same values', () => {
      const a = createMockSnapshot('s1', 1);
      const b = createMockSnapshot('s2', 1);

      const result = compareSnapshots(a, b);

      expect(result.different).toBe(false);
      expect(result.changedAtoms).toBe(0);
    });

    it('should handle different atom counts', () => {
      const a: Snapshot = {
        id: 's1',
        state: {
          atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
        },
        metadata: { timestamp: Date.now(), action: 'test', atomCount: 1 },
      };
      const b: Snapshot = {
        id: 's2',
        state: {
          atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
          atom2: { value: 2, type: 'primitive', name: 'atom2', atomId: '2' },
        },
        metadata: { timestamp: Date.now(), action: 'test', atomCount: 2 },
      };

      const result = compareSnapshots(a, b);

      expect(result.changedAtoms).toBe(1);
    });
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const strategy = new SignificanceBasedCompression();
      expect(strategy.name).toBe('significance');
    });

    it('should create with custom config', () => {
      const strategy = new SignificanceBasedCompression({
        minChangeThreshold: 0.5,
        maxConsecutiveSimilar: 5,
      });
      const config = strategy.getConfig();
      expect(config.minChangeThreshold).toBe(0.5);
    });
  });

  describe('shouldCompress', () => {
    it('should return false when disabled', () => {
      const strategy = new SignificanceBasedCompression({ enabled: false });
      const history = Array(20)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`, i));

      expect(strategy.shouldCompress(history, 19)).toBe(false);
    });

    it('should return false when history is short', () => {
      const strategy = new SignificanceBasedCompression({ minSnapshots: 10 });
      const history = Array(5)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`, i));

      expect(strategy.shouldCompress(history, 4)).toBe(false);
    });
  });

  describe('compress', () => {
    it('should keep snapshots with significant changes', () => {
      const strategy = new SignificanceBasedCompression({
        minChangeThreshold: 0.3,
        maxConsecutiveSimilar: 3,
      });
      const history = [
        createMockSnapshot('s1', 1),
        createMockSnapshot('s2', 2),
        createMockSnapshot('s3', 3),
        createMockSnapshot('s4', 4),
      ];

      const result = strategy.compress(history);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should compress similar snapshots', () => {
      const strategy = new SignificanceBasedCompression({
        minChangeThreshold: 0.5,
        maxConsecutiveSimilar: 2,
      });
      // All similar snapshots
      const history = Array(10)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`, 1));

      const result = strategy.compress(history);

      expect(result.length).toBeLessThan(history.length);
    });

    it('should record metadata', () => {
      const strategy = new SignificanceBasedCompression();
      const history = Array(15)
        .fill(null)
        .map((_, i) => createMockSnapshot(`s${i}`, i));

      strategy.compress(history);

      const metadata = strategy.getMetadata();
      expect(metadata).not.toBeNull();
    });

    it('should return empty array for empty history', () => {
      const strategy = new SignificanceBasedCompression();
      const result = strategy.compress([]);
      expect(result).toEqual([]);
    });
  });

  describe('getConfig', () => {
    it('should return configuration', () => {
      const strategy = new SignificanceBasedCompression({
        minChangeThreshold: 0.7,
      });
      const config = strategy.getConfig();
      expect(config.minChangeThreshold).toBe(0.7);
    });
  });
});

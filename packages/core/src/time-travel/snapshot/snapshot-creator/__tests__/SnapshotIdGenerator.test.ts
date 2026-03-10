/**
 * SnapshotIdGenerator tests
 */

import { describe, it, expect } from 'vitest';
import { SnapshotIdGenerator } from '../SnapshotIdGenerator';

describe('SnapshotIdGenerator', () => {
  describe('generate', () => {
    it('should generate unique IDs', () => {
      const generator = new SnapshotIdGenerator();
      const id1 = generator.generate();
      const id2 = generator.generate();

      expect(id1).not.toBe(id2);
    });

    it('should generate string IDs', () => {
      const generator = new SnapshotIdGenerator();
      const id = generator.generate();

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('generateWithPrefix', () => {
    it('should generate ID with prefix', () => {
      const generator = new SnapshotIdGenerator();
      const id = generator.generateWithPrefix('test');

      expect(id.startsWith('test-')).toBe(true);
    });

    it('should generate unique IDs with prefix', () => {
      const generator = new SnapshotIdGenerator();
      const id1 = generator.generateWithPrefix('test');
      const id2 = generator.generateWithPrefix('test');

      expect(id1).not.toBe(id2);
    });
  });

  describe('generateWithTimestamp', () => {
    it('should generate ID with timestamp', () => {
      const generator = new SnapshotIdGenerator();
      const id = generator.generateWithTimestamp();

      expect(id.startsWith('snap-')).toBe(true);
    });

    it('should include timestamp in ID', () => {
      const generator = new SnapshotIdGenerator();
      const before = Date.now();
      const id = generator.generateWithTimestamp();
      const after = Date.now();

      const timestamp = parseInt(id.split('-')[1]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate unique IDs with timestamp', () => {
      const generator = new SnapshotIdGenerator();
      const id1 = generator.generateWithTimestamp();
      const id2 = generator.generateWithTimestamp();

      expect(id1).not.toBe(id2);
    });
  });
});

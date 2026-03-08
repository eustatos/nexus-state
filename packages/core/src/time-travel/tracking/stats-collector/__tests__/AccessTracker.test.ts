/**
 * AccessTracker tests
 */

import { describe, it, expect } from 'vitest';
import { AccessTracker } from '../AccessTracker';
import type { TrackedAtom } from '../../types';

function createMockTrackedAtom(id: symbol, name: string): TrackedAtom {
  return {
    id,
    name,
    atom: {} as any,
    type: 'primitive',
    status: 'active',
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    lastChanged: Date.now(),
    accessCount: 0,
    idleTime: 0,
    ttl: 60000,
    gcEligible: false,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    changeCount: 0,
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accessCount: 0,
      changeCount: 0,
      tags: [],
      custom: {},
    },
    subscribers: new Set(),
  };
}

describe('AccessTracker', () => {
  describe('record', () => {
    it('should record atom access', () => {
      const tracker = new AccessTracker();
      const atomId = Symbol('test');

      tracker.record(atomId);

      expect(tracker.getCount(atomId)).toBe(1);
    });

    it('should increment access count', () => {
      const tracker = new AccessTracker();
      const atomId = Symbol('test');

      tracker.record(atomId);
      tracker.record(atomId);
      tracker.record(atomId);

      expect(tracker.getCount(atomId)).toBe(3);
    });
  });

  describe('getCount', () => {
    it('should return 0 for unknown atom', () => {
      const tracker = new AccessTracker();
      const atomId = Symbol('unknown');

      expect(tracker.getCount(atomId)).toBe(0);
    });

    it('should return access count', () => {
      const tracker = new AccessTracker();
      const atomId = Symbol('test');

      tracker.record(atomId);
      tracker.record(atomId);

      expect(tracker.getCount(atomId)).toBe(2);
    });
  });

  describe('getAllCounts', () => {
    it('should return empty map initially', () => {
      const tracker = new AccessTracker();
      expect(tracker.getAllCounts().size).toBe(0);
    });

    it('should return copy of counts', () => {
      const tracker = new AccessTracker();
      const atomId = Symbol('test');

      tracker.record(atomId);
      const counts1 = tracker.getAllCounts();
      const counts2 = tracker.getAllCounts();

      expect(counts1).toEqual(counts2);
      expect(counts1).not.toBe(counts2);
    });
  });

  describe('getStats', () => {
    it('should return zero stats when no accesses', () => {
      const tracker = new AccessTracker();
      const atoms: TrackedAtom[] = [];

      const stats = tracker.getStats(atoms);

      expect(stats.totalAccesses).toBe(0);
      expect(stats.mostAccessed).toEqual([]);
    });

    it('should return correct total accesses', () => {
      const tracker = new AccessTracker();
      const atomId1 = Symbol('test1');
      const atomId2 = Symbol('test2');

      tracker.record(atomId1);
      tracker.record(atomId1);
      tracker.record(atomId2);

      const atoms = [
        createMockTrackedAtom(atomId1, 'test1'),
        createMockTrackedAtom(atomId2, 'test2'),
      ];

      const stats = tracker.getStats(atoms);

      expect(stats.totalAccesses).toBe(3);
    });

    it('should return most accessed atoms', () => {
      const tracker = new AccessTracker();
      const atomId1 = Symbol('test1');
      const atomId2 = Symbol('test2');

      tracker.record(atomId1);
      tracker.record(atomId1);
      tracker.record(atomId1);
      tracker.record(atomId2);

      const atoms = [
        createMockTrackedAtom(atomId1, 'test1'),
        createMockTrackedAtom(atomId2, 'test2'),
      ];

      const stats = tracker.getStats(atoms);

      expect(stats.mostAccessed[0].name).toBe('test1');
      expect(stats.mostAccessed[0].count).toBe(3);
    });

    it('should return least accessed atoms', () => {
      const tracker = new AccessTracker();
      const atomId1 = Symbol('test1');
      const atomId2 = Symbol('test2');

      tracker.record(atomId1);
      tracker.record(atomId1);
      tracker.record(atomId1);
      tracker.record(atomId2);

      const atoms = [
        createMockTrackedAtom(atomId1, 'test1'),
        createMockTrackedAtom(atomId2, 'test2'),
      ];

      const stats = tracker.getStats(atoms);

      expect(stats.leastAccessed[0].name).toBe('test2');
      expect(stats.leastAccessed[0].count).toBe(1);
    });
  });

  describe('reset', () => {
    it('should clear all access counts', () => {
      const tracker = new AccessTracker();
      const atomId = Symbol('test');

      tracker.record(atomId);
      tracker.record(atomId);
      tracker.reset();

      expect(tracker.getCount(atomId)).toBe(0);
    });
  });

  describe('getTrackedCount', () => {
    it('should return 0 initially', () => {
      const tracker = new AccessTracker();
      expect(tracker.getTrackedCount()).toBe(0);
    });

    it('should return count of tracked atoms', () => {
      const tracker = new AccessTracker();
      const atomId1 = Symbol('test1');
      const atomId2 = Symbol('test2');

      tracker.record(atomId1);
      tracker.record(atomId2);

      expect(tracker.getTrackedCount()).toBe(2);
    });
  });
});

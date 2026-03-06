/**
 * ReferenceCounter tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReferenceCounter } from '../ReferenceCounter';
import type { TrackedAtom } from '../types';

function createMockAtom(name: string, id?: symbol): TrackedAtom {
  const now = Date.now();
  return {
    id: id || Symbol(name),
    atom: {} as any,
    name,
    type: 'primitive',
    status: 'active',
    createdAt: now,
    lastAccessed: now,
    lastChanged: now,
    accessCount: 0,
    idleTime: 0,
    ttl: 300000,
    gcEligible: true,
    firstSeen: now,
    lastSeen: now,
    changeCount: 0,
    metadata: {
      createdAt: now,
      type: 'primitive',
    },
  };
}

describe('ReferenceCounter', () => {
  let counter: ReferenceCounter;

  beforeEach(() => {
    counter = new ReferenceCounter();
  });

  describe('recordAccess', () => {
    it('should record atom access', () => {
      const atom = createMockAtom('atom1');

      counter.recordAccess(atom);

      expect(counter.getAccessCount(atom)).toBe(1);
      expect(atom.lastAccessTimestamp).toBeDefined();
    });

    it('should increment access count on multiple accesses', () => {
      const atom = createMockAtom('atom1');

      counter.recordAccess(atom);
      counter.recordAccess(atom);
      counter.recordAccess(atom);

      expect(counter.getAccessCount(atom)).toBe(3);
    });

    it('should track access for multiple atoms', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');

      counter.recordAccess(atom1);
      counter.recordAccess(atom1);
      counter.recordAccess(atom2);

      expect(counter.getAccessCount(atom1)).toBe(2);
      expect(counter.getAccessCount(atom2)).toBe(1);
    });

    it('should update lastAccessTimestamp', () => {
      const atom = createMockAtom('atom1');
      const beforeAccess = Date.now();

      counter.recordAccess(atom);

      const afterAccess = Date.now();

      expect(atom.lastAccessTimestamp).toBeGreaterThanOrEqual(beforeAccess);
      expect(atom.lastAccessTimestamp).toBeLessThanOrEqual(afterAccess);
    });
  });

  describe('addSubscriber', () => {
    it('should add subscriber to atom', () => {
      const atom = createMockAtom('atom1');

      counter.addSubscriber(atom, 'subscriber-1', 'component');

      expect(counter.getSubscriberCount(atom)).toBe(1);
      expect(atom.subscribers?.has('subscriber-1')).toBe(true);
    });

    it('should initialize subscribers set if needed', () => {
      const atom = createMockAtom('atom1');

      counter.addSubscriber(atom, 'subscriber-1');

      expect(atom.subscribers).toBeDefined();
    });

    it('should track subscriber info', () => {
      const atom = createMockAtom('atom1');
      const beforeSubscribe = Date.now();

      counter.addSubscriber(atom, 'subscriber-1', 'effect');

      const info = counter.getSubscriberInfo(atom);

      expect(info.length).toBe(1);
      expect(info[0]?.id).toBe('subscriber-1');
      expect(info[0]?.type).toBe('effect');
      expect(info[0]?.subscribedAt).toBeGreaterThanOrEqual(beforeSubscribe);
    });

    it('should add multiple subscribers', () => {
      const atom = createMockAtom('atom1');

      counter.addSubscriber(atom, 'subscriber-1', 'component');
      counter.addSubscriber(atom, 'subscriber-2', 'effect');
      counter.addSubscriber(atom, 'subscriber-3', 'manual');

      expect(counter.getSubscriberCount(atom)).toBe(3);
    });

    it('should handle different subscriber types', () => {
      const atom = createMockAtom('atom1');

      counter.addSubscriber(atom, 'sub1', 'component');
      counter.addSubscriber(atom, 'sub2', 'effect');
      counter.addSubscriber(atom, 'sub3', 'manual');
      counter.addSubscriber(atom, 'sub4', 'unknown');

      const info = counter.getSubscriberInfo(atom);

      expect(info.map((i) => i.type)).toEqual([
        'component',
        'effect',
        'manual',
        'unknown',
      ]);
    });

    it('should default to unknown subscriber type', () => {
      const atom = createMockAtom('atom1');

      counter.addSubscriber(atom, 'subscriber-1');

      const info = counter.getSubscriberInfo(atom);
      expect(info[0]?.type).toBe('unknown');
    });
  });

  describe('removeSubscriber', () => {
    it('should remove subscriber from atom', () => {
      const atom = createMockAtom('atom1');
      counter.addSubscriber(atom, 'subscriber-1');

      const removed = counter.removeSubscriber(atom, 'subscriber-1');

      expect(removed).toBe(true);
      expect(counter.getSubscriberCount(atom)).toBe(0);
    });

    it('should return false for non-existent subscriber', () => {
      const atom = createMockAtom('atom1');

      const removed = counter.removeSubscriber(atom, 'non-existent');

      expect(removed).toBe(false);
    });

    it('should return false when atom has no subscribers', () => {
      const atom = createMockAtom('atom1');

      const removed = counter.removeSubscriber(atom, 'subscriber-1');

      expect(removed).toBe(false);
    });

    it('should clean up subscriber info when last subscriber removed', () => {
      const atom = createMockAtom('atom1');
      counter.addSubscriber(atom, 'subscriber-1');

      counter.removeSubscriber(atom, 'subscriber-1');

      expect(counter.getSubscriberInfo(atom)).toEqual([]);
    });

    it('should keep other subscribers when removing one', () => {
      const atom = createMockAtom('atom1');
      counter.addSubscriber(atom, 'subscriber-1');
      counter.addSubscriber(atom, 'subscriber-2');

      counter.removeSubscriber(atom, 'subscriber-1');

      expect(counter.getSubscriberCount(atom)).toBe(1);
      expect(counter.getSubscriberInfo(atom)[0]?.id).toBe('subscriber-2');
    });
  });

  describe('getSubscriberCount', () => {
    it('should return 0 for atom with no subscribers', () => {
      const atom = createMockAtom('atom1');

      expect(counter.getSubscriberCount(atom)).toBe(0);
    });

    it('should return correct subscriber count', () => {
      const atom = createMockAtom('atom1');
      counter.addSubscriber(atom, 'sub1');
      counter.addSubscriber(atom, 'sub2');

      expect(counter.getSubscriberCount(atom)).toBe(2);
    });
  });

  describe('getAccessCount', () => {
    it('should return 0 for atom with no access', () => {
      const atom = createMockAtom('atom1');

      expect(counter.getAccessCount(atom)).toBe(0);
    });

    it('should return correct access count', () => {
      const atom = createMockAtom('atom1');
      counter.recordAccess(atom);
      counter.recordAccess(atom);

      expect(counter.getAccessCount(atom)).toBe(2);
    });
  });

  describe('getSubscriberInfo', () => {
    it('should return empty array for atom with no subscribers', () => {
      const atom = createMockAtom('atom1');

      const info = counter.getSubscriberInfo(atom);

      expect(info).toEqual([]);
    });

    it('should return subscriber info array', () => {
      const atom = createMockAtom('atom1');
      counter.addSubscriber(atom, 'sub1', 'component');

      const info = counter.getSubscriberInfo(atom);

      expect(info.length).toBe(1);
      expect(info[0]?.id).toBe('sub1');
    });
  });

  describe('hasSubscribers', () => {
    it('should return false for atom with no subscribers', () => {
      const atom = createMockAtom('atom1');

      expect(counter.hasSubscribers(atom)).toBe(false);
    });

    it('should return true for atom with subscribers', () => {
      const atom = createMockAtom('atom1');
      counter.addSubscriber(atom, 'subscriber-1');

      expect(counter.hasSubscribers(atom)).toBe(true);
    });

    it('should return false after removing all subscribers', () => {
      const atom = createMockAtom('atom1');
      counter.addSubscriber(atom, 'subscriber-1');
      counter.removeSubscriber(atom, 'subscriber-1');

      expect(counter.hasSubscribers(atom)).toBe(false);
    });
  });

  describe('getAtomsWithNoSubscribers', () => {
    it('should return atoms with no subscribers', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');
      counter.addSubscriber(atom1, 'subscriber-1');

      const result = counter.getAtomsWithNoSubscribers([atom1, atom2]);

      expect(result.length).toBe(1);
      expect(result[0]?.name).toBe('atom2');
    });

    it('should return empty array when all atoms have subscribers', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');
      counter.addSubscriber(atom1, 'subscriber-1');
      counter.addSubscriber(atom2, 'subscriber-2');

      const result = counter.getAtomsWithNoSubscribers([atom1, atom2]);

      expect(result).toEqual([]);
    });

    it('should return all atoms when none have subscribers', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');

      const result = counter.getAtomsWithNoSubscribers([atom1, atom2]);

      expect(result.length).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return reference statistics', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');

      counter.recordAccess(atom1);
      counter.recordAccess(atom1);
      counter.recordAccess(atom2);
      counter.addSubscriber(atom1, 'sub1');

      const stats = counter.getStats([atom1, atom2]);

      expect(stats.totalReferences).toBe(3);
      expect(stats.totalSubscribers).toBe(1);
      expect(stats.averageSubscribers).toBe(0.5);
    });

    it('should count atoms with no subscribers', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');
      counter.addSubscriber(atom1, 'sub1');

      const stats = counter.getStats([atom1, atom2]);

      expect(stats.atomsWithNoSubscribers).toBe(1);
    });

    it('should return zero stats for empty atoms array', () => {
      const stats = counter.getStats([]);

      expect(stats.totalReferences).toBe(0);
      expect(stats.totalSubscribers).toBe(0);
      expect(stats.averageSubscribers).toBe(0);
      expect(stats.atomsWithNoSubscribers).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all reference data', () => {
      const atom1 = createMockAtom('atom1');
      counter.recordAccess(atom1);
      counter.addSubscriber(atom1, 'sub1');

      counter.clear();

      // Note: clear() clears internal maps, but atom.subscribers set is on the atom object
      // So getSubscriberCount will still see the set on the atom
      expect(counter.getAccessCount(atom1)).toBe(0);
      // The atom's subscribers set still exists, but counter's internal info is cleared
      expect(counter.getSubscriberInfo(atom1)).toEqual([]);
    });
  });

  describe('clearAccessCounts', () => {
    it('should clear only access counts', () => {
      const atom1 = createMockAtom('atom1');
      counter.recordAccess(atom1);
      counter.addSubscriber(atom1, 'sub1');

      counter.clearAccessCounts();

      expect(counter.getAccessCount(atom1)).toBe(0);
      expect(counter.getSubscriberCount(atom1)).toBe(1);
    });
  });

  describe('clearSubscriberInfo', () => {
    it('should clear only subscriber info', () => {
      const atom1 = createMockAtom('atom1');
      counter.recordAccess(atom1);
      counter.addSubscriber(atom1, 'sub1');

      counter.clearSubscriberInfo();

      expect(counter.getAccessCount(atom1)).toBe(1);
      expect(counter.getSubscriberInfo(atom1)).toEqual([]);
    });
  });
});

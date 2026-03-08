/**
 * TrackingStatsCollector tests
 */

import { describe, it, expect } from 'vitest';
import { TrackingStatsCollector } from '../TrackingStatsCollector';
import type { TrackedAtom } from '../../types';

function createMockTrackedAtom(
  id: symbol,
  name: string,
  type: string = 'primitive',
  status: string = 'active'
): TrackedAtom {
  return {
    id,
    name,
    atom: {} as any,
    type: type as any,
    status: status as any,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
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

describe('TrackingStatsCollector', () => {
  describe('collect', () => {
    it('should collect tracking stats', () => {
      const collector = new TrackingStatsCollector();
      const atoms: TrackedAtom[] = [];

      const stats = collector.collect(atoms);

      expect(stats).toBeDefined();
      expect(stats.totalAtoms).toBe(0);
    });

    it('should count atoms by status', () => {
      const collector = new TrackingStatsCollector();
      const atoms = [
        createMockTrackedAtom(Symbol('1'), 'atom1', 'primitive', 'active'),
        createMockTrackedAtom(Symbol('2'), 'atom2', 'primitive', 'idle'),
        createMockTrackedAtom(Symbol('3'), 'atom3', 'primitive', 'stale'),
      ];

      const stats = collector.collect(atoms);

      expect(stats.totalAtoms).toBe(3);
    });

    it('should count atoms by type', () => {
      const collector = new TrackingStatsCollector();
      const atoms = [
        createMockTrackedAtom(Symbol('1'), 'atom1', 'primitive'),
        createMockTrackedAtom(Symbol('2'), 'atom2', 'computed'),
        createMockTrackedAtom(Symbol('3'), 'atom3', 'writable'),
      ];

      const stats = collector.collect(atoms);

      expect(stats.byType['primitive']).toBe(1);
      expect(stats.byType['computed']).toBe(1);
      expect(stats.byType['writable']).toBe(1);
    });
  });

  describe('calculateSubscriberStats', () => {
    it('should calculate subscriber statistics', () => {
      const collector = new TrackingStatsCollector();
      const atom1 = createMockTrackedAtom(Symbol('1'), 'atom1');
      atom1.subscribers.add('sub1');
      atom1.subscribers.add('sub2');

      const atom2 = createMockTrackedAtom(Symbol('2'), 'atom2');

      const atoms = [atom1, atom2];

      const stats = collector.calculateSubscriberStats(atoms);

      expect(stats.totalSubscribers).toBe(2);
      expect(stats.atomsWithNoSubscribers).toBe(1);
      expect(stats.averageSubscribers).toBe(1);
    });

    it('should handle empty atoms array', () => {
      const collector = new TrackingStatsCollector();
      const stats = collector.calculateSubscriberStats([]);

      expect(stats.totalSubscribers).toBe(0);
      expect(stats.averageSubscribers).toBe(0);
    });
  });

  describe('calculateStatusStats', () => {
    it('should calculate status statistics', () => {
      const collector = new TrackingStatsCollector();
      const atoms = [
        createMockTrackedAtom(Symbol('1'), 'atom1', 'primitive', 'active'),
        createMockTrackedAtom(Symbol('2'), 'atom2', 'primitive', 'idle'),
        createMockTrackedAtom(Symbol('3'), 'atom3', 'primitive', 'stale'),
      ];

      const stats = collector.calculateStatusStats(atoms);

      expect(stats.active).toBe(1);
      expect(stats.idle).toBe(1);
      expect(stats.stale).toBe(1);
      expect(stats.total).toBe(3);
    });
  });

  describe('calculateTypeStats', () => {
    it('should calculate type statistics', () => {
      const collector = new TrackingStatsCollector();
      const atoms = [
        createMockTrackedAtom(Symbol('1'), 'atom1', 'primitive'),
        createMockTrackedAtom(Symbol('2'), 'atom2', 'primitive'),
        createMockTrackedAtom(Symbol('3'), 'atom3', 'computed'),
      ];

      const stats = collector.calculateTypeStats(atoms);

      expect(stats['primitive']).toBe(2);
      expect(stats['computed']).toBe(1);
    });

    it('should handle unknown types', () => {
      const collector = new TrackingStatsCollector();
      const atoms = [
        createMockTrackedAtom(Symbol('1'), 'atom1', 'unknown'),
      ];

      const stats = collector.calculateTypeStats(atoms);

      expect(stats['unknown']).toBe(1);
    });
  });
});

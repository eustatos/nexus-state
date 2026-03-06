/**
 * TrackedAtomsRepository tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TrackedAtomsRepository } from '../TrackedAtomsRepository';
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

describe('TrackedAtomsRepository', () => {
  let repository: TrackedAtomsRepository;

  beforeEach(() => {
    repository = new TrackedAtomsRepository();
  });

  describe('track', () => {
    it('should track an atom', () => {
      const atom = createMockAtom('atom1');

      const result = repository.track(atom);

      expect(result).toBe(true);
      expect(repository.getCount()).toBe(1);
    });

    it('should not track duplicate atom', () => {
      const atom = createMockAtom('atom1');
      repository.track(atom);

      const result = repository.track(atom);

      expect(result).toBe(false);
      expect(repository.getCount()).toBe(1);
    });

    it('should index atom by name', () => {
      const atom = createMockAtom('atom1');

      repository.track(atom);

      expect(repository.isTrackedByName('atom1')).toBe(true);
    });

    it('should track multiple atoms with same name', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom1');

      repository.track(atom1);
      repository.track(atom2);

      expect(repository.getCount()).toBe(2);
      expect(repository.getByName('atom1').length).toBe(2);
    });

    it('should track atoms of different types', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2', Symbol('atom2'));
      atom2.type = 'computed';

      repository.track(atom1);
      repository.track(atom2);

      expect(repository.getCount()).toBe(2);
    });
  });

  describe('untrack', () => {
    it('should untrack an atom', () => {
      const atom = createMockAtom('atom1');
      repository.track(atom);

      const result = repository.untrack(atom.id);

      expect(result).toBe(true);
      expect(repository.getCount()).toBe(0);
    });

    it('should return false for non-existent atom', () => {
      const result = repository.untrack(Symbol('non-existent'));

      expect(result).toBe(false);
    });

    it('should remove atom from name index', () => {
      const atom = createMockAtom('atom1');
      repository.track(atom);
      repository.untrack(atom.id);

      expect(repository.isTrackedByName('atom1')).toBe(false);
    });

    it('should keep name index when other atoms with same name exist', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom1');
      repository.track(atom1);
      repository.track(atom2);

      repository.untrack(atom1.id);

      expect(repository.isTrackedByName('atom1')).toBe(true);
      expect(repository.getByName('atom1').length).toBe(1);
    });

    it('should remove name index when last atom is untracked', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom1');
      repository.track(atom1);
      repository.track(atom2);

      repository.untrack(atom1.id);
      repository.untrack(atom2.id);

      expect(repository.isTrackedByName('atom1')).toBe(false);
    });
  });

  describe('get', () => {
    it('should get atom by ID', () => {
      const atom = createMockAtom('atom1');
      repository.track(atom);

      const result = repository.get(atom.id);

      expect(result).toBeDefined();
      expect(result?.name).toBe('atom1');
    });

    it('should return undefined for non-existent atom', () => {
      const result = repository.get(Symbol('non-existent'));

      expect(result).toBeUndefined();
    });
  });

  describe('getByName', () => {
    it('should get atoms by name', () => {
      const atom = createMockAtom('atom1');
      repository.track(atom);

      const result = repository.getByName('atom1');

      expect(result.length).toBe(1);
      expect(result[0]?.name).toBe('atom1');
    });

    it('should return empty array for non-existent name', () => {
      const result = repository.getByName('non-existent');

      expect(result).toEqual([]);
    });

    it('should return all atoms with same name', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom1');
      repository.track(atom1);
      repository.track(atom2);

      const result = repository.getByName('atom1');

      expect(result.length).toBe(2);
    });
  });

  describe('getAll', () => {
    it('should return all tracked atoms', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');
      repository.track(atom1);
      repository.track(atom2);

      const result = repository.getAll();

      expect(result.length).toBe(2);
    });

    it('should return empty array when no atoms tracked', () => {
      const result = repository.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getAllIds', () => {
    it('should return all atom IDs', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');
      repository.track(atom1);
      repository.track(atom2);

      const result = repository.getAllIds();

      expect(result.length).toBe(2);
      expect(result).toContain(atom1.id);
      expect(result).toContain(atom2.id);
    });

    it('should return empty array when no atoms tracked', () => {
      const result = repository.getAllIds();

      expect(result).toEqual([]);
    });
  });

  describe('isTracked', () => {
    it('should return true for tracked atom', () => {
      const atom = createMockAtom('atom1');
      repository.track(atom);

      expect(repository.isTracked(atom.id)).toBe(true);
    });

    it('should return false for non-tracked atom', () => {
      const result = repository.isTracked(Symbol('non-existent'));

      expect(result).toBe(false);
    });
  });

  describe('isTrackedByName', () => {
    it('should return true for tracked name', () => {
      const atom = createMockAtom('atom1');
      repository.track(atom);

      expect(repository.isTrackedByName('atom1')).toBe(true);
    });

    it('should return false for non-tracked name', () => {
      expect(repository.isTrackedByName('non-existent')).toBe(false);
    });
  });

  describe('getCount', () => {
    it('should return count of tracked atoms', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');
      repository.track(atom1);
      repository.track(atom2);

      expect(repository.getCount()).toBe(2);
    });

    it('should return 0 when no atoms tracked', () => {
      expect(repository.getCount()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return statistics with correct total', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');
      
      repository.track(atom1);
      repository.track(atom2);

      const stats = repository.getStats();

      expect(stats.total).toBe(2);
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byStatus');
    });

    it('should count atoms by status', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');
      atom2.status = 'idle';
      repository.track(atom1);
      repository.track(atom2);

      const stats = repository.getStats();

      expect(stats.total).toBe(2);
      expect(stats.byStatus).toBeDefined();
    });

    it('should return zero stats when no atoms tracked', () => {
      const stats = repository.getStats();

      expect(stats.total).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byStatus).toEqual({});
    });

    it('should handle unknown types', () => {
      const atom = createMockAtom('atom1');
      atom.type = 'unknown-type';
      repository.track(atom);

      const stats = repository.getStats();

      expect(stats.total).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all tracked atoms', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');
      repository.track(atom1);
      repository.track(atom2);

      repository.clear();

      expect(repository.getCount()).toBe(0);
      expect(repository.getAll()).toEqual([]);
    });

    it('should clear name index', () => {
      const atom = createMockAtom('atom1');
      repository.track(atom);
      repository.clear();

      expect(repository.isTrackedByName('atom1')).toBe(false);
    });
  });
});

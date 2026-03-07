/**
 * TTLManager tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TTLManager } from '../TTLManager';
import type { TrackedAtom } from '../types';

function createMockAtom(name: string, overrides?: Partial<TrackedAtom>): TrackedAtom {
  const now = Date.now();
  return {
    id: Symbol(name),
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
    ...overrides,
  };
}

describe('TTLManager', () => {
  let ttlManager: TTLManager;

  beforeEach(() => {
    ttlManager = new TTLManager();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const manager = new TTLManager();

      expect(manager).toBeDefined();
    });

    it('should create with custom config', () => {
      const manager = new TTLManager({
        defaultTTL: 60000,
        idleTimeout: 10000,
        staleTimeout: 30000,
      });

      expect(manager).toBeDefined();
    });
  });

  describe('getTTLForAtom', () => {
    it('should return type-specific TTL', () => {
      const manager = new TTLManager({
        ttlByType: { computed: 60000 },
      });

      const atom = createMockAtom('atom1', { type: 'computed' });

      expect(manager.getTTLForAtom(atom)).toBe(60000);
    });

    it('should return atom-specific TTL', () => {
      const atom = createMockAtom('atom1', { ttl: 120000 });

      expect(ttlManager.getTTLForAtom(atom)).toBe(120000);
    });

    it('should return default TTL', () => {
      const atom = createMockAtom('atom1');

      expect(ttlManager.getTTLForAtom(atom)).toBe(300000);
    });

    it('should prioritize type-specific TTL over default', () => {
      const manager = new TTLManager({
        ttlByType: { primitive: 60000 },
        defaultTTL: 300000,
      });

      const atom = createMockAtom('atom1', { type: 'primitive' });

      expect(manager.getTTLForAtom(atom)).toBe(60000);
    });
  });

  describe('isExpired', () => {
    it('should return false for recently accessed atom', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now(),
      });

      expect(ttlManager.isExpired(atom)).toBe(false);
    });

    it('should return true for stale atom', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 400000, // Older than default TTL
      });

      expect(ttlManager.isExpired(atom)).toBe(true);
    });

    it('should use atom-specific TTL', () => {
      const atom = createMockAtom('atom1', {
        ttl: 10000,
        lastAccessed: Date.now() - 20000,
      });

      expect(ttlManager.isExpired(atom)).toBe(true);
    });

    it('should use createdAt when lastAccessed is missing', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: undefined as any,
        createdAt: Date.now() - 400000,
      });

      expect(ttlManager.isExpired(atom)).toBe(true);
    });
  });

  describe('isIdle', () => {
    it('should return false for recently accessed atom', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now(),
      });

      expect(ttlManager.isIdle(atom)).toBe(false);
    });

    it('should return true for idle atom', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 120000, // Older than default idleTimeout
      });

      expect(ttlManager.isIdle(atom)).toBe(true);
    });

    it('should use custom idleTimeout', () => {
      const manager = new TTLManager({ idleTimeout: 5000 });
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 10000,
      });

      expect(manager.isIdle(atom)).toBe(true);
    });
  });

  describe('isStale', () => {
    it('should return false for recently accessed atom', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now(),
      });

      expect(ttlManager.isStale(atom)).toBe(false);
    });

    it('should return true for stale atom', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 200000, // Older than default staleTimeout
      });

      expect(ttlManager.isStale(atom)).toBe(true);
    });

    it('should use custom staleTimeout', () => {
      const manager = new TTLManager({ staleTimeout: 5000 });
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 10000,
      });

      expect(manager.isStale(atom)).toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should return active for recently accessed atom', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now(),
      });

      expect(ttlManager.getStatus(atom)).toBe('active');
    });

    it('should return idle for idle atom', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 120000,
      });

      expect(ttlManager.getStatus(atom)).toBe('idle');
    });

    it('should return stale for stale atom', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 200000,
      });

      expect(ttlManager.getStatus(atom)).toBe('stale');
    });

    it('should prioritize stale over idle', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 200000,
      });

      expect(ttlManager.getStatus(atom)).toBe('stale');
    });
  });

  describe('updateStatus', () => {
    it('should update atom status', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 200000,
      });

      const status = ttlManager.updateStatus(atom);

      expect(status).toBe('stale');
      expect(atom.status).toBe('stale');
    });

    it('should return updated status', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now(),
      });

      const status = ttlManager.updateStatus(atom);

      expect(status).toBe('active');
    });
  });

  describe('updateStatuses', () => {
    it('should update statuses for multiple atoms', () => {
      const atom1 = createMockAtom('atom1', { lastAccessed: Date.now() });
      const atom2 = createMockAtom('atom2', {
        lastAccessed: Date.now() - 200000,
      });

      const statuses = ttlManager.updateStatuses([atom1, atom2]);

      expect(statuses.get(atom1.id)).toBe('active');
      expect(statuses.get(atom2.id)).toBe('stale');
    });

    it('should return map of all statuses', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('atom2');

      const statuses = ttlManager.updateStatuses([atom1, atom2]);

      expect(statuses.size).toBe(2);
    });
  });

  describe('getExpiredAtoms', () => {
    it('should return stale atoms', () => {
      const atom1 = createMockAtom('atom1', {
        lastAccessed: Date.now() - 400000,
      });
      const atom2 = createMockAtom('atom2', {
        lastAccessed: Date.now(),
      });

      const expired = ttlManager.getExpiredAtoms([atom1, atom2]);

      expect(expired.length).toBe(1);
      expect(expired[0]?.name).toBe('atom1');
    });

    it('should return empty array when no stale atoms', () => {
      const atom1 = createMockAtom('atom1', {
        lastAccessed: Date.now(),
      });
      const atom2 = createMockAtom('atom2', {
        lastAccessed: Date.now(),
      });

      const expired = ttlManager.getExpiredAtoms([atom1, atom2]);

      expect(expired).toEqual([]);
    });
  });

  describe('getIdleAtoms', () => {
    it('should return idle atoms', () => {
      const atom1 = createMockAtom('atom1', {
        lastAccessed: Date.now() - 120000,
      });
      const atom2 = createMockAtom('atom2', {
        lastAccessed: Date.now(),
      });

      const idle = ttlManager.getIdleAtoms([atom1, atom2]);

      expect(idle.length).toBe(1);
      expect(idle[0]?.name).toBe('atom1');
    });
  });

  describe('getStaleAtoms', () => {
    it('should return stale atoms', () => {
      const atom1 = createMockAtom('atom1', {
        lastAccessed: Date.now() - 200000,
      });
      const atom2 = createMockAtom('atom2', {
        lastAccessed: Date.now(),
      });

      const stale = ttlManager.getStaleAtoms([atom1, atom2]);

      expect(stale.length).toBe(1);
      expect(stale[0]?.name).toBe('atom1');
    });
  });

  describe('getTTLResult', () => {
    it('should return TTL result', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 200000,
      });

      const result = ttlManager.getTTLResult(atom);

      expect(result.atomId).toBe(atom.id);
      expect(result.atomName).toBe('atom1');
      expect(result.status).toBe('stale');
      expect(result.timeSinceAccess).toBeGreaterThan(0);
      expect(result.ttl).toBe(300000);
      expect(result.isExpired).toBe(true);
    });

    it('should return isExpired true for stale atom', () => {
      const atom = createMockAtom('atom1', {
        lastAccessed: Date.now() - 400000,
      });

      const result = ttlManager.getTTLResult(atom);

      expect(result.isExpired).toBe(true);
      expect(result.status).toBe('stale');
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      ttlManager.configure({ defaultTTL: 60000 });

      const config = ttlManager.getConfig();
      expect(config.defaultTTL).toBe(60000);
    });

    it('should merge partial configuration', () => {
      ttlManager.configure({ idleTimeout: 5000 });
      ttlManager.configure({ staleTimeout: 10000 });

      const config = ttlManager.getConfig();
      expect(config.idleTimeout).toBe(5000);
      expect(config.staleTimeout).toBe(10000);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = ttlManager.getConfig();

      expect(config.defaultTTL).toBe(300000);
      expect(config.idleTimeout).toBe(60000);
      expect(config.staleTimeout).toBe(180000);
    });
  });
});

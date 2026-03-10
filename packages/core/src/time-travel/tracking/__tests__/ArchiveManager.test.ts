/**
 * ArchiveManager tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ArchiveManager } from '../ArchiveManager';
import type { TrackedAtom } from '../types';

function createMockTrackedAtom(id: symbol, name: string, status = 'active'): TrackedAtom {
  return {
    id,
    name,
    atom: {} as any,
    type: 'primitive',
    status,
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

describe('ArchiveManager', () => {
  describe('constructor', () => {
    it('should create with default config', () => {
      const manager = new ArchiveManager();
      expect(manager).toBeDefined();
    });

    it('should create with custom config', () => {
      const manager = new ArchiveManager({
        enabled: false,
        maxArchived: 500,
        autoCleanup: true,
        archiveTTL: 7200000,
      });
      expect(manager).toBeDefined();
    });
  });

  describe('archive', () => {
    it('should archive atom when enabled', () => {
      const manager = new ArchiveManager();
      const atom = createMockTrackedAtom(Symbol('test'), 'test');

      const result = manager.archive(atom, 'cleanup');

      expect(result).toBe(true);
      expect(manager.getCount()).toBe(1);
    });

    it('should not archive when disabled', () => {
      const manager = new ArchiveManager({ enabled: false });
      const atom = createMockTrackedAtom(Symbol('test'), 'test');

      const result = manager.archive(atom);

      expect(result).toBe(false);
      expect(manager.getCount()).toBe(0);
    });

    it('should store archive timestamp', () => {
      const manager = new ArchiveManager();
      const atom = createMockTrackedAtom(Symbol('test'), 'test');
      const beforeArchive = Date.now();

      manager.archive(atom);

      const archived = manager.getArchived(atom.id);
      expect(archived?.archivedAt).toBeGreaterThanOrEqual(beforeArchive);
    });

    it('should store archive reason', () => {
      const manager = new ArchiveManager();
      const atom = createMockTrackedAtom(Symbol('test'), 'test');

      manager.archive(atom, 'test-reason');

      const archived = manager.getArchived(atom.id);
      expect(archived?.reason).toBe('test-reason');
    });

    it('should store original status', () => {
      const manager = new ArchiveManager();
      const atom = createMockTrackedAtom(Symbol('test'), 'test', 'idle');

      manager.archive(atom);

      const archived = manager.getArchived(atom.id);
      expect(archived?.originalStatus).toBe('idle');
    });

    it('should trigger auto cleanup when enabled', () => {
      const manager = new ArchiveManager({
        autoCleanup: true,
        maxArchived: 2,
        archiveTTL: 1000,
      });

      manager.archive(createMockTrackedAtom(Symbol('1'), 'test1'));
      manager.archive(createMockTrackedAtom(Symbol('2'), 'test2'));
      manager.archive(createMockTrackedAtom(Symbol('3'), 'test3'));

      expect(manager.getCount()).toBeLessThanOrEqual(2);
    });
  });

  describe('restore', () => {
    it('should restore archived atom', () => {
      const manager = new ArchiveManager();
      const atom = createMockTrackedAtom(Symbol('test'), 'test', 'idle');
      manager.archive(atom);

      const restored = manager.restore(atom.id);

      expect(restored).toBeDefined();
      expect(restored?.status).toBe('idle');
    });

    it('should remove from archives after restore', () => {
      const manager = new ArchiveManager();
      const atom = createMockTrackedAtom(Symbol('test'), 'test');
      manager.archive(atom);

      manager.restore(atom.id);

      expect(manager.getArchived(atom.id)).toBeUndefined();
    });

    it('should return undefined for unknown atom', () => {
      const manager = new ArchiveManager();
      const atomId = Symbol('unknown');

      const restored = manager.restore(atomId);

      expect(restored).toBeUndefined();
    });
  });

  describe('getArchived', () => {
    it('should return archived atom', () => {
      const manager = new ArchiveManager();
      const atom = createMockTrackedAtom(Symbol('test'), 'test');
      manager.archive(atom);

      const archived = manager.getArchived(atom.id);

      expect(archived).toBeDefined();
      expect(archived?.name).toBe('test');
    });

    it('should return undefined for unknown atom', () => {
      const manager = new ArchiveManager();
      const atomId = Symbol('unknown');

      const archived = manager.getArchived(atomId);

      expect(archived).toBeUndefined();
    });
  });

  describe('getAllArchived', () => {
    it('should return all archived atoms', () => {
      const manager = new ArchiveManager();
      const atom1 = createMockTrackedAtom(Symbol('1'), 'test1');
      const atom2 = createMockTrackedAtom(Symbol('2'), 'test2');

      manager.archive(atom1);
      manager.archive(atom2);

      const archived = manager.getAllArchived();

      expect(archived.length).toBe(2);
    });

    it('should return empty array when no archives', () => {
      const manager = new ArchiveManager();
      const archived = manager.getAllArchived();

      expect(archived).toEqual([]);
    });
  });

  describe('getByReason', () => {
    it('should return atoms by reason', () => {
      const manager = new ArchiveManager();
      const atom1 = createMockTrackedAtom(Symbol('1'), 'test1');
      const atom2 = createMockTrackedAtom(Symbol('2'), 'test2');

      manager.archive(atom1, 'reason1');
      manager.archive(atom2, 'reason1');

      const byReason = manager.getByReason('reason1');

      expect(byReason.length).toBe(2);
    });

    it('should return empty array for unknown reason', () => {
      const manager = new ArchiveManager();
      const atom = createMockTrackedAtom(Symbol('1'), 'test1');
      manager.archive(atom, 'reason1');

      const byReason = manager.getByReason('unknown');

      expect(byReason).toEqual([]);
    });
  });

  describe('getExpiredArchives', () => {
    it('should return expired archives', () => {
      vi.useFakeTimers();
      const manager = new ArchiveManager({ archiveTTL: 1000 });
      const atom = createMockTrackedAtom(Symbol('1'), 'test1');
      manager.archive(atom);

      vi.advanceTimersByTime(2000);

      const expired = manager.getExpiredArchives();

      expect(expired.length).toBe(1);
      vi.useRealTimers();
    });

    it('should return empty array when no expired', () => {
      const manager = new ArchiveManager({ archiveTTL: 60000 });
      const atom = createMockTrackedAtom(Symbol('1'), 'test1');
      manager.archive(atom);

      const expired = manager.getExpiredArchives();

      expect(expired).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should remove archived atom', () => {
      const manager = new ArchiveManager();
      const atom = createMockTrackedAtom(Symbol('1'), 'test1');
      manager.archive(atom);

      const result = manager.remove(atom.id);

      expect(result).toBe(true);
      expect(manager.getCount()).toBe(0);
    });

    it('should return false for unknown atom', () => {
      const manager = new ArchiveManager();
      const atomId = Symbol('unknown');

      const result = manager.remove(atomId);

      expect(result).toBe(false);
    });
  });

  describe('cleanupOldArchives', () => {
    it('should remove expired archives', () => {
      vi.useFakeTimers();
      const manager = new ArchiveManager({ archiveTTL: 1000, autoCleanup: false });
      const atom = createMockTrackedAtom(Symbol('1'), 'test1');
      manager.archive(atom);

      vi.advanceTimersByTime(2000);
      const removed = manager.cleanupOldArchives();

      expect(removed).toBe(1);
      expect(manager.getCount()).toBe(0);
      vi.useRealTimers();
    });

    it('should remove excess archives over limit', () => {
      const manager = new ArchiveManager({
        maxArchived: 2,
        archiveTTL: 3600000,
        autoCleanup: false,
      });

      manager.archive(createMockTrackedAtom(Symbol('1'), 'test1'));
      manager.archive(createMockTrackedAtom(Symbol('2'), 'test2'));
      manager.archive(createMockTrackedAtom(Symbol('3'), 'test3'));

      const removed = manager.cleanupOldArchives();

      expect(removed).toBe(1);
      expect(manager.getCount()).toBe(2);
    });

    it('should return 0 when nothing to cleanup', () => {
      const manager = new ArchiveManager();
      const removed = manager.cleanupOldArchives();

      expect(removed).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return archive stats', () => {
      const manager = new ArchiveManager();
      const atom1 = createMockTrackedAtom(Symbol('1'), 'test1');
      const atom2 = createMockTrackedAtom(Symbol('2'), 'test2');

      manager.archive(atom1, 'reason1');
      manager.archive(atom2, 'reason1');

      const stats = manager.getStats();

      expect(stats.totalArchived).toBe(2);
      expect(stats.byReason['reason1']).toBe(2);
    });

    it('should group by reason', () => {
      const manager = new ArchiveManager();
      manager.archive(createMockTrackedAtom(Symbol('1'), 'test1'), 'reason1');
      manager.archive(createMockTrackedAtom(Symbol('2'), 'test2'), 'reason2');

      const stats = manager.getStats();

      expect(stats.byReason['reason1']).toBe(1);
      expect(stats.byReason['reason2']).toBe(1);
    });

    it('should return oldest and newest archive', () => {
      vi.useFakeTimers();
      const manager = new ArchiveManager();

      manager.archive(createMockTrackedAtom(Symbol('1'), 'test1'));
      vi.advanceTimersByTime(1000);
      manager.archive(createMockTrackedAtom(Symbol('2'), 'test2'));

      const stats = manager.getStats();

      expect(stats.oldestArchive).toBeDefined();
      expect(stats.newestArchive).toBeDefined();
      expect(stats.newestArchive! - stats.oldestArchive!).toBe(1000);
      vi.useRealTimers();
    });

    it('should return undefined timestamps when no archives', () => {
      const manager = new ArchiveManager();
      const stats = manager.getStats();

      expect(stats.totalArchived).toBe(0);
      expect(stats.oldestArchive).toBeUndefined();
      expect(stats.newestArchive).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all archives', () => {
      const manager = new ArchiveManager();
      manager.archive(createMockTrackedAtom(Symbol('1'), 'test1'));
      manager.archive(createMockTrackedAtom(Symbol('2'), 'test2'));

      manager.clear();

      expect(manager.getCount()).toBe(0);
    });
  });

  describe('getCount', () => {
    it('should return archived count', () => {
      const manager = new ArchiveManager();
      manager.archive(createMockTrackedAtom(Symbol('1'), 'test1'));
      manager.archive(createMockTrackedAtom(Symbol('2'), 'test2'));

      expect(manager.getCount()).toBe(2);
    });

    it('should return 0 when no archives', () => {
      const manager = new ArchiveManager();
      expect(manager.getCount()).toBe(0);
    });
  });

  describe('getConfig', () => {
    it('should return config', () => {
      const manager = new ArchiveManager({
        enabled: false,
        maxArchived: 500,
      });

      const config = manager.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.maxArchived).toBe(500);
    });
  });

  describe('configure', () => {
    it('should update config', () => {
      const manager = new ArchiveManager();

      manager.configure({ maxArchived: 200 });

      const config = manager.getConfig();
      expect(config.maxArchived).toBe(200);
    });

    it('should preserve existing config', () => {
      const manager = new ArchiveManager({ enabled: false, maxArchived: 500 });

      manager.configure({ maxArchived: 200 });

      const config = manager.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.maxArchived).toBe(200);
    });
  });
});

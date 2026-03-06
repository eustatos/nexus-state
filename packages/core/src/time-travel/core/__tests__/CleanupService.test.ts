/**
 * CleanupService tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CleanupService } from '../CleanupService';
import type { TrackedAtom } from '../tracking/types';

describe('CleanupService', () => {
  let cleanupService: CleanupService;

  const createTrackedAtom = (name: string): TrackedAtom => ({
    id: Symbol(name),
    name,
    value: 'test-value',
  });

  beforeEach(() => {
    cleanupService = new CleanupService();
  });

  afterEach(() => {
    cleanupService.dispose();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const service = new CleanupService();
      const config = service.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.defaultTTL).toBe(300000);
      expect(config.cleanupInterval).toBe(60000);
      expect(config.minAgeBeforeCleanup).toBe(1000);
    });

    it('should create with custom config', () => {
      const service = new CleanupService({
        enabled: false,
        defaultTTL: 60000,
        cleanupInterval: 30000,
        minAgeBeforeCleanup: 5000,
      });

      const config = service.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.defaultTTL).toBe(60000);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      cleanupService.configure({ defaultTTL: 120000 });

      const config = cleanupService.getConfig();
      expect(config.defaultTTL).toBe(120000);
    });
  });

  describe('track', () => {
    it('should track atom with default TTL', () => {
      const atom = createTrackedAtom('testAtom');
      cleanupService.track(atom);

      expect(cleanupService.getTrackedCount()).toBe(1);
    });

    it('should track atom with custom TTL', () => {
      const atom = createTrackedAtom('testAtom');
      cleanupService.track(atom, 5000);

      const tracked = cleanupService.getTrackedAtom(atom.id);
      expect(tracked?.ttl).toBe(5000);
    });

    it('should not track when disabled', () => {
      const service = new CleanupService({ enabled: false });
      const atom = createTrackedAtom('testAtom');

      service.track(atom);

      expect(service.getTrackedCount()).toBe(0);
    });
  });

  describe('touch', () => {
    it('should handle non-existent atom', () => {
      const nonExistentId = Symbol('non-existent');

      expect(() => cleanupService.touch(nonExistentId)).not.toThrow();
    });
  });

  describe('untrack', () => {
    it('should stop tracking atom', () => {
      const atom = createTrackedAtom('testAtom');
      cleanupService.track(atom);

      expect(cleanupService.getTrackedCount()).toBe(1);

      cleanupService.untrack(atom.id);

      expect(cleanupService.getTrackedCount()).toBe(0);
    });

    it('should handle non-existent atom', () => {
      const nonExistentId = Symbol('non-existent');

      expect(() => cleanupService.untrack(nonExistentId)).not.toThrow();
    });
  });

  describe('getStaleAtoms', () => {
    it('should return empty array when no stale atoms', () => {
      const stale = cleanupService.getStaleAtoms();
      expect(stale).toHaveLength(0);
    });

    it('should respect minAgeBeforeCleanup', () => {
      vi.useFakeTimers();

      const service = new CleanupService({
        defaultTTL: 100,
        minAgeBeforeCleanup: 500,
      });

      const atom = createTrackedAtom('testAtom');
      service.track(atom);

      vi.advanceTimersByTime(200);

      const stale = service.getStaleAtoms();
      expect(stale).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should not return atoms with TTL 0', () => {
      const atom = createTrackedAtom('testAtom');
      cleanupService.track(atom, 0);

      const stale = cleanupService.getStaleAtoms();
      expect(stale).toHaveLength(0);
    });
  });

  describe('cleanupNow', () => {
    it('should handle cleanup errors', () => {
      vi.useFakeTimers();

      const atom = createTrackedAtom('testAtom');
      cleanupService.track(atom, 100);

      vi.advanceTimersByTime(200);

      const result = cleanupService.cleanupNow();

      expect(result.failedCount).toBe(0);

      vi.useRealTimers();
    });

    it('should update last cleanup timestamp', () => {
      const before = cleanupService.getStats().lastCleanupTimestamp;

      cleanupService.cleanupNow();

      const after = cleanupService.getStats().lastCleanupTimestamp;
      expect(after).toBeDefined();
      if (before) {
        expect(after!).toBeGreaterThanOrEqual(before);
      }
    });

    it('should increment total cleanups', () => {
      const before = cleanupService.getStats().totalCleanups;

      cleanupService.cleanupNow();

      const after = cleanupService.getStats().totalCleanups;
      expect(after).toBe(before + 1);
    });
  });

  describe('startAutoCleanup/stopAutoCleanup', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start auto cleanup', () => {
      const service = new CleanupService({ cleanupInterval: 100 });

      service.startAutoCleanup();

      vi.advanceTimersByTime(150);

      expect(service.getStats().totalCleanups).toBeGreaterThanOrEqual(1);

      service.stopAutoCleanup();
    });

    it('should stop auto cleanup', () => {
      const service = new CleanupService({ cleanupInterval: 100 });

      service.startAutoCleanup();
      service.stopAutoCleanup();

      const before = service.getStats().totalCleanups;
      vi.advanceTimersByTime(150);
      const after = service.getStats().totalCleanups;

      expect(after).toBe(before);
    });

    it('should restart auto cleanup if already running', () => {
      const service = new CleanupService({ cleanupInterval: 100 });

      service.startAutoCleanup();
      service.startAutoCleanup();

      vi.advanceTimersByTime(150);

      expect(service.getStats().totalCleanups).toBeGreaterThanOrEqual(1);

      service.stopAutoCleanup();
    });
  });

  describe('getStats', () => {
    it('should return stats for empty service', () => {
      const stats = cleanupService.getStats();

      expect(stats.totalTrackedAtoms).toBe(0);
      expect(stats.staleAtomsCount).toBe(0);
      expect(stats.totalCleanups).toBe(0);
    });

    it('should return stats with tracked atoms', () => {
      const atom = createTrackedAtom('testAtom');
      cleanupService.track(atom);

      const stats = cleanupService.getStats();

      expect(stats.totalTrackedAtoms).toBe(1);
    });

    it('should include last cleanup timestamp', () => {
      cleanupService.cleanupNow();

      const stats = cleanupService.getStats();
      expect(stats.lastCleanupTimestamp).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all tracked atoms', () => {
      cleanupService.track(createTrackedAtom('atom1'));
      cleanupService.track(createTrackedAtom('atom2'));

      expect(cleanupService.getTrackedCount()).toBe(2);

      cleanupService.clear();

      expect(cleanupService.getTrackedCount()).toBe(0);
    });
  });

  describe('getTrackedCount', () => {
    it('should return number of tracked atoms', () => {
      expect(cleanupService.getTrackedCount()).toBe(0);

      cleanupService.track(createTrackedAtom('atom1'));

      expect(cleanupService.getTrackedCount()).toBe(1);
    });
  });

  describe('getTrackedAtom', () => {
    it('should return tracked atom by ID', () => {
      const atom = createTrackedAtom('testAtom');
      cleanupService.track(atom);

      const tracked = cleanupService.getTrackedAtom(atom.id);

      expect(tracked).toBeDefined();
      expect(tracked?.name).toBe('testAtom');
    });

    it('should return undefined for non-existent ID', () => {
      const tracked = cleanupService.getTrackedAtom(Symbol('non-existent'));
      expect(tracked).toBeUndefined();
    });
  });

  describe('getAllTrackedAtoms', () => {
    it('should return all tracked atoms', () => {
      const atom1 = createTrackedAtom('atom1');
      const atom2 = createTrackedAtom('atom2');

      cleanupService.track(atom1);
      cleanupService.track(atom2);

      const all = cleanupService.getAllTrackedAtoms();

      expect(all).toHaveLength(2);
    });

    it('should return empty array when no atoms tracked', () => {
      const all = cleanupService.getAllTrackedAtoms();
      expect(all).toHaveLength(0);
    });
  });

  describe('dispose', () => {
    it('should stop auto cleanup and clear atoms', () => {
      vi.useFakeTimers();

      const service = new CleanupService({ cleanupInterval: 100 });
      service.track(createTrackedAtom('atom1'));
      service.startAutoCleanup();

      service.dispose();

      vi.advanceTimersByTime(150);

      expect(service.getTrackedCount()).toBe(0);

      vi.useRealTimers();
    });

    it('should handle dispose when not started', () => {
      expect(() => cleanupService.dispose()).not.toThrow();
    });
  });
});

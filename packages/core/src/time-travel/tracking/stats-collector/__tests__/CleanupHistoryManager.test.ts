/**
 * CleanupHistoryManager tests
 */

import { describe, it, expect } from 'vitest';
import { CleanupHistoryManager } from '../CleanupHistoryManager';
import type { CleanupResult } from '../../types';

function createMockCleanupResult(overrides?: Partial<CleanupResult>): CleanupResult {
  return {
    cleanedCount: 5,
    failedCount: 1,
    errors: [],
    duration: 100,
    ...overrides,
  };
}

describe('CleanupHistoryManager', () => {
  describe('constructor', () => {
    it('should create with default max history size', () => {
      const manager = new CleanupHistoryManager();
      expect(manager).toBeDefined();
    });

    it('should create with custom max history size', () => {
      const manager = new CleanupHistoryManager(50);
      expect(manager).toBeDefined();
    });
  });

  describe('record', () => {
    it('should record cleanup result', () => {
      const manager = new CleanupHistoryManager();
      const result = createMockCleanupResult();

      manager.record(result);

      expect(manager.getLength()).toBe(1);
    });

    it('should trim history when exceeds max size', () => {
      const manager = new CleanupHistoryManager(3);

      manager.record(createMockCleanupResult({ cleanedCount: 1 }));
      manager.record(createMockCleanupResult({ cleanedCount: 2 }));
      manager.record(createMockCleanupResult({ cleanedCount: 3 }));
      manager.record(createMockCleanupResult({ cleanedCount: 4 }));

      expect(manager.getLength()).toBe(3);
      const history = manager.getHistory();
      expect(history[0].cleanedCount).toBe(2);
    });
  });

  describe('getHistory', () => {
    it('should return empty array initially', () => {
      const manager = new CleanupHistoryManager();
      expect(manager.getHistory()).toEqual([]);
    });

    it('should return copy of history', () => {
      const manager = new CleanupHistoryManager();
      const result = createMockCleanupResult();

      manager.record(result);
      const history1 = manager.getHistory();
      const history2 = manager.getHistory();

      expect(history1).toEqual(history2);
      expect(history1).not.toBe(history2);
    });
  });

  describe('getStats', () => {
    it('should return zero stats when no cleanups', () => {
      const manager = new CleanupHistoryManager();
      const stats = manager.getStats();

      expect(stats.totalCleanups).toBe(0);
      expect(stats.totalAtomsCleaned).toBe(0);
      expect(stats.averageCleanedPerCleanup).toBe(0);
    });

    it('should return correct stats', () => {
      const manager = new CleanupHistoryManager();

      manager.record(createMockCleanupResult({ cleanedCount: 5, failedCount: 1 }));
      manager.record(createMockCleanupResult({ cleanedCount: 10, failedCount: 2 }));

      const stats = manager.getStats();

      expect(stats.totalCleanups).toBe(2);
      expect(stats.totalAtomsCleaned).toBe(15);
      expect(stats.totalAtomsFailed).toBe(3);
      expect(stats.averageCleanedPerCleanup).toBe(7.5);
    });

    it('should return last cleanup result', () => {
      const manager = new CleanupHistoryManager();
      const result1 = createMockCleanupResult({ cleanedCount: 5 });
      const result2 = createMockCleanupResult({ cleanedCount: 10 });

      manager.record(result1);
      manager.record(result2);

      const stats = manager.getStats();
      expect(stats.lastCleanup?.cleanedCount).toBe(10);
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      const manager = new CleanupHistoryManager();

      manager.record(createMockCleanupResult());
      manager.record(createMockCleanupResult());
      manager.clear();

      expect(manager.getLength()).toBe(0);
      expect(manager.getHistory()).toEqual([]);
    });
  });

  describe('getLength', () => {
    it('should return 0 initially', () => {
      const manager = new CleanupHistoryManager();
      expect(manager.getLength()).toBe(0);
    });

    it('should return correct length', () => {
      const manager = new CleanupHistoryManager();

      manager.record(createMockCleanupResult());
      manager.record(createMockCleanupResult());

      expect(manager.getLength()).toBe(2);
    });
  });
});

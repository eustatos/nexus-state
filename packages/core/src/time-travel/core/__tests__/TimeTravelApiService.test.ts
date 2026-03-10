/**
 * Tests for TimeTravelApiService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeTravelApiService } from '../TimeTravelApiService';
import {
  createMockSnapshot,
  createMockHistoryService,
  createMockSnapshotService,
  createMockSubscriptionManager,
} from './fixtures/test-helpers';

describe('TimeTravelApiService', () => {
  let historyService: ReturnType<typeof createMockHistoryService>;
  let snapshotService: ReturnType<typeof createMockSnapshotService>;
  let subscriptionManager: ReturnType<typeof createMockSubscriptionManager>;
  let apiService: TimeTravelApiService;

  beforeEach(() => {
    historyService = createMockHistoryService();
    snapshotService = createMockSnapshotService();
    subscriptionManager = createMockSubscriptionManager();

    apiService = new TimeTravelApiService(
      historyService as any,
      snapshotService as any,
      subscriptionManager as any,
      { autoCapture: false }
    );
  });

  describe('capture()', () => {
    it('should capture a snapshot and add to history', () => {
      const mockSnapshot = createMockSnapshot('test-1', 'test-action');
      snapshotService.capture = vi.fn(() => ({
        success: true,
        snapshot: mockSnapshot,
        duration: 1,
      }));

      const result = apiService.capture('test-action');

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-1');
      expect(snapshotService.capture).toHaveBeenCalledWith('test-action');
      expect(historyService.add).toHaveBeenCalledWith(mockSnapshot);
    });

    it('should emit snapshot-captured event', () => {
      const mockSnapshot = createMockSnapshot('test-1', 'test-action');
      snapshotService.capture = vi.fn(() => ({
        success: true,
        snapshot: mockSnapshot,
        duration: 1,
      }));

      apiService.capture('test-action');

      expect(subscriptionManager.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'snapshot-captured',
          snapshotId: 'test-1',
        })
      );
    });

    it('should return undefined when capture fails', () => {
      snapshotService.capture = vi.fn(() => ({
        success: false,
        error: 'capture failed',
      }));

      const result = apiService.capture('test-action');

      expect(result).toBeUndefined();
    });
  });

  describe('undo()', () => {
    it('should return false when cannot undo', () => {
      historyService.canUndo = vi.fn(() => false);

      const result = apiService.undo();

      expect(result).toBe(false);
      expect(historyService.undo).not.toHaveBeenCalled();
    });

    it('should undo and restore snapshot when can undo', () => {
      const mockSnapshot = createMockSnapshot('test-1', 'test-action');
      historyService.canUndo = vi.fn(() => true);
      historyService.undo = vi.fn(() => ({ success: true }));
      historyService.getCurrent = vi.fn(() => mockSnapshot);

      const result = apiService.undo();

      expect(result).toBe(true);
      expect(historyService.undo).toHaveBeenCalled();
      expect(snapshotService.restore).toHaveBeenCalledWith(mockSnapshot);
    });

    it('should emit undo event', () => {
      const mockSnapshot = createMockSnapshot('test-1', 'test-action');
      historyService.canUndo = vi.fn(() => true);
      historyService.undo = vi.fn(() => ({ success: true }));
      historyService.getCurrent = vi.fn(() => mockSnapshot);

      apiService.undo();

      expect(subscriptionManager.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'undo',
          snapshotId: 'test-1',
        })
      );
    });
  });

  describe('redo()', () => {
    it('should return false when cannot redo', () => {
      historyService.canRedo = vi.fn(() => false);

      const result = apiService.redo();

      expect(result).toBe(false);
      expect(historyService.redo).not.toHaveBeenCalled();
    });

    it('should redo and restore snapshot when can redo', () => {
      const mockSnapshot = createMockSnapshot('test-1', 'test-action');
      historyService.canRedo = vi.fn(() => true);
      historyService.redo = vi.fn(() => ({ success: true }));
      historyService.getCurrent = vi.fn(() => mockSnapshot);

      const result = apiService.redo();

      expect(result).toBe(true);
      expect(historyService.redo).toHaveBeenCalled();
      expect(snapshotService.restore).toHaveBeenCalledWith(mockSnapshot);
    });
  });

  describe('jumpTo()', () => {
    it('should jump to snapshot by ID', () => {
      const mockSnapshot = createMockSnapshot('test-1', 'test-action');
      historyService.jumpTo = vi.fn(() => ({ success: true, current: mockSnapshot }));

      const result = apiService.jumpTo('test-1');

      expect(result).toBe(true);
      expect(historyService.jumpTo).toHaveBeenCalledWith('test-1');
      expect(snapshotService.restore).toHaveBeenCalledWith(mockSnapshot);
    });

    it('should emit jump event', () => {
      const mockSnapshot = createMockSnapshot('test-1', 'test-action');
      historyService.jumpTo = vi.fn(() => ({ success: true, current: mockSnapshot }));

      apiService.jumpTo('test-1');

      expect(subscriptionManager.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'jump',
          snapshotId: 'test-1',
        })
      );
    });

    it('should return false when jump fails', () => {
      historyService.jumpTo = vi.fn(() => ({ success: false, error: 'not found' }));

      const result = apiService.jumpTo('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('jumpToIndex()', () => {
    it('should jump to snapshot by index', () => {
      const mockSnapshot = createMockSnapshot('test-1', 'test-action');
      historyService.jumpToIndex = vi.fn(() => ({ success: true, current: mockSnapshot }));

      const result = apiService.jumpToIndex(5);

      expect(result).toBe(true);
      expect(historyService.jumpToIndex).toHaveBeenCalledWith(5);
      expect(snapshotService.restore).toHaveBeenCalledWith(mockSnapshot);
    });
  });

  describe('History access methods', () => {
    it('should return canUndo from history service', () => {
      historyService.canUndo = vi.fn(() => true);
      expect(apiService.canUndo()).toBe(true);

      historyService.canUndo = vi.fn(() => false);
      expect(apiService.canUndo()).toBe(false);
    });

    it('should return canRedo from history service', () => {
      historyService.canRedo = vi.fn(() => true);
      expect(apiService.canRedo()).toBe(true);

      historyService.canRedo = vi.fn(() => false);
      expect(apiService.canRedo()).toBe(false);
    });

    it('should return current snapshot from history service', () => {
      const mockSnapshot = createMockSnapshot('test-1');
      historyService.getCurrent = vi.fn(() => mockSnapshot);

      const result = apiService.getCurrentSnapshot();

      expect(result).toBe(mockSnapshot);
    });

    it('should return history length from history service', () => {
      historyService.getLength = vi.fn(() => 10);

      const result = apiService.getHistoryLength();

      expect(result).toBe(10);
    });

    it('should return all history from history service', () => {
      const snapshots = [
        createMockSnapshot('test-1'),
        createMockSnapshot('test-2'),
      ];
      historyService.getAll = vi.fn(() => snapshots);

      const result = apiService.getAllHistory();

      expect(result).toBe(snapshots);
    });

    it('should return history stats from history service', () => {
      const stats = {
        length: 10,
        currentIndex: 5,
        canUndo: true,
        canRedo: true,
      };
      historyService.getStats = vi.fn(() => stats);

      const result = apiService.getHistoryStats();

      expect(result).toEqual(stats);
    });
  });

  describe('clearHistory()', () => {
    it('should clear history', () => {
      apiService.clearHistory();

      expect(historyService.clear).toHaveBeenCalled();
    });
  });

  describe('getHistory()', () => {
    it('should return all history (alias)', () => {
      const snapshots = [createMockSnapshot('test-1')];
      historyService.getAll = vi.fn(() => snapshots);

      const result = apiService.getHistory();

      expect(result).toBe(snapshots);
    });
  });

  describe('configure()', () => {
    it('should update configuration', () => {
      apiService.configure({ autoCapture: true });

      const config = apiService.getConfig();
      expect(config.autoCapture).toBe(true);
    });

    it('should merge configuration', () => {
      apiService.configure({ autoCapture: true });
      apiService.configure({ autoCapture: false });

      const config = apiService.getConfig();
      expect(config.autoCapture).toBe(false);
    });
  });

  describe('getConfig()', () => {
    it('should return a copy of configuration', () => {
      const config1 = apiService.getConfig();
      const config2 = apiService.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    it('should return default configuration', () => {
      const config = apiService.getConfig();

      expect(config.autoCapture).toBe(false);
    });
  });
});

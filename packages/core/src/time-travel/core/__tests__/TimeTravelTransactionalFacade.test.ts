/**
 * Tests for TimeTravelTransactionalFacade
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeTravelTransactionalFacade } from '../TimeTravelTransactionalFacade';
import { createMockSnapshot, createMockHistoryService, createMockSnapshotService } from './fixtures/test-helpers';

describe('TimeTravelTransactionalFacade', () => {
  let historyService: ReturnType<typeof createMockHistoryService>;
  let snapshotService: ReturnType<typeof createMockSnapshotService>;
  let transactionalFacade: TimeTravelTransactionalFacade;
  let mockRestorer: any;

  beforeEach(() => {
    historyService = createMockHistoryService();
    mockRestorer = {
      restore: vi.fn(() => true),
      getLastCheckpoint: vi.fn(() => null),
      rollback: vi.fn(() =>
        Promise.resolve({
          success: true,
          checkpointId: 'test',
          rolledBackCount: 0,
          failedCount: 0,
          timestamp: Date.now(),
        })
      ),
      getCheckpoints: vi.fn(() => []),
    };
    snapshotService = {
      ...createMockSnapshotService(),
      getRestorer: vi.fn(() => mockRestorer),
    };
    transactionalFacade = new TimeTravelTransactionalFacade(
      snapshotService as any,
      historyService as any
    );
  });

  describe('restoreWithTransaction()', () => {
    it('should restore snapshot with transaction', async () => {
      const mockSnapshot = createMockSnapshot('test-1', 'test-action');
      historyService.getById = vi.fn(() => mockSnapshot);

      const result = await transactionalFacade.restoreWithTransaction('test-1');

      expect(result.success).toBe(true);
      expect(snapshotService.restoreWithTransaction).toHaveBeenCalledWith(mockSnapshot, undefined);
    });

    it('should pass options to restoreWithTransaction', async () => {
      const mockSnapshot = createMockSnapshot('test-1');
      historyService.getById = vi.fn(() => mockSnapshot);
      const options = { transactional: true, timeout: 5000 };

      await transactionalFacade.restoreWithTransaction('test-1', options);

      expect(snapshotService.restoreWithTransaction).toHaveBeenCalledWith(mockSnapshot, options);
    });

    it('should return error when snapshot not found', async () => {
      historyService.getById = vi.fn(() => undefined);

      const result = await transactionalFacade.restoreWithTransaction('nonexistent');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Snapshot with ID nonexistent not found');
      expect(result.restoredCount).toBe(0);
    });

    it('should log warning when snapshot not found', async () => {
      historyService.getById = vi.fn(() => undefined);

      await transactionalFacade.restoreWithTransaction('nonexistent');

      // Verify the flow - actual logging would be tested separately
      expect(historyService.getById).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('getLastCheckpoint()', () => {
    it('should return last checkpoint', () => {
      const mockCheckpoint = {
        id: 'checkpoint-1',
        timestamp: Date.now(),
        snapshotId: 'snapshot-1',
        previousValues: new Map(),
        metadata: {
          atomCount: 1,
          duration: 10,
          inProgress: false,
          committed: true,
        },
      };

      mockRestorer.getLastCheckpoint = vi.fn(() => mockCheckpoint);

      const result = transactionalFacade.getLastCheckpoint();

      expect(result).toBe(mockCheckpoint);
    });

    it('should return null when no checkpoints', () => {
      mockRestorer.getLastCheckpoint = vi.fn(() => null);

      const result = transactionalFacade.getLastCheckpoint();

      expect(result).toBeNull();
    });
  });

  describe('rollbackToCheckpoint()', () => {
    it('should rollback to checkpoint', async () => {
      const mockResult = {
        success: true,
        checkpointId: 'checkpoint-1',
        rolledBackCount: 5,
        failedCount: 0,
        timestamp: Date.now(),
      };

      mockRestorer.rollback = vi.fn(() => Promise.resolve(mockResult));

      const result = await transactionalFacade.rollbackToCheckpoint('checkpoint-1');

      expect(result.success).toBe(true);
      expect(result.checkpointId).toBe('checkpoint-1');
    });

    it('should pass checkpoint ID to restorer', async () => {
      await transactionalFacade.rollbackToCheckpoint('test-checkpoint');

      expect(mockRestorer.rollback).toHaveBeenCalledWith('test-checkpoint');
    });
  });

  describe('getCheckpoints()', () => {
    it('should return all checkpoints', () => {
      const checkpoints = [
        {
          id: 'checkpoint-1',
          timestamp: Date.now(),
          snapshotId: 'snapshot-1',
          previousValues: new Map(),
          metadata: {
            atomCount: 1,
            duration: 10,
            inProgress: false,
            committed: true,
          },
        },
        {
          id: 'checkpoint-2',
          timestamp: Date.now(),
          snapshotId: 'snapshot-2',
          previousValues: new Map(),
          metadata: {
            atomCount: 2,
            duration: 20,
            inProgress: false,
            committed: true,
          },
        },
      ];

      mockRestorer.getCheckpoints = vi.fn(() => checkpoints);

      const result = transactionalFacade.getCheckpoints();

      expect(result).toBe(checkpoints);
    });

    it('should return empty array when no checkpoints', () => {
      mockRestorer.getCheckpoints = vi.fn(() => []);

      const result = transactionalFacade.getCheckpoints();

      expect(result).toEqual([]);
    });
  });

  describe('importState()', () => {
    it('should import state from external source', () => {
      const state = {
        'atom-1': { value: 1, type: 'primitive' },
        'atom-2': { value: 2, type: 'primitive' },
      };

      const result = transactionalFacade.importState(state);

      expect(result).toBe(true);
      expect(mockRestorer.restore).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringContaining('imported-'),
          state,
          metadata: expect.objectContaining({
            action: 'import',
            atomCount: 2,
          }),
        })
      );
    });

    it('should create snapshot with imported state', () => {
      const state = { 'atom-1': { value: 1 } };

      transactionalFacade.importState(state);

      const callArg = mockRestorer.restore.mock.calls[0][0];
      expect(callArg.state).toEqual(state);
      expect(callArg.metadata.action).toBe('import');
    });

    it('should count atoms in state', () => {
      const state = {
        'atom-1': {},
        'atom-2': {},
        'atom-3': {},
      };

      transactionalFacade.importState(state);

      const callArg = mockRestorer.restore.mock.calls[0][0];
      expect(callArg.metadata.atomCount).toBe(3);
    });
  });

  describe('rollback()', () => {
    it('should be alias for rollbackToCheckpoint', async () => {
      await transactionalFacade.rollback('checkpoint-1');

      expect(mockRestorer.rollback).toHaveBeenCalledWith('checkpoint-1');
    });
  });

  describe('Integration tests', () => {
    it('should handle full restore flow', async () => {
      const mockSnapshot = createMockSnapshot('test-1', 'restore-test', {
        'atom-1': { value: 100, type: 'primitive' },
      });

      historyService.getById = vi.fn(() => mockSnapshot);

      const mockResult = {
        success: true,
        restoredCount: 1,
        totalAtoms: 1,
        errors: [],
        warnings: [],
        duration: 50,
        timestamp: Date.now(),
      };

      snapshotService.restoreWithTransaction = vi.fn(() => Promise.resolve(mockResult));

      const result = await transactionalFacade.restoreWithTransaction('test-1');

      expect(result.success).toBe(true);
      expect(result.restoredCount).toBe(1);
    });

    it('should handle failed restore', async () => {
      historyService.getById = vi.fn(() => undefined);

      const result = await transactionalFacade.restoreWithTransaction('nonexistent');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

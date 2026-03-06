/**
 * SnapshotService tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SnapshotService } from '../SnapshotService';
import type { Store, Atom } from '../../types';

describe('SnapshotService', () => {
  let snapshotService: SnapshotService;
  let mockStore: Store;

  beforeEach(() => {
    mockStore = {
      get: vi.fn(),
      set: vi.fn(),
      batch: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      getAtom: vi.fn(),
      getAtoms: vi.fn(),
    } as unknown as Store;

    snapshotService = new SnapshotService(mockStore);
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const service = new SnapshotService(mockStore);
      const config = service.getConfig();

      expect(config).toBeDefined();
    });

    it('should create with custom config', () => {
      const service = new SnapshotService(mockStore, {
        creator: { validateBeforeCapture: true },
        restorer: { validateBeforeRestore: true },
        restoration: { batchRestore: true },
      });

      const config = service.getConfig();
      expect(config).toBeDefined();
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      snapshotService.configure({
        creator: { validateBeforeCapture: true },
      });

      const config = snapshotService.getConfig();
      expect(config.creator?.validateBeforeCapture).toBe(true);
    });
  });

  describe('getCreator', () => {
    it('should return snapshot creator', () => {
      const creator = snapshotService.getCreator();
      expect(creator).toBeDefined();
    });
  });

  describe('getRestorer', () => {
    it('should return snapshot restorer', () => {
      const restorer = snapshotService.getRestorer();
      expect(restorer).toBeDefined();
    });
  });

  describe('capture', () => {
    it('should capture snapshot successfully', () => {
      const result = snapshotService.capture('test-action');

      expect(result.success).toBe(true);
      expect(result.snapshot).toBeDefined();
      expect(result.snapshot?.metadata.action).toBe('test-action');
      expect(result.duration).toBeDefined();
    });

    it('should capture without action', () => {
      const result = snapshotService.capture();

      expect(result.success).toBe(true);
      expect(result.snapshot).toBeDefined();
    });

    it('should handle capture errors', () => {
      const service = new SnapshotService({
        get: vi.fn(() => {
          throw new Error('Store error');
        }),
      } as unknown as Store);

      const result = service.capture('test-action');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('restore', () => {
    it('should restore snapshot successfully', () => {
      const captureResult = snapshotService.capture('test-action');

      if (captureResult.snapshot) {
        const result = snapshotService.restore(captureResult.snapshot);
        expect(result).toBe(true);
      }
    });

    it('should handle restore errors gracefully', () => {
      const invalidSnapshot = {
        id: 'invalid',
        state: {},
        metadata: { timestamp: Date.now(), action: 'test' },
      };

      const result = snapshotService.restore(invalidSnapshot);

      expect(result).toBe(false);
    });
  });

  describe('restoreWithResult', () => {
    it('should restore with detailed result', () => {
      const captureResult = snapshotService.capture('test-action');

      if (captureResult.snapshot) {
        const result = snapshotService.restoreWithResult(captureResult.snapshot);

        expect(result.success).toBe(true);
        expect(result.restored).toBeDefined();
      }
    });

    it('should return failure for invalid snapshot', () => {
      const invalidSnapshot = {
        id: 'invalid',
        state: {},
        metadata: { timestamp: Date.now(), action: 'test' },
      };

      const result = snapshotService.restoreWithResult(invalidSnapshot);

      expect(result.success).toBe(false);
    });
  });

  describe('restoreWithTransaction', () => {
    it('should restore with transaction support', async () => {
      const captureResult = snapshotService.capture('test-action');

      if (captureResult.snapshot) {
        const result = await snapshotService.restoreWithTransaction(
          captureResult.snapshot
        );

        expect(result.success).toBe(true);
        expect(result.restored).toBeDefined();
      }
    });

    it('should handle transaction rollback on error', async () => {
      const invalidSnapshot = {
        id: 'invalid',
        state: {},
        metadata: { timestamp: Date.now(), action: 'test' },
      };

      const result = await snapshotService.restoreWithTransaction(invalidSnapshot);

      expect(result.success).toBe(false);
    });

    it('should accept restoration options', async () => {
      const captureResult = snapshotService.capture('test-action');

      if (captureResult.snapshot) {
        const result = await snapshotService.restoreWithTransaction(
          captureResult.snapshot,
          {
            validateBeforeRestore: true,
            batchRestore: true,
            rollbackOnError: true,
          }
        );

        expect(result.success).toBe(true);
      }
    });
  });

  describe('integration', () => {
    it('should capture and restore in sequence', () => {
      const capture1 = snapshotService.capture('action1');
      expect(capture1.success).toBe(true);

      const capture2 = snapshotService.capture('action2');
      expect(capture2.success).toBe(true);

      if (capture1.snapshot) {
        const restoreResult = snapshotService.restore(capture1.snapshot);
        expect(restoreResult).toBe(true);
      }
    });

    it('should handle multiple captures', () => {
      const snapshots: string[] = [];

      for (let i = 0; i < 5; i++) {
        const result = snapshotService.capture(`action-${i}`);
        if (result.success && result.snapshot) {
          snapshots.push(result.snapshot.id);
        }
      }

      expect(snapshots.length).toBe(5);
    });
  });

  describe('error handling', () => {
    it('should handle store.get errors during capture', () => {
      const errorStore = {
        get: vi.fn(() => {
          throw new Error('Get error');
        }),
      } as unknown as Store;

      const service = new SnapshotService(errorStore);
      const result = service.capture('test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle store.set errors during restore', () => {
      const errorStore = {
        get: vi.fn(),
        set: vi.fn(() => {
          throw new Error('Set error');
        }),
      } as unknown as Store;

      const service = new SnapshotService(errorStore);
      const captureResult = service.capture('test');

      if (captureResult.snapshot) {
        const result = service.restore(captureResult.snapshot);
        expect(result).toBe(false);
      }
    });
  });
});

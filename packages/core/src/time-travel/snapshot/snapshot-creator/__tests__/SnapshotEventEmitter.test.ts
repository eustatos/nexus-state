/**
 * SnapshotEventEmitter tests
 */

import { describe, it, expect, vi } from 'vitest';
import { SnapshotEventEmitter } from '../SnapshotEventEmitter';
import type { Snapshot } from '../../types';

function createMockSnapshot(): Snapshot {
  return {
    id: 'test-id',
    state: {},
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 0,
    },
  } as Snapshot;
}

describe('SnapshotEventEmitter', () => {
  describe('subscribe', () => {
    it('should subscribe to create events', () => {
      const emitter = new SnapshotEventEmitter();
      const listener = vi.fn();

      const unsubscribe = emitter.subscribe('create', listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to error events', () => {
      const emitter = new SnapshotEventEmitter();
      const listener = vi.fn();

      const unsubscribe = emitter.subscribe('error', listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from events', () => {
      const emitter = new SnapshotEventEmitter();
      const listener = vi.fn();

      const unsubscribe = emitter.subscribe('create', listener);
      unsubscribe();

      emitter.emit('create', createMockSnapshot());

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should emit create events', () => {
      const emitter = new SnapshotEventEmitter();
      const listener = vi.fn();
      const snapshot = createMockSnapshot();

      emitter.subscribe('create', listener);
      emitter.emit('create', snapshot);

      expect(listener).toHaveBeenCalledWith(snapshot);
    });

    it('should emit error events', () => {
      const emitter = new SnapshotEventEmitter();
      const listener = vi.fn();
      const errorSnapshot = createMockSnapshot();

      emitter.subscribe('error', listener);
      emitter.emit('error', errorSnapshot);

      expect(listener).toHaveBeenCalledWith(errorSnapshot);
    });

    it('should handle listener errors gracefully', () => {
      const emitter = new SnapshotEventEmitter();
      const errorListener = vi.fn(() => {
        throw new Error('Test error');
      });
      const goodListener = vi.fn();

      emitter.subscribe('create', errorListener);
      emitter.subscribe('create', goodListener);

      expect(() => emitter.emit('create', createMockSnapshot())).not.toThrow();
      expect(goodListener).toHaveBeenCalled();
    });

    it('should not emit without snapshot for create event', () => {
      const emitter = new SnapshotEventEmitter();
      const listener = vi.fn();

      emitter.subscribe('create', listener);
      emitter.emit('create');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('clearListeners', () => {
    it('should clear all listeners', () => {
      const emitter = new SnapshotEventEmitter();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      emitter.subscribe('create', listener1);
      emitter.subscribe('error', listener2);
      emitter.clearListeners();

      emitter.emit('create', createMockSnapshot());
      emitter.emit('error');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('getListenerCount', () => {
    it('should return 0 initially', () => {
      const emitter = new SnapshotEventEmitter();
      expect(emitter.getListenerCount()).toBe(0);
    });

    it('should return count for specific event', () => {
      const emitter = new SnapshotEventEmitter();

      emitter.subscribe('create', vi.fn());
      emitter.subscribe('create', vi.fn());

      expect(emitter.getListenerCount('create')).toBe(2);
    });

    it('should return total count without event', () => {
      const emitter = new SnapshotEventEmitter();

      emitter.subscribe('create', vi.fn());
      emitter.subscribe('error', vi.fn());

      expect(emitter.getListenerCount()).toBe(2);
    });
  });
});

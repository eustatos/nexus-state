/**
 * SubscriptionManager tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionManager } from '../SubscriptionManager';
import type { TimeTravelEventType, TimeTravelEvent } from '../SubscriptionManager';

describe('SubscriptionManager', () => {
  let subscriptionManager: SubscriptionManager;

  beforeEach(() => {
    subscriptionManager = new SubscriptionManager();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const manager = new SubscriptionManager();
      const config = manager.getConfig();

      expect(config.maxListenersPerEvent).toBe(100);
    });

    it('should create with custom config', () => {
      const manager = new SubscriptionManager({
        maxListenersPerEvent: 50,
      });

      const config = manager.getConfig();
      expect(config.maxListenersPerEvent).toBe(50);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      subscriptionManager.configure({ maxListenersPerEvent: 25 });

      const config = subscriptionManager.getConfig();
      expect(config.maxListenersPerEvent).toBe(25);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to event type', () => {
      const listener = vi.fn();
      const unsubscribe = subscriptionManager.subscribe('undo', listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = subscriptionManager.subscribe('undo', listener);

      subscriptionManager.emit({ type: 'undo', timestamp: Date.now() });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      subscriptionManager.emit({ type: 'undo', timestamp: Date.now() });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      subscriptionManager.subscribe('redo', listener1);
      subscriptionManager.subscribe('redo', listener2);

      subscriptionManager.emit({ type: 'redo', timestamp: Date.now() });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should warn when max listeners reached', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const manager = new SubscriptionManager({ maxListenersPerEvent: 2 });

      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      manager.subscribe('undo', listener1);
      manager.subscribe('undo', listener2);
      const unsubscribe3 = manager.subscribe('undo', listener3);

      expect(unsubscribe3).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Max listeners')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from event type', () => {
      const listener = vi.fn();
      subscriptionManager.subscribe('jump', listener);

      subscriptionManager.unsubscribe('jump', listener);

      subscriptionManager.emit({ type: 'jump', timestamp: Date.now() });
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle non-existent listener', () => {
      const listener = vi.fn();

      expect(() =>
        subscriptionManager.unsubscribe('undo', listener)
      ).not.toThrow();
    });
  });

  describe('unsubscribeAll', () => {
    it('should unsubscribe all listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      subscriptionManager.subscribe('undo', listener1);
      subscriptionManager.subscribe('redo', listener2);

      subscriptionManager.unsubscribeAll();

      subscriptionManager.emit({ type: 'undo', timestamp: Date.now() });
      subscriptionManager.emit({ type: 'redo', timestamp: Date.now() });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should emit event to listeners', () => {
      const listener = vi.fn();
      subscriptionManager.subscribe('snapshot-captured', listener);

      const event: TimeTravelEvent = {
        type: 'snapshot-captured',
        timestamp: Date.now(),
        snapshotId: 'test-id',
      };

      subscriptionManager.emit(event);

      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should handle listener errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const listener = vi.fn(() => {
        throw new Error('Listener error');
      });

      subscriptionManager.subscribe('error', listener);
      subscriptionManager.emit({ type: 'error', timestamp: Date.now() });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle events with no listeners', () => {
      expect(() =>
        subscriptionManager.emit({ type: 'cleanup', timestamp: Date.now() })
      ).not.toThrow();
    });

    it('should emit atom-change event with atom info', () => {
      const listener = vi.fn();
      subscriptionManager.subscribe('atom-change', listener);

      const event: TimeTravelEvent = {
        type: 'atom-change',
        timestamp: Date.now(),
        atom: {
          id: Symbol('test'),
          name: 'testAtom',
          value: 'testValue',
        },
      };

      subscriptionManager.emit(event);

      expect(listener).toHaveBeenCalledWith(event);
    });
  });

  describe('getListenerCount', () => {
    it('should return 0 for event type with no listeners', () => {
      const count = subscriptionManager.getListenerCount('undo');
      expect(count).toBe(0);
    });

    it('should return correct listener count', () => {
      subscriptionManager.subscribe('redo', vi.fn());
      subscriptionManager.subscribe('redo', vi.fn());

      const count = subscriptionManager.getListenerCount('redo');
      expect(count).toBe(2);
    });
  });

  describe('getTotalListenerCount', () => {
    it('should return 0 when no listeners', () => {
      const count = subscriptionManager.getTotalListenerCount();
      expect(count).toBe(0);
    });

    it('should return total count across all event types', () => {
      subscriptionManager.subscribe('undo', vi.fn());
      subscriptionManager.subscribe('redo', vi.fn());
      subscriptionManager.subscribe('redo', vi.fn());

      const count = subscriptionManager.getTotalListenerCount();
      expect(count).toBe(3);
    });
  });

  describe('getEventTypes', () => {
    it('should return empty array when no listeners', () => {
      const types = subscriptionManager.getEventTypes();
      expect(types).toHaveLength(0);
    });

    it('should return event types with listeners', () => {
      subscriptionManager.subscribe('undo', vi.fn());
      subscriptionManager.subscribe('redo', vi.fn());

      const types = subscriptionManager.getEventTypes();
      expect(types).toContain('undo');
      expect(types).toContain('redo');
    });
  });

  describe('hasListeners', () => {
    it('should return false for event type with no listeners', () => {
      expect(subscriptionManager.hasListeners('undo')).toBe(false);
    });

    it('should return true for event type with listeners', () => {
      subscriptionManager.subscribe('redo', vi.fn());
      expect(subscriptionManager.hasListeners('redo')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear listeners for event type', () => {
      const listener = vi.fn();
      subscriptionManager.subscribe('jump', listener);

      subscriptionManager.clear('jump');

      subscriptionManager.emit({ type: 'jump', timestamp: Date.now() });
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle non-existent event type', () => {
      expect(() => subscriptionManager.clear('non-existent')).not.toThrow();
    });
  });

  describe('event types', () => {
    const eventTypes: TimeTravelEventType[] = [
      'snapshot-captured',
      'snapshot-restored',
      'undo',
      'redo',
      'jump',
      'atom-change',
      'cleanup',
      'error',
    ];

    it.each(eventTypes)('should handle %s event', (eventType) => {
      const listener = vi.fn();
      subscriptionManager.subscribe(eventType, listener);

      const event: TimeTravelEvent = {
        type: eventType,
        timestamp: Date.now(),
      };

      subscriptionManager.emit(event);

      expect(listener).toHaveBeenCalledWith(event);
    });
  });

  describe('integration', () => {
    it('should handle complex subscription flow', () => {
      const undoListener = vi.fn();
      const redoListener = vi.fn();
      const snapshotListener = vi.fn();

      const undoUnsubscribe = subscriptionManager.subscribe('undo', undoListener);
      subscriptionManager.subscribe('redo', redoListener);
      subscriptionManager.subscribe('snapshot-captured', snapshotListener);

      subscriptionManager.emit({ type: 'undo', timestamp: Date.now() });
      subscriptionManager.emit({ type: 'redo', timestamp: Date.now() });

      expect(undoListener).toHaveBeenCalledTimes(1);
      expect(redoListener).toHaveBeenCalledTimes(1);
      expect(snapshotListener).not.toHaveBeenCalled();

      undoUnsubscribe();
      subscriptionManager.emit({ type: 'undo', timestamp: Date.now() });

      expect(undoListener).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple events with data', () => {
      const listener = vi.fn();
      subscriptionManager.subscribe('snapshot-restored', listener);

      subscriptionManager.emit({
        type: 'snapshot-restored',
        timestamp: Date.now(),
        snapshotId: 'test-id',
        data: { restored: true },
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].data).toEqual({ restored: true });
    });
  });
});

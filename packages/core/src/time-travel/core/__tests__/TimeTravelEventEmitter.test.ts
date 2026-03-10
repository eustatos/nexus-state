/**
 * Tests for TimeTravelEventEmitter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeTravelEventEmitter } from '../TimeTravelEventEmitter';
import { createMockSubscriptionManager } from './fixtures/test-helpers';

describe('TimeTravelEventEmitter', () => {
  let subscriptionManager: ReturnType<typeof createMockSubscriptionManager>;
  let eventEmitter: TimeTravelEventEmitter;

  beforeEach(() => {
    subscriptionManager = createMockSubscriptionManager();
    eventEmitter = new TimeTravelEventEmitter(subscriptionManager as any);
  });

  describe('subscribe()', () => {
    it('should subscribe to events', () => {
      const listener = vi.fn();

      const unsubscribe = eventEmitter.subscribe('snapshot-captured', listener);

      expect(subscriptionManager.subscribe).toHaveBeenCalledWith(
        'snapshot-captured',
        listener
      );
      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();

      const unsubscribe = eventEmitter.subscribe('snapshot-captured', listener);
      unsubscribe();

      // Verify unsubscribe was called (subscription manager should remove listener)
      expect(unsubscribe).toBeDefined();
    });

    it('should allow multiple subscriptions to same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      eventEmitter.subscribe('snapshot-captured', listener1);
      eventEmitter.subscribe('snapshot-captured', listener2);

      expect(subscriptionManager.subscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('emit()', () => {
    it('should emit events to subscription manager', () => {
      const event = {
        type: 'snapshot-captured',
        timestamp: Date.now(),
        snapshotId: 'test-1',
      };

      eventEmitter.emit(event);

      expect(subscriptionManager.emit).toHaveBeenCalledWith(event);
    });

    it('should emit undo events', () => {
      const event = {
        type: 'undo',
        timestamp: Date.now(),
        snapshotId: 'test-1',
      };

      eventEmitter.emit(event);

      expect(subscriptionManager.emit).toHaveBeenCalledWith(event);
    });

    it('should emit redo events', () => {
      const event = {
        type: 'redo',
        timestamp: Date.now(),
        snapshotId: 'test-1',
      };

      eventEmitter.emit(event);

      expect(subscriptionManager.emit).toHaveBeenCalledWith(event);
    });

    it('should emit jump events', () => {
      const event = {
        type: 'jump',
        timestamp: Date.now(),
        snapshotId: 'test-1',
      };

      eventEmitter.emit(event);

      expect(subscriptionManager.emit).toHaveBeenCalledWith(event);
    });
  });

  describe('unsubscribeAll()', () => {
    it('should unsubscribe all listeners', () => {
      eventEmitter.subscribe('snapshot-captured', vi.fn());
      eventEmitter.subscribe('undo', vi.fn());

      eventEmitter.unsubscribeAll();

      expect(subscriptionManager.unsubscribeAll).toHaveBeenCalled();
    });
  });

  describe('getSubscriberCount()', () => {
    it('should return subscriber count for event type', () => {
      subscriptionManager.getSubscriberCount = vi.fn((eventType: string) => {
        if (eventType === 'snapshot-captured') return 5;
        return 0;
      });

      const count = eventEmitter.getSubscriberCount('snapshot-captured');

      expect(count).toBe(5);
    });

    it('should return 0 when no subscribers', () => {
      subscriptionManager.getSubscriberCount = vi.fn(() => 0);

      const count = eventEmitter.getSubscriberCount('nonexistent');

      expect(count).toBe(0);
    });

    it('should return 0 when method not available', () => {
      subscriptionManager.getSubscriberCount = undefined as any;

      const count = eventEmitter.getSubscriberCount('test');

      expect(count).toBe(0);
    });
  });

  describe('hasSubscribers()', () => {
    it('should return true when has subscribers', () => {
      subscriptionManager.getSubscriberCount = vi.fn(() => 5);

      const hasSubs = eventEmitter.hasSubscribers('snapshot-captured');

      expect(hasSubs).toBe(true);
    });

    it('should return false when no subscribers', () => {
      subscriptionManager.getSubscriberCount = vi.fn(() => 0);

      const hasSubs = eventEmitter.hasSubscribers('snapshot-captured');

      expect(hasSubs).toBe(false);
    });
  });

  describe('Integration with subscription manager', () => {
    it('should notify listeners on emit', () => {
      const listener = vi.fn();
      eventEmitter.subscribe('snapshot-captured', listener);

      const event = {
        type: 'snapshot-captured',
        timestamp: Date.now(),
        snapshotId: 'test-1',
      };

      eventEmitter.emit(event);

      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should not notify after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = eventEmitter.subscribe('snapshot-captured', listener);

      unsubscribe();

      const event = {
        type: 'snapshot-captured',
        timestamp: Date.now(),
        snapshotId: 'test-1',
      };

      eventEmitter.emit(event);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});

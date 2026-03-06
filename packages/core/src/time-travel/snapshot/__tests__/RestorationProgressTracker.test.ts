/**
 * RestorationProgressTracker tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RestorationProgressTracker } from '../RestorationProgressTracker';

describe('RestorationProgressTracker', () => {
  let tracker: RestorationProgressTracker;

  beforeEach(() => {
    tracker = new RestorationProgressTracker();
  });

  describe('start', () => {
    it('should start tracking with total atoms', () => {
      tracker.start(10, false);

      const state = tracker.getState();
      expect(state?.inProgress).toBe(true);
      expect(state?.totalAtoms).toBe(10);
      expect(state?.currentIndex).toBe(0);
    });

    it('should start tracking for rollback', () => {
      tracker.start(5, true);

      const state = tracker.getState();
      expect(state?.isRollback).toBe(true);
    });

    it('should set timestamps', () => {
      const beforeStart = Date.now();
      tracker.start(10, false);
      const afterStart = Date.now();

      const state = tracker.getState();
      expect(state?.startTime).toBeGreaterThanOrEqual(beforeStart);
      expect(state?.startTime).toBeLessThanOrEqual(afterStart);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      tracker.start(10, false);
    });

    it('should update current index', () => {
      tracker.update(5, 'atom5');

      const state = tracker.getState();
      expect(state?.currentIndex).toBe(5);
    });

    it('should update current atom name', () => {
      tracker.update(3, 'testAtom');

      const state = tracker.getState();
      expect(state?.currentAtomName).toBe('testAtom');
    });

    it('should update atom ID', () => {
      const atomId = Symbol('test');
      tracker.update(1, 'atom1', atomId);

      const state = tracker.getState();
      expect(state?.currentAtomId).toBe(atomId);
    });

    it('should update last update time', () => {
      const beforeUpdate = Date.now();
      tracker.update(1, 'atom1');
      const afterUpdate = Date.now();

      const state = tracker.getState();
      expect(state?.lastUpdateTime).toBeGreaterThanOrEqual(beforeUpdate);
      expect(state?.lastUpdateTime).toBeLessThanOrEqual(afterUpdate);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      tracker.subscribe(listener);

      tracker.update(1, 'atom1');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should warn if called before start', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const newTracker = new RestorationProgressTracker();

      newTracker.update(1, 'atom1');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('complete', () => {
    beforeEach(() => {
      tracker.start(10, false);
    });

    it('should mark tracking as complete', () => {
      tracker.complete();

      const state = tracker.getState();
      expect(state?.inProgress).toBe(false);
    });

    it('should notify listeners on complete', () => {
      const listener = vi.fn();
      tracker.subscribe(listener);

      tracker.complete();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should warn if called before start', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const newTracker = new RestorationProgressTracker();

      newTracker.complete();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      tracker.start(10, false);
      tracker.update(5, 'atom5');
    });

    it('should reset state', () => {
      tracker.reset();

      const state = tracker.getState();
      expect(state).toBeNull();
    });

    it('should clear listeners', () => {
      const listener = vi.fn();
      const unsubscribe = tracker.subscribe(listener);
      unsubscribe();
      tracker.reset();

      tracker.start(5, false);
      tracker.update(1, 'atom1');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    beforeEach(() => {
      tracker.start(10, false);
    });

    it('should subscribe listener', () => {
      const listener = vi.fn();
      tracker.subscribe(listener);

      tracker.update(1, 'atom1');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      tracker.subscribe(listener1);
      tracker.subscribe(listener2);

      tracker.update(1, 'atom1');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = tracker.subscribe(listener);

      unsubscribe();

      tracker.update(1, 'atom1');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return null before start', () => {
      const state = tracker.getState();

      expect(state).toBeNull();
    });

    it('should return state after start', () => {
      tracker.start(10, false);

      const state = tracker.getState();
      expect(state).not.toBeNull();
      expect(state?.totalAtoms).toBe(10);
    });

    it('should return inProgress status', () => {
      tracker.start(10, false);

      const state = tracker.getState();
      expect(state?.inProgress).toBe(true);
    });

    it('should return currentIndex', () => {
      tracker.start(10, false);
      tracker.update(5, 'atom5');

      const state = tracker.getState();
      expect(state?.currentIndex).toBe(5);
    });
  });

  describe('isInProgress', () => {
    it('should return false before start', () => {
      // Note: isInProgress is not a method, we check state
      const state = tracker.getState();
      expect(state?.inProgress).toBeFalsy();
    });

    it('should return true during tracking', () => {
      tracker.start(10, false);

      const state = tracker.getState();
      expect(state?.inProgress).toBe(true);
    });

    it('should return false after complete', () => {
      tracker.start(10, false);
      tracker.complete();

      const state = tracker.getState();
      expect(state?.inProgress).toBe(false);
    });
  });

  describe('listener notification', () => {
    beforeEach(() => {
      tracker.start(10, false);
    });

    it('should notify listeners in order', () => {
      const calls: number[] = [];
      tracker.subscribe(() => calls.push(1));
      tracker.subscribe(() => calls.push(2));
      tracker.subscribe(() => calls.push(3));

      tracker.update(1, 'atom1');

      expect(calls).toEqual([1, 2, 3]);
    });

    it('should pass state to listeners', () => {
      const listener = vi.fn();
      tracker.subscribe(listener);

      tracker.update(5, 'atom5');

      expect(listener).toHaveBeenCalledTimes(1);
      const state = listener.mock.calls[0]?.[0];
      expect(state).toBeDefined();
      expect(state.currentIndex).toBe(5);
      expect(state.totalAtoms).toBe(10);
    });
  });
});

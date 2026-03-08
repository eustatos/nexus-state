/**
 * ChangeListenerRegistry tests
 */

import { describe, it, expect, vi } from 'vitest';
import { ChangeListenerRegistry } from '../ChangeListenerRegistry';
import type { ChangeEvent } from '../../types';

function createMockEvent(atomId: symbol): ChangeEvent {
  return {
    atom: {} as any,
    atomId,
    atomName: 'test',
    oldValue: 1,
    newValue: 2,
    timestamp: Date.now(),
    type: 'value',
  };
}

describe('ChangeListenerRegistry', () => {
  describe('addListener', () => {
    it('should add listener for atom', () => {
      const registry = new ChangeListenerRegistry();
      const atomId = Symbol('test');
      const listener = vi.fn();

      const unsubscribe = registry.addListener(atomId, listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function', () => {
      const registry = new ChangeListenerRegistry();
      const atomId = Symbol('test');
      const listener = vi.fn();

      const unsubscribe = registry.addListener(atomId, listener);
      unsubscribe();

      registry.notify(createMockEvent(atomId));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('removeListener', () => {
    it('should remove listener', () => {
      const registry = new ChangeListenerRegistry();
      const atomId = Symbol('test');
      const listener = vi.fn();

      registry.addListener(atomId, listener);
      registry.removeListener(atomId, listener);

      registry.notify(createMockEvent(atomId));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('addGlobalListener', () => {
    it('should add global listener', () => {
      const registry = new ChangeListenerRegistry();
      const listener = vi.fn();

      const unsubscribe = registry.addGlobalListener(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should notify global listeners', () => {
      const registry = new ChangeListenerRegistry();
      const listener = vi.fn();
      const atomId = Symbol('test');

      registry.addGlobalListener(listener);
      registry.notify(createMockEvent(atomId));

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('notify', () => {
    it('should handle listener errors gracefully', () => {
      const registry = new ChangeListenerRegistry();
      const atomId = Symbol('test');
      const errorListener = vi.fn(() => {
        throw new Error('Test error');
      });
      const goodListener = vi.fn();

      registry.addListener(atomId, errorListener);
      registry.addListener(atomId, goodListener);

      expect(() => registry.notify(createMockEvent(atomId))).not.toThrow();
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('getListenerCount', () => {
    it('should return 0 initially', () => {
      const registry = new ChangeListenerRegistry();
      expect(registry.getListenerCount()).toBe(0);
    });

    it('should count atom listeners', () => {
      const registry = new ChangeListenerRegistry();
      const atomId = Symbol('test');

      registry.addListener(atomId, vi.fn());
      registry.addListener(atomId, vi.fn());

      expect(registry.getListenerCount()).toBe(2);
    });

    it('should count global listeners', () => {
      const registry = new ChangeListenerRegistry();

      registry.addGlobalListener(vi.fn());
      registry.addGlobalListener(vi.fn());

      expect(registry.getListenerCount()).toBe(2);
    });
  });

  describe('hasListeners', () => {
    it('should return false for unknown atom', () => {
      const registry = new ChangeListenerRegistry();
      const atomId = Symbol('test');

      expect(registry.hasListeners(atomId)).toBe(false);
    });

    it('should return true for atom with listeners', () => {
      const registry = new ChangeListenerRegistry();
      const atomId = Symbol('test');

      registry.addListener(atomId, vi.fn());

      expect(registry.hasListeners(atomId)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all listeners', () => {
      const registry = new ChangeListenerRegistry();
      const atomId = Symbol('test');

      registry.addListener(atomId, vi.fn());
      registry.addGlobalListener(vi.fn());
      registry.clear();

      expect(registry.getListenerCount()).toBe(0);
    });
  });
});

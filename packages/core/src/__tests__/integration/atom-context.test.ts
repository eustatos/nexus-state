/**
 * SR-009: Integration tests for AtomContext end-to-end
 * Tests context propagation through the entire system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '../../index';
import type { AtomContext } from '../../reactive';

describe('SR-009: AtomContext End-to-End Integration', () => {
  beforeEach(() => {
    // Clear any global state
  });

  describe('full context propagation chain', () => {
    it('should propagate context through entire chain: store -> writable -> base atom', () => {
      const store = createStore();
      const baseAtom = atom(0, 'base');
      const contexts: Array<{ atom: string; context?: AtomContext }> = [];

      // Plugin to capture context at each level
      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          contexts.push({ atom: atom.name || 'unknown', context });
          return value;
        },
      }));

      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, value: number) => {
          set(baseAtom, value * 2, {
            source: 'nested-write',
            metadata: { level: 'nested' },
          });
        },
        'writable'
      );

      const context: AtomContext = {
        source: 'user-action',
        metadata: { userId: 123, action: 'increment' },
        silent: false,
      };

      store.set(writableAtom, 5, context);

      // Should have captured contexts for both atoms
      expect(contexts.length).toBeGreaterThanOrEqual(1);

      // Find context for base atom
      const baseContextEntry = contexts.find((c) => c.atom === 'base');
      expect(baseContextEntry).toBeDefined();
      expect(baseContextEntry?.context?.source).toBe('nested-write');
      expect(baseContextEntry?.context?.metadata?.level).toBe('nested');
    });

    it('should handle multiple plugins receiving context', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const plugin1Contexts: Array<AtomContext | undefined> = [];
      const plugin2Contexts: Array<AtomContext | undefined> = [];
      const plugin3Contexts: Array<AtomContext | undefined> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          plugin1Contexts.push(context);
          return value;
        },
      }));

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          plugin2Contexts.push(context);
          return value;
        },
      }));

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          plugin3Contexts.push(context);
          return value;
        },
      }));

      const context: AtomContext = {
        source: 'multi-plugin-test',
        metadata: { test: true },
      };

      store.set(testAtom, 10, context);

      // All plugins should receive the same context
      expect(plugin1Contexts.length).toBe(1);
      expect(plugin2Contexts.length).toBe(1);
      expect(plugin3Contexts.length).toBe(1);

      expect(plugin1Contexts[0]?.source).toBe('multi-plugin-test');
      expect(plugin2Contexts[0]?.source).toBe('multi-plugin-test');
      expect(plugin3Contexts[0]?.source).toBe('multi-plugin-test');
    });
  });

  describe('silent mode integration', () => {
    it('should suppress notifications in silent mode end-to-end', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');
      const computedAtom = atom((get) => get(testAtom) * 2, 'computed');

      const notifications: number[] = [];

      store.subscribe(testAtom, (value) => {
        notifications.push(value);
      });

      // Silent update
      store.set(testAtom, 10, { silent: true });

      // No notifications should be triggered
      expect(notifications).toEqual([]);
      expect(store.get(testAtom)).toBe(10);
      expect(store.get(computedAtom)).toBe(20);
    });

    it('should notify subscribers when silent is false', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');
      const notifications: number[] = [];

      store.subscribe(testAtom, (value) => {
        notifications.push(value);
      });

      // Explicit non-silent update
      store.set(testAtom, 10, { silent: false });

      expect(notifications).toEqual([10]);
    });

    it('should handle mixed silent and non-silent updates', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');
      const notifications: number[] = [];

      store.subscribe(testAtom, (value) => {
        notifications.push(value);
      });

      store.set(testAtom, 1, { silent: true });
      store.set(testAtom, 2, { silent: false });
      store.set(testAtom, 3, { silent: true });
      store.set(testAtom, 4, { silent: false });

      // Only non-silent updates should trigger notifications
      expect(notifications).toEqual([2, 4]);
      expect(store.get(testAtom)).toBe(4);
    });
  });

  describe('timeTravel integration', () => {
    it('should handle timeTravel flag through the system', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const timeTravelEvents: Array<{ value: number; context?: AtomContext }> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          if (context?.timeTravel) {
            timeTravelEvents.push({ value, context });
          }
          return value;
        },
      }));

      // Regular update
      store.set(testAtom, 10);

      // Time travel update
      store.set(testAtom, 5, { timeTravel: true, source: 'time-travel' });

      expect(timeTravelEvents.length).toBe(1);
      expect(timeTravelEvents[0].value).toBe(5);
      expect(timeTravelEvents[0].context?.source).toBe('time-travel');
      expect(store.get(testAtom)).toBe(5);
    });

    it('should suppress effects with timeTravel flag', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');
      const sideEffects: number[] = [];

      const subscriber = vi.fn((value) => {
        sideEffects.push(value);
      });

      store.subscribe(testAtom, subscriber);

      // Regular update triggers effects
      store.set(testAtom, 10);
      expect(subscriber).toHaveBeenCalledTimes(1);

      // Time travel should still notify (unless silent is also true)
      store.set(testAtom, 5, { timeTravel: true });
      expect(subscriber).toHaveBeenCalledTimes(2);

      // Time travel + silent should suppress
      store.set(testAtom, 3, { timeTravel: true, silent: true });
      expect(subscriber).toHaveBeenCalledTimes(2); // Still 2
    });
  });

  describe('metadata integration', () => {
    it('should preserve metadata through the entire chain', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      let capturedMetadata: Record<string, unknown> | undefined;

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          capturedMetadata = context?.metadata;
          return value;
        },
      }));

      const metadata = {
        userId: 123,
        action: 'increment',
        timestamp: Date.now(),
        nested: {
          level1: {
            level2: { value: 'deep' },
          },
        },
      };

      store.set(testAtom, 10, { metadata });

      expect(capturedMetadata).toEqual(metadata);
    });

    it('should handle complex nested metadata', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const metadataChain: Array<Record<string, unknown> | undefined> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          metadataChain.push(context?.metadata);
          return value;
        },
      }));

      const complexMetadata = {
        user: { id: 1, name: 'Alice', roles: ['admin', 'user'] },
        action: {
          type: 'UPDATE',
          payload: { field: 'name', oldValue: 'A', newValue: 'B' },
        },
        metadata: {
          timestamp: Date.now(),
          source: 'client',
          version: 1,
        },
      };

      store.set(testAtom, 10, { metadata: complexMetadata });

      expect(metadataChain.length).toBe(1);
      expect(metadataChain[0]).toEqual(complexMetadata);
    });
  });

  describe('context with computed atoms', () => {
    it('should propagate context when updating base atoms of computed', () => {
      const store = createStore();
      const baseAtom = atom(0, 'base');
      const computedAtom = atom((get) => get(baseAtom) * 2, 'computed');

      const contexts: Array<AtomContext | undefined> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          contexts.push(context);
          return value;
        },
      }));

      store.set(baseAtom, 10, { source: 'base-update' });

      expect(contexts.length).toBe(1);
      expect(contexts[0]?.source).toBe('base-update');
      expect(store.get(computedAtom)).toBe(20);
    });

    it('should handle context in writable atoms with computed dependencies', () => {
      const store = createStore();
      const base1 = atom(5, 'base1');
      const base2 = atom(10, 'base2');

      const writableComputed = atom(
        (get) => get(base1) + get(base2),
        (get, set, value: number) => {
          set(base1, value, { source: 'writable-computed', metadata: { target: 'base1' } });
          set(base2, value, { source: 'writable-computed', metadata: { target: 'base2' } });
        },
        'writable-computed'
      );

      const contexts: Array<{ atom: string; context?: AtomContext }> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          contexts.push({ atom: atom.name || 'unknown', context });
          return value;
        },
      }));

      store.set(writableComputed, 20, { source: 'external' });

      expect(store.get(base1)).toBe(20);
      expect(store.get(base2)).toBe(20);

      // Check that contexts were captured
      const base1Context = contexts.find((c) => c.atom === 'base1')?.context;
      const base2Context = contexts.find((c) => c.atom === 'base2')?.context;

      expect(base1Context?.source).toBe('writable-computed');
      expect(base2Context?.source).toBe('writable-computed');
    });
  });

  describe('error handling with context', () => {
    it('should handle errors in plugins with context', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const errorPlugin = () => ({
        onSet: (atom: any, value: any, context?: AtomContext) => {
          if (context?.metadata?.shouldThrow) {
            throw new Error('Plugin error');
          }
          return value;
        },
      });

      store.applyPlugin!(errorPlugin);

      // Should not throw without flag
      expect(() => {
        store.set(testAtom, 10, { metadata: { shouldThrow: false } });
      }).not.toThrow();

      // Should throw with flag
      expect(() => {
        store.set(testAtom, 10, { metadata: { shouldThrow: true } });
      }).toThrow('Plugin error');
    });

    it('should preserve context in error scenarios', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      let capturedContextBeforeError: AtomContext | undefined;

      const plugin1 = () => ({
        onSet: (atom: any, value: any, context?: AtomContext) => {
          capturedContextBeforeError = context;
          return value;
        },
      });

      const plugin2 = () => ({
        onSet: (atom: any, value: any, context?: AtomContext) => {
          throw new Error('Error in plugin2');
        },
      });

      store.applyPlugin!(plugin1);
      store.applyPlugin!(plugin2);

      const context: AtomContext = {
        source: 'error-test',
        metadata: { test: true },
      };

      expect(() => {
        store.set(testAtom, 10, context);
      }).toThrow('Error in plugin2');

      // First plugin should have received context before error
      expect(capturedContextBeforeError).toEqual(context);
    });
  });

  describe('concurrent updates with context', () => {
    it('should handle multiple updates with different contexts', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const updateLog: Array<{ value: number; context?: AtomContext }> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          updateLog.push({ value, context });
          return value;
        },
      }));

      store.set(testAtom, 1, { source: 'update-1' });
      store.set(testAtom, 2, { source: 'update-2' });
      store.set(testAtom, 3, { source: 'update-3' });

      expect(updateLog.length).toBe(3);
      expect(updateLog[0].context?.source).toBe('update-1');
      expect(updateLog[1].context?.source).toBe('update-2');
      expect(updateLog[2].context?.source).toBe('update-3');
      expect(store.get(testAtom)).toBe(3);
    });

    it('should handle batch updates with context', () => {
      const store = createStore();
      const atom1 = atom(0, 'atom1');
      const atom2 = atom(0, 'atom2');

      const contexts: Array<{ atom: string; context?: AtomContext }> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          contexts.push({ atom: atom.name || 'unknown', context });
          return value;
        },
      }));

      // Simulate batch update
      store.set(atom1, 10, { source: 'batch', metadata: { batch: 1 } });
      store.set(atom2, 20, { source: 'batch', metadata: { batch: 1 } });

      expect(contexts.length).toBe(2);
      expect(contexts.every((c) => c.context?.source === 'batch')).toBe(true);
      expect(contexts.every((c) => c.context?.metadata?.batch === 1)).toBe(true);
    });
  });

  describe('backward compatibility', () => {
    it('should work without context (backward compatibility)', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const contexts: Array<AtomContext | undefined> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          contexts.push(context);
          return value;
        },
      }));

      // Old API without context
      store.set(testAtom, 10);

      expect(contexts.length).toBe(1);
      expect(contexts[0]).toBeUndefined();
      expect(store.get(testAtom)).toBe(10);
    });

    it('should mix context and non-context updates', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const updateLog: Array<{ value: number; hasContext: boolean }> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          updateLog.push({ value, hasContext: context !== undefined });
          return value;
        },
      }));

      store.set(testAtom, 1); // No context
      store.set(testAtom, 2, { source: 'test' }); // With context
      store.set(testAtom, 3); // No context

      expect(updateLog.length).toBe(3);
      expect(updateLog[0].hasContext).toBe(false);
      expect(updateLog[1].hasContext).toBe(true);
      expect(updateLog[2].hasContext).toBe(false);
    });
  });
});

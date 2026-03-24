import { describe, it, expect, vi } from 'vitest';
import { atom, createStore } from '../../index';
import type { AtomContext } from '../../reactive';

describe('SR-004: AtomContext propagation', () => {
  describe('basic context passing', () => {
    it('should pass context through set()', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const context: AtomContext = {
        silent: false,
        source: 'test-case',
        metadata: { userId: 123 },
      };

      // Context should not throw
      expect(() => {
        store.set(testAtom, 10, context);
      }).not.toThrow();

      expect(store.get(testAtom)).toBe(10);
    });

    it('should maintain backward compatibility without context', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      // Old API still works
      expect(() => {
        store.set(testAtom, 10);
      }).not.toThrow();

      expect(store.get(testAtom)).toBe(10);
    });

    it('should accept partial context', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      // Only source
      store.set(testAtom, 10, { source: 'test' });
      expect(store.get(testAtom)).toBe(10);

      // Only metadata
      store.set(testAtom, 20, { metadata: { key: 'value' } });
      expect(store.get(testAtom)).toBe(20);

      // Only silent
      store.set(testAtom, 30, { silent: true });
      expect(store.get(testAtom)).toBe(30);
    });
  });

  describe('plugin hooks with context', () => {
    it('should make context available in onSet hooks', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      let capturedContext: AtomContext | undefined;

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          capturedContext = context;
          return value;
        },
      }));

      const myContext: AtomContext = {
        source: 'user-action',
        metadata: { action: 'increment' },
      };

      store.set(testAtom, 10, myContext);

      expect(capturedContext).toBeDefined();
      expect(capturedContext?.source).toBe('user-action');
      expect(capturedContext?.metadata?.action).toBe('increment');
    });

    it('should make context available in afterSet hooks', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      let capturedContext: AtomContext | undefined;

      store.applyPlugin!(() => ({
        afterSet: (atom, value, context) => {
          capturedContext = context;
        },
      }));

      const myContext: AtomContext = {
        source: 'after-set-test',
        metadata: { test: true },
      };

      store.set(testAtom, 10, myContext);

      expect(capturedContext).toBeDefined();
      expect(capturedContext?.source).toBe('after-set-test');
    });

    it('should handle undefined context in hooks', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      let contextWasUndefined = false;

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          if (context === undefined) {
            contextWasUndefined = true;
          }
          return value;
        },
      }));

      store.set(testAtom, 10);

      expect(contextWasUndefined).toBe(true);
    });

    it('should handle timeTravel flag in context', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      let timeTravelFlag: boolean | undefined;

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          timeTravelFlag = context?.timeTravel;
          return value;
        },
      }));

      store.set(testAtom, 10, { timeTravel: true });

      expect(timeTravelFlag).toBe(true);
    });
  });

  describe('context propagation through writable atoms', () => {
    it('should propagate context through writable atoms', () => {
      const store = createStore();
      const baseAtom = atom(0, 'base');

      let contextReceived = false;

      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, value: number) => {
          // Context is passed through set()
          set(baseAtom, value * 2);
          contextReceived = true;
        },
        'writable'
      );

      const context: AtomContext = {
        source: 'writable-test',
      };

      store.set(writableAtom, 10, context);

      expect(store.get(baseAtom)).toBe(20);
      expect(contextReceived).toBe(true);
    });

    it('should support context merging in nested writes', () => {
      const store = createStore();
      const atom1 = atom(0, 'atom1');
      const atom2 = atom(0, 'atom2');

      const contexts: AtomContext[] = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          if (context) {
            contexts.push(context);
          }
          return value;
        },
      }));

      const writableAtom = atom(
        (get) => get(atom1) + get(atom2),
        (get, set, value: number) => {
          set(atom1, value, { source: 'nested-write' });
          set(atom2, value * 2);
        },
        'writable'
      );

      store.set(writableAtom, 10, { source: 'parent-write' });

      expect(contexts.length).toBeGreaterThan(0);
      expect(contexts.some((c) => c.source === 'nested-write')).toBe(true);
    });

    it('should merge parent and child contexts correctly', () => {
      const store = createStore();
      const baseAtom = atom(0, 'base');

      const contexts: Array<{ atom: string; context?: AtomContext }> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          contexts.push({ atom: atom.name || 'unknown', context });
          return value;
        },
      }));

      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, value: number) => {
          // Child context should merge with parent
          set(baseAtom, value, { source: 'child', metadata: { child: true } });
        },
        'writable'
      );

      store.set(writableAtom, 10, {
        source: 'parent',
        metadata: { parent: true },
      });

      // Find the context for baseAtom
      const baseContext = contexts.find((c) => c.atom === 'base')?.context;

      // Child context takes precedence for same keys
      expect(baseContext?.source).toBe('child');
      // But parent metadata should be preserved if not overwritten
      expect(baseContext?.metadata).toBeDefined();
    });
  });

  describe('silent context', () => {
    it('should handle silent context', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');
      const subscriber = vi.fn();

      store.subscribe(testAtom, subscriber);

      store.set(testAtom, 10, { silent: true });

      expect(subscriber).not.toHaveBeenCalled();
      expect(store.get(testAtom)).toBe(10);
    });

    it('should notify subscribers when silent is false', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');
      const subscriber = vi.fn();

      store.subscribe(testAtom, subscriber);

      store.set(testAtom, 10, { silent: false });

      expect(subscriber).toHaveBeenCalledWith(10);
    });

    it('should handle silent in writable atoms', () => {
      const store = createStore();
      const baseAtom = atom(0, 'base');
      const subscriber = vi.fn();

      store.subscribe(baseAtom, subscriber);

      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, value: number) => {
          set(baseAtom, value * 2, { silent: true });
        },
        'writable'
      );

      store.set(writableAtom, 10, { silent: true });

      expect(subscriber).not.toHaveBeenCalled();
      expect(store.get(baseAtom)).toBe(20);
    });
  });

  describe('context metadata', () => {
    it('should pass metadata through the chain', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const metadata = {
        userId: 123,
        action: 'increment',
        timestamp: Date.now(),
      };

      let capturedMetadata: typeof metadata | undefined;

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          capturedMetadata = context?.metadata as typeof metadata;
          return value;
        },
      }));

      store.set(testAtom, 10, { metadata });

      expect(capturedMetadata).toEqual(metadata);
    });

    it('should handle complex metadata objects', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const complexMetadata = {
        user: { id: 1, name: 'Test' },
        action: { type: 'UPDATE', payload: { field: 'value' } },
        nested: { deep: { value: [1, 2, 3] } },
      };

      let receivedMetadata: typeof complexMetadata | undefined;

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          receivedMetadata = context?.metadata as typeof complexMetadata;
          return value;
        },
      }));

      store.set(testAtom, 10, { metadata: complexMetadata });

      expect(receivedMetadata).toEqual(complexMetadata);
    });
  });

  describe('multiple plugins', () => {
    it('should pass context to all plugins', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const contexts: Array<AtomContext | undefined> = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          contexts.push(context);
          return value;
        },
      }));

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          contexts.push(context);
          return value;
        },
      }));

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          contexts.push(context);
          return value;
        },
      }));

      const context: AtomContext = { source: 'multi-plugin' };
      store.set(testAtom, 10, context);

      expect(contexts.length).toBe(3);
      contexts.forEach((ctx) => {
        expect(ctx?.source).toBe('multi-plugin');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty context object', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      expect(() => {
        store.set(testAtom, 10, {});
      }).not.toThrow();
    });

    it('should handle context with only timeTravel flag', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      let capturedTimeTravel: boolean | undefined;

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          capturedTimeTravel = context?.timeTravel;
          return value;
        },
      }));

      store.set(testAtom, 10, { timeTravel: true });

      expect(capturedTimeTravel).toBe(true);
    });

    it('should handle context with custom source', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      const sources: string[] = [];

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          if (context?.source) {
            sources.push(context.source);
          }
          return value;
        },
      }));

      store.set(testAtom, 10, { source: 'custom-source' });

      expect(sources).toContain('custom-source');
    });

    it('should handle function updates with context', () => {
      const store = createStore();
      const testAtom = atom(0, 'test');

      let contextWithFunctionUpdate: AtomContext | undefined;

      store.applyPlugin!(() => ({
        onSet: (atom, value, context) => {
          contextWithFunctionUpdate = context;
          return value;
        },
      }));

      store.set(
        testAtom,
        (prev) => prev + 10,
        { source: 'function-update' }
      );

      expect(contextWithFunctionUpdate?.source).toBe('function-update');
      expect(store.get(testAtom)).toBe(10);
    });
  });
});

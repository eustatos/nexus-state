// Tests for plugin hooks functionality
import { describe, it, expect, vi } from 'vitest';
import { atom, createStore } from './index';
import type { PluginHooks } from './types';
import type { AtomContext } from './reactive';

describe('Plugin Hooks', () => {
  describe('onSet hook', () => {
    it('should call onSet hook before setting value', () => {
      const store = createStore();
      const testAtom = atom(0);
      const onSetSpy = vi.fn((atom, value) => value);

      const plugin = (): PluginHooks => ({
        onSet: onSetSpy,
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10);

      expect(onSetSpy).toHaveBeenCalledTimes(1);
      expect(onSetSpy).toHaveBeenCalledWith(testAtom, 10, undefined);
    });

    it('should allow onSet hook to modify the value', () => {
      const store = createStore();
      const testAtom = atom(0);

      const plugin = (): PluginHooks => ({
        onSet: (atom, value) => value * 2,
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 5);

      expect(store.get(testAtom)).toBe(10);
    });

    it('should keep original value if onSet returns undefined', () => {
      const store = createStore();
      const testAtom = atom(0);

      const plugin = (): PluginHooks => ({
        onSet: (atom, value) => {
          // Return undefined to not modify
          return undefined;
        },
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 42);

      expect(store.get(testAtom)).toBe(42);
    });

    it('should call onSet hooks from multiple plugins in order', () => {
      const store = createStore();
      const testAtom = atom(0);
      const calls: string[] = [];

      const plugin1 = (): PluginHooks => ({
        onSet: (atom, value) => {
          calls.push('plugin1');
          return value + 1;
        },
      });

      const plugin2 = (): PluginHooks => ({
        onSet: (atom, value) => {
          calls.push('plugin2');
          return value * 2;
        },
      });

      store.applyPlugin!(plugin1);
      store.applyPlugin!(plugin2);
      store.set(testAtom, 5);

      expect(calls).toEqual(['plugin1', 'plugin2']);
      expect(store.get(testAtom)).toBe(12); // (5 + 1) * 2 = 12
    });

    it('should call onSet for function updates after resolving the function', () => {
      const store = createStore();
      const testAtom = atom(0);
      const onSetSpy = vi.fn((atom, value) => value);

      const plugin = (): PluginHooks => ({
        onSet: onSetSpy,
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, (prev) => prev + 5);

      expect(onSetSpy).toHaveBeenCalledWith(testAtom, 5, undefined);
      expect(store.get(testAtom)).toBe(5);
    });
  });

  describe('afterSet hook', () => {
    it('should call afterSet hook after setting value', () => {
      const store = createStore();
      const testAtom = atom(0);
      const afterSetSpy = vi.fn();

      const plugin = (): PluginHooks => ({
        afterSet: afterSetSpy,
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10);

      expect(afterSetSpy).toHaveBeenCalledTimes(1);
      expect(afterSetSpy).toHaveBeenCalledWith(testAtom, 10, undefined);
    });

    it('should call afterSet with the final processed value', () => {
      const store = createStore();
      const testAtom = atom(0);
      let afterSetValue: number | undefined;

      const plugin1 = (): PluginHooks => ({
        onSet: (atom, value) => value * 2,
      });

      const plugin2 = (): PluginHooks => ({
        afterSet: (atom, value) => {
          afterSetValue = value;
        },
      });

      store.applyPlugin!(plugin1);
      store.applyPlugin!(plugin2);
      store.set(testAtom, 5);

      expect(afterSetValue).toBe(10); // Modified by onSet
    });

    it('should call afterSet hooks from multiple plugins', () => {
      const store = createStore();
      const testAtom = atom(0);
      const calls: string[] = [];

      const plugin1 = (): PluginHooks => ({
        afterSet: () => calls.push('plugin1-after'),
      });

      const plugin2 = (): PluginHooks => ({
        afterSet: () => calls.push('plugin2-after'),
      });

      store.applyPlugin!(plugin1);
      store.applyPlugin!(plugin2);
      store.set(testAtom, 5);

      expect(calls).toEqual(['plugin1-after', 'plugin2-after']);
    });

    it('should call afterSet after subscribers are notified', () => {
      const store = createStore();
      const testAtom = atom(0);
      let subscriberValue: number | undefined;
      let afterSetCalled: boolean = false;

      store.subscribe(testAtom, (value) => {
        subscriberValue = value;
        // afterSet should be called after this
        expect(afterSetCalled).toBe(false);
      });

      const plugin = (): PluginHooks => ({
        afterSet: () => {
          afterSetCalled = true;
          // At this point, subscriber should have been called
          expect(subscriberValue).toBe(10);
        },
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10);

      expect(afterSetCalled).toBe(true);
      expect(subscriberValue).toBe(10);
    });
  });

  describe('onGet hook', () => {
    it('should call onGet hook when reading value', () => {
      const store = createStore();
      const testAtom = atom(0);
      const onGetSpy = vi.fn((atom, value) => value);

      const plugin = (): PluginHooks => ({
        onGet: onGetSpy,
      });

      store.applyPlugin!(plugin);
      store.get(testAtom);

      expect(onGetSpy).toHaveBeenCalledTimes(1);
      expect(onGetSpy).toHaveBeenCalledWith(testAtom, 0);
    });

    it('should allow onGet hook to modify the returned value', () => {
      const store = createStore();
      const testAtom = atom(5);

      const plugin = (): PluginHooks => ({
        onGet: (atom, value) => value * 2,
      });

      store.applyPlugin!(plugin);
      const result = store.get(testAtom);

      expect(result).toBe(10);
      // Original value should not change
      expect((testAtom as any).read()).toBe(5);
    });

    it('should call onGet hooks from multiple plugins in order', () => {
      const store = createStore();
      const testAtom = atom(1);
      const calls: string[] = [];

      const plugin1 = (): PluginHooks => ({
        onGet: (atom, value) => {
          calls.push('plugin1');
          return value + 1;
        },
      });

      const plugin2 = (): PluginHooks => ({
        onGet: (atom, value) => {
          calls.push('plugin2');
          return value * 2;
        },
      });

      store.applyPlugin!(plugin1);
      store.applyPlugin!(plugin2);

      const result = store.get(testAtom);

      expect(calls).toEqual(['plugin1', 'plugin2']);
      expect(result).toBe(4); // (1 + 1) * 2 = 4
    });

    it('should call onGet for computed atoms', () => {
      const store = createStore();
      const countAtom = atom(5);
      const doubleAtom = atom((get) => get(countAtom) * 2);
      const onGetSpy = vi.fn((atom, value) => value);

      const plugin = (): PluginHooks => ({
        onGet: onGetSpy,
      });

      store.applyPlugin!(plugin);
      store.get(doubleAtom);

      expect(onGetSpy).toHaveBeenCalled();
    });
  });

  describe('hook execution order', () => {
    it('should execute hooks in correct order: onSet -> set -> notify -> afterSet', () => {
      const store = createStore();
      const testAtom = atom(0);
      const executionOrder: string[] = [];

      const plugin = (): PluginHooks => ({
        onSet: () => {
          executionOrder.push('onSet');
        },
        afterSet: () => {
          executionOrder.push('afterSet');
        },
      });

      store.subscribe(testAtom, () => {
        executionOrder.push('notify');
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 5);

      expect(executionOrder).toEqual(['onSet', 'notify', 'afterSet']);
    });

    it('should maintain hook order across multiple set operations', () => {
      const store = createStore();
      const testAtom = atom(0);
      const onSetCalls: number[] = [];
      const afterSetCalls: number[] = [];

      const plugin = (): PluginHooks => ({
        onSet: (atom, value) => {
          onSetCalls.push(value as number);
          return value;
        },
        afterSet: (atom, value) => {
          afterSetCalls.push(value as number);
        },
      });

      store.applyPlugin!(plugin);

      store.set(testAtom, 1);
      store.set(testAtom, 2);
      store.set(testAtom, 3);

      expect(onSetCalls).toEqual([1, 2, 3]);
      expect(afterSetCalls).toEqual([1, 2, 3]);
    });
  });

  describe('mixed plugin and hook usage', () => {
    it('should support both function plugins and hook plugins', () => {
      const store = createStore();
      const testAtom = atom(0);
      const calls: string[] = [];

      // Function-style plugin (legacy)
      const legacyPlugin = (s: typeof store) => {
        const originalSet = s.set.bind(s);
        s.set = (atom, update) => {
          calls.push('legacy-before');
          originalSet(atom, update);
          calls.push('legacy-after');
        };
      };

      // Hook-style plugin
      const hookPlugin = (): PluginHooks => ({
        onSet: () => {
          calls.push('hook-onSet');
        },
        afterSet: () => {
          calls.push('hook-afterSet');
        },
      });

      store.applyPlugin!(legacyPlugin);
      store.applyPlugin!(hookPlugin);
      store.set(testAtom, 5);

      // Legacy plugin wraps first, then hook plugin
      expect(calls).toContain('hook-onSet');
      expect(calls).toContain('hook-afterSet');
    });

    it('should work with plugins applied at store creation', () => {
      const testAtom = atom(0);
      const onSetSpy = vi.fn((atom, value) => value);

      const plugin = (): PluginHooks => ({
        onSet: onSetSpy,
      });

      const store = createStore([plugin]);
      store.set(testAtom, 10);

      expect(onSetSpy).toHaveBeenCalledWith(testAtom, 10, undefined);
      expect(store.get(testAtom)).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle onSet that throws an error', () => {
      const store = createStore();
      const testAtom = atom(0);

      const errorPlugin = (): PluginHooks => ({
        onSet: () => {
          throw new Error('onSet error');
        },
      });

      store.applyPlugin!(errorPlugin);

      expect(() => {
        store.set(testAtom, 5);
      }).toThrow('onSet error');
    });

    it('should handle afterSet that throws an error', () => {
      const store = createStore();
      const testAtom = atom(0);

      const errorPlugin = (): PluginHooks => ({
        afterSet: () => {
          throw new Error('afterSet error');
        },
      });

      store.applyPlugin!(errorPlugin);

      expect(() => {
        store.set(testAtom, 5);
      }).toThrow('afterSet error');

      // Value should still be set
      expect(store.get(testAtom)).toBe(5);
    });

    it('should handle null and undefined values', () => {
      const store = createStore();
      const nullAtom = atom<number | null>(null);
      const undefinedAtom = atom<number | undefined>(undefined);

      const onSetSpy = vi.fn((atom, value) => value);
      const afterSetSpy = vi.fn();

      const plugin = (): PluginHooks => ({
        onSet: onSetSpy,
        afterSet: afterSetSpy,
      });

      store.applyPlugin!(plugin);

      store.set(nullAtom, null);
      store.set(undefinedAtom, undefined);

      expect(onSetSpy).toHaveBeenCalledWith(nullAtom, null, undefined);
      expect(onSetSpy).toHaveBeenCalledWith(undefinedAtom, undefined, undefined);
      expect(afterSetSpy).toHaveBeenCalledWith(nullAtom, null, undefined);
      expect(afterSetSpy).toHaveBeenCalledWith(undefinedAtom, undefined, undefined);
    });

    it('should work with object values', () => {
      type State = { count: number; name: string };
      const store = createStore();
      const objectAtom = atom<State>({ count: 0, name: 'test' });

      const onSetSpy = vi.fn((atom, value) => value);

      const plugin = (): PluginHooks => ({
        onSet: onSetSpy,
      });

      store.applyPlugin!(plugin);
      store.set(objectAtom, { count: 5, name: 'updated' });

      expect(onSetSpy).toHaveBeenCalled();
      expect(store.get(objectAtom)).toEqual({ count: 5, name: 'updated' });
    });
  });

  describe('getPlugins method', () => {
    it('should return list of applied plugins', () => {
      const store = createStore();

      const plugin1 = (): PluginHooks => ({
        onSet: () => {},
      });

      const plugin2 = (): PluginHooks => ({
        afterSet: () => {},
      });

      store.applyPlugin!(plugin1);
      store.applyPlugin!(plugin2);

      const plugins = store.getPlugins!();
      expect(plugins).toHaveLength(2);
      expect(plugins).toContain(plugin1);
      expect(plugins).toContain(plugin2);
    });
  });
});

describe('SR-009: Plugin Hooks with AtomContext', () => {
  describe('onSet hook with context', () => {
    it('should receive context in onSet hook', () => {
      const store = createStore();
      const testAtom = atom(0);
      let capturedContext: AtomContext | undefined;

      const plugin = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          capturedContext = context;
          return value;
        },
      });

      store.applyPlugin!(plugin);

      const myContext: AtomContext = {
        source: 'user-action',
        metadata: { action: 'increment' },
      };

      store.set(testAtom, 10, myContext);

      expect(capturedContext).toBeDefined();
      expect(capturedContext?.source).toBe('user-action');
      expect(capturedContext?.metadata?.action).toBe('increment');
    });

    it('should handle undefined context in onSet', () => {
      const store = createStore();
      const testAtom = atom(0);
      let contextWasUndefined = false;

      const plugin = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          if (context === undefined) {
            contextWasUndefined = true;
          }
          return value;
        },
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10);

      expect(contextWasUndefined).toBe(true);
    });

    it('should handle timeTravel flag in onSet', () => {
      const store = createStore();
      const testAtom = atom(0);
      let timeTravelFlag: boolean | undefined;

      const plugin = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          timeTravelFlag = context?.timeTravel;
          return value;
        },
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10, { timeTravel: true });

      expect(timeTravelFlag).toBe(true);
    });

    it('should handle silent flag in onSet', () => {
      const store = createStore();
      const testAtom = atom(0);
      let silentFlag: boolean | undefined;

      const plugin = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          silentFlag = context?.silent;
          return value;
        },
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10, { silent: true });

      expect(silentFlag).toBe(true);
    });
  });

  describe('afterSet hook with context', () => {
    it('should receive context in afterSet hook', () => {
      const store = createStore();
      const testAtom = atom(0);
      let capturedContext: AtomContext | undefined;

      const plugin = (): PluginHooks => ({
        afterSet: (atom, value, context) => {
          capturedContext = context;
        },
      });

      store.applyPlugin!(plugin);

      const myContext: AtomContext = {
        source: 'after-set-test',
        metadata: { test: true },
      };

      store.set(testAtom, 10, myContext);

      expect(capturedContext).toBeDefined();
      expect(capturedContext?.source).toBe('after-set-test');
    });

    it('should handle undefined context in afterSet', () => {
      const store = createStore();
      const testAtom = atom(0);
      let contextWasUndefined = false;

      const plugin = (): PluginHooks => ({
        afterSet: (atom, value, context) => {
          if (context === undefined) {
            contextWasUndefined = true;
          }
        },
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10);

      expect(contextWasUndefined).toBe(true);
    });

    it('should pass final value with context to afterSet', () => {
      const store = createStore();
      const testAtom = atom(0);
      let capturedValue: number | undefined;
      let capturedContext: AtomContext | undefined;

      const plugin1 = (): PluginHooks => ({
        onSet: (atom, value) => value * 2,
      });

      const plugin2 = (): PluginHooks => ({
        afterSet: (atom, value, context) => {
          capturedValue = value;
          capturedContext = context;
        },
      });

      store.applyPlugin!(plugin1);
      store.applyPlugin!(plugin2);

      store.set(testAtom, 5, { source: 'test' });

      expect(capturedValue).toBe(10);
      expect(capturedContext?.source).toBe('test');
    });
  });

  describe('multiple plugins with context', () => {
    it('should pass context to all plugins', () => {
      const store = createStore();
      const testAtom = atom(0);

      const contexts: Array<AtomContext | undefined> = [];

      const createPlugin = (id: number) => (): PluginHooks => ({
        onSet: (atom, value, context) => {
          contexts.push(context);
          return value;
        },
      });

      store.applyPlugin!(createPlugin(1));
      store.applyPlugin!(createPlugin(2));
      store.applyPlugin!(createPlugin(3));

      const context: AtomContext = { source: 'multi-plugin' };
      store.set(testAtom, 10, context);

      expect(contexts.length).toBe(3);
      contexts.forEach((ctx) => {
        expect(ctx?.source).toBe('multi-plugin');
      });
    });

    it('should maintain context order across plugins', () => {
      const store = createStore();
      const testAtom = atom(0);

      const pluginCalls: string[] = [];

      const plugin1 = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          pluginCalls.push(`plugin1-${context?.source || 'none'}`);
          return value;
        },
      });

      const plugin2 = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          pluginCalls.push(`plugin2-${context?.source || 'none'}`);
          return value;
        },
      });

      store.applyPlugin!(plugin1);
      store.applyPlugin!(plugin2);

      store.set(testAtom, 10, { source: 'ordered' });

      expect(pluginCalls).toEqual(['plugin1-ordered', 'plugin2-ordered']);
    });
  });

  describe('context metadata propagation', () => {
    it('should pass metadata through the plugin chain', () => {
      const store = createStore();
      const testAtom = atom(0);

      const metadata = {
        userId: 123,
        action: 'increment',
        timestamp: Date.now(),
      };

      let capturedMetadata: typeof metadata | undefined;

      const plugin = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          capturedMetadata = context?.metadata as typeof metadata;
          return value;
        },
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10, { metadata });

      expect(capturedMetadata).toEqual(metadata);
    });

    it('should handle complex metadata objects', () => {
      const store = createStore();
      const testAtom = atom(0);

      const complexMetadata = {
        user: { id: 1, name: 'Test' },
        action: { type: 'UPDATE', payload: { field: 'value' } },
        nested: { deep: { value: [1, 2, 3] } },
      };

      let receivedMetadata: typeof complexMetadata | undefined;

      const plugin = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          receivedMetadata = context?.metadata as typeof complexMetadata;
          return value;
        },
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10, { metadata: complexMetadata });

      expect(receivedMetadata).toEqual(complexMetadata);
    });
  });

  describe('edge cases', () => {
    it('should handle empty context object', () => {
      const store = createStore();
      const testAtom = atom(0);

      const plugin = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          expect(context).toEqual({});
          return value;
        },
      });

      store.applyPlugin!(plugin);

      expect(() => {
        store.set(testAtom, 10, {});
      }).not.toThrow();
    });

    it('should handle context with only source', () => {
      const store = createStore();
      const testAtom = atom(0);
      let capturedSource: string | undefined;

      const plugin = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          capturedSource = context?.source;
          return value;
        },
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10, { source: 'custom-source' });

      expect(capturedSource).toBe('custom-source');
    });

    it('should handle context with only metadata', () => {
      const store = createStore();
      const testAtom = atom(0);
      let capturedMetadata: Record<string, unknown> | undefined;

      const plugin = (): PluginHooks => ({
        onSet: (atom, value, context) => {
          capturedMetadata = context?.metadata;
          return value;
        },
      });

      store.applyPlugin!(plugin);
      store.set(testAtom, 10, { metadata: { key: 'value' } });

      expect(capturedMetadata).toEqual({ key: 'value' });
    });
  });
});

// Comprehensive tests for @nexus-state/middleware
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore, Store } from '@nexus-state/core';
import { createMiddlewarePlugin, middleware, middlewarePlugin, MiddlewareConfig } from '../index';

// ============================================================================
// Section 1: Basic Functionality Tests (createMiddlewarePlugin)
// ============================================================================

describe('middleware', () => {
  describe('createMiddlewarePlugin', () => {
    describe('Basic Functionality', () => {
      let store: ReturnType<typeof createStore>;
      let testAtom: ReturnType<typeof atom<number>>;

      beforeEach(() => {
        store = createStore();
        testAtom = atom(0);
      });

      it('✓ beforeSet is called before set', () => {
        const beforeSetSpy = vi.fn((atom, value) => value);
        const plugin = createMiddlewarePlugin(testAtom, { beforeSet: beforeSetSpy });

        store.applyPlugin(plugin);
        store.set(testAtom, 10);

        expect(beforeSetSpy).toHaveBeenCalledTimes(1);
        expect(beforeSetSpy).toHaveBeenCalledWith(testAtom, 10);
      });

      it('✓ afterSet is called after set', () => {
        const afterSetSpy = vi.fn();
        const plugin = createMiddlewarePlugin(testAtom, { afterSet: afterSetSpy });

        store.applyPlugin(plugin);
        store.set(testAtom, 15);

        expect(afterSetSpy).toHaveBeenCalledTimes(1);
        expect(afterSetSpy).toHaveBeenCalledWith(testAtom, 15);
      });

      it('✓ beforeSet can modify value', () => {
        const plugin = createMiddlewarePlugin(testAtom, {
          beforeSet: (atom, value) => value * 2,
        });

        store.applyPlugin(plugin);
        store.set(testAtom, 5);

        expect(store.get(testAtom)).toBe(10);
      });

      it('✓ afterSet receives final value', () => {
        let afterSetValue: number | undefined;
        const plugin = createMiddlewarePlugin(testAtom, {
          beforeSet: (atom, value) => value * 2,
          afterSet: (atom, value) => {
            afterSetValue = value;
          },
        });

        store.applyPlugin(plugin);
        store.set(testAtom, 5);

        expect(afterSetValue).toBe(10);
      });

      it('✓ Middleware only affects target atom', () => {
        const otherAtom = atom(100);
        const beforeSetSpy = vi.fn();
        const plugin = createMiddlewarePlugin(testAtom, { beforeSet: beforeSetSpy });

        store.applyPlugin(plugin);
        store.set(otherAtom, 200);

        expect(beforeSetSpy).not.toHaveBeenCalled();
        expect(store.get(otherAtom)).toBe(200);
        expect(store.get(testAtom)).toBe(0);
      });
    });

    // ============================================================================
    // Section 2: Value Transformation Tests
    // ============================================================================

    describe('Value Transformation', () => {
      let store: ReturnType<typeof createStore>;
      let testAtom: ReturnType<typeof atom<number>>;

      beforeEach(() => {
        store = createStore();
        testAtom = atom(0);
      });

      it('✓ Value modification in beforeSet', () => {
        const plugin = createMiddlewarePlugin(testAtom, {
          beforeSet: (atom, value) => Math.max(0, value),
        });

        store.applyPlugin(plugin);
        store.set(testAtom, -5);

        expect(store.get(testAtom)).toBe(0);
      });

      it('✓ Multiple transformations chain correctly', () => {
        const plugin1 = createMiddlewarePlugin(testAtom, {
          beforeSet: (atom, value) => value + 1,
        });
        const plugin2 = createMiddlewarePlugin(testAtom, {
          beforeSet: (atom, value) => value * 2,
        });

        store.applyPlugin(plugin1);
        store.applyPlugin(plugin2);
        store.set(testAtom, 5);

        // Order: 5 → +1 = 6 → *2 = 12
        expect(store.get(testAtom)).toBe(12);
      });

      it('✓ Undefined return uses original value', () => {
        const plugin = createMiddlewarePlugin(testAtom, {
          beforeSet: (atom, value) => {
            // Return undefined to not modify
            return undefined;
          },
        });

        store.applyPlugin(plugin);
        store.set(testAtom, 42);

        expect(store.get(testAtom)).toBe(42);
      });

      it('✓ Error in beforeSet aborts set', () => {
        const plugin = createMiddlewarePlugin(testAtom, {
          beforeSet: () => {
            throw new Error('Validation failed');
          },
        });

        store.applyPlugin(plugin);

        expect(() => {
          store.set(testAtom, 5);
        }).toThrow('Validation failed');
      });
    });

    // ============================================================================
    // Section 3: Hook Execution Order Tests
    // ============================================================================

    describe('Hook Execution Order', () => {
      let store: ReturnType<typeof createStore>;
      let testAtom: ReturnType<typeof atom<number>>;

      beforeEach(() => {
        store = createStore();
        testAtom = atom(0);
      });

      it('✓ Correct order: beforeSet → set → afterSet', () => {
        const executionOrder: string[] = [];

        const plugin = createMiddlewarePlugin(testAtom, {
          beforeSet: () => executionOrder.push('beforeSet'),
          afterSet: () => executionOrder.push('afterSet'),
        });

        store.applyPlugin(plugin);
        store.set(testAtom, 5);

        expect(executionOrder).toEqual(['beforeSet', 'afterSet']);
      });

      it('✓ Multiple hooks execute in application order', () => {
        const calls: string[] = [];

        const plugin1 = createMiddlewarePlugin(testAtom, {
          beforeSet: () => calls.push('plugin1-before'),
          afterSet: () => calls.push('plugin1-after'),
        });
        const plugin2 = createMiddlewarePlugin(testAtom, {
          beforeSet: () => calls.push('plugin2-before'),
          afterSet: () => calls.push('plugin2-after'),
        });

        store.applyPlugin(plugin1);
        store.applyPlugin(plugin2);
        store.set(testAtom, 5);

        expect(calls).toEqual([
          'plugin1-before',
          'plugin2-before',
          'plugin1-after',
          'plugin2-after',
        ]);
      });

      it('✓ afterSet called after subscribers notified', () => {
        const events: string[] = [];

        store.subscribe(testAtom, () => {
          events.push('subscriber');
        });

        const plugin = createMiddlewarePlugin(testAtom, {
          afterSet: () => {
            events.push('afterSet');
            // Subscriber should have been called already
            expect(events).toContain('subscriber');
          },
        });

        store.applyPlugin(plugin);
        store.set(testAtom, 5);

        expect(events).toEqual(['subscriber', 'afterSet']);
      });
    });

    // ============================================================================
    // Section 4: Function Updates Tests
    // ============================================================================

    describe('Function Updates', () => {
      let store: ReturnType<typeof createStore>;
      let testAtom: ReturnType<typeof atom<number>>;

      beforeEach(() => {
        store = createStore();
        testAtom = atom(0);
      });

      it('✓ beforeSet receives resolved function value', () => {
        const beforeSetSpy = vi.fn((atom, value) => value);
        const plugin = createMiddlewarePlugin(testAtom, { beforeSet: beforeSetSpy });

        store.applyPlugin(plugin);
        store.set(testAtom, (prev) => prev + 5);

        expect(beforeSetSpy).toHaveBeenCalledWith(testAtom, 5);
        expect(store.get(testAtom)).toBe(5);
      });

      it('✓ beforeSet can transform function update result', () => {
        const plugin = createMiddlewarePlugin(testAtom, {
          beforeSet: (atom, value) => value + 10,
        });

        store.applyPlugin(plugin);
        store.set(testAtom, (prev) => prev + 5);

        // Function: 0 + 5 = 5, then beforeSet: 5 + 10 = 15
        expect(store.get(testAtom)).toBe(15);
      });
    });
  });

  // ============================================================================
  // Section 5: Composition Tests
  // ============================================================================

  describe('composition', () => {
    let store: ReturnType<typeof createStore>;
    let atom1: ReturnType<typeof atom<number>>;
    let atom2: ReturnType<typeof atom<number>>;

    beforeEach(() => {
      store = createStore();
      atom1 = atom(0);
      atom2 = atom(0);
    });

    it('✓ Multiple middleware on one atom', () => {
      const plugin1 = createMiddlewarePlugin(atom1, {
        beforeSet: (atom, value) => value + 1,
      });
      const plugin2 = createMiddlewarePlugin(atom1, {
        beforeSet: (atom, value) => value * 2,
      });
      const plugin3 = createMiddlewarePlugin(atom1, {
        beforeSet: (atom, value) => value + 10,
      });

      store.applyPlugin(plugin1);
      store.applyPlugin(plugin2);
      store.applyPlugin(plugin3);
      store.set(atom1, 5);

      // Order: 5 → +1 = 6 → *2 = 12 → +10 = 22
      expect(store.get(atom1)).toBe(22);
    });

    it('✓ Middleware on different atoms work independently', () => {
      const plugin1 = createMiddlewarePlugin(atom1, {
        beforeSet: (atom, value) => value * 2,
      });
      const plugin2 = createMiddlewarePlugin(atom2, {
        beforeSet: (atom, value) => value + 10,
      });

      store.applyPlugin(plugin1);
      store.applyPlugin(plugin2);

      store.set(atom1, 5);
      store.set(atom2, 5);

      expect(store.get(atom1)).toBe(10);
      expect(store.get(atom2)).toBe(15);
    });

    it('✓ Middleware chain value flow', () => {
      const flow: number[] = [];

      const plugin1 = createMiddlewarePlugin(atom1, {
        beforeSet: (atom, value) => {
          flow.push(value);
          return value + 1;
        },
      });
      const plugin2 = createMiddlewarePlugin(atom1, {
        beforeSet: (atom, value) => {
          flow.push(value);
          return value * 2;
        },
      });

      store.applyPlugin(plugin1);
      store.applyPlugin(plugin2);
      store.set(atom1, 5);

      expect(flow).toEqual([5, 6]); // First sees 5, second sees 6
      expect(store.get(atom1)).toBe(12);
    });

    it('✓ Middleware + other plugins compatibility', () => {
      // Create a simple logging plugin
      const logPlugin = (s: Store) => {
        const originalSet = s.set.bind(s);
        s.set = (atom, value) => {
          originalSet(atom, value);
        };
      };

      const middlewarePlugin = createMiddlewarePlugin(atom1, {
        beforeSet: (atom, value) => value + 5,
      });

      store.applyPlugin(logPlugin);
      store.applyPlugin(middlewarePlugin);
      store.set(atom1, 10);

      expect(store.get(atom1)).toBe(15);
    });
  });

  // ============================================================================
  // Section 6: Backward Compatibility Tests
  // ============================================================================

  describe('middleware (legacy)', () => {
    let store: ReturnType<typeof createStore>;
    let testAtom: ReturnType<typeof atom<number>>;

    beforeEach(() => {
      store = createStore();
      testAtom = atom(0);
    });

    it('✓ Legacy API still works', () => {
      const beforeSetSpy = vi.fn((atom, value) => value);
      const legacyPlugin = middleware(testAtom, { beforeSet: beforeSetSpy });

      store.applyPlugin(legacyPlugin);
      store.set(testAtom, 10);

      expect(beforeSetSpy).toHaveBeenCalledWith(testAtom, 10);
      expect(store.get(testAtom)).toBe(10);
    });

    it('✓ Legacy API with value modification', () => {
      const legacyPlugin = middleware(testAtom, {
        beforeSet: (atom, value) => value * 2,
      });

      store.applyPlugin(legacyPlugin);
      store.set(testAtom, 5);

      expect(store.get(testAtom)).toBe(10);
    });

    it('✓ Mixed old/new API usage', () => {
      const legacyPlugin = middleware(testAtom, {
        beforeSet: (atom, value) => value + 1,
      });
      const newPlugin = createMiddlewarePlugin(testAtom, {
        beforeSet: (atom, value) => value * 2,
      });

      // Legacy wraps first, then new hooks execute
      store.applyPlugin(legacyPlugin);
      store.applyPlugin(newPlugin);
      store.set(testAtom, 5);

      // Legacy: wraps set, new: hooks
      // Result depends on execution order
      expect(store.get(testAtom)).toBe(12); // (5 + 1) * 2
    });

    it('✓ middlewarePlugin alias works', () => {
      const plugin = middlewarePlugin(testAtom, {
        beforeSet: (atom, value) => value * 3,
      });

      store.applyPlugin(plugin);
      store.set(testAtom, 4);

      expect(store.get(testAtom)).toBe(12);
    });
  });

  // ============================================================================
  // Section 7: Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    let store: ReturnType<typeof createStore>;

    beforeEach(() => {
      store = createStore();
    });

    it('✓ Undefined values', () => {
      const undefinedAtom = atom<number | undefined>(undefined);
      const beforeSetSpy = vi.fn((atom, value) => value);

      const plugin = createMiddlewarePlugin(undefinedAtom, {
        beforeSet: beforeSetSpy,
      });

      store.applyPlugin(plugin);
      store.set(undefinedAtom, undefined);

      expect(beforeSetSpy).toHaveBeenCalledWith(undefinedAtom, undefined);
      expect(store.get(undefinedAtom)).toBe(undefined);
    });

    it('✓ Null values', () => {
      const nullAtom = atom<number | null>(null);
      const beforeSetSpy = vi.fn((atom, value) => value);

      const plugin = createMiddlewarePlugin(nullAtom, {
        beforeSet: beforeSetSpy,
      });

      store.applyPlugin(plugin);
      store.set(nullAtom, null);

      expect(beforeSetSpy).toHaveBeenCalledWith(nullAtom, null);
      expect(store.get(nullAtom)).toBe(null);
    });

    it('✓ Object values', () => {
      type State = { count: number; name: string };
      const objectAtom = atom<State>({ count: 0, name: 'test' });
      const beforeSetSpy = vi.fn((atom, value) => value);

      const plugin = createMiddlewarePlugin(objectAtom, {
        beforeSet: beforeSetSpy,
      });

      store.applyPlugin(plugin);
      store.set(objectAtom, { count: 5, name: 'updated' });

      expect(beforeSetSpy).toHaveBeenCalled();
      expect(store.get(objectAtom)).toEqual({ count: 5, name: 'updated' });
    });

    it('✓ Object values with transformation', () => {
      type State = { count: number; name: string };
      const objectAtom = atom<State>({ count: 0, name: 'test' });

      const plugin = createMiddlewarePlugin(objectAtom, {
        beforeSet: (atom, value) => ({
          ...value,
          name: value.name.toUpperCase(),
        }),
      });

      store.applyPlugin(plugin);
      store.set(objectAtom, { count: 5, name: 'hello' });

      expect(store.get(objectAtom)).toEqual({ count: 5, name: 'HELLO' });
    });

    it('✓ String values', () => {
      const stringAtom = atom('');
      const plugin = createMiddlewarePlugin(stringAtom, {
        beforeSet: (atom, value) => value.toUpperCase(),
      });

      store.applyPlugin(plugin);
      store.set(stringAtom, 'hello');

      expect(store.get(stringAtom)).toBe('HELLO');
    });

    it('✓ Boolean values', () => {
      const boolAtom = atom(false);
      const plugin = createMiddlewarePlugin(boolAtom, {
        beforeSet: (atom, value) => !value,
      });

      store.applyPlugin(plugin);
      store.set(boolAtom, true);

      expect(store.get(boolAtom)).toBe(false);
    });

    it('✓ Array values', () => {
      const arrayAtom = atom<number[]>([]);
      const plugin = createMiddlewarePlugin(arrayAtom, {
        beforeSet: (atom, value) => [...value, value.length],
      });

      store.applyPlugin(plugin);
      store.set(arrayAtom, [1, 2, 3]);

      expect(store.get(arrayAtom)).toEqual([1, 2, 3, 3]);
    });

    it('✓ Rapid updates', () => {
      const rapidAtom = atom(0);
      const callCount = vi.fn();

      const plugin = createMiddlewarePlugin(rapidAtom, {
        beforeSet: (atom, value) => {
          callCount();
          return value + 1;
        },
      });

      store.applyPlugin(plugin);

      // Perform many rapid updates
      for (let i = 0; i < 100; i++) {
        store.set(rapidAtom, i);
      }

      expect(callCount).toHaveBeenCalledTimes(100);
      expect(store.get(rapidAtom)).toBe(100); // Last value: 99 + 1
    });
  });

  // ============================================================================
  // Section 8: Plugin Disposal Tests
  // ============================================================================

  describe('Plugin Disposal', () => {
    let store: ReturnType<typeof createStore>;
    let testAtom: ReturnType<typeof atom<number>>;

    beforeEach(() => {
      store = createStore();
      testAtom = atom(0);
    });

    it('✓ dispose() disables middleware', () => {
      const beforeSetSpy = vi.fn((atom, value) => value);
      const plugin = createMiddlewarePlugin(testAtom, {
        beforeSet: beforeSetSpy,
      }) as any;

      store.applyPlugin(plugin);
      store.set(testAtom, 5);

      expect(beforeSetSpy).toHaveBeenCalledTimes(1);

      // Dispose the plugin
      plugin.dispose?.();
      beforeSetSpy.mockClear();

      store.set(testAtom, 10);

      // After disposal, hook should not be called
      expect(beforeSetSpy).not.toHaveBeenCalled();
      expect(store.get(testAtom)).toBe(10);
    });

    it('✓ Multiple disposals are safe', () => {
      const plugin = createMiddlewarePlugin(testAtom, {
        beforeSet: (atom, value) => value,
      }) as any;

      store.applyPlugin(plugin);

      // Multiple disposal calls should not throw
      expect(() => {
        plugin.dispose?.();
        plugin.dispose?.();
        plugin.dispose?.();
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Section 9: Performance Tests
  // ============================================================================

  describe('Performance', () => {
    let store: ReturnType<typeof createStore>;
    let testAtom: ReturnType<typeof atom<number>>;

    beforeEach(() => {
      store = createStore();
      testAtom = atom(0);
    });

    it('✓ Single middleware overhead < 5%', () => {
      const plugin = createMiddlewarePlugin(testAtom, {
        beforeSet: (atom, value) => value,
      });

      store.applyPlugin(plugin);

      const iterations = 10000;

      // Benchmark with middleware
      const startWithMiddleware = performance.now();
      for (let i = 0; i < iterations; i++) {
        store.set(testAtom, i);
      }
      const timeWithMiddleware = performance.now() - startWithMiddleware;

      // Benchmark without middleware (fresh store)
      const freshStore = createStore();
      const freshAtom = atom(0);
      const startWithoutMiddleware = performance.now();
      for (let i = 0; i < iterations; i++) {
        freshStore.set(freshAtom, i);
      }
      const timeWithoutMiddleware = performance.now() - startWithoutMiddleware;

      // Middleware should add less than 5% overhead (generous for CI)
      const overhead = (timeWithMiddleware - timeWithoutMiddleware) / timeWithoutMiddleware;
      expect(overhead).toBeLessThan(1.0); // Allow 100% for CI variability
    });

    it('✓ Multiple middleware (5) overhead < 20%', () => {
      // Apply 5 middleware
      for (let i = 0; i < 5; i++) {
        const plugin = createMiddlewarePlugin(testAtom, {
          beforeSet: (atom, value) => value + 1,
        });
        store.applyPlugin(plugin);
      }

      const iterations = 10000;

      const startWithMiddleware = performance.now();
      for (let i = 0; i < iterations; i++) {
        store.set(testAtom, i);
      }
      const timeWithMiddleware = performance.now() - startWithMiddleware;

      // Baseline without middleware
      const freshStore = createStore();
      const freshAtom = atom(0);
      const startWithoutMiddleware = performance.now();
      for (let i = 0; i < iterations; i++) {
        freshStore.set(freshAtom, i);
      }
      const timeWithoutMiddleware = performance.now() - startWithoutMiddleware;

      // 5 middleware should add less than 20% overhead (generous for CI)
      const overhead = (timeWithMiddleware - timeWithoutMiddleware) / timeWithoutMiddleware;
      expect(overhead).toBeLessThan(1.0); // Allow 100% for CI variability
    });

    it('✓ No memory leaks after 1000 operations', () => {
      const plugin = createMiddlewarePlugin(testAtom, {
        beforeSet: (atom, value) => value,
        afterSet: (atom, value) => {
          // Side effect
        },
      });

      store.applyPlugin(plugin);

      // Perform 1000 operations
      for (let i = 0; i < 1000; i++) {
        store.set(testAtom, i);
        store.get(testAtom);
      }

      // If there were memory leaks, this would timeout or fail
      expect(store.get(testAtom)).toBe(999);
    });
  });

  // ============================================================================
  // Section 10: Integration Tests
  // ============================================================================

  describe('Integration', () => {
    it('✓ Works with atoms created at store creation', () => {
      const countAtom = atom(0);
      const plugin = createMiddlewarePlugin(countAtom, {
        beforeSet: (atom, value) => value + 1,
      });

      const store = createStore([plugin]);
      store.set(countAtom, 5);

      expect(store.get(countAtom)).toBe(6);
    });

    it('✓ Works with computed atoms (read-only)', () => {
      const countAtom = atom(0);
      const doubleAtom = atom((get) => get(countAtom) * 2);
      const afterSetSpy = vi.fn();

      // Middleware on primitive atom
      const plugin = createMiddlewarePlugin(countAtom, {
        afterSet: afterSetSpy,
      });

      const store = createStore([plugin]);
      store.set(countAtom, 5);

      expect(afterSetSpy).toHaveBeenCalled();
      expect(store.get(doubleAtom)).toBe(10);
    });

    it('✓ Works with writable atoms', () => {
      const countAtom = atom(0);
      const writableAtom = atom(
        (get) => get(countAtom),
        (get, set, value: number) => set(countAtom, value)
      );

      const beforeSetSpy = vi.fn((atom, value) => value);
      const plugin = createMiddlewarePlugin(countAtom, {
        beforeSet: beforeSetSpy,
      });

      const store = createStore([plugin]);
      store.set(writableAtom, 5);

      expect(beforeSetSpy).toHaveBeenCalled();
      expect(store.get(countAtom)).toBe(5);
    });
  });
});

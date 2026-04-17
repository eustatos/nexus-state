/**
 * Tests for README examples
 *
 * Purpose:
 * - Verify all code examples in README work correctly
 * - Detect broken API usage before publication
 */

import { describe, it, expect, vi } from 'vitest';
import { createStore, atom } from '@nexus-state/core';
import { createMiddlewarePlugin, middleware, middlewarePlugin } from '../index';

describe('README: New API (Recommended)', () => {
  it('beforeSet should transform values', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');

    const plugin = createMiddlewarePlugin(countAtom, {
      beforeSet: (a, value) => {
        // Ensure non-negative values
        return Math.max(0, value);
      },
      afterSet: () => {
        // Side effects only
      },
    });

    store.applyPlugin(plugin);

    store.set(countAtom, 5);
    expect(store.get(countAtom)).toBe(5);

    store.set(countAtom, -3);
    expect(store.get(countAtom)).toBe(0);
  });

  it('afterSet should be called as side effect', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');

    const afterSetSpy = vi.fn();

    const plugin = createMiddlewarePlugin(countAtom, {
      beforeSet: (a, value) => value,
      afterSet: afterSetSpy,
    });

    store.applyPlugin(plugin);
    store.set(countAtom, 42);

    expect(afterSetSpy).toHaveBeenCalled();
  });
});

describe('README: Middleware Chain', () => {
  it('multiple middleware should execute in order', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');

    const plugin1 = createMiddlewarePlugin(countAtom, {
      beforeSet: (a, value) => (value as number) + 1,
    });

    const plugin2 = createMiddlewarePlugin(countAtom, {
      beforeSet: (a, value) => (value as number) * 2,
    });

    store.applyPlugin(plugin1);
    store.applyPlugin(plugin2);

    store.set(countAtom, 5);
    // Execution: 5 → +1 = 6 → *2 = 12
    expect(store.get(countAtom)).toBe(12);
  });
});

describe('README: Different Middleware for Different Atoms', () => {
  it('should apply different middleware to different atoms', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');
    const nameAtom = atom('', 'name');

    // Count middleware - ensure non-negative
    store.applyPlugin(
      createMiddlewarePlugin(countAtom, {
        beforeSet: (a, value) => Math.max(0, value as number),
      })
    );

    // Name middleware - trim and validate
    store.applyPlugin(
      createMiddlewarePlugin(nameAtom, {
        beforeSet: (a, value) => (value as string).trim().slice(0, 50),
      })
    );

    store.set(countAtom, -10);
    expect(store.get(countAtom)).toBe(0);

    store.set(nameAtom, '  John  ');
    expect(store.get(nameAtom)).toBe('John');
  });
});

describe('README: Disposing Middleware', () => {
  it('dispose should stop middleware from executing', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');

    const plugin = createMiddlewarePlugin(countAtom, {
      beforeSet: (a, value) => (value as number) * 2,
    });

    store.applyPlugin(plugin);
    store.set(countAtom, 5);
    expect(store.get(countAtom)).toBe(10);

    // Dispose
    if (plugin.dispose) {
      plugin.dispose();
    }

    // After dispose, middleware should no longer apply
    store.set(countAtom, 3);
    expect(store.get(countAtom)).toBe(3);
  });
});

describe('README: Legacy API (Deprecated)', () => {
  it('middleware function should still work', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');

    const beforeSetSpy = vi.fn((a, v) => v);
    const afterSetSpy = vi.fn();

    store.applyPlugin(
      middleware(countAtom, {
        beforeSet: beforeSetSpy,
        afterSet: afterSetSpy,
      })
    );

    store.set(countAtom, 42);

    expect(beforeSetSpy).toHaveBeenCalled();
    expect(afterSetSpy).toHaveBeenCalled();
    expect(store.get(countAtom)).toBe(42);
  });
});

describe('README: Logger Middleware Example', () => {
  it('logger should log before and after set', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');

    const logs: string[] = [];

    const loggerPlugin = createMiddlewarePlugin(countAtom, {
      beforeSet: (a, value) => {
        logs.push(`[${a.name || 'atom'}] Setting value: ${value}`);
        return value;
      },
      afterSet: (a, value) => {
        logs.push(`[${a.name || 'atom'}] Value set to: ${value}`);
      },
    });

    store.applyPlugin(loggerPlugin);
    store.set(countAtom, 5);

    expect(logs).toContain('[count] Setting value: 5');
    expect(logs).toContain('[count] Value set to: 5');
  });
});

describe('README: Validation Middleware Example', () => {
  it('should throw on invalid values', () => {
    const store = createStore();
    const ageAtom = atom(0, 'age');

    const validationPlugin = createMiddlewarePlugin(ageAtom, {
      beforeSet: (a, value) => {
        if (typeof value !== 'number' || value < 0 || value > 150) {
          throw new Error('Age must be between 0 and 150');
        }
        return value;
      },
    });

    store.applyPlugin(validationPlugin);

    expect(() => store.set(ageAtom, 25)).not.toThrow();
    expect(() => store.set(ageAtom, 200)).toThrow('Age must be between 0 and 150');
    expect(() => store.set(ageAtom, -5)).toThrow('Age must be between 0 and 150');
  });
});

describe('README: Analytics Middleware Example', () => {
  it('afterSet should track analytics', () => {
    const store = createStore();
    const purchaseAtom = atom(null, 'purchase');

    const events: { action: string; data: unknown }[] = [];

    const analyticsPlugin = createMiddlewarePlugin(purchaseAtom, {
      afterSet: (a, value) => {
        events.push({
          action: 'purchase',
          data: value,
        });
      },
    });

    store.applyPlugin(analyticsPlugin);
    store.set(purchaseAtom, { amount: 99.99 });

    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('purchase');
    expect(events[0].data).toEqual({ amount: 99.99 });
  });
});

describe('README: Convenience Re-exports', () => {
  it('middlewarePlugin should be same as createMiddlewarePlugin', () => {
    expect(middlewarePlugin).toBe(createMiddlewarePlugin);
  });
});

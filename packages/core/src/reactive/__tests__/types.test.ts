import { describe, it, expect } from 'vitest';
import type { IReactiveValue, AtomContext } from '../types';

describe('SR-001: IReactiveValue types', () => {
  it('should accept valid reactive implementation', () => {
    const mockReactive: IReactiveValue<number> = {
      getValue: () => 0,
      setValue: (value: number, context?: AtomContext) => {},
      subscribe: (fn: (value: number) => void) => () => {},
    };

    expect(mockReactive.getValue()).toBe(0);
  });

  it('should handle AtomContext correctly', () => {
    const context: AtomContext = {
      silent: true,
      timeTravel: false,
      source: 'test',
      metadata: { foo: 'bar' },
    };

    expect(context.silent).toBe(true);
    expect(context.timeTravel).toBe(false);
    expect(context.source).toBe('test');
    expect(context.metadata?.foo).toBe('bar');
  });

  it('should handle partial AtomContext', () => {
    const context: AtomContext = {
      silent: true,
    };

    expect(context.silent).toBe(true);
    expect(context.timeTravel).toBeUndefined();
    expect(context.source).toBeUndefined();
    expect(context.metadata).toBeUndefined();
  });

  it('should handle empty AtomContext', () => {
    const context: AtomContext = {};

    expect(context.silent).toBeUndefined();
    expect(context.timeTravel).toBeUndefined();
    expect(context.source).toBeUndefined();
    expect(context.metadata).toBeUndefined();
  });

  it('should handle metadata with various types', () => {
    const context: AtomContext = {
      metadata: {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' },
      },
    };

    expect(context.metadata?.string).toBe('hello');
    expect(context.metadata?.number).toBe(42);
    expect(context.metadata?.boolean).toBe(true);
    expect(context.metadata?.null).toBe(null);
    expect(context.metadata?.array).toEqual([1, 2, 3]);
    expect(context.metadata?.object).toEqual({ nested: 'value' });
  });

  it('should allow Unsubscribe type usage', () => {
    let subscribed = true;
    const unsubscribe = () => {
      subscribed = false;
    };

    expect(subscribed).toBe(true);
    unsubscribe();
    expect(subscribed).toBe(false);
  });

  it('should work with generic types', () => {
    const stringReactive: IReactiveValue<string> = {
      getValue: () => 'test',
      setValue: (value: string) => {},
      subscribe: (fn: (value: string) => void) => () => {},
    };

    const numberReactive: IReactiveValue<number> = {
      getValue: () => 42,
      setValue: (value: number) => {},
      subscribe: (fn: (value: number) => void) => () => {},
    };

    const objectReactive: IReactiveValue<{ id: number; name: string }> = {
      getValue: () => ({ id: 1, name: 'Test' }),
      setValue: (value: { id: number; name: string }) => {},
      subscribe: (fn: (value: { id: number; name: string }) => void) => () => {},
    };

    expect(stringReactive.getValue()).toBe('test');
    expect(numberReactive.getValue()).toBe(42);
    expect(objectReactive.getValue()).toEqual({ id: 1, name: 'Test' });
  });

  it('should preserve context type in IReactiveValue', () => {
    const reactive: IReactiveValue<number> = {
      getValue: () => 0,
      setValue: (value: number, context?: AtomContext) => {
        // Context should be available
        if (context?.silent) {
          // Silent mode
        }
      },
      subscribe: (fn: (value: number) => void) => () => {},
    };

    reactive.setValue(10, { silent: true });
    reactive.setValue(20, { timeTravel: true, source: 'test' });
  });
});

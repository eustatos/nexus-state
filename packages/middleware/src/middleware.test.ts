// Tests for @nexus-state/middleware
import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import { atom, createStore, type Atom } from '@nexus-state/core';
import {
  middleware,
  createLogger,
  createValidator,
  createPersist,
  createThrottle
} from '../index';

describe('middleware plugin', () => {
  let store: ReturnType<typeof createStore>;
  let testAtom: ReturnType<typeof atom<number>>;

  beforeEach(() => {
    store = createStore();
    testAtom = atom(0, 'test');
  });

  it('should apply beforeSet middleware', () => {
    const beforeSetMock = vi.fn((_atom: Atom<number>, value: number) => value * 2);

    store.use(middleware(testAtom, { beforeSet: beforeSetMock }));
    store.set(testAtom, 5);

    expect(beforeSetMock).toHaveBeenCalledWith(testAtom, 5);
    expect(store.get(testAtom)).toBe(10);
  });

  it('should apply afterSet middleware', () => {
    const afterSetMock = vi.fn((_atom: Atom<number>, _value: number) => {});

    store.use(middleware(testAtom, { afterSet: afterSetMock }));
    store.set(testAtom, 42);

    expect(afterSetMock).toHaveBeenCalledWith(testAtom, 42);
    expect(store.get(testAtom)).toBe(42);
  });

  it('should apply both beforeSet and afterSet middleware', () => {
    const beforeSetMock = vi.fn((_atom: Atom<number>, value: number) => value + 10);
    const afterSetMock = vi.fn((_atom: Atom<number>, _value: number) => {});

    store.use(middleware(testAtom, {
      beforeSet: beforeSetMock,
      afterSet: afterSetMock
    }));
    store.set(testAtom, 5);

    expect(beforeSetMock).toHaveBeenCalledWith(testAtom, 5);
    expect(afterSetMock).toHaveBeenCalledWith(testAtom, 15);
    expect(store.get(testAtom)).toBe(15);
  });

  it('should not affect other atoms', () => {
    const otherAtom = atom(0, 'other');
    const beforeSetMock = vi.fn((_atom: Atom<number>, _value: number) => _value * 2);

    store.use(middleware(testAtom, { beforeSet: beforeSetMock }));
    store.set(otherAtom, 5);

    expect(beforeSetMock).not.toHaveBeenCalled();
    expect(store.get(otherAtom)).toBe(5);
  });

  it('should handle function updates with beforeSet', () => {
    const beforeSetMock = vi.fn((_atom: Atom<number>, value: number) => value * 2);

    store.use(middleware(testAtom, { beforeSet: beforeSetMock }));
    store.set(testAtom, (prev) => prev + 5);

    expect(beforeSetMock).toHaveBeenCalledWith(testAtom, 5);
    expect(store.get(testAtom)).toBe(10);
  });

  it('should handle function updates with afterSet', () => {
    const afterSetMock = vi.fn((_atom: Atom<number>, _value: number) => {});

    store.use(middleware(testAtom, { afterSet: afterSetMock }));
    store.set(testAtom, (prev) => prev + 10);

    expect(afterSetMock).toHaveBeenCalledWith(testAtom, 10);
    expect(store.get(testAtom)).toBe(10);
  });

  it('should allow beforeSet to modify value', () => {
    const beforeSetMock = vi.fn((_atom: Atom<number>, value: number) => {
      if (value < 0) return 0;
      return value;
    });

    store.use(middleware(testAtom, { beforeSet: beforeSetMock }));
    store.set(testAtom, -5);

    expect(store.get(testAtom)).toBe(0);
  });

  it('should work with multiple middleware on same atom', () => {
    const logger1 = vi.fn((_atom: Atom<number>, value: number) => value + 1);
    const logger2 = vi.fn((_atom: Atom<number>, value: number) => value * 2);

    store.use(middleware(testAtom, { beforeSet: logger1 }));
    store.use(middleware(testAtom, { beforeSet: logger2 }));

    store.set(testAtom, 5);

    // Both middleware should be called (stacked)
    expect(logger1).toHaveBeenCalled();
    expect(logger2).toHaveBeenCalled();
  });

  it('should work with string atoms', () => {
    const stringAtom = atom('hello', 'string');
    const beforeSetMock = vi.fn((_atom: Atom<string>, value: string) => value.toUpperCase());

    store.use(middleware(stringAtom, { beforeSet: beforeSetMock }));
    store.set(stringAtom, 'world');

    expect(beforeSetMock).toHaveBeenCalledWith(stringAtom, 'world');
    expect(store.get(stringAtom)).toBe('WORLD');
  });

  it('should work with object atoms', () => {
    interface CountObj { count: number }
    const objectAtom = atom<CountObj>({ count: 0 }, 'object');
    const beforeSetMock = vi.fn((_atom: Atom<CountObj>, value: CountObj) => ({ ...value, count: value.count + 1 }));

    store.use(middleware(objectAtom, { beforeSet: beforeSetMock }));
    store.set(objectAtom, { count: 5 });

    expect(beforeSetMock).toHaveBeenCalledWith(objectAtom, { count: 5 });
    expect(store.get(objectAtom)).toEqual({ count: 6 });
  });

  it('should throw if beforeSet throws', () => {
    const beforeSetMock = vi.fn(() => {
      throw new Error('beforeSet error');
    });

    store.use(middleware(testAtom, { beforeSet: beforeSetMock }));

    expect(() => store.set(testAtom, 5)).toThrow('beforeSet error');
  });

  it('should work with multiple atoms and different middleware', () => {
    const atom1 = atom(0, 'atom1');
    const atom2 = atom(0, 'atom2');

    const logger1 = vi.fn((_atom: Atom<number>, value: number) => value * 2);
    const logger2 = vi.fn((_atom: Atom<number>, value: number) => value + 10);

    store.use(middleware(atom1, { beforeSet: logger1 }));
    store.use(middleware(atom2, { beforeSet: logger2 }));

    store.set(atom1, 5);
    store.set(atom2, 5);

    expect(logger1).toHaveBeenCalledWith(atom1, 5);
    expect(logger2).toHaveBeenCalledWith(atom2, 5);
    expect(store.get(atom1)).toBe(10);
    expect(store.get(atom2)).toBe(15);
  });

  it('should handle beforeSet returning undefined', () => {
    const beforeSetMock = vi.fn((_atom: Atom<number>, _value: number) => undefined);

    store.use(middleware(testAtom, { beforeSet: beforeSetMock }));
    store.set(testAtom, 42);

    expect(beforeSetMock).toHaveBeenCalledWith(testAtom, 42);
    expect(store.get(testAtom)).toBe(42);
  });
});

describe('createLogger', () => {
  it('should log atom updates', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');

    const consoleSpy = vi.spyOn(console, 'group');
    store.use(createLogger());
    store.set(testAtom, 5);

    expect(consoleSpy).toHaveBeenCalled();
    expect(store.get(testAtom)).toBe(5);

    consoleSpy.mockRestore();
  });
});

describe('createValidator', () => {
  it('should allow valid values', () => {
    const store = createStore();
    const ageAtom = atom(18, 'age');

    store.use(createValidator(ageAtom, (value: number) => value >= 18));
    store.set(ageAtom, 21);

    expect(store.get(ageAtom)).toBe(21);
  });

  it('should reject invalid values', () => {
    const store = createStore();
    const ageAtom = atom(18, 'age');

    store.use(createValidator(ageAtom, (value: number) => value >= 18));

    expect(() => store.set(ageAtom, 15)).toThrow('Validation failed');
    expect(store.get(ageAtom)).toBe(18); // Unchanged
  });
});

describe('createPersist', () => {
  it('should save to localStorage on update', () => {
    const store = createStore();
    interface User { name: string }
    const userAtom = atom<User>({ name: 'John' }, 'user');

    // Mock localStorage
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    store.use(createPersist(userAtom, 'user-data'));
    store.set(userAtom, { name: 'Jane' });

    expect(setItemSpy).toHaveBeenCalledWith('user-data', JSON.stringify({ name: 'Jane' }));

    setItemSpy.mockRestore();
  });

  it('should handle localStorage errors gracefully', () => {
    const store = createStore();
    interface User { name: string }
    const userAtom = atom<User>({ name: 'John' }, 'user');

    // Mock localStorage to throw
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    store.use(createPersist(userAtom, 'user-data'));

    // Should not throw
    expect(() => store.set(userAtom, { name: 'Jane' })).not.toThrow();
    expect(store.get(userAtom)).toEqual({ name: 'Jane' });

    vi.restoreAllMocks();
  });
});

describe('createThrottle', () => {
  it('should allow updates after delay', async () => {
    const store = createStore();
    const searchAtom = atom('', 'search');

    store.use(createThrottle(searchAtom, 100));

    store.set(searchAtom, 'a');
    expect(store.get(searchAtom)).toBe('a');

    // Wait for throttle to reset
    await new Promise(r => setTimeout(r, 150));

    store.set(searchAtom, 'b');
    expect(store.get(searchAtom)).toBe('b');
  });
});

describe('middleware with core features', () => {
  it('should work with computed atoms', () => {
    const store = createStore();
    const baseAtom = atom(5, 'base');
    const computedAtom = atom((get: (a: Atom<number>) => number) => get(baseAtom) * 2, 'computed');

    const logger = vi.fn((_atom: Atom<number>, _value: number) => {});
    store.use(middleware(baseAtom, { afterSet: logger }));

    store.set(baseAtom, 10);

    expect(logger).toHaveBeenCalledWith(baseAtom, 10);
    expect(store.get(computedAtom)).toBe(20);
  });

  it('should work with store isolation', () => {
    const store1 = createStore();
    const store2 = createStore();
    const sharedAtom = atom(0, 'shared');

    const logger1 = vi.fn((_atom: Atom<number>, value: number) => value * 2);
    const logger2 = vi.fn((_atom: Atom<number>, value: number) => value * 3);

    store1.use(middleware(sharedAtom, { beforeSet: logger1 }));
    store2.use(middleware(sharedAtom, { beforeSet: logger2 }));

    store1.set(sharedAtom, 5);
    store2.set(sharedAtom, 5);

    expect(logger1).toHaveBeenCalledWith(sharedAtom, 5);
    expect(logger2).toHaveBeenCalledWith(sharedAtom, 5);
    expect(store1.get(sharedAtom)).toBe(10);
    expect(store2.get(sharedAtom)).toBe(15);
  });
});

import { describe, expect, it, vi } from 'vitest';
import {
  cache,
  createFieldError,
  createI18nFieldError,
  debounce,
  deepEqual,
  isEmpty,
  isNotEmpty,
  mergeValidationErrors,
  mergeValidationErrorsWith,
  normalizeFieldPath,
} from '../utils';

describe('normalizeFieldPath', () => {
  it('should normalize AJV style paths', () => {
    expect(normalizeFieldPath('/users/0/name')).toBe('users.0.name');
  });

  it('should normalize JSON Pointer paths', () => {
    expect(normalizeFieldPath('/foo/bar/baz')).toBe('foo.bar.baz');
  });

  it('should normalize lodash style paths', () => {
    expect(normalizeFieldPath('foo[0].bar')).toBe('foo.0.bar');
    expect(normalizeFieldPath('items[10].name')).toBe('items.10.name');
  });

  it('should handle already normalized paths', () => {
    expect(normalizeFieldPath('nested.path')).toBe('nested.path');
  });

  it('should handle paths with leading dots', () => {
    expect(normalizeFieldPath('.users.name')).toBe('users.name');
  });

  it('should handle paths with trailing dots', () => {
    expect(normalizeFieldPath('users.name.')).toBe('users.name');
  });

  it('should handle empty string', () => {
    expect(normalizeFieldPath('')).toBe('');
  });

  it('should handle complex paths', () => {
    expect(normalizeFieldPath('/users/0/addresses/1/street')).toBe(
      'users.0.addresses.1.street'
    );
  });
});

describe('mergeValidationErrors', () => {
  it('should merge multiple error objects', () => {
    const errors1 = {
      fieldErrors: { name: { message: 'Required' } },
    };
    const errors2 = {
      fieldErrors: { email: { message: 'Invalid' } },
    };

    const merged = mergeValidationErrors(errors1, errors2);

    expect(merged.fieldErrors.name).toEqual({ message: 'Required' });
    expect(merged.fieldErrors.email).toEqual({ message: 'Invalid' });
  });

  it('should skip null/undefined errors', () => {
    const errors1 = {
      fieldErrors: { name: { message: 'Required' } },
    };
    const merged = mergeValidationErrors(errors1, null, undefined);

    expect(merged.fieldErrors.name).toEqual({ message: 'Required' });
  });

  it('should merge formErrors', () => {
    const errors1 = {
      fieldErrors: {},
      formErrors: [{ message: 'Error 1' }],
    };
    const errors2 = {
      fieldErrors: {},
      formErrors: [{ message: 'Error 2' }],
    };

    const merged = mergeValidationErrors(errors1, errors2);

    expect(merged.formErrors).toHaveLength(2);
    expect(merged.formErrors?.[0].message).toBe('Error 1');
    expect(merged.formErrors?.[1].message).toBe('Error 2');
  });

  it('should give priority to first error on conflict', () => {
    const errors1 = {
      fieldErrors: { name: { message: 'First error' } },
    };
    const errors2 = {
      fieldErrors: { name: { message: 'Second error' } },
    };

    const merged = mergeValidationErrors(errors1, errors2);

    expect(merged.fieldErrors.name).toEqual({ message: 'First error' });
  });

  it('should handle empty input', () => {
    const merged = mergeValidationErrors();
    expect(merged.fieldErrors).toEqual({});
    expect(merged.formErrors).toEqual([]);
  });

  it('should handle errors with code and params', () => {
    const errors1 = {
      fieldErrors: {
        email: { message: 'Required', code: 'required' },
      },
    };
    const errors2 = {
      fieldErrors: {
        password: {
          message: 'Min {min} chars',
          code: 'min_length',
          params: { min: 8 },
        },
      },
    };

    const merged = mergeValidationErrors(errors1, errors2);

    expect(merged.fieldErrors.email).toEqual({
      message: 'Required',
      code: 'required',
    });
    expect(merged.fieldErrors.password).toEqual({
      message: 'Min {min} chars',
      code: 'min_length',
      params: { min: 8 },
    });
  });
});

describe('mergeValidationErrorsWith', () => {
  it('should merge with custom merge function', () => {
    const errors1 = {
      fieldErrors: { name: { message: 'First' } },
    };
    const errors2 = {
      fieldErrors: { name: { message: 'Second' } },
    };

    const mergeFn = vi.fn(
      (a, b) =>
        ({
          message: `${a?.message} + ${b?.message}`,
        } as any)
    );

    const merged = mergeValidationErrorsWith([errors1, errors2], mergeFn);

    expect(mergeFn).toHaveBeenCalledTimes(1);
    expect(merged.fieldErrors.name).toEqual({
      message: 'First + Second',
    });
  });

  it('should handle non-conflicting errors', () => {
    const errors1 = {
      fieldErrors: { name: { message: 'Required' } },
    };
    const errors2 = {
      fieldErrors: { email: { message: 'Invalid' } },
    };

    const mergeFn = vi.fn();
    const merged = mergeValidationErrorsWith([errors1, errors2], mergeFn);

    expect(mergeFn).not.toHaveBeenCalled();
    expect(merged.fieldErrors.name).toEqual({ message: 'Required' });
    expect(merged.fieldErrors.email).toEqual({ message: 'Invalid' });
  });
});

describe('createFieldError', () => {
  it('should create error with message only', () => {
    const error = createFieldError('Required');
    expect(error).toEqual({ message: 'Required' });
  });

  it('should create error with code', () => {
    const error = createFieldError('Required', 'required');
    expect(error).toEqual({ message: 'Required', code: 'required' });
  });

  it('should create error with params', () => {
    const error = createFieldError('Min {min}', 'min_length', { min: 3 });
    expect(error).toEqual({
      message: 'Min {min}',
      code: 'min_length',
      params: { min: 3 },
    });
  });

  it('should create error with all properties', () => {
    const error = createFieldError(
      'Must be {min}',
      'min_value',
      { min: 5, field: 'age' }
    );
    expect(error.message).toBe('Must be {min}');
    expect(error.code).toBe('min_value');
    expect(error.params).toEqual({ min: 5, field: 'age' });
  });
});

describe('createI18nFieldError', () => {
  it('should create error with i18n data', () => {
    const error = createI18nFieldError(
      'required',
      { field: 'Email' },
      {
        en: 'Email is required',
        ru: 'Email обязателен',
      }
    );

    expect(error.code).toBe('required');
    expect(error.message).toBe('Email is required');
    expect(error.params).toEqual({
      field: 'Email',
      i18n: {
        code: 'required',
        messages: {
          en: 'Email is required',
          ru: 'Email обязателен',
        },
      },
    });
  });

  it('should use first message as default', () => {
    const error = createI18nFieldError('unknown', {}, {
      en: 'Unknown error',
    });

    expect(error.message).toBe('Unknown error');
  });

  it('should use code as fallback message', () => {
    const error = createI18nFieldError('unknown', {}, {});
    expect(error.message).toBe('unknown');
  });
});

describe('isEmpty', () => {
  it('should return true for null', () => {
    expect(isEmpty(null)).toBe(true);
  });

  it('should return true for undefined', () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isEmpty('')).toBe(true);
  });

  it('should return false for non-empty string', () => {
    expect(isEmpty('text')).toBe(false);
    expect(isEmpty(' ')).toBe(false);
  });

  it('should return true for empty array', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('should return false for non-empty array', () => {
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty([null])).toBe(false);
  });

  it('should return true for empty object', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('should return false for non-empty object', () => {
    expect(isEmpty({ a: 1 })).toBe(false);
  });

  it('should return false for numbers', () => {
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(1)).toBe(false);
    expect(isEmpty(-1)).toBe(false);
  });

  it('should return false for booleans', () => {
    expect(isEmpty(true)).toBe(false);
    expect(isEmpty(false)).toBe(false);
  });
});

describe('isNotEmpty', () => {
  it('should return false for empty values', () => {
    expect(isNotEmpty(null)).toBe(false);
    expect(isNotEmpty(undefined)).toBe(false);
    expect(isNotEmpty('')).toBe(false);
    expect(isNotEmpty([])).toBe(false);
    expect(isNotEmpty({})).toBe(false);
  });

  it('should return true for non-empty values', () => {
    expect(isNotEmpty('text')).toBe(true);
    expect(isNotEmpty([1])).toBe(true);
    expect(isNotEmpty({ a: 1 })).toBe(true);
    expect(isNotEmpty(0)).toBe(true);
  });
});

describe('deepEqual', () => {
  it('should return true for primitive equality', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
  });

  it('should return false for primitive inequality', () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('a', 'b')).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
  });

  it('should return true for deep object equality', () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true);
    expect(
      deepEqual({ a: { b: { c: 3 } } }, { a: { b: { c: 3 } } })
    ).toBe(true);
  });

  it('should return true for array equality', () => {
    expect(deepEqual([1, 2], [1, 2])).toBe(true);
    expect(deepEqual([[1], [2]], [[1], [2]])).toBe(true);
    expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
  });

  it('should return false for different values', () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual([1, 2], [1, 3])).toBe(false);
    expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it('should return false for different lengths', () => {
    expect(deepEqual([1, 2], [1])).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('should return false for different types', () => {
    expect(deepEqual([1, 2], { 0: 1, 1: 2 })).toBe(false);
    expect(deepEqual('12', [1, 2])).toBe(false);
  });

  it('should handle null values', () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
  });

  it('should handle nested arrays', () => {
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(deepEqual([1, [2, 3]], [1, [2, 4]])).toBe(false);
  });
});

describe('debounce', () => {
  it('should debounce function calls', async () => {
    vi.useFakeTimers();

    const fn = vi.fn((x: number) => x * 2);
    const debouncedFn = debounce(fn, 50);

    debouncedFn(1);
    debouncedFn(2);
    debouncedFn(3);

    await vi.advanceTimersByTimeAsync(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);

    vi.useRealTimers();
  });

  it('should return promise result', async () => {
    vi.useFakeTimers();

    const fn = vi.fn((x: number) => x * 2);
    const debouncedFn = debounce(fn, 50);

    const promise = debouncedFn(5);

    await vi.advanceTimersByTimeAsync(50);

    const result = await promise;
    expect(result).toBe(10);

    vi.useRealTimers();
  });

  it('should handle async functions', async () => {
    vi.useFakeTimers();

    const fn = vi.fn(async (x: number) => x * 2);
    const debouncedFn = debounce(fn, 50);

    const promise = debouncedFn(5);

    await vi.advanceTimersByTimeAsync(50);

    const result = await promise;
    expect(result).toBe(10);

    vi.useRealTimers();
  });
});

describe('cache', () => {
  it('should cache function results', () => {
    const fn = vi.fn((x: number) => x * 2);
    const cachedFn = cache(fn);

    cachedFn(1);
    cachedFn(1);
    cachedFn(1);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should return cached value', () => {
    const fn = vi.fn((x: number) => x * 2);
    const cachedFn = cache(fn);

    const result1 = cachedFn(5);
    const result2 = cachedFn(5);

    expect(result1).toBe(10);
    expect(result2).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should expire cache after ttl', async () => {
    vi.useFakeTimers();

    const fn = vi.fn((x: number) => x * 2);
    const cachedFn = cache(fn, { ttl: 50 });

    cachedFn(1);

    await vi.advanceTimersByTimeAsync(100);

    cachedFn(1);

    expect(fn).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('should respect max size', () => {
    const fn = vi.fn((x: number) => x * 2);
    const cachedFn = cache(fn, { maxSize: 2 });

    cachedFn(1);
    cachedFn(2);
    cachedFn(3);

    // First entry should be evicted
    cachedFn(1);

    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('should use custom key function', () => {
    const fn = vi.fn((obj: { id: number }) => obj.id * 2);
    const cachedFn = cache(fn, {
      keyFn: (obj) => String(obj.id),
    });

    cachedFn({ id: 1 });
    cachedFn({ id: 1 });
    cachedFn({ id: 2 });

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should handle different argument types', () => {
    const fn = vi.fn((a: string, b: number) => `${a}-${b}`);
    const cachedFn = cache(fn);

    cachedFn('test', 1);
    cachedFn('test', 1);
    cachedFn('test', 2);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

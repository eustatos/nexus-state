import type { FieldError, ValidationErrors } from './types';

/**
 * Normalize field path from various formats to dot notation
 *
 * Supported formats:
 * - AJV: '/users/0/name' → 'users.0.name'
 * - JSON Pointer: '/foo/bar' → 'foo.bar'
 * - lodash: 'foo[0].bar' → 'foo.0.bar'
 *
 * @param path - Path in any format
 * @returns Normalized path (dot notation)
 *
 * @example
 * ```typescript
 * normalizeFieldPath('/users/0/name');  // 'users.0.name'
 * normalizeFieldPath('foo[0].bar');     // 'foo.0.bar'
 * normalizeFieldPath('nested.path');    // 'nested.path'
 * ```
 */
export function normalizeFieldPath(path: string): string {
  if (!path) return '';

  return path
    // Remove leading slash
    .replace(/^\//, '')
    // Replace slashes with dots
    .replace(/\//g, '.')
    // Replace array notation [0] with .0
    .replace(/\[(\d+)\]/g, '.$1')
    // Remove leading dot if present
    .replace(/^\./, '')
    // Remove trailing dot if present
    .replace(/\.$/, '');
}

/**
 * Merge multiple ValidationErrors objects
 *
 * On field error conflict:
 * - First error has priority
 * - Or pass mergeFn for custom merging
 *
 * @param errors - Array of errors to merge
 * @returns Merged errors
 *
 * @example
 * ```typescript
 * const merged = mergeValidationErrors(errors1, errors2, errors3);
 * ```
 */
export function mergeValidationErrors<T extends Record<string, unknown>>(
  ...errors: Array<ValidationErrors<T> | null | undefined>
): ValidationErrors<T> {
  const result: ValidationErrors<T> = {
    fieldErrors: {},
    formErrors: [],
  };

  for (const error of errors) {
    if (!error) continue;

    // Merge field errors
    if (error.fieldErrors) {
      for (const [key, fieldError] of Object.entries(error.fieldErrors)) {
        if (fieldError && !(key in result.fieldErrors)) {
          (result.fieldErrors as Record<string, FieldError | null>)[key] =
            fieldError;
        }
      }
    }

    // Merge form errors
    if (error.formErrors?.length) {
      result.formErrors = [
        ...(result.formErrors ?? []),
        ...error.formErrors,
      ];
    }
  }

  return result;
}

/**
 * Merge errors with custom merge function
 *
 * @param errors - Array of errors
 * @param mergeFn - Merge function for conflicts
 * @returns Merged errors
 */
export function mergeValidationErrorsWith<T extends Record<string, unknown>>(
  errors: Array<ValidationErrors<T> | null | undefined>,
  mergeFn: (
    a: FieldError | null,
    b: FieldError | null
  ) => FieldError | null
): ValidationErrors<T> {
  const result: ValidationErrors<T> = {
    fieldErrors: {},
    formErrors: [],
  };

  for (const error of errors) {
    if (!error) continue;

    if (error.fieldErrors) {
      for (const [key, fieldError] of Object.entries(error.fieldErrors)) {
        const existingError = (result.fieldErrors as Record<
          string,
          FieldError | null
        >)[key];

        if (existingError && fieldError) {
          // Conflict - use merge function
          (result.fieldErrors as Record<string, FieldError | null>)[key] =
            mergeFn(existingError, fieldError);
        } else if (fieldError) {
          (result.fieldErrors as Record<string, FieldError | null>)[key] =
            fieldError;
        }
      }
    }

    if (error.formErrors?.length) {
      result.formErrors = [
        ...(result.formErrors ?? []),
        ...error.formErrors,
      ];
    }
  }

  return result;
}

/**
 * Create a FieldError object
 *
 * @param message - Error message
 * @param code - Error code (optional)
 * @param params - Parameters for message (optional)
 * @returns FieldError object
 *
 * @example
 * ```typescript
 * const error = createFieldError(
 *   'Must be at least {min} characters',
 *   'min_length',
 *   { min: 3 }
 * );
 * ```
 */
export function createFieldError(
  message: string,
  code?: string,
  params?: Record<string, unknown>
): FieldError {
  return { message, code, params };
}

/**
 * Create a FieldError with internationalization
 *
 * @param code - Error code for i18n
 * @param params - Parameters for substitution
 * @param defaultMessages - Default messages for different languages
 * @returns FieldError object
 *
 * @example
 * ```typescript
 * const error = createI18nFieldError(
 *   'required',
 *   { field: 'Email' },
 *   {
 *     en: 'Email is required',
 *     ru: 'Email обязателен',
 *   }
 * );
 * ```
 */
export function createI18nFieldError(
  code: string,
  params: Record<string, unknown>,
  defaultMessages: Record<string, string>
): FieldError {
  // Use first message as default
  const message = Object.values(defaultMessages)[0] ?? code;

  return {
    message,
    code,
    params: {
      ...params,
      i18n: {
        code,
        messages: defaultMessages,
      },
    },
  };
}

/**
 * Check if value is empty
 *
 * Empty values are:
 * - null
 * - undefined
 * - '' (empty string)
 * - [] (empty array)
 * - {} (empty object)
 *
 * @param value - Value to check
 * @returns true if value is empty
 *
 * @example
 * ```typescript
 * isEmpty(null);           // true
 * isEmpty('');             // true
 * isEmpty([]);             // true
 * isEmpty({});             // true
 * isEmpty(0);              // false
 * isEmpty('text');         // false
 * ```
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value === '';
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Check if value is not empty
 *
 * @param value - Value to check
 * @returns true if value is not empty
 */
export function isNotEmpty(value: unknown): boolean {
  return !isEmpty(value);
}

/**
 * Deep comparison of two values
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if values are equal
 *
 * @example
 * ```typescript
 * deepEqual({ a: 1 }, { a: 1 });  // true
 * deepEqual([1, 2], [1, 2]);      // true
 * deepEqual({ a: 1 }, { a: 2 });  // false
 * ```
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    const bArray = b as unknown[];
    if (a.length !== bArray.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], bArray[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (
      !deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    )
      return false;
  }

  return true;
}

/**
 * Create a debounced version of a function
 *
 * @param fn - Function to debounce
 * @param delay - Delay in ms
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedValidate = debounce(async (value) => {
 *   return await api.validate(value);
 * }, 300);
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastResolve: ((result: ReturnType<T>) => void) | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const result = fn(...args);
        if (lastResolve) {
          lastResolve(result as ReturnType<T>);
        }
        resolve(result as ReturnType<T>);
        lastResolve = null;
      }, delay);

      lastResolve = resolve;
    });
  };
}

/**
 * Cache options
 */
export interface CacheOptions<T extends (...args: unknown[]) => unknown> {
  /** Function to create key from arguments */
  keyFn?: (...args: Parameters<T>) => string;
  /** Cache time-to-live in ms */
  ttl?: number;
  /** Maximum cache size */
  maxSize?: number;
}

/**
 * Create a cached version of a function
 *
 * @param fn - Function to cache
 * @param options - Cache options
 * @returns Cached function
 *
 * @example
 * ```typescript
 * const cachedValidate = cache(async (value) => {
 *   return await api.validate(value);
 * }, {
 *   keyFn: (value) => value,
 *   ttl: 60000,  // 1 minute
 * });
 * ```
 */
export function cache<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: CacheOptions<T> = {}
): T {
  const {
    keyFn = (...args) => JSON.stringify(args),
    ttl = 60000,
    maxSize = 100,
  } = options;

  const cacheMap = new Map<
    string,
    { value: ReturnType<T>; expires: number }
  >();

  return ((...args: Parameters<T>) => {
    const key = keyFn(...args);
    const cached = cacheMap.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    const result = fn(...args);

    // Clean up if cache is full
    if (cacheMap.size >= maxSize) {
      const firstKey = cacheMap.keys().next().value;
      if (firstKey) {
        cacheMap.delete(firstKey);
      }
    }

    cacheMap.set(key, {
      value: result as ReturnType<T>,
      expires: Date.now() + ttl,
    });

    return result as ReturnType<T>;
  }) as T;
}

import type { DSLRule } from './types';

/**
 * Options for async validators
 */
export interface AsyncValidatorOptions {
  /** Debounce delay in ms */
  debounce?: number;

  /** Number of retry attempts */
  retry?: number;

  /** Timeout in ms */
  timeout?: number;

  /** Cache results */
  cache?: boolean;

  /** Cache TTL in ms (default 5 minutes) */
  cacheTTL?: number;
}

/**
 * Cache entry for validation results
 */
interface CacheEntry {
  result: string | null;
  timestamp: number;
}

/**
 * Unique value validator (API/DB check)
 *
 * @param url - API URL for checking or check function
 * @param message - Error message
 * @param options - Options
 */
export function unique(
  url: string | ((value: string) => Promise<boolean>),
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string): Promise<string | null> => {
    if (!value) {
      return null; // Empty values handled by required
    }

    // Check cache
    if (options?.cache !== false) {
      const cached = cache.get(value);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000; // 5 minutes

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    let isTaken: boolean;

    if (typeof url === 'string') {
      // HTTP request
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isTaken = (data as any).exists ?? (data as any).taken ?? false;
      } catch (error) {
        console.error('Unique validation error:', error);
        return 'Validation failed';
      }
    } else {
      // Check function
      isTaken = await url(value);
    }

    const result = isTaken ? (message ?? 'This value is already taken') : null;

    // Cache result
    if (options?.cache !== false) {
      cache.set(value, { result, timestamp: Date.now() });
    }

    return result;
  };

  return {
    validate: validateFn,
    async: true,
    code: 'unique',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * Exists value validator (API/DB check)
 *
 * @param url - API URL for checking or check function
 * @param message - Error message
 * @param options - Options
 */
export function exists(
  url: string | ((value: string) => Promise<boolean>),
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string): Promise<string | null> => {
    if (!value) {
      return null;
    }

    // Check cache
    if (options?.cache !== false) {
      const cached = cache.get(value);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    let existsResult: boolean;

    if (typeof url === 'string') {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existsResult = (data as any).exists ?? false;
      } catch (error) {
        console.error('Exists validation error:', error);
        return 'Validation failed';
      }
    } else {
      existsResult = await url(value);
    }

    const result = existsResult ? null : (message ?? 'This value does not exist');

    if (options?.cache !== false) {
      cache.set(value, { result, timestamp: Date.now() });
    }

    return result;
  };

  return {
    validate: validateFn,
    async: true,
    code: 'exists',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * Custom async validator
 *
 * @param fn - Async validation function
 * @param message - Default message
 * @param options - Options
 */
export function asyncCustom<T = unknown>(
  fn: (value: T, allValues?: unknown) => Promise<string | null>,
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<T> {
  return {
    validate: fn,
    async: true,
    message,
    code: 'async_custom',
    options,
  };
}

/**
 * Domain/email availability checker
 *
 * @param type - Check type ('domain' | 'mx')
 * @param message - Error message
 * @param options - Options
 */
export function checkDomain(
  type: 'domain' | 'mx' = 'domain',
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string): Promise<string | null> => {
    if (!value) {
      return null;
    }

    // Extract domain from email
    let domain = value;
    if (value.includes('@')) {
      domain = value.split('@')[1];
    }

    // Check cache
    if (options?.cache !== false) {
      const cached = cache.get(domain);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=${type === 'mx' ? 'MX' : 'A'}`
      );
      const data = (await response.json()) as { Answer?: unknown[] };

      const isValid = data.Answer && data.Answer.length > 0;
      const result = isValid ? null : (message ?? 'Invalid domain');

      if (options?.cache !== false) {
        cache.set(domain, { result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      console.error('Domain validation error:', error);
      return 'Domain validation failed';
    }
  };

  return {
    validate: validateFn,
    async: true,
    code: 'domain_check',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * File URL existence checker
 *
 * @param message - Error message
 * @param options - Options
 */
export function checkFileExists(
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string): Promise<string | null> => {
    if (!value) {
      return null;
    }

    // Check cache
    if (options?.cache !== false) {
      const cached = cache.get(value);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    try {
      const response = await fetch(value, { method: 'HEAD' });
      const exists = response.ok;

      const result = exists ? null : (message ?? 'File not found');

      if (options?.cache !== false) {
        cache.set(value, { result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      console.error('File exists validation error:', error);
      return 'File validation failed';
    }
  };

  return {
    validate: validateFn,
    async: true,
    code: 'file_exists',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * CAPTCHA validator
 *
 * @param verifyUrl - URL for CAPTCHA verification
 * @param message - Error message
 * @param options - Options
 */
export function checkCaptcha(
  verifyUrl: string,
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const validateFn = async (value: string, allValues?: unknown): Promise<string | null> => {
    if (!value) {
      return null;
    }

    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captcha: value,
          ...(allValues as Record<string, unknown>),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { valid?: boolean; success?: boolean };
      const isValid = data.valid ?? data.success ?? false;

      return isValid ? null : (message ?? 'Captcha verification failed');
    } catch (error) {
      console.error('Captcha validation error:', error);
      return 'Captcha validation failed';
    }
  };

  return {
    validate: validateFn,
    async: true,
    code: 'captcha',
    options: {
      debounce: 0, // CAPTCHA without debounce
      ...options,
    },
  };
}

/**
 * User subscription/status checker
 *
 * @param checkFn - Status check function
 * @param requiredStatus - Required status
 * @param message - Error message
 * @param options - Options
 */
export function checkUserStatus<T = unknown>(
  checkFn: (userId: string, allValues?: unknown) => Promise<T>,
  requiredStatus: T,
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string, allValues?: unknown): Promise<string | null> => {
    if (!value) {
      return null;
    }

    // Check cache
    if (options?.cache !== false) {
      const cached = cache.get(value);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    try {
      const status = await checkFn(value, allValues);
      const isValid = status === requiredStatus;

      const result = isValid ? null : (message ?? 'Insufficient permissions');

      if (options?.cache !== false) {
        cache.set(value, { result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      console.error('User status validation error:', error);
      return 'Status validation failed';
    }
  };

  return {
    validate: validateFn,
    async: true,
    code: 'user_status',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * Promo code validator
 *
 * @param url - API URL for checking
 * @param message - Error message
 * @param options - Options
 */
export function checkPromoCode(
  url: string,
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string): Promise<string | null> => {
    if (!value) {
      return null;
    }

    // Check cache
    if (options?.cache !== false) {
      const cached = cache.get(value);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { valid?: boolean; success?: boolean };
      const isValid = data.valid ?? data.success ?? false;

      const result = isValid ? null : (message ?? 'Invalid promo code');

      if (options?.cache !== false) {
        cache.set(value, { result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      console.error('Promo code validation error:', error);
      return 'Promo code validation failed';
    }
  };

  return {
    validate: validateFn,
    async: true,
    code: 'promo_code',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * Utility: Debounce wrapper
 *
 * @param fn - Function to debounce
 * @param delay - Delay in ms
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withDebounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: unknown[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise<unknown>((resolve) => {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        resolve(fn(...args));
      }, delay);
    });
  }) as T;
}

/**
 * Utility: Retry wrapper
 *
 * @param fn - Function to retry
 * @param retries - Number of attempts
 * @param delay - Delay between attempts in ms
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  retries = 3,
  delay = 1000
): T {
  return (async (...args: unknown[]) => {
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;

        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }) as T;
}

/**
 * Utility: Timeout wrapper
 *
 * @param fn - Function to timeout
 * @param timeout - Timeout in ms
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withTimeout<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  timeout: number
): T {
  return (async (...args: unknown[]) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const timeoutPromise = new Promise<unknown>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Timeout')), timeout);
    });

    try {
      return await Promise.race([fn(...args), timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }) as T;
}

/**
 * Composite: Apply all options (debounce, retry, timeout)
 *
 * @param fn - Validation function
 * @param options - Options
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withOptions<T extends (...args: any[]) => Promise<string | null>>(
  fn: T,
  options?: AsyncValidatorOptions
): T {
  let wrapped = fn;

  // Apply in order: debounce -> retry -> timeout
  // Debounce wraps everything to prevent rapid calls
  // Retry wraps the core function to handle failures
  // Timeout wraps retry to prevent infinite hangs
  if (options?.retry) {
    wrapped = withRetry(wrapped, options.retry);
  }

  if (options?.timeout) {
    wrapped = withTimeout(wrapped, options.timeout);
  }

  if (options?.debounce) {
    wrapped = withDebounce(wrapped, options.debounce);
  }

  return wrapped;
}

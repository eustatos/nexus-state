import { Store, Atom } from '@nexus-state/core';
import type { FieldState } from './types';
import type { AsyncValidator, AsyncValidatorOptions, AsyncValidatorWithConfig } from './types';

interface ValidationCache {
  [key: string]: {
    result: string | null;
    timestamp: number;
  };
}

/**
 * Normalize async validator to unified format
 */
function normalizeValidator<TValue>(
  validator: AsyncValidator<TValue> | AsyncValidatorWithConfig<TValue>
): AsyncValidatorWithConfig<TValue> {
  if ('validate' in validator) {
    return validator;
  }
  return { validate: validator, options: {} };
}

/**
 * Async validation manager for field-level async validation
 */
export class AsyncValidationManager<TValue> {
  private abortController: AbortController | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private cache: ValidationCache = {};
  private readonly defaultOptions: Required<AsyncValidatorOptions> = {
    debounce: 300,
    retry: 0,
    cache: true,
    timeout: 5000,
  };

  constructor(
    private readonly store: Store,
    private readonly stateAtom: Atom<FieldState<TValue>>,
    private validators: Array<AsyncValidator<TValue> | AsyncValidatorWithConfig<TValue>>,
    private readonly fieldDebounce?: number
  ) {}

  /**
   * Start async validation with debouncing
   */
  public validate(value: TValue, formValues?: Record<string, unknown>): void {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Cancel pending validation
    this.cancel();

    // Get debounce delay from field-level override or first validator or use default
    const firstValidator = normalizeValidator(this.validators[0]);
    const debounceDelay =
      this.fieldDebounce ??
      firstValidator.options?.debounce ??
      this.defaultOptions.debounce;

    // Debounce validation
    this.debounceTimer = setTimeout(() => {
      this.executeValidation(value, formValues);
    }, debounceDelay);
  }

  /**
   * Execute async validation
   */
  private async executeValidation(
    value: TValue,
    formValues?: Record<string, unknown>
  ): Promise<void> {
    // Set validating state
    this.store.set(this.stateAtom, (prev) => ({
      ...prev,
      validating: true,
      asyncError: null,
    }));

    // Create new abort controller
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      // Run all async validators sequentially
      for (const validator of this.validators) {
        if (signal.aborted) {
          return;
        }

        const normalized = normalizeValidator(validator);
        const error = await this.runValidator(value, normalized, formValues, signal);

        if (error) {
          // Update state with error
          this.store.set(this.stateAtom, (prev) => ({
            ...prev,
            validating: false,
            asyncError: error,
          }));
          return;
        }
      }

      // All validators passed
      this.store.set(this.stateAtom, (prev) => ({
        ...prev,
        validating: false,
        asyncError: null,
      }));
    } catch (error) {
      if (!signal.aborted) {
        console.error('Async validation error:', error);
        this.store.set(this.stateAtom, (prev) => ({
          ...prev,
          validating: false,
          asyncError: 'Validation failed',
        }));
      }
    }
  }

  /**
   * Run single async validator with retry logic
   */
  private async runValidator(
    value: TValue,
    validator: AsyncValidatorWithConfig<TValue>,
    formValues: Record<string, unknown> | undefined,
    signal: AbortSignal,
    attemptNumber = 0
  ): Promise<string | null> {
    const options = { ...this.defaultOptions, ...validator.options };

    // Check cache
    if (options.cache) {
      const cacheKey = this.getCacheKey(value, validator);
      const cached = this.cache[cacheKey];

      if (cached && Date.now() - cached.timestamp < 60000) {
        // Cache valid for 1 minute
        return cached.result;
      }
    }

    try {
      // Execute validation with timeout (skip if timeout is 0)
      const result = options.timeout > 0
        ? await Promise.race([
            validator.validate(value, formValues),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Validation timeout')), options.timeout)
            ),
          ])
        : await validator.validate(value, formValues);

      if (signal.aborted) {
        return null;
      }

      // Cache result
      if (options.cache) {
        const cacheKey = this.getCacheKey(value, validator);
        this.cache[cacheKey] = {
          result,
          timestamp: Date.now(),
        };
      }

      return result;
    } catch (error) {
      if (signal.aborted) {
        return null;
      }

      // Retry logic
      if (attemptNumber < options.retry) {
        const delay = Math.min(1000 * Math.pow(2, attemptNumber), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        if (signal.aborted) {
          return null;
        }

        return this.runValidator(value, validator, formValues, signal, attemptNumber + 1);
      }

      throw error;
    }
  }

  /**
   * Cancel pending validation
   */
  public cancel(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Reset validating state
    this.store.set(this.stateAtom, (prev) => ({
      ...prev,
      validating: false,
    }));
  }

  /**
   * Clear validation cache
   */
  public clearCache(): void {
    this.cache = {};
  }

  /**
   * Generate cache key for validator
   */
  private getCacheKey(
    value: TValue,
    validator: AsyncValidatorWithConfig<TValue>
  ): string {
    return `${JSON.stringify(value)}_${validator.validate.toString()}`;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.cancel();
    this.clearCache();
  }
}

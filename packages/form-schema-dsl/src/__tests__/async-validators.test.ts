import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  asyncCustom,
  checkCaptcha,
  checkDomain,
  checkFileExists,
  checkPromoCode,
  exists,
  unique,
  withDebounce,
  withOptions,
  withRetry,
  withTimeout,
} from '../async-validators';

// Mock fetch
global.fetch = vi.fn();

describe('Async Validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('unique', () => {
    it('should pass when value is unique (URL)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      } as unknown as Response);

      const validator = unique('https://api.example.com/check');
      const error = await validator.validate('newuser');

      expect(error).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/check',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ value: 'newuser' }),
        })
      );
    });

    it('should fail when value is taken (URL)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      } as unknown as Response);

      const validator = unique('https://api.example.com/check', 'Username taken');
      const error = await validator.validate('existinguser');

      expect(error).toBe('Username taken');
    });

    it('should pass when value is unique (function)', async () => {
      const checkFn = vi.fn().mockResolvedValue(false);

      const validator = unique(checkFn);
      const error = await validator.validate('newuser');

      expect(error).toBeNull();
      expect(checkFn).toHaveBeenCalledWith('newuser');
    });

    it('should fail when value is taken (function)', async () => {
      const checkFn = vi.fn().mockResolvedValue(true);

      const validator = unique(checkFn, 'Taken');
      const error = await validator.validate('existing');

      expect(error).toBe('Taken');
    });

    it('should skip empty values', async () => {
      const validator = unique('https://api.example.com/check');
      const error = await validator.validate('');

      expect(error).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should cache results', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      } as unknown as Response);

      const validator = unique('https://api.example.com/check', 'Taken', { cache: true });

      await validator.validate('test');
      await validator.validate('test');

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('exists', () => {
    it('should pass when value exists', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      } as unknown as Response);

      const validator = exists('https://api.example.com/check-invite');
      const error = await validator.validate('VALID123');

      expect(error).toBeNull();
    });

    it('should fail when value does not exist', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      } as unknown as Response);

      const validator = exists('https://api.example.com/check-invite', 'Invalid code');
      const error = await validator.validate('INVALID');

      expect(error).toBe('Invalid code');
    });

    it('should skip empty values', async () => {
      const validator = exists('https://api.example.com/check');
      const error = await validator.validate('');

      expect(error).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('asyncCustom', () => {
    it('should use custom async function', async () => {
      const customFn = vi.fn().mockResolvedValue(null);

      const validator = asyncCustom(customFn);
      const error = await validator.validate('test');

      expect(error).toBeNull();
      expect(customFn).toHaveBeenCalledWith('test');
    });

    it('should return error from function', async () => {
      const customFn = vi.fn().mockResolvedValue('Error occurred');

      const validator = asyncCustom(customFn, 'Custom error');
      const error = await validator.validate('test');

      expect(error).toBe('Error occurred');
    });

    it('should receive allValues', async () => {
      const customFn = vi.fn().mockResolvedValue(null);

      const validator = asyncCustom(customFn);
      await validator.validate('test', { other: 'value' });

      expect(customFn).toHaveBeenCalledWith('test', { other: 'value' });
    });
  });

  describe('checkDomain', () => {
    it('should pass for valid domain', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Answer: [{ type: 'A' }] }),
      } as unknown as Response);

      const validator = checkDomain();
      const error = await validator.validate('test@example.com');

      expect(error).toBeNull();
    });

    it('should fail for invalid domain', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Answer: [] }),
      } as unknown as Response);

      const validator = checkDomain('domain', 'Domain not found');
      const error = await validator.validate('test@invalid.invalid');

      expect(error).toBe('Domain not found');
    });

    it('should skip empty values', async () => {
      const validator = checkDomain();
      const error = await validator.validate('');

      expect(error).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should extract domain from email', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Answer: [{ type: 'A' }] }),
      } as unknown as Response);

      const validator = checkDomain();
      await validator.validate('user@example.com');

      expect(fetch).toHaveBeenCalled();
      const callUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('example.com');
    });
  });

  describe('checkFileExists', () => {
    it('should pass for existing file', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as unknown as Response);

      const validator = checkFileExists();
      const error = await validator.validate('https://example.com/image.jpg');

      expect(error).toBeNull();
    });

    it('should fail for non-existing file', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as unknown as Response);

      const validator = checkFileExists('File not accessible');
      const error = await validator.validate('https://example.com/missing.jpg');

      expect(error).toBe('File not accessible');
    });

    it('should skip empty values', async () => {
      const validator = checkFileExists();
      const error = await validator.validate('');

      expect(error).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('checkCaptcha', () => {
    it('should pass for valid captcha', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as unknown as Response);

      const validator = checkCaptcha('https://api.example.com/verify');
      const error = await validator.validate('captcha123');

      expect(error).toBeNull();
    });

    it('should fail for invalid captcha', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false }),
      } as unknown as Response);

      const validator = checkCaptcha('https://api.example.com/verify', 'Invalid captcha');
      const error = await validator.validate('wrong');

      expect(error).toBe('Invalid captcha');
    });

    it('should skip empty values', async () => {
      const validator = checkCaptcha('https://api.example.com/verify');
      const error = await validator.validate('');

      expect(error).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('checkPromoCode', () => {
    it('should pass for valid promo code', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as unknown as Response);

      const validator = checkPromoCode('https://api.example.com/validate-promo');
      const error = await validator.validate('SAVE20');

      expect(error).toBeNull();
    });

    it('should fail for invalid promo code', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false }),
      } as unknown as Response);

      const validator = checkPromoCode('https://api.example.com/validate-promo', 'Invalid code');
      const error = await validator.validate('INVALID');

      expect(error).toBe('Invalid code');
    });

    it('should skip empty values', async () => {
      const validator = checkPromoCode('https://api.example.com/validate-promo');
      const error = await validator.validate('');

      expect(error).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('withDebounce', () => {
    it('should debounce function calls', async () => {
      vi.useFakeTimers();

      const fn = vi.fn((x: number) => x * 2);
      const debouncedFn = withDebounce(fn, 50);

      debouncedFn(1);
      debouncedFn(2);
      debouncedFn(3);

      await vi.advanceTimersByTimeAsync(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3);

      vi.useRealTimers();
    });
  });

  describe('withRetry', () => {
    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockRejectedValueOnce(new Error('Second'))
        .mockResolvedValueOnce('Success');

      const retriedFn = withRetry(fn, 3, 10);
      const result = await retriedFn();

      expect(result).toBe('Success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

      const retriedFn = withRetry(fn, 2, 10);

      await expect(retriedFn()).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('withTimeout', () => {
    it('should resolve if function completes before timeout', async () => {
      const fn = vi.fn().mockResolvedValue('Success');

      const timeoutFn = withTimeout(fn, 1000);
      const result = await timeoutFn();

      expect(result).toBe('Success');
    });

    it('should reject if function takes too long', async () => {
      vi.useFakeTimers();

      const fn = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve('Success'), 2000);
          })
      );

      const timeoutFn = withTimeout(fn, 100);

      const promise = timeoutFn();
      await vi.advanceTimersByTimeAsync(150);

      await expect(promise).rejects.toThrow('Timeout');

      vi.useRealTimers();
    });
  });

  describe('withOptions', () => {
    it('should apply timeout', async () => {
      const fn = vi.fn().mockResolvedValue('Success');

      const wrapped = withOptions(fn, { timeout: 1000 });
      const result = await wrapped();

      expect(result).toBe('Success');
    });

    it('should apply retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockResolvedValue('Success');

      const wrapped = withOptions(fn, { retry: 3 });
      const result = await wrapped();

      expect(result).toBe('Success');
    });

    it('should apply debounce', async () => {
      vi.useFakeTimers();

      const fn = vi.fn().mockResolvedValue('Success');
      const wrapped = withOptions(fn, { debounce: 50 });

      wrapped();
      wrapped();
      wrapped();

      await vi.advanceTimersByTimeAsync(100);

      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});

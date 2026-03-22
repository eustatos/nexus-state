import { describe, it, expect, vi, expectTypeOf } from 'vitest';
import type { AxiosResponse, AxiosError } from 'axios';
import {
  unwrapAxiosResponse,
  axiosMapper,
  axiosErrorHandler,
  type SerializedAxiosError,
} from '../axios-helpers';

describe('axios-helpers', () => {
  describe('unwrapAxiosResponse', () => {
    it('should extract data from AxiosResponse', async () => {
      const mockResponse: AxiosResponse<{ id: number; name: string }> = {
        data: { id: 1, name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const promise = Promise.resolve(mockResponse);
      const result = await unwrapAxiosResponse(promise);

      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should handle null data', async () => {
      const mockResponse: AxiosResponse<null> = {
        data: null,
        status: 204,
        statusText: 'No Content',
        headers: {},
        config: {} as any,
      };

      const promise = Promise.resolve(mockResponse);
      const result = await unwrapAxiosResponse(promise);

      expect(result).toBeNull();
    });

    it('should preserve type inference', () => {
      type TestData = { id: number; value: string };
      const mockResponse: AxiosResponse<TestData> = {
        data: { id: 1, value: 'test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const promise = Promise.resolve(mockResponse);
      const result = unwrapAxiosResponse(promise);

      expectTypeOf(result).toEqualTypeOf<Promise<TestData>>();
    });
  });

  describe('axiosMapper', () => {
    it('should wrap API function', async () => {
      const mockApi = vi.fn().mockResolvedValue({
        data: { id: 1, name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const mappedFn = axiosMapper(mockApi);
      const result = await mappedFn(123);

      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(mockApi).toHaveBeenCalledWith(123);
    });

    it('should preserve argument types', () => {
      const mockApi = (id: number, name: string) =>
        Promise.resolve({
          data: { id, name },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        });

      const mappedFn = axiosMapper(mockApi);

      expectTypeOf(mappedFn).parameter(0).toEqualTypeOf<number>();
      expectTypeOf(mappedFn).parameter(1).toEqualTypeOf<string>();
    });

    it('should preserve return type', () => {
      type ReturnData = { id: number; name: string };
      const mockApi = (id: number): Promise<AxiosResponse<ReturnData>> =>
        Promise.resolve({
          data: { id, name: 'Test' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        });

      const mappedFn = axiosMapper(mockApi);

      expectTypeOf(mappedFn).returns.toEqualTypeOf<Promise<ReturnData>>();
    });

    it('should handle multiple arguments', async () => {
      const mockApi = vi.fn().mockResolvedValue({
        data: { result: 'success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const mappedFn = axiosMapper(mockApi);
      await mappedFn('arg1', 42, { key: 'value' });

      expect(mockApi).toHaveBeenCalledWith('arg1', 42, { key: 'value' });
    });

    it('should handle errors from wrapped function', async () => {
      const error = new Error('API error');
      const mockApi = vi.fn().mockRejectedValue(error);

      const mappedFn = axiosMapper(mockApi);

      await expect(mappedFn(123)).rejects.toThrow('API error');
    });
  });

  describe('axiosErrorHandler', () => {
    it('should handle AxiosError', () => {
      const handler = vi.fn();
      const wrappedHandler = axiosErrorHandler(handler);

      const axiosError: AxiosError<{ message: string }> = {
        message: 'Network Error',
        code: 'ECONNREFUSED',
        response: {
          status: 500,
          data: { message: 'Server error' },
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        name: 'AxiosError',
      };

      wrappedHandler(axiosError);

      expect(handler).toHaveBeenCalledWith({
        message: 'Network Error',
        code: 'ECONNREFUSED',
        status: 500,
        data: { message: 'Server error' },
        isAxiosError: true,
      });
    });

    it('should handle non-Axios errors', () => {
      const handler = vi.fn();
      const wrappedHandler = axiosErrorHandler(handler);

      wrappedHandler(new Error('Regular error'));

      expect(handler).toHaveBeenCalledWith({
        message: 'Regular error',
        isAxiosError: false,
      });
    });

    it('should handle string errors', () => {
      const handler = vi.fn();
      const wrappedHandler = axiosErrorHandler(handler);

      wrappedHandler('String error');

      expect(handler).toHaveBeenCalledWith({
        message: 'String error',
        isAxiosError: false,
      });
    });

    it('should handle null/undefined errors', () => {
      const handler = vi.fn();
      const wrappedHandler = axiosErrorHandler(handler);

      wrappedHandler(null);
      wrappedHandler(undefined);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, {
        message: 'null',
        isAxiosError: false,
      });
      expect(handler).toHaveBeenNthCalledWith(2, {
        message: 'undefined',
        isAxiosError: false,
      });
    });

    it('should preserve error data type', () => {
      type ErrorData = { code: string; details: string };
      const handler = vi.fn<(error: SerializedAxiosError<ErrorData>) => void>();
      const wrappedHandler = axiosErrorHandler<ErrorData>(handler);

      const axiosError: AxiosError<ErrorData> = {
        message: 'Validation error',
        response: {
          status: 400,
          data: { code: 'INVALID_INPUT', details: 'Missing required field' },
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        name: 'AxiosError',
      };

      wrappedHandler(axiosError);

      expect(handler).toHaveBeenCalledWith({
        message: 'Validation error',
        status: 400,
        data: { code: 'INVALID_INPUT', details: 'Missing required field' },
        isAxiosError: true,
      });
    });

    it('should handle AxiosError without response', () => {
      const handler = vi.fn();
      const wrappedHandler = axiosErrorHandler(handler);

      const axiosError: AxiosError = {
        message: 'Network error',
        code: 'ERR_NETWORK',
        isAxiosError: true,
        name: 'AxiosError',
      };

      wrappedHandler(axiosError);

      expect(handler).toHaveBeenCalledWith({
        message: 'Network error',
        code: 'ERR_NETWORK',
        status: undefined,
        data: undefined,
        isAxiosError: true,
      });
    });
  });

  describe('Integration with useMutation pattern', () => {
    it('should work with unwrapAxiosResponse pattern', async () => {
      const mockApi = vi.fn().mockResolvedValue({
        data: { id: 1, archived: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Simulate useMutation pattern
      const mutationFn = (id: number) => unwrapAxiosResponse(mockApi(id));
      const result = await mutationFn(123);

      expect(result).toEqual({ id: 1, archived: true });
    });

    it('should work with axiosMapper pattern', async () => {
      const mockApi = vi.fn().mockResolvedValue({
        data: { id: 1, updated: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Simulate useMutation pattern
      const mutationFn = axiosMapper(mockApi);
      const result = await mutationFn(456);

      expect(result).toEqual({ id: 1, updated: true });
      expect(mockApi).toHaveBeenCalledWith(456);
    });

    it('should work with error handler pattern', async () => {
      const errorHandler = vi.fn();
      const wrappedErrorHandler = axiosErrorHandler(errorHandler);

      // Simulate onError callback
      const mockError: AxiosError<{ message: string }> = {
        message: 'Conflict',
        response: {
          status: 409,
          data: { message: 'Resource already exists' },
          statusText: 'Conflict',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        name: 'AxiosError',
      };

      wrappedErrorHandler(mockError);

      expect(errorHandler).toHaveBeenCalledWith({
        message: 'Conflict',
        status: 409,
        data: { message: 'Resource already exists' },
        isAxiosError: true,
      });
    });
  });
});

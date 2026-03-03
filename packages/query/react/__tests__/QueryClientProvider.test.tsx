import { describe, it, expect, vi } from 'vitest';
// Use adapter for renderHook to support React 17/18/19
import { renderHook } from '../../src/__tests__/renderHook-adapter';
import React from 'react';
import {
  QueryClientProvider,
  createQueryClient,
  useQueryClient,
  useQueryClientStore,
  useInvalidateQueries,
  useRefetchQueries,
} from '../QueryClientProvider';
import { createStore } from '@nexus-state/core';

describe('QueryClientProvider', () => {
  const createWrapper = () => {
    const client = createQueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { Wrapper, client };
  };

  it('should provide query client to children', () => {
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useQueryClient(), {
      wrapper: Wrapper,
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.getStore).toBe('function');
  });

  it('should throw error when used outside provider', () => {
    let error: Error | null = null;
    try {
      renderHook(() => useQueryClient());
    } catch (e) {
      error = e as Error;
    }
    
    // React 18+: error thrown synchronously
    if (error) {
      expect(error.message).toContain('useQueryClient must be used within a QueryClientProvider');
    } else {
      // React 17: error logged to console
      const consoleErrorSpy = vi.spyOn(console, 'error');
      renderHook(() => useQueryClient());
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorMessage = consoleErrorSpy.mock.calls
        .flat()
        .some(call => typeof call === 'string' && call.includes('useQueryClient must be used within a QueryClientProvider'));
      expect(errorMessage).toBe(true);
      consoleErrorSpy.mockRestore();
    }
  });

  it('should create query client with custom config', () => {
    const store = createStore();
    const client = createQueryClient({
      store,
      defaultOptions: {
        queries: {
          staleTime: 5000,
        },
      },
    });

    expect(client.getStore()).toBe(store);
    expect(client.getDefaultOptions()).toEqual({
      staleTime: 5000,
    });
  });

  it('should update default options', () => {
    const client = createQueryClient();

    client.setDefaultOptions({
      queries: {
        retry: 5,
      },
    });

    expect(client.getDefaultOptions()).toEqual({
      retry: 5,
    });
  });

  it('should clear cache', () => {
    const client = createQueryClient();

    client.clearCache();

    // clearCache calls getQueryCache().clear(), which doesn't log anything
    // Just verify the method exists and doesn't throw
    expect(() => client.clearCache()).not.toThrow();
  });

  it('should invalidate queries', () => {
    const client = createQueryClient();
    const logSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    client.invalidateQueries('users');

    expect(logSpy).toHaveBeenCalledWith('Invalidating queries: users');
    logSpy.mockRestore();
  });

  it('should refetch queries', async () => {
    const client = createQueryClient();
    const logSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    await client.refetchQueries('users');

    expect(logSpy).toHaveBeenCalledWith('Refetching queries: users');
    logSpy.mockRestore();
  });
});

describe('useQueryClientStore', () => {
  it('should return store from query client', () => {
    const store = createStore();
    const client = createQueryClient({ store });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useQueryClientStore(), {
      wrapper: Wrapper,
    });

    expect(result.current).toBe(store);
  });
});

describe('useInvalidateQueries', () => {
  it('should return invalidate function', () => {
    const client = createQueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useInvalidateQueries(), {
      wrapper: Wrapper,
    });

    expect(typeof result.current).toBe('function');
  });

  it('should invalidate queries when called', () => {
    const client = createQueryClient();
    const logSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useInvalidateQueries(), {
      wrapper: Wrapper,
    });

    result.current('users');

    expect(logSpy).toHaveBeenCalledWith('Invalidating queries: users');
    logSpy.mockRestore();
  });
});

describe('useRefetchQueries', () => {
  it('should return refetch function', () => {
    const client = createQueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRefetchQueries(), {
      wrapper: Wrapper,
    });

    expect(typeof result.current).toBe('function');
  });

  it('should refetch queries when called', async () => {
    const client = createQueryClient();
    const logSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRefetchQueries(), {
      wrapper: Wrapper,
    });

    await result.current('users');

    expect(logSpy).toHaveBeenCalledWith('Refetching queries: users');
    logSpy.mockRestore();
  });
});

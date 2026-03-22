import { describe, it, expectTypeOf } from 'vitest';
import { renderHook } from '../../src/__tests__/renderHook-adapter';
import { StoreProvider } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { useMutation } from '../useMutation';

describe('useMutation - Type Inference', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={createStore()}>{children}</StoreProvider>
  );

  it('should infer TVariables from mutationFn with single parameter', () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: (id: number) => Promise.resolve(id),
        }),
      { wrapper }
    );

    // Check mutate type - should accept number
    expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<number>();
  });

  it('should infer TVariables from mutationFn with object', () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: (data: { name: string; age: number }) =>
            Promise.resolve({ id: 1, ...data }),
        }),
      { wrapper }
    );

    expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<{
      name: string;
      age: number;
    }>();
  });

  it('should infer TData from return type', () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: (id: number) => Promise.resolve({ id, name: 'Test' }),
        }),
      { wrapper }
    );

    expectTypeOf(result.current.data).toEqualTypeOf<
      { id: number; name: string } | undefined
    >();
  });

  it('should infer TData for primitive types', () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: (id: number) => Promise.resolve(String(id)),
        }),
      { wrapper }
    );

    expectTypeOf(result.current.data).toEqualTypeOf<string | undefined>();
  });

  it('should support explicit type parameters', () => {
    const { result } = renderHook(
      () =>
        useMutation<string, Error, number>({
          mutationFn: (id) => Promise.resolve(String(id)),
        }),
      { wrapper }
    );

    expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<number>();
    expectTypeOf(result.current.data).toEqualTypeOf<string | undefined>();
  });

  it('should infer TVariables for string parameter', () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: (name: string) => Promise.resolve({ name }),
        }),
      { wrapper }
    );

    expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<string>();
  });

  it('should infer TVariables for boolean parameter', () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: (flag: boolean) => Promise.resolve(flag),
        }),
      { wrapper }
    );

    expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<boolean>();
  });

  it('should infer TVariables for union types', () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: (value: string | number) => Promise.resolve(value),
        }),
      { wrapper }
    );

    expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<
      string | number
    >();
  });

  it('should infer TVariables for optional parameters', () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: (data?: { name?: string }) => Promise.resolve(data),
        }),
      { wrapper }
    );

    expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<
      { name?: string } | undefined
    >();
  });

  it('should infer TError from explicit type parameter', () => {
    type CustomError = { code: string; message: string };

    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: (id: number) => Promise.resolve(id),
        }) as ReturnType<
          typeof useMutation<(...args: any[]) => Promise<any>, CustomError>
        >,
      { wrapper }
    );

    expectTypeOf(result.current.error).toEqualTypeOf<CustomError | null>();
  });

  it('should maintain backward compatibility with explicit type parameters', () => {
    const { result } = renderHook(
      () =>
        useMutation<{ id: number }, Error, { name: string }, { prev: string }>({
          mutationFn: (data) => Promise.resolve({ id: 1 }),
          onMutate: (data) => ({ prev: 'old' }),
        }),
      { wrapper }
    );

    expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<{
      name: string;
    }>();
    expectTypeOf(result.current.data).toEqualTypeOf<{ id: number } | undefined>();
    expectTypeOf(result.current.variables).toEqualTypeOf<
      { name: string } | undefined
    >();
  });
});

import { atom, Store, createStore } from '@nexus-state/core';
import type { PrimitiveAtom } from '@nexus-state/core';
import type { MutationOptions, MutationState, MutationResult } from './types';

/**
 * Create initial mutation state
 */
function createInitialState<
  TData,
  TError,
  TVariables
>(): MutationState<TData, TError, TVariables> {
  return {
    status: 'idle',
    data: undefined,
    error: null,
    variables: undefined,
    failureCount: 0,
    isPending: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
  };
}

/**
 * Create a mutation
 */
export function mutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: MutationOptions<TData, TError, TVariables, TContext>
): MutationResult<TData, TError, TVariables, TContext> {
  const store: Store = options.store ?? createStore();

  // Initial state
  const initialState = createInitialState<TData, TError, TVariables>();
  const stateAtom = atom<MutationState<TData, TError, TVariables>>(initialState);

  let context: TContext | undefined;

  // Helper: Update state
  const updateState = (
    updates: Partial<MutationState<TData, TError, TVariables>>
  ) => {
    store.set(stateAtom, (prev) => {
      const next = { ...prev, ...updates };
      next.isPending = next.status === 'loading';
      next.isSuccess = next.status === 'success';
      next.isError = next.status === 'error';
      next.isIdle = next.status === 'idle';
      return next;
    });
  };

  // Helper: Execute mutation with retries
  const executeMutation = async (
    variables: TVariables,
    attemptNumber = 0
  ): Promise<TData> => {
    try {
      const data = await options.mutationFn(variables);
      return data;
    } catch (error) {
      const maxRetries =
        typeof options.retry === 'number'
          ? options.retry
          : options.retry === true
            ? 3
            : 0;

      const shouldRetry = attemptNumber < maxRetries;

      if (shouldRetry) {
        const delay =
          typeof options.retryDelay === 'function'
            ? options.retryDelay(attemptNumber + 1)
            : options.retryDelay ?? 1000;

        await new Promise((resolve) => setTimeout(resolve, delay));
        return executeMutation(variables, attemptNumber + 1);
      }

      throw error;
    }
  };

  // Helper: Invalidate/refetch queries
  const handleQueryInvalidation = () => {
    if (options.invalidateQueries) {
      options.invalidateQueries.forEach((queryKey) => {
        // Mark queries as stale - implementation depends on query cache structure
        // This will be integrated with query cache in future
        console.debug(`Invalidating query: ${queryKey}`);
      });
    }

    if (options.refetchQueries) {
      options.refetchQueries.forEach((queryKey) => {
        // Trigger refetch - implementation depends on query cache structure
        console.debug(`Refetching query: ${queryKey}`);
      });
    }
  };

  // Main mutation function (fire and forget)
  const mutate = (variables: TVariables) => {
    mutateAsync(variables).catch((error) => {
      // Error already handled in mutateAsync
      console.error('Mutation error:', error);
    });
  };

  // Async mutation function
  const mutateAsync = async (variables: TVariables): Promise<TData> => {
    // Update state to loading
    updateState({
      status: 'loading',
      variables,
      error: null,
    });

    try {
      // Call onMutate for optimistic updates
      if (options.onMutate) {
        context = await options.onMutate(variables);
      }

      // Execute mutation
      const data = await executeMutation(variables);

      // Update state to success
      updateState({
        status: 'success',
        data,
        error: null,
        failureCount: 0,
      });

      // Invalidate and refetch queries
      handleQueryInvalidation();

      // Call success callback
      options.onSuccess?.(data, variables, context);
      options.onSettled?.(data, null, variables, context);

      return data;
    } catch (error) {
      const typedError = error as TError;
      const currentFailureCount = store.get(stateAtom).failureCount;

      // Update state to error
      updateState({
        status: 'error',
        error: typedError,
        failureCount: (currentFailureCount ?? 0) + 1,
      });

      // Call error callback
      options.onError?.(typedError, variables, context);
      options.onSettled?.(undefined, typedError, variables, context);

      throw error;
    }
  };

  // Reset mutation state
  const reset = () => {
    store.set(stateAtom, initialState);
    context = undefined;
  };

  return {
    state: stateAtom,
    mutate,
    mutateAsync,
    reset,
  };
}

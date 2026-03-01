import { useRef, useCallback } from 'react';
import { useAtomValue, useStore } from '@nexus-state/react';
import { mutation } from '../src/mutation';
import type { UseMutationOptions, UseMutationResult } from './types';
import type { MutationResult as CoreMutationResult } from '../src/types';

/**
 * Hook for executing mutations with state management
 *
 * @param options - Mutation options including mutationFn and callbacks
 * @returns Mutation result with data, loading state, error, and mutate functions
 *
 * @example
 * ```tsx
 * function CreatePost() {
 *   const { mutate, isPending, isError, error, data } = useMutation({
 *     mutationFn: async (post: { title: string; content: string }) => {
 *       const response = await fetch('/api/posts', {
 *         method: 'POST',
 *         body: JSON.stringify(post),
 *       });
 *       return response.json();
 *     },
 *     onSuccess: (data) => {
 *       console.log('Post created:', data);
 *     },
 *   });
 *
 *   const handleSubmit = (e: React.FormEvent) => {
 *     e.preventDefault();
 *     mutate({ title: 'New Post', content: 'Content here' });
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button type="submit" disabled={isPending}>
 *         {isPending ? 'Creating...' : 'Create Post'}
 *       </button>
 *       {isError && <div>Error: {error?.message}</div>}
 *       {data && <div>Created: {data.id}</div>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const store = useStore();
  const mutationRef = useRef<CoreMutationResult<TData, TError, TVariables, TContext> | null>(null);
  const optionsRef = useRef<UseMutationOptions<TData, TError, TVariables, TContext>>(options);

  // Keep options updated
  optionsRef.current = options;

  // Create mutation instance once
  if (!mutationRef.current) {
    mutationRef.current = mutation({
      ...options,
      store,
    });
  }

  const mut = mutationRef.current;

  // Subscribe to state changes using useAtomValue
  const state = useAtomValue(mut.state);

  // Wrap mutate to ensure stable reference
  const mutate = useCallback(
    (variables: TVariables) => {
      mut.mutate(variables);
    },
    [mut]
  );

  const mutateAsync = useCallback(
    (variables: TVariables) => {
      return mut.mutateAsync(variables);
    },
    [mut]
  );

  const reset = useCallback(() => {
    mut.reset();
  }, [mut]);

  return {
    data: state.data,
    error: state.error,
    isIdle: state.isIdle,
    isPending: state.isPending,
    isError: state.isError,
    isSuccess: state.isSuccess,
    status: state.status,
    variables: state.variables,
    failureCount: state.failureCount,
    mutate,
    mutateAsync,
    reset,
  };
}

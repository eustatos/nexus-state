/**
 * Mutation Typing Examples
 *
 * This file demonstrates various patterns for typing mutations
 * in @nexus-state/query.
 */

import { useMutation, unwrapAxiosResponse, axiosMapper } from '@nexus-state/query';
import type { AxiosResponse } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

interface Dictionary {
  id: number;
  code: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateDictionaryRequest {
  code: string;
  name: string;
}

interface UpdateDictionaryRequest {
  id: number;
  values: Partial<Dictionary>;
}

// Mock API for examples
const api = {
  delete: (id: number): Promise<void> => Promise.resolve(),
  create: (data: CreateDictionaryRequest): Promise<Dictionary> =>
    Promise.resolve({} as Dictionary),
  update: (id: number, values: Partial<Dictionary>): Promise<Dictionary> =>
    Promise.resolve({} as Dictionary),
  archive: (id: number): Promise<AxiosResponse<{ id: number; archived: boolean }>> =>
    Promise.resolve({} as AxiosResponse<{ id: number; archived: boolean }>),
  getById: (id: number): Promise<AxiosResponse<Dictionary>> =>
    Promise.resolve({} as AxiosResponse<Dictionary>),
  refresh: (): Promise<void> => Promise.resolve(),
};

// ============================================================================
// Example 1: Delete Mutation (returns void)
// ============================================================================

/**
 * Delete mutation with automatic type inference
 */
export const useDeleteDictionaryAuto = () => {
  return useMutation({
    mutationFn: (id: number) => api.delete(id),
  });
};

/**
 * Delete mutation with explicit types
 */
export const useDeleteDictionary = () => {
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.delete(id),
  });
};

// Usage:
// const { mutate } = useDeleteDictionary();
// mutate(123);

// ============================================================================
// Example 2: Create Mutation (returns created object)
// ============================================================================

/**
 * Create mutation with automatic type inference
 */
export const useCreateDictionaryAuto = () => {
  return useMutation({
    mutationFn: (data: CreateDictionaryRequest) => api.create(data),
  });
};

/**
 * Create mutation with explicit types
 */
export const useCreateDictionary = () => {
  return useMutation<Dictionary, Error, CreateDictionaryRequest>({
    mutationFn: (data) => api.create(data),
  });
};

// Usage:
// const { mutate } = useCreateDictionary();
// mutate({ code: 'TEST', name: 'Test Dictionary' });

// ============================================================================
// Example 3: Update Mutation (complex arguments)
// ============================================================================

/**
 * Update mutation with automatic type inference
 */
export const useUpdateDictionaryAuto = () => {
  return useMutation({
    mutationFn: ({ id, values }: UpdateDictionaryRequest) =>
      api.update(id, values),
  });
};

/**
 * Update mutation with explicit types
 */
export const useUpdateDictionary = () => {
  return useMutation<Dictionary, Error, UpdateDictionaryRequest>({
    mutationFn: ({ id, values }) => api.update(id, values),
  });
};

// Usage:
// const { mutate } = useUpdateDictionary();
// mutate({ id: 123, values: { name: 'New Name' } });

// ============================================================================
// Example 4: Mutation without Arguments
// ============================================================================

/**
 * Refresh mutation with automatic type inference
 */
export const useRefreshAuto = () => {
  return useMutation({
    mutationFn: () => api.refresh(),
  });
};

/**
 * Refresh mutation with explicit types
 */
export const useRefresh = () => {
  return useMutation<void, Error>({
    mutationFn: () => api.refresh(),
  });
};

// Usage:
// const { mutate } = useRefresh();
// mutate(); // or mutate(undefined)

// ============================================================================
// Example 5: Working with AxiosResponse
// ============================================================================

/**
 * Archive mutation using unwrapAxiosResponse helper
 */
export const useArchiveDictionaryWithHelper = () => {
  return useMutation({
    mutationFn: (id: number) =>
      unwrapAxiosResponse(api.archive(id)),
  });
};

/**
 * Archive mutation using axiosMapper helper
 */
export const useArchiveDictionaryWithMapper = () => {
  return useMutation({
    mutationFn: axiosMapper(api.archive),
  });
};

/**
 * Archive mutation with explicit types and manual unwrap
 */
export const useArchiveDictionaryExplicit = () => {
  return useMutation<{ id: number; archived: boolean }, Error, number>({
    mutationFn: (id) => unwrapAxiosResponse(api.archive(id)),
  });
};

// Usage:
// const { mutate, data } = useArchiveDictionaryWithHelper();
// mutate(123);
// console.log(data); // { id: number; archived: boolean }

// ============================================================================
// Example 6: Optimistic Updates with Context
// ============================================================================

interface DeleteContext {
  previousData: Dictionary[];
}

/**
 * Delete mutation with optimistic updates
 */
export const useDeleteDictionaryOptimistic = () => {
  return useMutation<void, Error, number, DeleteContext>({
    mutationFn: (id) => api.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      // await queryClient.cancelQueries({ queryKey: ['dictionaries'] });

      // Snapshot previous value (in real app, get from cache)
      const previousData: Dictionary[] = [];

      // Optimistically update (in real app, update cache)
      // queryClient.setQueryData(['dictionaries'], (old) =>
      //   old?.filter((d) => d.id !== id)
      // );

      return { previousData };
    },
    onError: (err, id, context) => {
      // Rollback on error
      console.error('Delete failed, rolling back:', context?.previousData);
    },
    onSettled: () => {
      // Always refetch after mutation
      // queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
    },
  });
};

// Usage:
// const { mutate } = useDeleteDictionaryOptimistic();
// mutate(123);

// ============================================================================
// Example 7: Axios Error Handling
// ============================================================================

import { axiosErrorHandler } from '@nexus-state/query';

interface ApiError {
  message: string;
  code: string;
}

/**
 * Create mutation with Axios error handling
 */
export const useCreateDictionaryWithErrorHandling = () => {
  return useMutation({
    mutationFn: (data: CreateDictionaryRequest) =>
      axiosMapper(api.create)(data),
    onError: axiosErrorHandler<ApiError>((error) => {
      if (error.isAxiosError) {
        // Handle Axios error
        console.error(`API Error ${error.status}: ${error.message}`);

        if (error.status === 409) {
          // Conflict - dictionary already exists
          console.error('Dictionary already exists:', error.data?.message);
        } else if (error.status === 400) {
          // Bad request - validation error
          console.error('Validation error:', error.data?.message);
        }
      } else {
        // Handle non-Axios error
        console.error('Unknown error:', error.message);
      }
    }),
  });
};

// Usage:
// const { mutate } = useCreateDictionaryWithErrorHandling();
// mutate({ code: 'TEST', name: 'Test' });

// ============================================================================
// Example 8: Comparison - Automatic vs Explicit Typing
// ============================================================================

/**
 * Automatic type inference (recommended for most cases)
 * - Less boilerplate
 * - Types inferred from mutationFn
 * - Cleaner code
 */
export const useAutomaticTyping = () => {
  return useMutation({
    mutationFn: (id: number) => api.delete(id),
    // ✅ TVariables inferred as number
    // ✅ TData inferred as void
    // ✅ TError defaults to Error
  });
};

/**
 * Explicit type parameters (for advanced cases)
 * - Full control over types
 * - Useful when inference fails
 * - Required for complex generic scenarios
 */
export const useExplicitTyping = () => {
  return useMutation<void, Error, number, { previousId: number }>({
    mutationFn: (id) => api.delete(id),
    // ✅ All types explicitly specified
    // ✅ TContext for optimistic updates
  });
};

// ============================================================================
// Type Safety Examples
// ============================================================================

/**
 * These examples show type safety in action:
 *
 * ✅ CORRECT - types match
 * useDeleteDictionary().mutate(123);
 *
 * ❌ WRONG - TypeScript error
 * useDeleteDictionary().mutate('123'); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
 *
 * ❌ WRONG - missing required property
 * useCreateDictionary().mutate({ code: 'TEST' }); // Error: Property 'name' is missing
 */

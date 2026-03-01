import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  FC,
  useCallback,
} from 'react';
import { createStore, Store } from '@nexus-state/core';
import { clearQueryCache } from '../src/query';
import type { QueryClient, QueryClientConfig } from './types';

/**
 * Context for sharing query client across React components
 */
const QueryClientContext = createContext<QueryClient | null>(null);

/**
 * Create a query client instance
 *
 * @param config - Query client configuration
 * @returns Query client instance
 *
 * @example
 * ```tsx
 * const queryClient = createQueryClient({
 *   defaultOptions: {
 *     queries: {
 *       staleTime: 5 * 60 * 1000,
 *       retry: 3,
 *     },
 *   },
 * });
 * ```
 */
export function createQueryClient(config: QueryClientConfig = {}): QueryClient {
  const store = config.store ?? createStore();
  let defaultOptions = config.defaultOptions;

  return {
    getStore: () => store,

    getDefaultOptions: () => defaultOptions?.queries,

    getDefaultMutationOptions: () => defaultOptions?.mutations,

    setDefaultOptions: (options: QueryClientConfig['defaultOptions']) => {
      defaultOptions = options;
    },

    clearCache: () => {
      clearQueryCache();
    },

    invalidateQueries: (queryKey?: string) => {
      // Implementation depends on query cache structure
      // This will be integrated with query cache in future
      console.debug(`Invalidating queries: ${queryKey ?? 'all'}`);
    },

    refetchQueries: async (queryKey?: string) => {
      // Implementation depends on query cache structure
      // This will be integrated with query cache in future
      console.debug(`Refetching queries: ${queryKey ?? 'all'}`);
    },
  };
}

/**
 * Props for QueryClientProvider component
 */
export interface QueryClientProviderProps {
  /** Child components */
  children: ReactNode;
  /** Query client instance */
  client: QueryClient;
}

/**
 * Provider component to share query client across React components
 *
 * @example
 * ```tsx
 * const queryClient = createQueryClient({
 *   defaultOptions: {
 *     queries: {
 *       staleTime: 5 * 60 * 1000,
 *     },
 *   },
 * });
 *
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourApp />
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export const QueryClientProvider: FC<QueryClientProviderProps> = ({
  children,
  client,
}) => {
  // Memoize client to prevent unnecessary re-renders
  const contextValue = useMemo(() => client, [client]);

  return (
    <QueryClientContext.Provider value={contextValue}>
      {children}
    </QueryClientContext.Provider>
  );
};

/**
 * Hook to get the query client from context
 *
 * @returns The query client from context
 * @throws Error if used outside of QueryClientProvider
 *
 * @example
 * ```tsx
 * function SomeComponent() {
 *   const queryClient = useQueryClient();
 *
 *   const handleRefresh = () => {
 *     queryClient.invalidateQueries('users');
 *   };
 *
 *   return <button onClick={handleRefresh}>Refresh</button>;
 * }
 * ```
 */
export function useQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error(
      'useQueryClient must be used within a QueryClientProvider. ' +
        'Wrap your component tree with <QueryClientProvider>.'
    );
  }
  return client;
}

/**
 * Hook to get the store from query client
 *
 * @returns The store instance from query client
 *
 * @example
 * ```tsx
 * function AdvancedComponent() {
 *   const store = useQueryClientStore();
 *   // Use store directly with core atoms
 * }
 * ```
 */
export function useQueryClientStore(): Store {
  const client = useQueryClient();
  return client.getStore();
}

/**
 * Hook to invalidate queries
 *
 * @returns Function to invalidate queries
 *
 * @example
 * ```tsx
 * function RefreshButton() {
 *   const invalidateQueries = useInvalidateQueries();
 *
 *   return (
 *     <button onClick={() => invalidateQueries('users')}>
 *       Refresh Users
 *     </button>
 *   );
 * }
 * ```
 */
export function useInvalidateQueries(): (queryKey?: string) => void {
  const client = useQueryClient();
  return useCallback(
    (queryKey?: string) => {
      client.invalidateQueries(queryKey);
    },
    [client]
  );
}

/**
 * Hook to refetch queries
 *
 * @returns Function to refetch queries
 *
 * @example
 * ```tsx
 * function RefetchButton() {
 *   const refetchQueries = useRefetchQueries();
 *
 *   const handleRefetch = async () => {
 *     await refetchQueries('users');
 *   };
 *
 *   return <button onClick={handleRefetch}>Refetch All</button>;
 * }
 * ```
 */
export function useRefetchQueries(): (queryKey?: string) => Promise<void> {
  const client = useQueryClient();
  return useCallback(
    (queryKey?: string) => {
      return client.refetchQueries(queryKey);
    },
    [client]
  );
}

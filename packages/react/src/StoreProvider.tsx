import type { Store } from '@nexus-state/core';
import { createContext, useContext, type ReactNode } from 'react';

const StoreContext = createContext<Store | null>(null);

export interface StoreProviderProps {
  store: Store;
  children: ReactNode;
}

/**
 * Provider component that makes a store available to all child components.
 * Use this to avoid passing the store explicitly to every hook.
 *
 * @param props - Provider props
 * @param props.store - The store instance to provide
 * @param props.children - Child components that will have access to the store
 * @returns React element with store context
 *
 * @example
 * ```tsx
 * import { createStore } from '@nexus-state/core';
 * import { StoreProvider } from '@nexus-state/react';
 *
 * const store = createStore();
 *
 * function App() {
 *   return (
 *     <StoreProvider store={store}>
 *       <YourApp />
 *     </StoreProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Nested providers - inner store overrides outer
 * <StoreProvider store={outerStore}>
 *   <StoreProvider store={innerStore}>
 *     <ChildComponent /> // Uses innerStore
 *   </StoreProvider>
 * </StoreProvider>
 * ```
 */
export function StoreProvider({ store, children }: StoreProviderProps): JSX.Element {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/**
 * Hook to access the store from context.
 * @returns The store instance from the nearest StoreProvider
 * @throws {Error} If used outside of StoreProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const store = useStore();
 *   const count = useAtomValue(countAtom, store);
 *   return <div>{count}</div>;
 * }
 * ```
 */
export function useStore(): Store {
  const store = useContext(StoreContext);
  if (store === null) {
    throw new Error(
      'useStore must be used within a StoreProvider. ' +
      'Wrap your component tree with <StoreProvider store={store}>.'
    );
  }
  return store;
}

/**
 * Hook to optionally get the store from context.
 * Returns null if used outside of StoreProvider.
 * @returns The store instance from context, or null if not available
 * @internal
 */
export function useStoreOptional(): Store | null {
  return useContext(StoreContext);
}

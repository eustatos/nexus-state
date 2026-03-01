import { createContext, useContext, useMemo, ReactNode, FC } from "react";
import { Store, createStore } from "@nexus-state/core";

/**
 * Context for sharing store across React components
 */
const StoreContext = createContext<Store | null>(null);

/**
 * Props for StoreProvider component
 */
export interface StoreProviderProps {
  /** Child components */
  children: ReactNode;
  /** Optional store to use (creates a new one if not provided) */
  store?: Store;
}

/**
 * Provider component to share store across React components
 * @example
 * ```tsx
 * <StoreProvider>
 *   <App />
 * </StoreProvider>
 * ```
 * @example
 * ```tsx
 * const store = createStore();
 * <StoreProvider store={store}>
 *   <App />
 * </StoreProvider>
 * ```
 */
export const StoreProvider: FC<StoreProviderProps> = ({ children, store }) => {
  const defaultStore = useMemo(() => store || createStore(), [store]);

  return (
    <StoreContext.Provider value={defaultStore}>
      {children}
    </StoreContext.Provider>
  );
};

/**
 * Hook to get the store from context
 * @returns The store from context
 * @throws Error if used outside of StoreProvider
 * @example
 * ```tsx
 * function MyComponent() {
 *   const store = useStore();
 *   const [count, setCount] = useAtom(countAtom, store);
 *   // ...
 * }
 * ```
 */
export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(
      "useStore must be used within a StoreProvider. " +
        "Wrap your component tree with <StoreProvider>."
    );
  }
  return store;
}

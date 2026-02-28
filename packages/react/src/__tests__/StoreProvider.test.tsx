import { describe, it, expect } from 'vitest';
import { renderHook, render, screen, act } from '@testing-library/react';
import { atom, createStore } from '@nexus-state/core';
import { StoreProvider, useStore } from '../StoreProvider';
import { useAtomValue } from '../useAtomValue';
import { useSetAtom } from '../useSetAtom';
import { useAtom } from '../useAtom';

describe('StoreProvider', () => {
  it('should provide store to child components', () => {
    const store = createStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result } = renderHook(() => useStore(), { wrapper });
    expect(result.current).toBe(store);
  });

  it('should throw error when useStore used outside provider', () => {
    expect(() => renderHook(() => useStore())).toThrow(
      'useStore must be used within a StoreProvider'
    );
  });

  it('should allow hooks to use context store', () => {
    const countAtom = atom(42);
    const store = createStore();
    store.set(countAtom, 42);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result } = renderHook(() => useAtomValue(countAtom), { wrapper });
    expect(result.current).toBe(42);
  });

  it('should support nested providers (inner overrides outer)', () => {
    const countAtom = atom(0);
    const outerStore = createStore();
    const innerStore = createStore();
    outerStore.set(countAtom, 10);
    innerStore.set(countAtom, 20);

    function InnerComponent() {
      const store = useStore();
      return <div data-testid="value">{store.get(countAtom)}</div>;
    }

    render(
      <StoreProvider store={outerStore}>
        <StoreProvider store={innerStore}>
          <InnerComponent />
        </StoreProvider>
      </StoreProvider>
    );
    
    expect(screen.getByTestId('value').textContent).toBe('20');
  });

  it('should allow explicit store to override context', () => {
    const countAtom = atom(0);
    const contextStore = createStore();
    const explicitStore = createStore();
    contextStore.set(countAtom, 10);
    explicitStore.set(countAtom, 20);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={contextStore}>{children}</StoreProvider>
    );
    const { result } = renderHook(
      () => useAtomValue(countAtom, explicitStore),
      { wrapper }
    );
    expect(result.current).toBe(20);
  });

  it('should work with useAtom using context store', () => {
    const countAtom = atom(5);
    const store = createStore();
    store.set(countAtom, 5);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result } = renderHook(() => useAtom(countAtom), { wrapper });
    expect(result.current[0]).toBe(5);
  });

  it('should work with useSetAtom using context store', () => {
    const countAtom = atom(0);
    const store = createStore();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result } = renderHook(() => useSetAtom(countAtom), { wrapper });
    
    expect(typeof result.current).toBe('function');
  });

  it('should update components when context store value changes', () => {
    const countAtom = atom(0);
    const store = createStore();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result } = renderHook(() => useAtomValue(countAtom), { wrapper });
    expect(result.current).toBe(0);
    
    // Update via external store reference with act
    act(() => {
      store.set(countAtom, 100);
    });
    expect(result.current).toBe(100);
  });

  it('should handle multiple atoms with context store', () => {
    const atom1 = atom(1);
    const atom2 = atom(2);
    const store = createStore();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result: result1 } = renderHook(() => useAtomValue(atom1), { wrapper });
    const { result: result2 } = renderHook(() => useAtomValue(atom2), { wrapper });
    
    expect(result1.current).toBe(1);
    expect(result2.current).toBe(2);
  });

  it('should work with computed atoms using context store', () => {
    const baseAtom = atom(10);
    const doubleAtom = atom((get: any) => get(baseAtom) * 2);
    const store = createStore();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result } = renderHook(() => useAtomValue(doubleAtom), { wrapper });
    expect(result.current).toBe(20);
  });

  it('should allow setter from useSetAtom to update context store', () => {
    const countAtom = atom(0);
    const store = createStore();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result } = renderHook(() => useSetAtom(countAtom), { wrapper });
    
    // Use the setter to update the value
    result.current(42);
    expect(store.get(countAtom)).toBe(42);
  });

  it('should support functional updates via useSetAtom with context', () => {
    const countAtom = atom(10);
    const store = createStore();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result } = renderHook(() => useSetAtom(countAtom), { wrapper });
    
    // Use functional update
    result.current(prev => prev + 5);
    expect(store.get(countAtom)).toBe(15);
  });

  it('should work with deeply nested providers', () => {
    const valueAtom = atom('initial');
    const level1Store = createStore();
    const level2Store = createStore();
    const level3Store = createStore();
    
    level1Store.set(valueAtom, 'level1');
    level2Store.set(valueAtom, 'level2');
    level3Store.set(valueAtom, 'level3');

    function DeepComponent() {
      const store = useStore();
      return <div data-testid="deep-value">{store.get(valueAtom)}</div>;
    }

    render(
      <StoreProvider store={level1Store}>
        <div>
          <StoreProvider store={level2Store}>
            <div>
              <StoreProvider store={level3Store}>
                <DeepComponent />
              </StoreProvider>
            </div>
          </StoreProvider>
        </div>
      </StoreProvider>
    );
    
    expect(screen.getByTestId('deep-value').textContent).toBe('level3');
  });

  it('should throw descriptive error with installation hint', () => {
    try {
      renderHook(() => useStore());
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('StoreProvider');
      expect((error as Error).message).toContain('Wrap your component tree');
    }
  });
});

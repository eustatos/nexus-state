import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { atom, createStore } from '@nexus-state/core';
import { useSetAtom } from '../useSetAtom';

describe('useSetAtom', () => {
  it('should return a setter function', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(countAtom, store));
    expect(typeof result.current).toBe('function');
  });

  it('should update atom value when called', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(countAtom, store));
    act(() => { result.current(5); });
    expect(store.get(countAtom)).toBe(5);
  });

  it('should NOT re-render when atom value changes', () => {
    const countAtom = atom(0);
    const store = createStore();
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useSetAtom(countAtom, store);
    });
    const initialRenderCount = renderCount;
    act(() => { store.set(countAtom, 10); });
    expect(renderCount).toBe(initialRenderCount);
  });

  it('should support functional updates', () => {
    const countAtom = atom(10);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(countAtom, store));
    act(() => { result.current(prev => prev + 5); });
    expect(store.get(countAtom)).toBe(15);
  });

  it('should return stable setter reference', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result, rerender } = renderHook(() => useSetAtom(countAtom, store));
    const setter1 = result.current;
    rerender();
    const setter2 = result.current;
    expect(setter1).toBe(setter2);
  });

  it('should work with different stores', () => {
    const countAtom = atom(0);
    const store1 = createStore();
    const store2 = createStore();
    const { result: result1 } = renderHook(() => useSetAtom(countAtom, store1));
    const { result: result2 } = renderHook(() => useSetAtom(countAtom, store2));
    act(() => { result1.current(5); });
    expect(store1.get(countAtom)).toBe(5);
    expect(store2.get(countAtom)).toBe(0);
  });

  it('should work with string atoms', () => {
    const textAtom = atom('hello');
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(textAtom, store));
    act(() => { result.current('world'); });
    expect(store.get(textAtom)).toBe('world');
  });

  it('should work with object atoms', () => {
    const userAtom = atom({ name: 'John', age: 30 });
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(userAtom, store));
    act(() => { result.current({ name: 'Jane', age: 25 }); });
    expect(store.get(userAtom)).toEqual({ name: 'Jane', age: 25 });
  });

  it('should work with array atoms', () => {
    const itemsAtom = atom([1, 2, 3]);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(itemsAtom, store));
    act(() => { result.current([4, 5, 6]); });
    expect(store.get(itemsAtom)).toEqual([4, 5, 6]);
  });

  it('should work with boolean atoms', () => {
    const boolAtom = atom(true);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(boolAtom, store));
    act(() => { result.current(false); });
    expect(store.get(boolAtom)).toBe(false);
  });

  it('should work with null atoms', () => {
    const nullAtom = atom<string | null>(null);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(nullAtom, store));
    act(() => { result.current('not null'); });
    expect(store.get(nullAtom)).toBe('not null');
  });

  it('should work with undefined atoms', () => {
    const undefinedAtom = atom<string | undefined>(undefined);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(undefinedAtom, store));
    act(() => { result.current('defined'); });
    expect(store.get(undefinedAtom)).toBe('defined');
  });

  it('should handle multiple functional updates in sequence', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(countAtom, store));
    
    act(() => {
      result.current(prev => prev + 1);
      result.current(prev => prev + 1);
      result.current(prev => prev + 1);
    });
    
    expect(store.get(countAtom)).toBe(3);
  });

  it('should work with computed atoms (setter only)', () => {
    const baseAtom = atom(10);
    const derivedAtom = atom((get) => get(baseAtom) * 2);
    const store = createStore();
    
    // useSetAtom should work with any atom type
    const { result } = renderHook(() => useSetAtom(baseAtom, store));
    act(() => { result.current(20); });
    
    expect(store.get(baseAtom)).toBe(20);
    expect(store.get(derivedAtom)).toBe(40);
  });

  it('should maintain setter stability across multiple renders with different atoms', () => {
    const atom1 = atom(1);
    const atom2 = atom(2);
    const store = createStore();
    
    const { result, rerender } = renderHook(({ atom }) => useSetAtom(atom, store), {
      initialProps: { atom: atom1 }
    });
    
    const setter1 = result.current;
    
    // Rerender with same atom - setter should be stable
    rerender({ atom: atom1 });
    const setter2 = result.current;
    expect(setter1).toBe(setter2);
    
    // Rerender with different atom - setter should change
    rerender({ atom: atom2 });
    const setter3 = result.current;
    expect(setter1).not.toBe(setter3);
  });
});

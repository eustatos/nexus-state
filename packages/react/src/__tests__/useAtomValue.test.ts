import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { atom, createStore } from '@nexus-state/core';
import { useAtomValue } from '../useAtomValue';

describe('useAtomValue', () => {
  it('should return the initial value', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(countAtom, store));
    expect(result.current).toBe(0);
  });

  it('should update when atom value changes externally', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(countAtom, store));
    act(() => { store.set(countAtom, 5); });
    expect(result.current).toBe(5);
  });

  it('should work with computed atoms', () => {
    const baseAtom = atom(10);
    const doubleAtom = atom((get) => get(baseAtom) * 2);
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(doubleAtom, store));
    expect(result.current).toBe(20);
    act(() => { store.set(baseAtom, 15); });
    expect(result.current).toBe(30);
  });

  it('should handle multiple atoms independently', () => {
    const atom1 = atom(1);
    const atom2 = atom(2);
    const store = createStore();
    const { result: result1 } = renderHook(() => useAtomValue(atom1, store));
    const { result: result2 } = renderHook(() => useAtomValue(atom2, store));
    act(() => { store.set(atom1, 10); });
    expect(result1.current).toBe(10);
    expect(result2.current).toBe(2);
  });

  it('should work with writable atoms', () => {
    const writableAtom = atom(0, (get, set, update: number | ((prev: number) => number)) => {
      const newValue = typeof update === 'function' ? update(get(writableAtom)) : update;
      set(writableAtom, newValue);
    });
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(writableAtom, store));
    expect(result.current).toBe(0);
    act(() => { store.set(writableAtom, 42); });
    expect(result.current).toBe(42);
  });

  it('should handle string values', () => {
    const textAtom = atom('hello');
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(textAtom, store));
    expect(result.current).toBe('hello');
    act(() => { store.set(textAtom, 'world'); });
    expect(result.current).toBe('world');
  });

  it('should handle object values', () => {
    const userAtom = atom({ name: 'John', age: 30 });
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(userAtom, store));
    expect(result.current).toEqual({ name: 'John', age: 30 });
    act(() => { store.set(userAtom, { name: 'Jane', age: 25 }); });
    expect(result.current).toEqual({ name: 'Jane', age: 25 });
  });

  it('should handle array values', () => {
    const itemsAtom = atom([1, 2, 3]);
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(itemsAtom, store));
    expect(result.current).toEqual([1, 2, 3]);
    act(() => { store.set(itemsAtom, [4, 5, 6]); });
    expect(result.current).toEqual([4, 5, 6]);
  });

  it('should handle boolean values', () => {
    const boolAtom = atom(true);
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(boolAtom, store));
    expect(result.current).toBe(true);
    act(() => { store.set(boolAtom, false); });
    expect(result.current).toBe(false);
  });

  it('should handle null values', () => {
    const nullAtom = atom<string | null>(null);
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(nullAtom, store));
    expect(result.current).toBe(null);
    act(() => { store.set(nullAtom, 'not null'); });
    expect(result.current).toBe('not null');
  });

  it('should handle undefined values', () => {
    const undefinedAtom = atom<string | undefined>(undefined);
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(undefinedAtom, store));
    expect(result.current).toBe(undefined);
    act(() => { store.set(undefinedAtom, 'defined'); });
    expect(result.current).toBe('defined');
  });

  it('should work with derived computed atoms', () => {
    const baseAtom = atom(5);
    const doubledAtom = atom((get) => get(baseAtom) * 2);
    const tripledAtom = atom((get) => get(baseAtom) * 3);
    const summedAtom = atom((get) => get(doubledAtom) + get(tripledAtom));
    const store = createStore();
    
    const { result } = renderHook(() => useAtomValue(summedAtom, store));
    expect(result.current).toBe(25); // (5*2) + (5*3) = 10 + 15 = 25
    
    act(() => { store.set(baseAtom, 10); });
    expect(result.current).toBe(50); // (10*2) + (10*3) = 20 + 30 = 50
  });

  it('should not cause unnecessary re-renders when value does not change', () => {
    const countAtom = atom(0);
    const store = createStore();
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;
      return useAtomValue(countAtom, store);
    });
    
    const initialRenders = renderCount;
    act(() => { store.set(countAtom, 0); }); // Set same value
    
    // Should not re-render since value didn't change
    expect(renderCount).toBe(initialRenders);
    expect(result.current).toBe(0);
  });
});

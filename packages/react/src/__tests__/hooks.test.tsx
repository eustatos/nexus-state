import { describe, it, expect, vi } from 'vitest';
import { render, renderHook, screen, fireEvent } from '@testing-library/react';
import { atom, createStore, type Getter, type Setter } from '@nexus-state/core';
import { useAtom, useAtomValue, useSetAtom, useAtomCallback } from '../../index';
import React from 'react';

describe('React Hooks', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('useAtomValue', () => {
    it('should read atom value', () => {
      const countAtom = atom(0);

      const { result } = renderHook(() => useAtomValue(countAtom, store));

      expect(result.current).toBe(0);
    });

    it('should subscribe to atom changes', () => {
      const countAtom = atom(0);

      const { result, rerender } = renderHook(() =>
        useAtomValue(countAtom, store)
      );

      expect(result.current).toBe(0);

      // Update atom
      store.set(countAtom, 5);
      rerender();

      expect(result.current).toBe(5);
    });

    it('should not provide setter', () => {
      const countAtom = atom(0);

      const { result } = renderHook(() => useAtomValue(countAtom, store));

      // Result is just the value, not a tuple
      expect(typeof result.current).toBe('number');
      expect(Array.isArray(result.current)).toBe(false);
    });

    it('should throw error without store', () => {
      const countAtom = atom(0);

      expect(() => {
        renderHook(() => useAtomValue(countAtom));
      }).toThrow('useAtomValue requires a store');
    });
  });

  describe('useSetAtom', () => {
    it('should return setter function', () => {
      const countAtom = atom(0);

      const { result } = renderHook(() => useSetAtom(countAtom, store));

      expect(typeof result.current).toBe('function');
    });

    it('should update atom value', () => {
      const countAtom = atom(0);

      const { result } = renderHook(() => useSetAtom(countAtom, store));

      // Call setter
      result.current(5);

      // Verify atom was updated
      expect(store.get(countAtom)).toBe(5);
    });

    it('should support updater function', () => {
      const countAtom = atom(10);

      const { result } = renderHook(() => useSetAtom(countAtom, store));

      // Update with function
      result.current((prev: number) => prev + 5);

      expect(store.get(countAtom)).toBe(15);
    });

    it('should NOT cause re-renders on atom change', () => {
      const countAtom = atom(0);
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const setCount = useSetAtom(countAtom, store);
        return <button onClick={() => setCount(1)}>Set</button>;
      }

      render(<TestComponent />);
      expect(renderCount).toBe(1);

      // Update atom externally
      store.set(countAtom, 5);

      // Component should NOT re-render
      expect(renderCount).toBe(1);
    });

    it('should have stable reference', () => {
      const countAtom = atom(0);

      const { result, rerender } = renderHook(() =>
        useSetAtom(countAtom, store)
      );

      const firstSetter = result.current;

      rerender();

      const secondSetter = result.current;

      // Same reference
      expect(firstSetter).toBe(secondSetter);
    });

    it('should throw error without store', () => {
      const countAtom = atom(0);

      expect(() => {
        renderHook(() => useSetAtom(countAtom));
      }).toThrow('useSetAtom requires a store');
    });
  });

  describe('useAtom', () => {
    it('should return value and setter', () => {
      const countAtom = atom(0);

      const { result } = renderHook(() => useAtom(countAtom, store));

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(2);
      expect(typeof result.current[0]).toBe('number');
      expect(typeof result.current[1]).toBe('function');
    });

    it('should combine useAtomValue and useSetAtom behavior', () => {
      const countAtom = atom(0);

      const { result } = renderHook(() => useAtom(countAtom, store));

      const [value, setValue] = result.current;

      expect(value).toBe(0);

      setValue(5);

      expect(store.get(countAtom)).toBe(5);
    });

    it('should update on atom changes', () => {
      const countAtom = atom(0);

      const { result, rerender } = renderHook(() => useAtom(countAtom, store));

      expect(result.current[0]).toBe(0);

      store.set(countAtom, 10);
      rerender();

      expect(result.current[0]).toBe(10);
    });
  });

  describe('useAtomCallback', () => {
    it('should create callback with get and set', () => {
      const atom1 = atom(1);
      const atom2 = atom(2);

      const { result } = renderHook(() =>
        useAtomCallback(
          (get: Getter, set: Setter, multiplier: number) => {
            const val1 = get(atom1);
            const val2 = get(atom2);
            set(atom1, val1 * multiplier);
            set(atom2, val2 * multiplier);
            return val1 + val2;
          },
          store
        )
      );

      const returnValue = result.current(10);

      expect(returnValue).toBe(3); // 1 + 2
      expect(store.get(atom1)).toBe(10);
      expect(store.get(atom2)).toBe(20);
    });

    it('should have stable reference', () => {
      const countAtom = atom(0);

      const { result, rerender } = renderHook(() =>
        useAtomCallback(
          (get: Getter, set: Setter) => {
            set(countAtom, get(countAtom) + 1);
          },
          store
        )
      );

      const firstCallback = result.current;
      rerender();
      const secondCallback = result.current;

      expect(firstCallback).toBe(secondCallback);
    });

    it('should throw error without store', () => {
      expect(() => {
        renderHook(() =>
          useAtomCallback(
            (_get: Getter, set: Setter) => {
              set(atom(0), 1);
            },
            undefined as any
          )
        );
      }).toThrow('useAtomCallback requires a store');
    });
  });

  describe('Performance', () => {
    it('useSetAtom should not cause re-renders', () => {
      const countAtom = atom(0);
      let renderCount = 0;

      function WriteOnlyComponent() {
        renderCount++;
        const setCount = useSetAtom(countAtom, store);
        return <button onClick={() => setCount(1)}>Update</button>;
      }

      render(<WriteOnlyComponent />);

      const initialRenders = renderCount;

      // Update atom multiple times
      store.set(countAtom, 1);
      store.set(countAtom, 2);
      store.set(countAtom, 3);

      // No additional re-renders
      expect(renderCount).toBe(initialRenders);
    });

    it('useAtomValue should only re-render on changes', () => {
      const countAtom = atom(0);
      let renderCount = 0;

      function ReadOnlyComponent() {
        renderCount++;
        const count = useAtomValue(countAtom, store);
        return <div>{count}</div>;
      }

      render(<ReadOnlyComponent />);
      expect(renderCount).toBe(1);

      // Update atom
      store.set(countAtom, 1);
      expect(renderCount).toBe(2);

      // Set same value - should not re-render
      store.set(countAtom, 1);
      expect(renderCount).toBe(2);
    });
  });

  describe('Integration', () => {
    it('should work in realistic form scenario', () => {
      const nameAtom = atom('');
      const emailAtom = atom('');

      function FormComponent() {
        const [name, setName] = useAtom(nameAtom, store);
        const setEmail = useSetAtom(emailAtom, store);

        return (
          <div>
            <input
              data-testid="name-input"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
            <input
              data-testid="email-input"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            />
          </div>
        );
      }

      render(<FormComponent />);

      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'John' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      expect(store.get(nameAtom)).toBe('John');
      expect(store.get(emailAtom)).toBe('john@example.com');
    });

    it('should work with multiple atoms', () => {
      const atom1 = atom('a');
      const atom2 = atom('b');
      const atom3 = atom('c');

      function MultiAtomComponent() {
        const val1 = useAtomValue(atom1, store);
        const val2 = useAtomValue(atom2, store);
        const setVal3 = useSetAtom(atom3, store);

        return (
          <div>
            <span data-testid="val1">{val1}</span>
            <span data-testid="val2">{val2}</span>
            <button onClick={() => setVal3('updated')}>Update</button>
          </div>
        );
      }

      render(<MultiAtomComponent />);

      expect(screen.getByTestId('val1').textContent).toBe('a');
      expect(screen.getByTestId('val2').textContent).toBe('b');

      fireEvent.click(screen.getByText('Update'));

      expect(store.get(atom3)).toBe('updated');
    });
  });
});

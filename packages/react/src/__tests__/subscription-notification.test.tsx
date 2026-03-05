/**
 * Тесты для проверки React хуков и уведомлений об изменениях атомов
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { atom, createStore, batch } from '@nexus-state/core'
import { useAtomValue, useSetAtom, useAtom, StoreProvider } from '../../index'
import type { Atom, Store } from '@nexus-state/core'

describe('React Hooks - Subscription and Notification', () => {
  let store: Store
  let testAtom: Atom<number>

  beforeEach(() => {
    store = createStore()
    testAtom = atom(0, 'test')
  })

  describe('useAtomValue', () => {
    it('should return current atom value', () => {
      const { result } = renderHook(() => useAtomValue(testAtom, store))
      expect(result.current).toBe(0)
    })

    it('should re-render when atom value changes', async () => {
      const { result } = renderHook(() => useAtomValue(testAtom, store))

      expect(result.current).toBe(0)

      act(() => {
        store.set(testAtom, 1)
      })

      expect(result.current).toBe(1)

      act(() => {
        store.set(testAtom, 2)
      })

      expect(result.current).toBe(2)
    })

    it('should not re-render if value has not changed', async () => {
      let renderCount = 0

      const { result } = renderHook(() => {
        renderCount++
        return useAtomValue(testAtom, store)
      })

      expect(result.current).toBe(0)
      const initialRenderCount = renderCount

      act(() => {
        store.set(testAtom, 0) // Same value
      })

      // Не должно быть дополнительных рендеров
      expect(renderCount).toBe(initialRenderCount)
    })

    it('should handle multiple atoms', async () => {
      const atom1 = atom(0, 'atom1')
      const atom2 = atom(0, 'atom2')

      const { result } = renderHook(
        () => ({
          val1: useAtomValue(atom1, store),
          val2: useAtomValue(atom2, store)
        }),
        { wrapper: ({ children }) => (
          <StoreProvider store={store}>{children}</StoreProvider>
        )}
      )

      expect(result.current.val1).toBe(0)
      expect(result.current.val2).toBe(0)

      act(() => {
        store.set(atom1, 1)
      })

      expect(result.current.val1).toBe(1)
      expect(result.current.val2).toBe(0)

      act(() => {
        store.set(atom2, 2)
      })

      expect(result.current.val1).toBe(1)
      expect(result.current.val2).toBe(2)
    })

    it('should handle computed atoms', async () => {
      const countAtom = atom(0, 'count')
      const doubleAtom = atom((get) => get(countAtom) * 2, 'double')

      const { result } = renderHook(() => useAtomValue(doubleAtom, store))

      expect(result.current).toBe(0)

      act(() => {
        store.set(countAtom, 1)
      })

      expect(result.current).toBe(2)

      act(() => {
        store.set(countAtom, 5)
      })

      expect(result.current).toBe(10)
    })

    it('should work with useSetAtom from different component', async () => {
      const countAtom = atom(0, 'count')

      const { result: valueResult } = renderHook(
        () => useAtomValue(countAtom, store)
      )

      const { result: setResult } = renderHook(
        () => useSetAtom(countAtom, store)
      )

      expect(valueResult.current).toBe(0)

      act(() => {
        setResult.current(42)
      })

      expect(valueResult.current).toBe(42)
    })

    it('should handle rapid updates', async () => {
      const { result } = renderHook(() => useAtomValue(testAtom, store))

      act(() => {
        store.set(testAtom, 1)
        store.set(testAtom, 2)
        store.set(testAtom, 3)
      })

      expect(result.current).toBe(3)
    })

    it('should handle function updates', async () => {
      const { result } = renderHook(() => useAtomValue(testAtom, store))

      act(() => {
        store.set(testAtom, (prev) => prev + 1)
        store.set(testAtom, (prev) => prev + 1)
        store.set(testAtom, (prev) => prev + 1)
      })

      expect(result.current).toBe(3)
    })
  })

  describe('useAtom', () => {
    it('should return [value, setter] tuple', () => {
      const { result } = renderHook(() => useAtom(testAtom, store))
      const [value, setter] = result.current

      expect(value).toBe(0)
      expect(typeof setter).toBe('function')
    })

    it('should update value when setter is called', async () => {
      const { result } = renderHook(() => useAtom(testAtom, store))

      act(() => {
        result.current[1](1)
      })

      expect(result.current[0]).toBe(1)
    })

    it('should update with function', async () => {
      const { result } = renderHook(() => useAtom(testAtom, store))

      act(() => {
        result.current[1]((prev) => prev + 1)
      })

      expect(result.current[0]).toBe(1)
    })
  })

  describe('useSetAtom', () => {
    it('should return stable setter function', () => {
      const { result, rerender } = renderHook(
        () => useSetAtom(testAtom, store)
      )

      const firstSetter = result.current

      rerender()

      expect(result.current).toBe(firstSetter)
    })

    it('should update atom value', async () => {
      const { result } = renderHook(() => useSetAtom(testAtom, store))

      act(() => {
        result.current(42)
      })

      expect(store.get(testAtom)).toBe(42)
    })

    it('should trigger re-render in components using useAtomValue', async () => {
      const countAtom = atom('count', 0)

      const { result: valueResult } = renderHook(
        () => useAtomValue(countAtom, store)
      )

      const { result: setResult } = renderHook(
        () => useSetAtom(countAtom, store)
      )

      act(() => {
        setResult.current(100)
      })

      expect(valueResult.current).toBe(100)
    })
  })

  describe('Edge Cases', () => {
    it('should handle NaN values correctly', async () => {
      const nanAtom = atom(NaN, 'nan')
      const { result } = renderHook(() => useAtomValue(nanAtom, store))

      expect(Number.isNaN(result.current)).toBe(true)
    })

    it('should handle object values', async () => {
      type ObjType = { count: number }
      const objAtom = atom({ count: 0 } as ObjType, 'obj')
      const { result } = renderHook(() => useAtomValue(objAtom, store))

      expect(result.current).toEqual({ count: 0 })

      act(() => {
        store.set(objAtom, { count: 1 })
      })

      expect(result.current).toEqual({ count: 1 })
    })

    it('should handle array values', async () => {
      const arrAtom = atom([1, 2, 3], 'arr')
      const { result } = renderHook(() => useAtomValue(arrAtom, store))

      expect(result.current).toEqual([1, 2, 3])

      act(() => {
        store.set(arrAtom, [4, 5, 6])
      })

      expect(result.current).toEqual([4, 5, 6])
    })

    it('should handle null values', async () => {
      const nullAtom = atom<string | null>(null, 'null')
      const { result } = renderHook(() => useAtomValue(nullAtom, store))

      expect(result.current).toBe(null)

      act(() => {
        store.set(nullAtom, 'not null')
      })

      expect(result.current).toBe('not null')
    })
  })

  describe('Batching with React', () => {
    it('should batch updates in React act', async () => {
      const renderCounts = { count: 0, double: 0 }
      const countAtom = atom(0, 'count')
      const doubleAtom = atom((get) => get(countAtom) * 2, 'double')

      renderHook(() => {
        renderCounts.count++
        return useAtomValue(countAtom, store)
      })

      renderHook(() => {
        renderCounts.double++
        return useAtomValue(doubleAtom, store)
      })

      const initialCountRenders = renderCounts.count
      const initialDoubleRenders = renderCounts.double

      act(() => {
        store.set(countAtom, 1)
      })

      // Должен быть только один дополнительный рендер для каждого атома
      expect(renderCounts.count).toBe(initialCountRenders + 1)
      expect(renderCounts.double).toBe(initialDoubleRenders + 1)
    })

    it('should work with batch() wrapper', async () => {
      const countAtom = atom(0, 'count')
      const { result } = renderHook(() => useAtomValue(countAtom, store))

      act(() => {
        batch(() => {
          store.set(countAtom, 1)
          store.set(countAtom, 2)
          store.set(countAtom, 3)
        })
      })

      expect(result.current).toBe(3)
    })
  })

  describe('Multiple Stores', () => {
    it('should work with different stores', async () => {
      const store1 = createStore()
      const store2 = createStore()
      const atom1 = atom(0, 'atom1')
      const atom2 = atom(0, 'atom2')

      const { result: result1 } = renderHook(() => useAtomValue(atom1, store1))
      const { result: result2 } = renderHook(() => useAtomValue(atom2, store2))

      act(() => {
        store1.set(atom1, 1)
        store2.set(atom2, 2)
      })

      expect(result1.current).toBe(1)
      expect(result2.current).toBe(2)
    })
  })

  describe('Context Store', () => {
    it('should use store from context', async () => {
      const countAtom = atom(0, 'count')

      const { result } = renderHook(
        () => useAtomValue(countAtom),
        {
          wrapper: ({ children }) => (
            <StoreProvider store={store}>{children}</StoreProvider>
          )
        }
      )

      expect(result.current).toBe(0)

      act(() => {
        store.set(countAtom, 42)
      })

      expect(result.current).toBe(42)
    })

    it('should prefer explicit store over context', async () => {
      const store1 = createStore()
      const store2 = createStore()
      const countAtom = atom(0, 'count')

      store1.set(countAtom, 100)
      store2.set(countAtom, 200)

      const { result } = renderHook(
        () => useAtomValue(countAtom, store1), // Явно указываем store1
        {
          wrapper: ({ children }) => (
            <StoreProvider store={store2}>{children}</StoreProvider> // Но в контексте store2
          )
        }
      )

      expect(result.current).toBe(100) // Должно использовать store1
    })
  })
})

/**
 * Интеграционные тесты для SnapshotRestorer и React
 * Проверяют, что восстановление состояния из снапшотов правильно
 * уведомляет React компоненты
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { atom, createStore, SimpleTimeTravel } from '@nexus-state/core'
import { useAtomValue, useSetAtom } from '../../index'
import type { Store } from '@nexus-state/core'

describe('SnapshotRestorer + React Integration', () => {
  let store: Store
  let timeTravel: SimpleTimeTravel
  let contentAtom: ReturnType<typeof atom<string>>

  beforeEach(() => {
    store = createStore()
    contentAtom = atom('', 'content')
    
    timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: false
    })
  })

  describe('Snapshot Creation and Restoration', () => {
    it('should notify React components after snapshot restoration', () => {
      // Устанавливаем начальное значение
      act(() => {
        store.set(contentAtom, 'initial')
      })

      // Создаём снимок
      const snapshot1 = timeTravel.capture('initial')
      expect(snapshot1).toBeDefined()

      // Изменяем значение
      act(() => {
        store.set(contentAtom, 'modified')
      })

      // Проверяем, что React видит изменённое значение
      const { result } = renderHook(() => useAtomValue(contentAtom, store))
      expect(result.current).toBe('modified')

      // Восстанавливаем из снимка
      act(() => {
        timeTravel.jumpTo(0)
      })

      // React должен получить уведомление об изменении
      expect(result.current).toBe('initial')
    })

    it('should handle multiple snapshot restorations', () => {
      // Создаём несколько снимков
      act(() => {
        store.set(contentAtom, 'state1')
      })
      const snapshot1 = timeTravel.capture('state1')

      act(() => {
        store.set(contentAtom, 'state2')
      })
      const snapshot2 = timeTravel.capture('state2')

      act(() => {
        store.set(contentAtom, 'state3')
      })
      const snapshot3 = timeTravel.capture('state3')

      // Подписываемся на значение
      const { result } = renderHook(() => useAtomValue(contentAtom, store))
      expect(result.current).toBe('state3')

      // Переходим к первому снимку
      act(() => {
        timeTravel.jumpTo(0)
      })
      expect(result.current).toBe('state1')

      // Переходим ко второму снимку
      act(() => {
        timeTravel.jumpTo(1)
      })
      expect(result.current).toBe('state2')

      // Переходим к третьему снимку
      act(() => {
        timeTravel.jumpTo(2)
      })
      expect(result.current).toBe('state3')
    })

    it('should notify after undo', () => {
      // Создаём снимки
      act(() => {
        store.set(contentAtom, 'first')
      })
      timeTravel.capture('first')

      act(() => {
        store.set(contentAtom, 'second')
      })
      timeTravel.capture('second')

      const { result } = renderHook(() => useAtomValue(contentAtom, store))
      expect(result.current).toBe('second')

      // Отменяем
      act(() => {
        timeTravel.undo()
      })

      expect(result.current).toBe('first')
    })

    it('should notify after redo', () => {
      // Создаём снимки
      act(() => {
        store.set(contentAtom, 'first')
      })
      timeTravel.capture('first')

      act(() => {
        store.set(contentAtom, 'second')
      })
      timeTravel.capture('second')

      const { result } = renderHook(() => useAtomValue(contentAtom, store))

      // Отменяем
      act(() => {
        timeTravel.undo()
      })
      expect(result.current).toBe('first')

      // Повторяем
      act(() => {
        timeTravel.redo()
      })
      expect(result.current).toBe('second')
    })
  })

  describe('Multiple Atoms Restoration', () => {
    it('should restore multiple atoms and notify React', () => {
      const countAtom = atom(0, 'count')
      const nameAtom = atom('', 'name')

      const timeTravelMulti = new SimpleTimeTravel(store, {
        maxHistory: 100,
        autoCapture: false
      })

      // Устанавливаем значения
      act(() => {
        store.set(countAtom, 1)
        store.set(nameAtom, 'Alice')
      })
      const snapshot1 = timeTravelMulti.capture('state1')

      act(() => {
        store.set(countAtom, 2)
        store.set(nameAtom, 'Bob')
      })
      const snapshot2 = timeTravelMulti.capture('state2')

      // Подписываемся на оба атома
      const { result } = renderHook(() => ({
        count: useAtomValue(countAtom, store),
        name: useAtomValue(nameAtom, store)
      }))

      expect(result.current).toEqual({ count: 2, name: 'Bob' })

      // Восстанавливаем первое состояние
      act(() => {
        timeTravelMulti.jumpTo(0)
      })

      expect(result.current).toEqual({ count: 1, name: 'Alice' })
    })

    it('should handle partial atom updates in snapshot', () => {
      const countAtom = atom(0, 'count')
      const nameAtom = atom('', 'name')

      const timeTravelMulti = new SimpleTimeTravel(store, {
        maxHistory: 100,
        autoCapture: false
      })

      // Устанавливаем значения
      act(() => {
        store.set(countAtom, 1)
        store.set(nameAtom, 'Alice')
      })
      timeTravelMulti.capture('state1')

      // Изменяем только count
      act(() => {
        store.set(countAtom, 2)
      })
      timeTravelMulti.capture('state2')

      const { result } = renderHook(() => ({
        count: useAtomValue(countAtom, store),
        name: useAtomValue(nameAtom, store)
      }))

      // Восстанавливаем первое состояние
      act(() => {
        timeTravelMulti.undo()
      })

      expect(result.current.count).toBe(1)
      expect(result.current.name).toBe('Alice')
    })
  })

  describe('useSetAtom after Restoration', () => {
    it('should allow updates after snapshot restoration', () => {
      act(() => {
        store.set(contentAtom, 'initial')
      })
      timeTravel.capture('initial')

      act(() => {
        store.set(contentAtom, 'modified')
      })

      const { result } = renderHook(() => useAtomValue(contentAtom, store))
      const setContent = renderHook(() => useSetAtom(contentAtom, store)).result

      // Восстанавливаем
      act(() => {
        timeTravel.jumpTo(0)
      })
      expect(result.current).toBe('initial')

      // Обновляем после восстановления
      act(() => {
        setContent.current('after-restore')
      })
      expect(result.current).toBe('after-restore')
    })
  })

  describe('Concurrent Updates', () => {
    it('should handle rapid snapshot navigation', () => {
      // Создаём несколько снимков
      for (let i = 0; i < 5; i++) {
        act(() => {
          store.set(contentAtom, `state${i}`)
        })
        timeTravel.capture(`state${i}`)
      }

      const { result } = renderHook(() => useAtomValue(contentAtom, store))
      expect(result.current).toBe('state4')

      // Быстрая навигация
      act(() => {
        timeTravel.jumpTo(0)
        timeTravel.jumpTo(2)
        timeTravel.jumpTo(4)
      })

      expect(result.current).toBe('state4')

      act(() => {
        timeTravel.jumpTo(1)
      })
      expect(result.current).toBe('state1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty snapshot restoration', () => {
      const emptyAtom = atom('', 'empty')
      const tt = new SimpleTimeTravel(store, { autoCapture: false })

      act(() => {
        store.set(emptyAtom, '')
      })
      tt.capture('empty')

      act(() => {
        store.set(emptyAtom, 'not empty')
      })

      const { result } = renderHook(() => useAtomValue(emptyAtom, store))
      expect(result.current).toBe('not empty')

      act(() => {
        tt.jumpTo(0)
      })

      expect(result.current).toBe('')
    })

    it('should handle special characters in content', () => {
      const specialContent = 'Special: \n\t"quotes"\'apostrophes'
      
      act(() => {
        store.set(contentAtom, specialContent)
      })
      timeTravel.capture('special')

      act(() => {
        store.set(contentAtom, 'different')
      })

      const { result } = renderHook(() => useAtomValue(contentAtom, store))
      expect(result.current).toBe('different')

      act(() => {
        timeTravel.jumpTo(0)
      })

      expect(result.current).toBe(specialContent)
    })
  })
})

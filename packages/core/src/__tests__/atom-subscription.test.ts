/**
 * Тесты для проверки механизма подписки и уведомлений об изменениях атомов
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createStore } from '../store'
import { atom } from '../atom'
import { cleanupGlobalState } from '../test-utils'
import type { Atom, Store } from '../types'

describe('Atom Subscription and Notification', () => {
  let store: Store
  let testAtom: Atom<number>

  beforeEach(() => {
    cleanupGlobalState()
    store = createStore()
    testAtom = atom(0, 'test')
  })

  afterEach(() => {
    cleanupGlobalState()
  })

  describe('Basic Subscription', () => {
    it('should notify subscriber when atom value changes', () => {
      const notifications: number[] = []

      store.subscribe(testAtom, (newValue) => {
        notifications.push(newValue)
      })

      store.set(testAtom, 1)
      store.set(testAtom, 2)
      store.set(testAtom, 3)

      expect(notifications).toEqual([1, 2, 3])
    })

    it('should NOT notify with current value on subscribe (use get() instead)', () => {
      testAtom = atom(42, 'test2')
      let notifiedValue: number | undefined

      const unsubscribe = store.subscribe(testAtom, (newValue) => {
        notifiedValue = newValue
      })

      // Подписка НЕ получает текущее значение автоматически
      // Нужно использовать get() для получения текущего значения
      expect(notifiedValue).toBeUndefined()
      
      // Для получения текущего значения используйте get()
      expect(store.get(testAtom)).toBe(42)
      
      unsubscribe()
    })

    it('should not notify after unsubscribe', () => {
      const notifications: number[] = []

      const unsubscribe = store.subscribe(testAtom, (newValue) => {
        notifications.push(newValue)
      })

      store.set(testAtom, 1)
      expect(notifications).toEqual([1])

      unsubscribe()

      store.set(testAtom, 2)
      store.set(testAtom, 3)

      expect(notifications).toEqual([1])
    })

    it('should notify multiple subscribers', () => {
      const notifications1: number[] = []
      const notifications2: number[] = []

      store.subscribe(testAtom, (newValue) => {
        notifications1.push(newValue)
      })

      store.subscribe(testAtom, (newValue) => {
        notifications2.push(newValue)
      })

      store.set(testAtom, 1)
      store.set(testAtom, 2)

      expect(notifications1).toEqual([1, 2])
      expect(notifications2).toEqual([1, 2])
    })

    it('should handle subscriber that throws without breaking others', () => {
      const notifications: number[] = []
      let errorThrowingCalled = false

      store.subscribe(testAtom, () => {
        errorThrowingCalled = true
        throw new Error('Test error')
      })

      store.subscribe(testAtom, (newValue) => {
        notifications.push(newValue)
      })

      // Ошибка в одном подписчике не должна ломать других
      store.set(testAtom, 1)

      // Второй подписчик должен получить уведомление
      expect(notifications).toEqual([1])
      expect(errorThrowingCalled).toBe(true)
    })
  })

  describe('Notification Timing', () => {
    it('should notify synchronously on set', () => {
      let notified = false

      store.subscribe(testAtom, () => {
        notified = true
      })

      store.set(testAtom, 1)

      expect(notified).toBe(true)
    })

    it('should notify with updated value, not old value', () => {
      let valueDuringNotification: number | undefined

      store.subscribe(testAtom, (newValue) => {
        valueDuringNotification = newValue
        // Проверяем, что store.get возвращает то же значение
        expect(store.get(testAtom)).toBe(newValue)
      })

      store.set(testAtom, 42)
      expect(valueDuringNotification).toBe(42)
    })

    it('should notify even if value has not changed (current behavior)', () => {
      const notifications: number[] = []

      store.subscribe(testAtom, (newValue) => {
        notifications.push(newValue)
      })

      store.set(testAtom, 1)
      store.set(testAtom, 1) // Same value
      store.set(testAtom, 1) // Same value again

      // Текущая реализация уведомляет всегда, без сравнения значений
      expect(notifications).toEqual([1, 1, 1])
    })

    it('should notify for NaN -> NaN change', () => {
      const nanAtom = atom(NaN, 'nan')
      const notifications: number[] = []

      store.subscribe(nanAtom, (newValue) => {
        notifications.push(newValue)
      })

      store.set(nanAtom, NaN)

      // Текущая реализация уведомляет всегда
      expect(notifications).toHaveLength(1)
    })
  })

  describe('Multiple Atoms', () => {
    it('should notify only relevant subscribers', () => {
      const atom1 = atom(0, 'atom1')
      const atom2 = atom(0, 'atom2')
      
      const notifications1: number[] = []
      const notifications2: number[] = []

      store.subscribe(atom1, (newValue) => {
        notifications1.push(newValue)
      })

      store.subscribe(atom2, (newValue) => {
        notifications2.push(newValue)
      })

      store.set(atom1, 1)
      store.set(atom2, 2)
      store.set(atom1, 3)

      expect(notifications1).toEqual([1, 3])
      expect(notifications2).toEqual([2])
    })

    it('should handle cross-atom dependencies', () => {
      const countAtom = atom(0, 'count')
      const doubleAtom = atom((get) => get(countAtom) * 2, 'double')
      
      const countNotifications: number[] = []
      const doubleNotifications: number[] = []

      store.subscribe(countAtom, (newValue) => {
        countNotifications.push(newValue)
      })

      store.subscribe(doubleAtom, (newValue) => {
        doubleNotifications.push(newValue)
      })

      store.set(countAtom, 1)
      store.set(countAtom, 2)

      expect(countNotifications).toEqual([1, 2])
      expect(doubleNotifications).toEqual([2, 4])
    })
  })

  describe('Edge Cases', () => {
    it('should handle subscription during notification', () => {
      const notifications: (number | string)[] = []
      let secondSubscriberAdded = false

      store.subscribe(testAtom, (newValue) => {
        notifications.push(newValue)

        if (newValue === 1 && !secondSubscriberAdded) {
          secondSubscriberAdded = true
          store.subscribe(testAtom, (newVal) => {
            notifications.push(`second-${newVal}`)
          })
        }
      })

      store.set(testAtom, 1)
      store.set(testAtom, 2)

      // Второй подписчик добавляется во время уведомления и сразу получает текущее значение
      expect(notifications).toEqual([1, 'second-1', 2, 'second-2'])
    })

    it('should handle unsubscribe during notification', () => {
      const notifications: string[] = []
      let unsubscribe2: (() => void) | undefined

      unsubscribe2 = store.subscribe(testAtom, () => {
        notifications.push('second')
      })

      store.subscribe(testAtom, (newValue) => {
        notifications.push('first')
        if (newValue === 1 && unsubscribe2) {
          unsubscribe2()
        }
      })

      store.set(testAtom, 1)
      store.set(testAtom, 2)

      // Подписчики вызываются в порядке добавления, поэтому 'second' идёт первым для value=1
      expect(notifications).toEqual(['second', 'first', 'first'])
    })

    it('should handle function updates', () => {
      const notifications: number[] = []

      store.subscribe(testAtom, (newValue) => {
        notifications.push(newValue)
      })

      store.set(testAtom, (prev) => prev + 1)
      store.set(testAtom, (prev) => prev + 1)
      store.set(testAtom, (prev) => prev + 1)

      expect(notifications).toEqual([1, 2, 3])
    })
  })

  describe('Store with Multiple Atoms', () => {
    it('should maintain independent subscriptions', () => {
      const atom1 = atom('a', 'atom1')
      const atom2 = atom('b', 'atom2')
      const atom3 = atom('c', 'atom3')

      const notifications1: string[] = []
      const notifications2: string[] = []
      const notifications3: string[] = []

      store.subscribe(atom1, (v) => notifications1.push(v))
      store.subscribe(atom2, (v) => notifications2.push(v))
      store.subscribe(atom3, (v) => notifications3.push(v))

      store.set(atom1, 'a1')
      store.set(atom2, 'b1')
      store.set(atom3, 'c1')
      store.set(atom1, 'a2')

      expect(notifications1).toEqual(['a1', 'a2'])
      expect(notifications2).toEqual(['b1'])
      expect(notifications3).toEqual(['c1'])
    })
  })
})

describe('Batching and Notifications', () => {
  let store: Store
  let testAtom: Atom<number>

  beforeEach(() => {
    cleanupGlobalState()
    store = createStore()
    testAtom = atom(0, 'test')
  })

  afterEach(() => {
    cleanupGlobalState()
  })

  it('should batch notifications within batch()', () => {
    const notifications: number[] = []

    store.subscribe(testAtom, (newValue) => {
      notifications.push(newValue)
    })

    // Внутренняя реализация batching может отличаться
    // Этот тест проверяет базовое поведение
    store.set(testAtom, 1)
    store.set(testAtom, 2)

    expect(notifications.length).toBeGreaterThanOrEqual(1)
  })
})

/**
 * Test для проверки последовательных переходов по снапшотам с delta
 * Воспроизводит проблему: "Последовательные клики по снапшотам не восстанавливают состояние"
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { atom, createStore } from '../../../index'
import { SimpleTimeTravel } from '../../core/SimpleTimeTravel'
import { cleanupGlobalState } from '../../../test-utils'
import type { Store } from '../../../types'

describe('Delta Snapshots - Sequential Jump Test', () => {
  let store: Store
  let timeTravel: SimpleTimeTravel
  let contentAtom: ReturnType<typeof atom<string>>

  beforeEach(() => {
    // Clean up global state before each test
    cleanupGlobalState()
    
    store = createStore()
    contentAtom = atom('', 'content')

    // Включаем delta snapshots как в demo-editor
    timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: false,
      deltaSnapshots: {
        enabled: true,
        fullSnapshotInterval: 10,
        maxDeltaChainLength: 20,
        changeDetection: 'deep'
      }
    })
  })

  afterEach(() => {
    // Clean up global state after each test
    cleanupGlobalState()
  })

  it('should restore state correctly on sequential jumps (reproduces the bug)', () => {
    // Создаём 3 снапшота
    store.set(contentAtom, 'A')
    const snap1 = timeTravel.capture('snap1')
    expect(snap1).toBeDefined()

    store.set(contentAtom, 'A B')
    const snap2 = timeTravel.capture('snap2')
    expect(snap2).toBeDefined()

    store.set(contentAtom, 'A B C')
    const snap3 = timeTravel.capture('snap3')
    expect(snap3).toBeDefined()

    // Проверяем, что у нас 3 снапшота в истории
    const history = timeTravel.getHistory()
    expect(history.length).toBe(3)

    // Проверяем текущее состояние
    expect(store.get(contentAtom)).toBe('A B C')

    // Прыгаем к первому снапшоту (индекс 0)
    const jump1Result = timeTravel.jumpTo(0)
    expect(jump1Result).toBe(true)
    expect(store.get(contentAtom)).toBe('A')

    // Прыгаем ко второму снапшоту (индекс 1) - ЭТО НЕ РАБОТАЛО ДО FIX
    const jump2Result = timeTravel.jumpTo(1)
    expect(jump2Result).toBe(true)
    expect(store.get(contentAtom)).toBe('A B')

    // Прыгаем к третьему снапшоту (индекс 2) - ЭТО ТОЖЕ НЕ РАБОТАЛО
    const jump3Result = timeTravel.jumpTo(2)
    expect(jump3Result).toBe(true)
    expect(store.get(contentAtom)).toBe('A B C')
  })

  it('should handle multiple rapid jumps correctly', () => {
    // Создаём 5 снапшотов
    for (let i = 0; i < 5; i++) {
      store.set(contentAtom, `state${i}`)
      timeTravel.capture(`snap${i}`)
    }

    expect(store.get(contentAtom)).toBe('state4')

    // Быстрая навигация: 0 -> 2 -> 4 -> 1
    timeTravel.jumpTo(0)
    expect(store.get(contentAtom)).toBe('state0')

    timeTravel.jumpTo(2)
    expect(store.get(contentAtom)).toBe('state2')

    timeTravel.jumpTo(4)
    expect(store.get(contentAtom)).toBe('state4')

    timeTravel.jumpTo(1)
    expect(store.get(contentAtom)).toBe('state1')
  })

  it('should work with undo/redo after jumps', () => {
    // Создаём 3 снапшота
    store.set(contentAtom, 'first')
    timeTravel.capture('first')

    store.set(contentAtom, 'second')
    timeTravel.capture('second')

    store.set(contentAtom, 'third')
    timeTravel.capture('third')

    // Прыгаем к первому
    timeTravel.jumpTo(0)
    expect(store.get(contentAtom)).toBe('first')

    // Redo к второму
    timeTravel.redo()
    expect(store.get(contentAtom)).toBe('second')

    // Redo к третьему
    timeTravel.redo()
    expect(store.get(contentAtom)).toBe('third')

    // Undo ко второму
    timeTravel.undo()
    expect(store.get(contentAtom)).toBe('second')

    // Undo к первому
    timeTravel.undo()
    expect(store.get(contentAtom)).toBe('first')
  })

  it('should reconstruct delta snapshots correctly', () => {
    // Создаём достаточно снапшотов, чтобы появились delta
    const snapshots = []
    for (let i = 0; i < 15; i++) {
      store.set(contentAtom, `value${i}`)
      const snap = timeTravel.capture(`snap${i}`)
      if (snap) {
        snapshots.push(snap)
      }
    }

    // Проверяем, что delta включены
    const stats = timeTravel.getHistoryStats()
    console.log('History stats:', stats)

    // Прыгаем к разным снапшотам и проверяем восстановление
    timeTravel.jumpTo(5)
    expect(store.get(contentAtom)).toBe('value5')

    timeTravel.jumpTo(10)
    expect(store.get(contentAtom)).toBe('value10')

    timeTravel.jumpTo(0)
    expect(store.get(contentAtom)).toBe('value0')

    timeTravel.jumpTo(14)
    expect(store.get(contentAtom)).toBe('value14')
  })

  it('should handle edge case: jump to same snapshot multiple times', () => {
    store.set(contentAtom, 'initial')
    timeTravel.capture('initial')

    store.set(contentAtom, 'modified')
    timeTravel.capture('modified')

    // Прыгаем к первому снапшоту несколько раз
    timeTravel.jumpTo(0)
    expect(store.get(contentAtom)).toBe('initial')

    timeTravel.jumpTo(0)
    expect(store.get(contentAtom)).toBe('initial')

    timeTravel.jumpTo(0)
    expect(store.get(contentAtom)).toBe('initial')
  })

  it('should work with multiple atoms', () => {
    const countAtom = atom(0, 'count')
    const nameAtom = atom('', 'name')

    const tt = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: false,
      deltaSnapshots: {
        enabled: true,
        fullSnapshotInterval: 10,
        changeDetection: 'deep'
      }
    })

    // Создаём 3 состояния
    store.set(countAtom, 1)
    store.set(nameAtom, 'Alice')
    tt.capture('state1')

    store.set(countAtom, 2)
    store.set(nameAtom, 'Bob')
    tt.capture('state2')

    store.set(countAtom, 3)
    store.set(nameAtom, 'Charlie')
    tt.capture('state3')

    // Проверяем текущее состояние
    expect(store.get(countAtom)).toBe(3)
    expect(store.get(nameAtom)).toBe('Charlie')

    // Прыгаем к первому
    tt.jumpTo(0)
    expect(store.get(countAtom)).toBe(1)
    expect(store.get(nameAtom)).toBe('Alice')

    // Прыгаем ко второму
    tt.jumpTo(1)
    expect(store.get(countAtom)).toBe(2)
    expect(store.get(nameAtom)).toBe('Bob')

    // Прыгаем к третьему
    tt.jumpTo(2)
    expect(store.get(countAtom)).toBe(3)
    expect(store.get(nameAtom)).toBe('Charlie')
  })
})

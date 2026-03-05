/**
 * Test с 3 snapshot'ами как passing test, но с разными значениями
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { atom, createStore } from '../../../index'
import { SimpleTimeTravel } from '../../core/SimpleTimeTravel'
import { cleanupGlobalState } from '../../../test-utils'
import type { Store } from '../../../types'

describe('Delta 3 Snapshots Different Values', () => {
  let store: Store
  let timeTravel: SimpleTimeTravel
  let contentAtom: ReturnType<typeof atom<string>>

  beforeEach(() => {
    // Clean up global state before each test
    cleanupGlobalState()
    
    store = createStore()
    contentAtom = atom('', 'content')

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

  it('should work with 3 different values', () => {
    // 3 snapshot'а с ПОЛНОСТЬЮ РАЗНЫМИ значениями
    store.set(contentAtom, 'first')
    timeTravel.capture('first')

    store.set(contentAtom, 'second')
    timeTravel.capture('second')

    store.set(contentAtom, 'third')
    timeTravel.capture('third')

    // Проверяем jump
    const r0 = timeTravel.jumpTo(0)
    expect(r0).toBe(true)
    expect(store.get(contentAtom)).toBe('first')
    
    const r1 = timeTravel.jumpTo(1)
    expect(r1).toBe(true)
    expect(store.get(contentAtom)).toBe('second')
    
    const r2 = timeTravel.jumpTo(2)
    expect(r2).toBe(true)
    expect(store.get(contentAtom)).toBe('third')
  })

  it('should work with 4 different values without delta', () => {
    // Создаём НОВЫЙ timeTravel без delta
    const store2 = createStore()
    const contentAtom2 = atom('', 'content2')
    const tt2 = new SimpleTimeTravel(store2, {
      maxHistory: 100,
      autoCapture: false,
      deltaSnapshots: {
        enabled: false  // Отключаем delta
      }
    })

    // 4 snapshot'а
    store2.set(contentAtom2, 'one')
    tt2.capture('one')

    store2.set(contentAtom2, 'two')
    tt2.capture('two')

    store2.set(contentAtom2, 'three')
    tt2.capture('three')

    store2.set(contentAtom2, 'four')
    tt2.capture('four')

    const r0 = tt2.jumpTo(0)
    expect(r0).toBe(true)
    expect(store2.get(contentAtom2)).toBe('one')
    
    const r2 = tt2.jumpTo(2)
    expect(r2).toBe(true)
    expect(store2.get(contentAtom2)).toBe('three')
    
    const r3 = tt2.jumpTo(3)
    expect(r3).toBe(true)
    expect(store2.get(contentAtom2)).toBe('four')
    
    const r1 = tt2.jumpTo(1)
    expect(r1).toBe(true)
    expect(store2.get(contentAtom2)).toBe('two')
  })

  it('should work with 4 different values', () => {
    // 4 snapshot'а
    store.set(contentAtom, 'one')
    timeTravel.capture('one')

    store.set(contentAtom, 'two')
    timeTravel.capture('two')

    store.set(contentAtom, 'three')
    timeTravel.capture('three')

    store.set(contentAtom, 'four')
    timeTravel.capture('four')

    const r0 = timeTravel.jumpTo(0)
    expect(r0).toBe(true)
    expect(store.get(contentAtom)).toBe('one')

    const r2 = timeTravel.jumpTo(2)
    expect(r2).toBe(true)
    expect(store.get(contentAtom)).toBe('three')

    const r3 = timeTravel.jumpTo(3)
    expect(r3).toBe(true)
    expect(store.get(contentAtom)).toBe('four')

    const r1 = timeTravel.jumpTo(1)
    expect(r1).toBe(true)
    expect(store.get(contentAtom)).toBe('two')
  })
})

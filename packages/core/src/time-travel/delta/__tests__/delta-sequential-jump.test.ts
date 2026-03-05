/**
 * Test for checking sequential jumps through snapshots with delta
 * Reproduces the issue: "Sequential snapshot clicks do not restore state"
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

    // Enable delta snapshots like in demo-editor
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
    // Create 3 snapshots
    store.set(contentAtom, 'A')
    const snap1 = timeTravel.capture('snap1')
    expect(snap1).toBeDefined()

    store.set(contentAtom, 'A B')
    const snap2 = timeTravel.capture('snap2')
    expect(snap2).toBeDefined()

    store.set(contentAtom, 'A B C')
    const snap3 = timeTravel.capture('snap3')
    expect(snap3).toBeDefined()

    // Check that we have 3 snapshots in history
    const history = timeTravel.getHistory()
    expect(history.length).toBe(3)

    // Check current state
    expect(store.get(contentAtom)).toBe('A B C')

    // Jump to first snapshot (index 0)
    const jump1Result = timeTravel.jumpTo(0)
    expect(jump1Result).toBe(true)
    expect(store.get(contentAtom)).toBe('A')

    // Jump to second snapshot (index 1) - THIS DIDN'T WORK BEFORE FIX
    const jump2Result = timeTravel.jumpTo(1)
    expect(jump2Result).toBe(true)
    expect(store.get(contentAtom)).toBe('A B')

    // Jump to third snapshot (index 2) - THIS ALSO DIDN'T WORK BEFORE
    const jump3Result = timeTravel.jumpTo(2)
    expect(jump3Result).toBe(true)
    expect(store.get(contentAtom)).toBe('A B C')
  })

  it('should handle multiple rapid jumps correctly', () => {
    // Create 5 snapshots
    for (let i = 0; i < 5; i++) {
      store.set(contentAtom, `state${i}`)
      timeTravel.capture(`snap${i}`)
    }

    expect(store.get(contentAtom)).toBe('state4')

    // Quick navigation: 0 -> 2 -> 4 -> 1
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
    // Create 3 snapshots
    store.set(contentAtom, 'first')
    timeTravel.capture('first')

    store.set(contentAtom, 'second')
    timeTravel.capture('second')

    store.set(contentAtom, 'third')
    timeTravel.capture('third')

    // Jump to first
    timeTravel.jumpTo(0)
    expect(store.get(contentAtom)).toBe('first')

    // Redo to second
    timeTravel.redo()
    expect(store.get(contentAtom)).toBe('second')

    // Redo to third
    timeTravel.redo()
    expect(store.get(contentAtom)).toBe('third')

    // Undo to second
    timeTravel.undo()
    expect(store.get(contentAtom)).toBe('second')

    // Undo to first
    timeTravel.undo()
    expect(store.get(contentAtom)).toBe('first')
  })

  it('should reconstruct delta snapshots correctly', () => {
    // Create enough snapshots to generate deltas
    const snapshots = []
    for (let i = 0; i < 15; i++) {
      store.set(contentAtom, `value${i}`)
      const snap = timeTravel.capture(`snap${i}`)
      if (snap) {
        snapshots.push(snap)
      }
    }

    // Check that delta is enabled
    const stats = timeTravel.getHistoryStats()
    console.log('History stats:', stats)

    // Jump to different snapshots and check restoration
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

    // Jump to first snapshot multiple times
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

    // Create 3 states
    store.set(countAtom, 1)
    store.set(nameAtom, 'Alice')
    tt.capture('state1')

    store.set(countAtom, 2)
    store.set(nameAtom, 'Bob')
    tt.capture('state2')

    store.set(countAtom, 3)
    store.set(nameAtom, 'Charlie')
    tt.capture('state3')

    // Check current state
    expect(store.get(countAtom)).toBe(3)
    expect(store.get(nameAtom)).toBe('Charlie')

    // Jump to first
    tt.jumpTo(0)
    expect(store.get(countAtom)).toBe(1)
    expect(store.get(nameAtom)).toBe('Alice')

    // Jump to second
    tt.jumpTo(1)
    expect(store.get(countAtom)).toBe(2)
    expect(store.get(nameAtom)).toBe('Bob')

    // Jump to third
    tt.jumpTo(2)
    expect(store.get(countAtom)).toBe(3)
    expect(store.get(nameAtom)).toBe('Charlie')
  })
})

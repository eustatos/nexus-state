/**
 * Basic test for checking jumpTo without delta snapshots
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { atom, createStore } from '../../index'
import { SimpleTimeTravel } from '../core/SimpleTimeTravel'
import type { Store } from '../../types'

describe('Basic JumpTo Test (no delta)', () => {
  let store: Store
  let timeTravel: SimpleTimeTravel
  let contentAtom: ReturnType<typeof atom<string>>

  beforeEach(() => {
    store = createStore()
    contentAtom = atom('', 'content')

    // Disable delta snapshots
    timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: false,
      deltaSnapshots: {
        enabled: false
      }
    })
  })

  it('should restore state correctly on sequential jumps (no delta)', () => {
    // Create 3 snapshots
    store.set(contentAtom, 'A')
    const snap1 = timeTravel.capture('snap1')
    expect(snap1).toBeDefined()
    console.log('Snap1 state:', snap1?.state)

    store.set(contentAtom, 'A B')
    const snap2 = timeTravel.capture('snap2')
    expect(snap2).toBeDefined()
    console.log('Snap2 state:', snap2?.state)

    store.set(contentAtom, 'A B C')
    const snap3 = timeTravel.capture('snap3')
    expect(snap3).toBeDefined()
    console.log('Snap3 state:', snap3?.state)

    // Check that we have 3 snapshots in history
    const history = timeTravel.getHistory()
    console.log('History length:', history.length)
    console.log('History:', history.map(h => ({ id: h.id, state: h.state })))
    expect(history.length).toBe(3)

    // Check current state
    console.log('Current before jump:', store.get(contentAtom))
    expect(store.get(contentAtom)).toBe('A B C')

    // Jump to first snapshot (index 0)
    console.log('\n--- Jumping to index 0 ---')
    const jump1Result = timeTravel.jumpTo(0)
    console.log('Jump result:', jump1Result)
    console.log('Current after jump to 0:', store.get(contentAtom))
    expect(jump1Result).toBe(true)
    expect(store.get(contentAtom)).toBe('A')

    // Jump to second snapshot (index 1)
    console.log('\n--- Jumping to index 1 ---')
    const jump2Result = timeTravel.jumpTo(1)
    console.log('Jump result:', jump2Result)
    console.log('Current after jump to 1:', store.get(contentAtom))
    expect(jump2Result).toBe(true)
    expect(store.get(contentAtom)).toBe('A B')

    // Jump to third snapshot (index 2)
    console.log('\n--- Jumping to index 2 ---')
    const jump3Result = timeTravel.jumpTo(2)
    console.log('Jump result:', jump3Result)
    console.log('Current after jump to 2:', store.get(contentAtom))
    expect(jump3Result).toBe(true)
    expect(store.get(contentAtom)).toBe('A B C')
  })
})

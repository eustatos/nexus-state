/**
 * Integration tests for SnapshotRestorer and React
 * Check that state restoration from snapshots correctly
 * notifies React components
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
      // Set initial value
      act(() => {
        store.set(contentAtom, 'initial')
      })

      // Create snapshot
      const snapshot1 = timeTravel.capture('initial')
      expect(snapshot1).toBeDefined()

      // Change value
      act(() => {
        store.set(contentAtom, 'modified')
      })

      // Check that React sees the changed value
      const { result } = renderHook(() => useAtomValue(contentAtom, store))
      expect(result.current).toBe('modified')

      // Restore from snapshot
      act(() => {
        timeTravel.jumpTo(0)
      })

      // React should receive notification about change
      expect(result.current).toBe('initial')
    })

    it('should handle multiple snapshot restorations', () => {
      // Create multiple snapshots
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

      // Subscribe to value
      const { result } = renderHook(() => useAtomValue(contentAtom, store))
      expect(result.current).toBe('state3')

      // Jump to first snapshot
      act(() => {
        timeTravel.jumpTo(0)
      })
      expect(result.current).toBe('state1')

      // Jump to second snapshot
      act(() => {
        timeTravel.jumpTo(1)
      })
      expect(result.current).toBe('state2')

      // Jump to third snapshot
      act(() => {
        timeTravel.jumpTo(2)
      })
      expect(result.current).toBe('state3')
    })

    it('should notify after undo', () => {
      // Create snapshots
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

      // Undo
      act(() => {
        timeTravel.undo()
      })

      expect(result.current).toBe('first')
    })

    it('should notify after redo', () => {
      // Create snapshots
      act(() => {
        store.set(contentAtom, 'first')
      })
      timeTravel.capture('first')

      act(() => {
        store.set(contentAtom, 'second')
      })
      timeTravel.capture('second')

      const { result } = renderHook(() => useAtomValue(contentAtom, store))

      // Undo
      act(() => {
        timeTravel.undo()
      })
      expect(result.current).toBe('first')

      // Redo
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

      // Set values
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

      // Subscribe to both atoms
      const { result } = renderHook(() => ({
        count: useAtomValue(countAtom, store),
        name: useAtomValue(nameAtom, store)
      }))

      expect(result.current).toEqual({ count: 2, name: 'Bob' })

      // Restore first state
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

      // Set values
      act(() => {
        store.set(countAtom, 1)
        store.set(nameAtom, 'Alice')
      })
      timeTravelMulti.capture('state1')

      // Change only count
      act(() => {
        store.set(countAtom, 2)
      })
      timeTravelMulti.capture('state2')

      const { result } = renderHook(() => ({
        count: useAtomValue(countAtom, store),
        name: useAtomValue(nameAtom, store)
      }))

      // Restore first state
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

      // Restore
      act(() => {
        timeTravel.jumpTo(0)
      })
      expect(result.current).toBe('initial')

      // Update after restoration
      act(() => {
        setContent.current('after-restore')
      })
      expect(result.current).toBe('after-restore')
    })
  })

  describe('Concurrent Updates', () => {
    it('should handle rapid snapshot navigation', () => {
      // Create multiple snapshots
      for (let i = 0; i < 5; i++) {
        act(() => {
          store.set(contentAtom, `state${i}`)
        })
        timeTravel.capture(`state${i}`)
      }

      const { result } = renderHook(() => useAtomValue(contentAtom, store))
      expect(result.current).toBe('state4')

      // Quick navigation
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

/**
 * Test for store subscription during time-travel
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import { editorStore } from '@/store/store'
import { editorTimeTravel } from '@/store/timeTravel'
import { contentAtom } from '@/store/atoms/editor'

describe('Store Subscription During Time-Travel', () => {
  beforeEach(() => {
    editorTimeTravel.clearHistory()
    act(() => {
      editorStore.set(contentAtom, '')
    })
  })

  afterEach(() => {
    editorTimeTravel.dispose()
  })

  it('should notify store subscribers on jumpTo', async () => {
    let notificationReceived = false
    let notifiedValue: string | null = null

    // Subscribe to contentAtom changes
    const unsubscribe = editorStore.subscribe(contentAtom, (value) => {
      console.log('[TEST] Store subscriber called with:', value)
      notificationReceived = true
      notifiedValue = value
    })

    try {
      // Set initial value and capture
      await act(async () => {
        editorStore.set(contentAtom, 'Initial')
      })
      editorTimeTravel.capture('initial')

      // Change value
      await act(async () => {
        editorStore.set(contentAtom, 'Modified')
      })

      // Wait for batching to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      // Reset flags
      notificationReceived = false
      notifiedValue = null

      // Jump to snapshot
      await act(async () => {
        const result = editorTimeTravel.jumpTo(0)
        console.log('[TEST] jumpTo result:', result)
      })

      // Wait for notification
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check if notification was received
      console.log('[TEST] notificationReceived:', notificationReceived)
      console.log('[TEST] notifiedValue:', notifiedValue)
      console.log('[TEST] store.get(contentAtom):', editorStore.get(contentAtom))

      expect(notificationReceived).toBe(true)
      expect(notifiedValue).toBe('Initial')
    } finally {
      unsubscribe()
    }
  })

  it('should update store.get after jumpTo', async () => {
    // Set initial value and capture
    await act(async () => {
      editorStore.set(contentAtom, 'Initial')
    })
    editorTimeTravel.capture('initial')

    // Change value
    await act(async () => {
      editorStore.set(contentAtom, 'Modified')
    })

    // Verify current value
    expect(editorStore.get(contentAtom)).toBe('Modified')

    // Jump to snapshot
    await act(async () => {
      editorTimeTravel.jumpTo(0)
    })

    // Check value after jump
    const valueAfterJump = editorStore.get(contentAtom)
    console.log('[TEST] Value after jump:', valueAfterJump)
    
    expect(valueAfterJump).toBe('Initial')
  })
})

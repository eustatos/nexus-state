/**
 * Integration tests for time-travel + editor integration
 * 
 * These tests reproduce the issue where editor content doesn't update
 * when jumping to snapshots.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { render, screen, fireEvent } from '@testing-library/react'
import { editorStore } from '@/store/store'
import { editorTimeTravel } from '@/store/timeTravel'
import { contentAtom, isDirtyAtom } from '@/store/atoms/editor'
import { useTimeTravel } from '@/hooks/useTimeTravel'
import { useSnapshots } from '@/hooks/useSnapshots'
import { SimpleEditor } from '@/components/Editor/SimpleEditor'
import { SnapshotList } from '@/components/Snapshots/SnapshotList'

describe('Time-Travel Editor Integration', () => {
  beforeEach(() => {
    // Clear history before each test
    editorTimeTravel.clearHistory()
    // Reset content atom
    act(() => {
      editorStore.set(contentAtom, '')
    })
  })

  afterEach(() => {
    editorTimeTravel.dispose()
  })

  describe('jumpTo + Editor Content', () => {
    it('should update editor content when jumping to snapshot', async () => {
      // Set initial content and capture snapshot
      const initialContent = 'Initial content'
      await act(async () => {
        editorStore.set(contentAtom, initialContent)
      })
      editorTimeTravel.capture('initial')

      // Change content
      const modifiedContent = 'Modified content'
      await act(async () => {
        editorStore.set(contentAtom, modifiedContent)
      })

      // Render editor and verify modified content
      const { rerender } = render(<SimpleEditor />)
      const textarea = screen.getByTestId('editor') as HTMLTextAreaElement
      expect(textarea.value).toBe(modifiedContent)

      // Jump to initial snapshot
      await act(async () => {
        const result = editorTimeTravel.jumpTo(0)
        console.log('[TEST] jumpTo(0) result:', result)
      })

      // Force re-render
      rerender(<SimpleEditor />)

      // Editor should show initial content after jump
      await waitFor(() => {
        const updatedTextarea = screen.getByTestId('editor') as HTMLTextAreaElement
        console.log('[TEST] Editor value after jump:', updatedTextarea.value)
        expect(updatedTextarea.value).toBe(initialContent)
      }, { timeout: 1000 })
    })

    it('should receive jump event in useTimeTravel hook', async () => {
      let jumpEventReceived = false

      // Subscribe to jump events
      const unsubscribe = editorTimeTravel.subscribe('jump', () => {
        console.log('[TEST] Jump event received in subscription')
        jumpEventReceived = true
      })

      try {
        // Create snapshot
        await act(async () => {
          editorStore.set(contentAtom, 'test')
        })
        editorTimeTravel.capture('test')

        // Change content
        await act(async () => {
          editorStore.set(contentAtom, 'changed')
        })

        // Jump to snapshot
        await act(async () => {
          editorTimeTravel.jumpTo(0)
        })

        // Verify event was received
        expect(jumpEventReceived).toBe(true)
      } finally {
        unsubscribe()
      }
    })

    it('should update useTimeTravel version on jump', async () => {
      // Create snapshot
      await act(async () => {
        editorStore.set(contentAtom, 'test')
      })
      editorTimeTravel.capture('test')

      // Change content
      await act(async () => {
        editorStore.set(contentAtom, 'changed')
      })

      // Render useTimeTravel hook
      const { result } = renderHook(() => useTimeTravel())

      const initialVersion = result.current.currentPosition

      // Jump to snapshot
      await act(async () => {
        result.current.jumpTo(0)
      })

      // Version should change
      expect(result.current.currentPosition).not.toBe(initialVersion)
    })

    it('should update useSnapshots on jump', async () => {
      // Create snapshot
      await act(async () => {
        editorStore.set(contentAtom, 'test')
      })
      editorTimeTravel.capture('test')

      // Change content
      await act(async () => {
        editorStore.set(contentAtom, 'changed')
      })

      // Render useSnapshots hook
      const { result, rerender } = renderHook(() => useSnapshots({ autoRefresh: true }))

      const initialIndex = result.current.currentIndex

      // Jump to snapshot
      await act(async () => {
        editorTimeTravel.jumpTo(0)
      })

      // Force re-render
      rerender()

      // Index should change
      await waitFor(() => {
        expect(result.current.currentIndex).not.toBe(initialIndex)
      }, { timeout: 1000 })
    })
  })

  describe('SnapshotList + Editor Integration', () => {
    it('should update editor when clicking snapshot in list', async () => {
      // Create multiple snapshots
      await act(async () => {
        editorStore.set(contentAtom, 'Snapshot 1')
      })
      editorTimeTravel.capture('snap1')

      await act(async () => {
        editorStore.set(contentAtom, 'Snapshot 2')
      })
      editorTimeTravel.capture('snap2')

      await act(async () => {
        editorStore.set(contentAtom, 'Snapshot 3')
      })

      // Render editor and snapshot list
      render(
        <div>
          <SimpleEditor />
          <SnapshotList showUndoRedo={false} showSearch={false} showFilter={false} />
        </div>
      )

      // Verify current content
      const textarea = screen.getByTestId('editor') as HTMLTextAreaElement
      expect(textarea.value).toBe('Snapshot 3')

      // Click on first snapshot in list
      const snapshotItems = screen.getAllByTestId('snapshot-item')
      fireEvent.click(snapshotItems[0])

      // Editor should update to snapshot 1 content
      await waitFor(() => {
        expect(textarea.value).toBe('Snapshot 1')
      }, { timeout: 1000 })
    })
  })

  describe('Undo/Redo + Editor Integration', () => {
    it('should update editor on undo', async () => {
      // Create snapshot
      await act(async () => {
        editorStore.set(contentAtom, 'Before')
      })
      editorTimeTravel.capture('before')

      // Change content
      await act(async () => {
        editorStore.set(contentAtom, 'After')
      })

      // Render editor
      render(<SimpleEditor />)
      const textarea = screen.getByTestId('editor') as HTMLTextAreaElement
      expect(textarea.value).toBe('After')

      // Undo
      await act(async () => {
        editorTimeTravel.undo()
      })

      // Editor should show previous content
      await waitFor(() => {
        expect(textarea.value).toBe('Before')
      }, { timeout: 1000 })
    })

    it('should update editor on redo', async () => {
      // Create snapshot
      await act(async () => {
        editorStore.set(contentAtom, 'Before')
      })
      editorTimeTravel.capture('before')

      // Change content
      await act(async () => {
        editorStore.set(contentAtom, 'After')
      })

      // Render editor
      render(<SimpleEditor />)
      const textarea = screen.getByTestId('editor') as HTMLTextAreaElement

      // Undo
      await act(async () => {
        editorTimeTravel.undo()
      })

      // Redo
      await act(async () => {
        editorTimeTravel.redo()
      })

      // Editor should show "After" content
      await waitFor(() => {
        expect(textarea.value).toBe('After')
      }, { timeout: 1000 })
    })
  })
})

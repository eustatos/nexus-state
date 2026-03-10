import { editorTimeTravel } from './timeTravel'
import { editorStore } from './store'
import { contentAtom } from './atoms/editor'
import type { Snapshot } from '@nexus-state/core'

/**
 * Metadata for time-travel snapshot
 */
export interface SnapshotMetadata {
  /** Action type */
  action?: 'text-edit' | 'paste' | 'delete' | 'bulk-edit' | 'manual-save' | 'initial'
  /** Delta changes */
  delta?: {
    added: number
    removed: number
    type: 'insert' | 'delete' | 'replace' | 'empty'
    netChange?: number
  }
  /** Snapshot creation trigger */
  trigger?: 'debounce' | 'maxWait' | 'manual'
  /** Additional information */
  [key: string]: any
}

/**
 * Extended snapshot with additional metadata
 */
export interface ExtendedSnapshot extends Snapshot {
  metadata: SnapshotMetadata & {
    timestamp: number
    action?: string
    atomCount: number
  }
}

/**
 * Delta check result for confirmation
 */
export interface DeltaThresholdCheck {
  /** Whether confirmation is required */
  requiresConfirmation: boolean
  /** Total number of changes */
  totalChanges: number
  /** Characters added */
  added: number
  /** Characters removed */
  removed: number
  /** Change type */
  changeType: 'minor' | 'moderate' | 'significant' | 'major'
}

/**
 * Threshold values for confirming large changes
 */
export const DELTA_THRESHOLDS = {
  /** Minor: less than 50 changes - no confirmation */
  minor: 50,
  /** Moderate: 50-200 changes - visual indication */
  moderate: 200,
  /** Significant: 200-500 changes - confirmation recommended */
  significant: 500,
  /** Major: more than 500 changes - confirmation required */
  major: Infinity
} as const

/**
 * Capture a state snapshot
 *
 * @param action - Action name for history
 * @returns Created snapshot or undefined if failed
 */
export function captureSnapshot(
  action: string = 'text-edit'
): ExtendedSnapshot | undefined {
  return editorTimeTravel.capture(action) as ExtendedSnapshot | undefined
}

/**
 * Check snapshot delta against threshold values
 *
 * @param snapshot - Snapshot to check
 * @returns Threshold check result
 */
export function checkDeltaThreshold(
  snapshot: ExtendedSnapshot
): DeltaThresholdCheck {
  const delta = snapshot.metadata.delta

  if (!delta) {
    return {
      requiresConfirmation: false,
      totalChanges: 0,
      added: 0,
      removed: 0,
      changeType: 'minor'
    }
  }

  const added = delta.added || 0
  const removed = delta.removed || 0
  const totalChanges = added + removed

  let changeType: DeltaThresholdCheck['changeType'] = 'minor'
  let requiresConfirmation = false

  if (totalChanges > DELTA_THRESHOLDS.significant) {
    changeType = 'major'
    requiresConfirmation = true
  } else if (totalChanges > DELTA_THRESHOLDS.minor) {
    changeType = totalChanges > DELTA_THRESHOLDS.moderate ? 'significant' : 'moderate'
  }

  return {
    requiresConfirmation,
    totalChanges,
    added,
    removed,
    changeType
  }
}

/**
 * Jump to a snapshot by index
 *
 * @param index - Snapshot index in history (0-based)
 * @param options - Jump options
 * @param options.skipConfirmation - Skip confirmation for large delta
 * @returns true if jump was successful
 */
export function jumpToSnapshot(
  index: number,
  options: { skipConfirmation?: boolean } = {}
): boolean {
  console.log('[jumpToSnapshot] called with index:', index)
  const history = getHistory()

  if (index < 0 || index >= history.length) {
    console.warn(`[jumpToSnapshot] Invalid index: ${index}, history length: ${history.length}`)
    return false
  }

  const snapshot = history[index] as ExtendedSnapshot
  console.log('[jumpToSnapshot] snapshot state:', snapshot.state)
  console.log('[jumpToSnapshot] snapshot state editor.content:', snapshot.state['editor.content'])

  // Check delta for large changes
  if (!options.skipConfirmation) {
    const deltaCheck = checkDeltaThreshold(snapshot)

    if (deltaCheck.requiresConfirmation) {
      const message = `Jumping to this snapshot will change ${deltaCheck.totalChanges} characters` +
        ` (+${deltaCheck.added}/-${deltaCheck.removed}). Continue?`

      if (!window.confirm(message)) {
        return false
      }
    }
  }

  console.log('[jumpToSnapshot] calling editorTimeTravel.jumpTo')
  const result = editorTimeTravel.jumpTo(index)
  console.log('[jumpToSnapshot] editorTimeTravel.jumpTo result:', result)

  // Check content immediately after jumpTo
  const currentValue = editorStore.get(contentAtom)
  console.log('[jumpToSnapshot] content after jumpTo:', currentValue)

  return result
}

/**
 * Undo the last change
 *
 * @returns true if undo was successful
 */
export function undo(): boolean {
  return editorTimeTravel.undo()
}

/**
 * Redo the undone change
 *
 * @returns true if redo was successful
 */
export function redo(): boolean {
  return editorTimeTravel.redo()
}

/**
 * Check if undo is available
 *
 * @returns true if there is something to undo
 */
export function canUndo(): boolean {
  return editorTimeTravel.canUndo()
}

/**
 * Check if redo is available
 *
 * @returns true if there is something to redo
 */
export function canRedo(): boolean {
  return editorTimeTravel.canRedo()
}

/**
 * Get snapshot history
 *
 * @returns Array of all snapshots
 */
export function getHistory(): Snapshot[] {
  return editorTimeTravel.getHistory()
}

/**
 * Clear snapshot history
 */
export function clearHistory(): void {
  editorTimeTravel.clearHistory()
}

/**
 * Get current snapshot (without adding to history)
 *
 * @returns Current snapshot or null
 */
export function getCurrentSnapshot(): Snapshot | null {
  return editorTimeTravel.getCurrentSnapshot() || null
}

/**
 * Get history statistics
 *
 * @returns History statistics
 */
export function getHistoryStats() {
  return editorTimeTravel.getHistoryStats()
}

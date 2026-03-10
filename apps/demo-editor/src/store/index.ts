/**
 * Store module for the editor application
 *
 * @packageDocumentation
 */

/**
 * Store instance
 */
export { editorStore } from './store'

/**
 * Time-travel configuration
 */
export { editorTimeTravel } from './timeTravel'

/**
 * Time-travel helper functions
 */
export {
  captureSnapshot,
  jumpToSnapshot,
  undo,
  redo,
  canUndo,
  canRedo,
  getHistory,
  clearHistory,
  getCurrentSnapshot,
  getHistoryStats
} from './helpers'
export type { SnapshotMetadata } from './helpers'

/**
 * Atoms
 */
export * from './atoms'

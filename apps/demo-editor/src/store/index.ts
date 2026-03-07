/**
 * Store module для приложения редактора
 * 
 * @packageDocumentation
 */

/**
 * Store instance
 */
export { editorStore } from './store'

/**
 * Time-travel конфигурация
 */
export { editorTimeTravel } from './timeTravel'

/**
 * Хелперы для работы с time-travel
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
 * Атомы
 */
export * from './atoms'

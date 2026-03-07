/**
 * Атомы редактора
 */
export {
  contentAtom,
  cursorAtom,
  selectionAtom,
  isDirtyAtom,
  lastSavedAtom
} from './editor'

/**
 * Статистика редактора
 */
export { statsAtom } from './stats'
export type { EditorStats } from './stats'

/**
 * Атомы навигации
 */
export {
  currentPositionAtom,
  snapshotsCountAtom,
  canUndoAtom,
  canRedoAtom
} from './navigation'

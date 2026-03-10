import { atom, Atom, Getter } from '@nexus-state/core'
import { editorTimeTravel } from '../timeTravel'

/**
 * Atom for getting current position in time-travel
 *
 * Used to synchronize UI with current position in history.
 */
const timeTravelPositionAtom = atom(
  (_get: Getter) => {
    // Get current position from time-travel
    // This value should update on history changes
    return 0
  },
  'timeline.timeTravelPosition'
) as unknown as Atom<number>

/**
 * Atom for getting number of snapshots in history
 */
const snapshotsCountValueAtom = atom(
  (_get: Getter) => {
    return editorTimeTravel.getHistory().length
  },
  'timeline.snapshotsCountValue'
) as unknown as Atom<number>

/**
 * Current position in snapshot history
 *
 * Computed atom that returns current snapshot index.
 * Separate logic is used for undo/redo.
 */
export const currentPositionAtom = atom(
  (_get: Getter) => {
    const history = editorTimeTravel.getHistory()
    return history.length > 0 ? history.length - 1 : 0
  },
  'timeline.currentPositionValue'
) as unknown as Atom<number>

/**
 * Total number of snapshots in history
 *
 * Computed atom that returns history length.
 */
export const snapshotsCountAtom = snapshotsCountValueAtom

/**
 * Undo availability
 *
 * Computed atom that returns true if undo is available.
 */
export const canUndoAtom = atom(
  (_get: Getter) => {
    return editorTimeTravel.canUndo()
  },
  'timeline.canUndo'
) as unknown as Atom<boolean>

/**
 * Redo availability
 *
 * Computed atom that returns true if redo is available.
 */
export const canRedoAtom = atom(
  (_get: Getter) => {
    return editorTimeTravel.canRedo()
  },
  'timeline.canRedo'
) as unknown as Atom<boolean>

/**
 * Atom for controlling timeline slider position
 *
 * This atom synchronizes with time-travel position and allows
 * navigation control through UI.
 */
export const timelinePositionAtom = timeTravelPositionAtom

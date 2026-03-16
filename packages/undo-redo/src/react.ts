// React hook for undo/redo functionality
// This is a placeholder - the actual implementation would be in a separate react package

/**
 * Options for useUndoRedo hook
 */
export interface UseUndoRedoOptions {
  /** Initial state to push on mount */
  initialState?: unknown;
  /** Action name for initial state */
  initialAction?: string;
}

/**
 * Result of useUndoRedo hook
 */
export interface UseUndoRedoResult<T> {
  /** Undo function */
  undo: () => void;
  /** Redo function */
  redo: () => void;
  /** Can undo flag */
  canUndo: boolean;
  /** Can redo flag */
  canRedo: boolean;
  /** Current state */
  currentState: T | undefined;
  /** History length */
  historyLength: number;
  /** Position in history */
  position: number;
  /** Get full history */
  getHistory: () => Array<{ state: T; metadata: { timestamp: number; action?: string } }>;
}

/**
 * React hook for undo/redo functionality
 * 
 * @param _undoRedoManager The undo/redo manager instance
 * @param _options Hook options
 * @returns Undo/redo result object
 * 
 * @example
 * ```typescript
 * import { createUndoRedo } from '@nexus-state/undo-redo';
 * import { useUndoRedo } from '@nexus-state/undo-redo/react';
 * 
 * const undoRedo = createUndoRedo<string>();
 * 
 * function MyComponent() {
 *   const { undo, redo, canUndo, canRedo, currentState } = useUndoRedo(undoRedo);
 * 
 *   return (
 *     <div>
 *       <button onClick={undo} disabled={!canUndo}>Undo</button>
 *       <button onClick={redo} disabled={!canRedo}>Redo</button>
 *       <div>Current: {currentState}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUndoRedo<T>(
  _undoRedoManager: unknown,
  _options: UseUndoRedoOptions = {}
): UseUndoRedoResult<T> {
  // This would be implemented in the react package
  // using React hooks
  console.warn('useUndoRedo: Not implemented in base package');
  return {
    undo: () => undefined,
    redo: () => undefined,
    canUndo: false,
    canRedo: false,
    currentState: undefined,
    historyLength: 0,
    position: 0,
    getHistory: () => [],
  };
}

/**
 * Create a custom hook for a specific undo/redo manager
 * 
 * @param undoRedoManager The undo/redo manager instance
 * @returns Custom hook function
 */
export function createUseUndoRedo<T>(
  undoRedoManager: unknown
): (options?: UseUndoRedoOptions) => UseUndoRedoResult<T> {
  return (options?: UseUndoRedoOptions) => useUndoRedo(undoRedoManager, options);
}

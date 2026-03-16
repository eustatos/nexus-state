import { UndoRedoManager } from './UndoRedoManager';
import type { UndoRedoOptions, HistoryEntryMetadata } from './types';

/**
 * Create a new undo/redo manager
 * 
 * @param options Configuration options
 * @returns UndoRedoManager instance
 * 
 * @example
 * ```typescript
 * const undoRedo = createUndoRedo<string>({
 *   maxLength: 50,
 *   debounce: 300,
 *   ignoreFields: ['timestamp'],
 * });
 * 
 * undoRedo.push('state1');
 * undoRedo.undo();
 * undoRedo.redo();
 * ```
 */
export function createUndoRedo<T>(options: UndoRedoOptions<T> = {}): UndoRedoManager<T> {
  return new UndoRedoManager<T>(options);
}

// Re-export types for convenience
export type {
  UndoRedoOptions,
  HistoryEntryMetadata,
  UndoRedoEvent,
  UndoRedoListener,
  UndoRedoStats,
  KeyboardOptions,
} from './types';

// Re-export classes
export { UndoRedoManager };
export { UndoRedoStack } from './UndoRedoStack';

// Re-export integration
export { withUndoRedo } from './integration';
export type { WithUndoRedoOptions } from './integration';

// Re-export react
export { useUndoRedo, createUseUndoRedo } from './react';
export type { UseUndoRedoOptions, UseUndoRedoResult } from './react';

// ============================================================================
// Base types for @nexus-state/undo-redo
// ============================================================================

/**
 * Metadata for a history entry
 */
export interface HistoryEntryMetadata {
  /** Optional action name */
  action?: string;
  /** Timestamp when entry was created */
  timestamp: number;
  /** Optional custom data */
  [key: string]: unknown;
}

/**
 * History entry containing state and metadata
 */
export interface HistoryEntry<T> {
  /** State snapshot */
  state: T;
  /** Entry metadata */
  metadata: HistoryEntryMetadata;
}

/**
 * Undo/Redo options
 */
export interface UndoRedoOptions<T = unknown> {
  /** Maximum length of history (default: 50) */
  maxLength?: number;
  /** Debounce time in ms (default: 0) */
  debounce?: number;
  /** Fields to ignore when comparing states */
  ignoreFields?: (keyof T)[];
  /** Custom equality function */
  areEqual?: (a: T, b: T) => boolean;
}

/**
 * Undo/Redo events
 */
export type UndoRedoEvent = 'push' | 'undo' | 'redo' | 'clear' | 'change';

/**
 * Event listener function
 */
export type UndoRedoListener<T> = (state: T | undefined, metadata?: HistoryEntryMetadata) => void;

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardOptions {
  /** Undo shortcuts (default: ['ctrl+z', 'meta+z']) */
  undo?: string[];
  /** Redo shortcuts (default: ['ctrl+y', 'meta+shift+z', 'ctrl+shift+z']) */
  redo?: string[];
}

/**
 * Statistics about the undo/redo history
 */
export interface UndoRedoStats {
  /** Current history length */
  historyLength: number;
  /** Current position in history */
  position: number;
  /** Maximum history length */
  maxLength: number;
  /** Can undo */
  canUndo: boolean;
  /** Can redo */
  canRedo: boolean;
}

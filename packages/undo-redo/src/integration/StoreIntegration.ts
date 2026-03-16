import type { UndoRedoManager, UndoRedoOptions, HistoryEntryMetadata } from '../index';
import { createUndoRedo } from '../index';

/**
 * Options for withUndoRedo integration
 */
export interface WithUndoRedoOptions extends UndoRedoOptions {
  /** Array of atom names to ignore */
  ignoreAtoms?: string[];
  /** Function to determine if an atom should be ignored */
  shouldIgnoreAtom?: (atom: { name?: string }) => boolean;
}

/**
 * Store state wrapper for undo/redo integration
 */
interface StoreStateWrapper {
  /** State object */
  state: Record<string, unknown>;
  /** Metadata about the state */
  metadata: {
    timestamp: number;
    action?: string;
  };
}

/**
 * Store interface for integration
 */
interface StoreLike {
  getState(): Record<string, unknown>;
  subscribe(listener: () => void): () => void;
}

/**
 * Get the current state from a store
 * @param store The store to get state from
 * @returns The current state
 */
function getStoreState(store: StoreLike): Record<string, unknown> {
  return store.getState();
}

/**
 * Restore state to a store
 * @param _store The store to restore state to
 * @param _state The state to restore
 */
function restoreStoreState(_store: StoreLike, _state: Record<string, unknown>): void {
  // This would need to be implemented based on the store's API
  // For now, we'll use a placeholder
  console.warn('restoreStoreState not implemented');
}

/**
 * Create an undo/redo manager integrated with a store
 * 
 * @param store The store to integrate with
 * @param options Configuration options
 * @returns UndoRedoManager configured for store operations
 * 
 * @example
 * ```typescript
 * import { createStore } from '@nexus-state/core';
 * import { withUndoRedo } from '@nexus-state/undo-redo';
 * 
 * const store = createStore();
 * const undoRedo = withUndoRedo(store, {
 *   maxLength: 50,
 *   ignoreAtoms: ['tempData', 'loadingState'],
 * });
 * 
 * // Use the store
 * store.set(myAtom, newValue);
 * 
 * // Undo/Redo
 * undoRedo.undo();
 * undoRedo.redo();
 * ```
 */
export function withUndoRedo<T = Record<string, unknown>>(
  store: StoreLike,
  options: WithUndoRedoOptions = {}
): UndoRedoManager<T> {
  const {
    ignoreAtoms = [],
    shouldIgnoreAtom,
    maxLength = 50,
    debounce = 0,
    ignoreFields = [],
    areEqual,
  } = options;

  // Create base undo/redo manager
  const undoRedo = createUndoRedo<T>({
    maxLength,
    debounce,
    ignoreFields: ignoreFields as (keyof T)[],
    areEqual,
  });

  // Store the initial state
  let initialState: T = getStoreState(store) as T;
  undoRedo.push(initialState, { action: 'init', timestamp: Date.now() });

  // Track atoms to ignore
  const ignoredAtomNames = new Set(ignoreAtoms);

  // Helper to check if atom should be ignored
  const isIgnoredAtom = (atom: { name?: string }): boolean => {
    if (ignoredAtomNames.has(atom.name || '')) {
      return true;
    }
    if (shouldIgnoreAtom?.(atom)) {
      return true;
    }
    return false;
  };

  // Subscribe to store changes
  const unsubscribe = store.subscribe(
    // We need a way to subscribe to all changes
    // This is a limitation - need to think about how to implement this
    // For now, we'll use a manual capture approach
    () => {}
  );

  // Override push to capture store state
  const originalPush = undoRedo.push.bind(undoRedo);
  undoRedo.push = (state: T, metadata?: HistoryEntryMetadata): void => {
    // Filter out ignored fields if provided
    if (ignoreFields.length > 0 && typeof state === 'object' && state !== null) {
      const filteredState = { ...state };
      for (const field of ignoreFields) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (filteredState as any)[field];
      }
      originalPush(filteredState as T, metadata);
    } else {
      originalPush(state, metadata);
    }
  };

  // Add helper methods
  const undoRedoWithStore = {
    ...undoRedo,

    /**
     * Capture the current store state
     * @param action Optional action name
     */
    capture(action?: string): T | undefined {
      const currentState = getStoreState(store) as T;
      undoRedo.push(currentState, { action, timestamp: Date.now() });
      return currentState;
    },

    /**
     * Undo and restore store state
     */
    undoAndRestore(): T | undefined {
      const previousState = undoRedo.undo();
      if (previousState !== undefined) {
        restoreStoreState(store, previousState as Record<string, unknown>);
      }
      return previousState;
    },

    /**
     * Redo and restore store state
     */
    redoAndRestore(): T | undefined {
      const nextState = undoRedo.redo();
      if (nextState !== undefined) {
        restoreStoreState(store, nextState as Record<string, unknown>);
      }
      return nextState;
    },

    /**
     * Check if an atom is being ignored
     * @param atom The atom to check
     */
    isIgnoredAtom(atom: { name?: string }): boolean {
      return isIgnoredAtom(atom);
    },

    /**
     * Get the list of ignored atom names
     */
    getIgnoredAtomNames(): string[] {
      return Array.from(ignoredAtomNames);
    },
  };

  return undoRedoWithStore as unknown as UndoRedoManager<T>;
}

/**
 * Create a hook-like function for React (placeholder)
 * This would be implemented in the react sub-package
 */
export function createUseUndoRedo() {
  // This would be implemented in the react package
  // using React hooks
  console.warn('createUseUndoRedo: Not implemented in base package');
  return () => ({
    undo: () => undefined,
    redo: () => undefined,
    canUndo: false,
    canRedo: false,
  });
}

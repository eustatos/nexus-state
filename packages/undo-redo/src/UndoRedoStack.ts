import type { HistoryEntry, HistoryEntryMetadata } from './types';

/**
 * UndoRedoStack - Basic stack-based history management
 * 
 * Provides LIFO (Last In, First Out) history with undo/redo capabilities.
 * 
 * @example
 * ```typescript
 * const stack = new UndoRedoStack<string>(5);
 * stack.push('state1');
 * stack.push('state2');
 * 
 * stack.canUndo(); // true
 * stack.canRedo(); // false
 * 
 * const undoState = stack.undo(); // 'state2'
 * stack.canRedo(); // true
 * 
 * const redoState = stack.redo(); // 'state2'
 * ```
 */
export class UndoRedoStack<T> {
  private history: HistoryEntry<T>[] = [];
  private currentIndex: number = -1;
  private maxLength: number;

  /**
   * Create a new UndoRedoStack
   * @param maxLength Maximum number of history entries (default: 50)
   */
  constructor(maxLength: number = 50) {
    this.maxLength = Math.max(1, maxLength);
  }

  /**
   * Get the current history length
   */
  get length(): number {
    return this.history.length;
  }

  /**
   * Get the current position in history
   */
  get position(): number {
    return this.currentIndex;
  }

  /**
   * Get the maximum history length
   */
  get maxHistory(): number {
    return this.maxLength;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get the current state (top of undo stack)
   */
  getCurrent(): T | undefined {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex].state;
    }
    return undefined;
  }

  /**
   * Push a new state onto the history
   * @param state State to push
   * @param metadata Optional metadata
   */
  push(state: T, metadata?: HistoryEntryMetadata): void {
    // Remove any redo states when pushing new state
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    const entry: HistoryEntry<T> = {
      state,
      metadata: {
        timestamp: Date.now(),
        ...metadata,
      },
    };

    this.history.push(entry);

    // Trim history if it exceeds max length
    if (this.history.length > this.maxLength) {
      this.history.shift();
    } else {
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Undo to the previous state
   * @returns The previous state, or undefined if no undo available
   */
  undo(): T | undefined {
    if (!this.canUndo()) {
      return undefined;
    }

    const entry = this.history[this.currentIndex];
    this.currentIndex--;
    return entry.state;
  }

  /**
   * Redo to the next state
   * @returns The next state, or undefined if no redo available
   */
  redo(): T | undefined {
    if (!this.canRedo()) {
      return undefined;
    }

    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    return entry.state;
  }

  /**
   * Jump to a specific position in history
   * @param index Position to jump to
   * @returns The state at that position, or undefined if invalid
   */
  jumpTo(index: number): T | undefined {
    if (index < 0 || index >= this.history.length) {
      return undefined;
    }

    this.currentIndex = index;
    return this.history[index].state;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get all history entries
   */
  getHistory(): HistoryEntry<T>[] {
    return [...this.history];
  }

  /**
   * Get stats about the history
   */
  getStats(): {
    length: number;
    position: number;
    maxLength: number;
    canUndo: boolean;
    canRedo: boolean;
  } {
    return {
      length: this.history.length,
      position: this.currentIndex,
      maxLength: this.maxLength,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  /**
   * Get the current state and metadata
   */
  getCurrentWithMetadata(): { state: T; metadata: HistoryEntryMetadata } | undefined {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return undefined;
  }
}

import { UndoRedoStack } from './UndoRedoStack';
import type {
  UndoRedoOptions,
  HistoryEntryMetadata,
  UndoRedoEvent,
  UndoRedoListener,
  UndoRedoStats,
  KeyboardOptions,
} from './types';

/**
 * EventEmitter - Simple event emitter implementation
 */
class EventEmitter<T> {
  private listeners: Map<UndoRedoEvent, Set<UndoRedoListener<T>>> = new Map();

  on(event: UndoRedoEvent, listener: UndoRedoListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => this.off(event, listener);
  }

  off(event: UndoRedoEvent, listener: UndoRedoListener<T>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event: UndoRedoEvent, state: T | undefined, metadata?: HistoryEntryMetadata): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(state, metadata));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

/**
 * Debounce helper for batching rapid operations
 */
class Debouncer {
  private timeoutId: number | null = null;
  private callback: () => void;
  private delay: number;

  constructor(callback: () => void, delay: number) {
    this.callback = callback;
    this.delay = delay;
  }

  schedule(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
    // Use setTimeout if available (browser), otherwise just call immediately
    if (typeof setTimeout !== 'undefined') {
      this.timeoutId = window.setTimeout(() => {
        this.callback();
        this.timeoutId = null;
      }, this.delay);
    } else {
      // In Node.js environment, just call immediately
      this.callback();
    }
  }

  flush(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.callback();
      this.timeoutId = null;
    }
  }

  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isPending(): boolean {
    return this.timeoutId !== null;
  }
}

/**
 * BatchOperations - Group multiple operations into a single undo step
 */
class BatchOperations<T> {
  private operations: Array<{ state: T; metadata?: HistoryEntryMetadata }> = [];
  private isActive: boolean = false;
  private parent: UndoRedoManager<T>;

  constructor(parent: UndoRedoManager<T>) {
    this.parent = parent;
  }

  /**
   * Start a new batch
   */
  start(): void {
    if (!this.isActive) {
      this.isActive = true;
      this.operations = [];
    }
  }

  /**
   * Add an operation to the current batch
   */
  add(state: T, metadata?: HistoryEntryMetadata): void {
    if (this.isActive) {
      this.operations.push({ state, metadata });
    }
  }

  /**
   * End the current batch and push to history
   */
  end(metadata?: HistoryEntryMetadata): void {
    if (this.isActive && this.operations.length > 0) {
      // Push the last operation in the batch
      const lastOp = this.operations[this.operations.length - 1];
      const finalMetadata: HistoryEntryMetadata = {
        timestamp: Date.now(),
        ...metadata,
        ...lastOp.metadata,
        batch: true,
        operationCount: this.operations.length,
      };
      this.parent.pushToStack(lastOp.state, finalMetadata);
      this.operations = [];
      this.isActive = false;
    }
  }

  /**
   * Check if a batch is active
   */
  isActiveBatch(): boolean {
    return this.isActive;
  }
}

/**
 * UndoRedoManager - Main undo/redo manager
 * 
 * Provides undo/redo functionality with support for:
 * - History management
 * - Debouncing
 * - Batch operations
 * - Event emission
 */
export class UndoRedoManager<T> {
  private stack: UndoRedoStack<T>;
  private eventEmitter: EventEmitter<T>;
  private debouncer: Debouncer | null = null;
  private batchOperations: BatchOperations<T>;
  private keyboardShortcutsEnabled: boolean = false;

  private options: UndoRedoOptions<T>;

  /**
   * Create a new UndoRedoManager
   * @param options Configuration options
   */
  constructor(options: UndoRedoOptions<T> = {}) {
    this.options = {
      maxLength: 50,
      debounce: 0,
      ignoreFields: [],
      areEqual: undefined,
      ...options,
    };

    this.stack = new UndoRedoStack<T>(this.options.maxLength);
    this.eventEmitter = new EventEmitter<T>();
    this.batchOperations = new BatchOperations<T>(this);

    if (this.options.debounce !== undefined && this.options.debounce > 0) {
      this.debouncer = new Debouncer(() => {
        // Debounce callback - currently no-op
        // Could be used for auto-saving or other side effects
      }, this.options.debounce);
    }
  }

  // Re-export internal classes for external use
  get BatchOperations(): typeof BatchOperations {
    return BatchOperations;
  }

  get Debouncer(): typeof Debouncer {
    return Debouncer;
  }

  /**
   * Push a new state onto the history
   * @param state State to push
   * @param metadata Optional metadata
   */
  push(state: T, metadata?: HistoryEntryMetadata): void {
    // Debounce if configured
    if (this.debouncer && !this.batchOperations.isActiveBatch()) {
      this.debouncer.schedule();
    }

    // Add to batch if active
    if (this.batchOperations.isActiveBatch()) {
      this.batchOperations.add(state, metadata);
      return;
    }

    this.stack.push(state, metadata);
    this.eventEmitter.emit('push', state, metadata);
    this.eventEmitter.emit('change', state, metadata);
  }

  /**
   * Push state directly to stack (bypasses batch and debounce)
   * @param state State to push
   * @param metadata Optional metadata
   */
  public pushToStack(state: T, metadata?: HistoryEntryMetadata): void {
    this.stack.push(state, metadata);
    this.eventEmitter.emit('push', state, metadata);
    this.eventEmitter.emit('change', state, metadata);
  }

  /**
   * Undo to the previous state
   * @returns The previous state, or undefined if no undo available
   */
  undo(): T | undefined {
    const state = this.stack.undo();
    if (state !== undefined) {
      this.eventEmitter.emit('undo', state, undefined);
      this.eventEmitter.emit('change', state, undefined);
    }
    return state;
  }

  /**
   * Redo to the next state
   * @returns The next state, or undefined if no redo available
   */
  redo(): T | undefined {
    const state = this.stack.redo();
    if (state !== undefined) {
      this.eventEmitter.emit('redo', state, undefined);
      this.eventEmitter.emit('change', state, undefined);
    }
    return state;
  }

  /**
   * Jump to a specific position in history
   * @param index Position to jump to
   * @returns The state at that position, or undefined if invalid
   */
  jumpTo(index: number): T | undefined {
    const state = this.stack.jumpTo(index);
    if (state !== undefined) {
      this.eventEmitter.emit('change', state, undefined);
    }
    return state;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.stack.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.stack.canRedo();
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.stack.clear();
    this.eventEmitter.emit('clear', undefined, undefined);
  }

  /**
   * Get the current state
   */
  getCurrentState(): T | undefined {
    return this.stack.getCurrent();
  }

  /**
   * Get the history length
   */
  getHistoryLength(): number {
    return this.stack.length;
  }

  /**
   * Get the current position in history
   */
  getPosition(): number {
    return this.stack.position;
  }

  /**
   * Get all history entries
   */
  getHistory(): Array<{ state: T; metadata: HistoryEntryMetadata }> {
    return this.stack.getHistory().map((entry) => ({
      state: entry.state,
      metadata: entry.metadata,
    }));
  }

  /**
   * Get statistics about the history
   */
  getStats(): UndoRedoStats {
    const stackStats = this.stack.getStats();
    return {
      historyLength: stackStats.length,
      position: stackStats.position,
      maxLength: stackStats.maxLength,
      canUndo: stackStats.canUndo,
      canRedo: stackStats.canRedo,
    };
  }

  /**
   * Subscribe to events
   * @param event Event type to subscribe to
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  on(event: UndoRedoEvent, listener: UndoRedoListener<T>): () => void {
    return this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from events
   * @param event Event type
   * @param listener Event listener
   */
  off(event: UndoRedoEvent, listener: UndoRedoListener<T>): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Start a batch operation
   */
  batchStart(): void {
    this.batchOperations.start();
  }

  /**
   * End the current batch operation
   * @param metadata Optional metadata for the batch
   */
  batchEnd(metadata?: HistoryEntryMetadata): void {
    this.batchOperations.end(metadata);
  }

  /**
   * Execute a function as a batch operation
   * @param fn Function to execute
   * @param metadata Optional metadata for the batch
   */
  batch(fn: () => void, metadata?: HistoryEntryMetadata): void {
    this.batchStart();
    try {
      fn();
    } finally {
      this.batchEnd(metadata);
    }
  }

  /**
   * Enable keyboard shortcuts (browser only)
   * @param _options Keyboard shortcut options
   */
  enableKeyboardShortcuts(_options?: KeyboardOptions): void {
    this.keyboardShortcutsEnabled = true;
    // Keyboard shortcuts require document, so they're only enabled in browser
    // Implementation would add event listeners to document
  }

  /**
   * Disable keyboard shortcuts
   */
  disableKeyboardShortcuts(): void {
    this.keyboardShortcutsEnabled = false;
  }

  /**
   * Check if keyboard shortcuts are enabled
   */
  areKeyboardShortcutsEnabled(): boolean {
    return this.keyboardShortcutsEnabled;
  }

  /**
   * Get the current options
   */
  getOptions(): UndoRedoOptions<T> {
    return { ...this.options };
  }

  /**
   * Update options
   * @param options New options
   */
  updateOptions(options: Partial<UndoRedoOptions<T>>): void {
    this.options = { ...this.options, ...options };

    // Update stack if max length changed
    if (options.maxLength !== undefined) {
      this.stack = new UndoRedoStack<T>(options.maxLength);
    }

    // Update debouncer if debounce changed
    if (options.debounce !== undefined) {
      if (options.debounce > 0) {
        this.debouncer = new Debouncer(() => {}, options.debounce);
      } else {
        this.debouncer = null;
      }
    }
  }
}

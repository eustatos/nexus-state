import { Snapshot } from "../types";
import type { HistoryEvent, HistoryStats } from "./types";

// Import compression types
import type { CompressionStrategy, CompressionStrategyConfig } from "../compression";

// Import disposal infrastructure
import { BaseDisposable, type DisposableConfig } from "./disposable";

export class HistoryManager extends BaseDisposable {
  private past: Snapshot[] = [];
  private future: Snapshot[] = [];
  private current: Snapshot | null = null;
  private maxHistory: number;
  private listeners: Set<(event: HistoryEvent) => void> = new Set();
  private timers: Set<ReturnType<typeof setTimeout>> = new Set();

  // Compression support
  private compressionStrategy: CompressionStrategy | null = null;
  protected compressionConfig: CompressionStrategyConfig | null = null;

  // Memory tracking before/after compression
  private originalHistorySize: number = 0;
  private compressedHistorySize: number = 0;

  constructor(
    maxHistory: number = 50,
    compressionConfig?: CompressionStrategyConfig,
    disposalConfig?: DisposableConfig,
  ) {
    super(disposalConfig);
    this.maxHistory = maxHistory;

    if (compressionConfig) {
      this.compressionConfig = compressionConfig;
      // Import compression factory dynamically to avoid circular dependencies
      // This will be replaced with actual implementation
    }
  }

  /**
   * Helper to track timers for cleanup
   */
  protected setTimeout(
    callback: () => void,
    ms: number,
  ): ReturnType<typeof setTimeout> {
    const timer = setTimeout(callback, ms);
    this.timers.add(timer);
    return timer;
  }
  
  /**
   * Set compression strategy
   */
  setCompressionStrategy(strategy: CompressionStrategy | null): void {
    this.compressionStrategy = strategy;
    
    // Reset compression tracking
    this.originalHistorySize = 0;
    this.compressedHistorySize = 0;
    
    // Apply compression to existing history if strategy is enabled
    if (strategy && strategy.name !== "none" && strategy.shouldCompress(this.getAll(), this.past.length)) {
      this.applyCompression();
    }
  }

  add(snapshot: Snapshot): void {
    console.log(`[HISTORY.add] Adding snapshot: ${snapshot.metadata.action || 'unknown'}, past.length: ${this.past.length}, current: ${this.current?.metadata.action || 'none'}`);
    
    // If maxHistory is 0, don't save any history
    if (this.maxHistory <= 0) {
      console.log(`[HISTORY.add] maxHistory is ${this.maxHistory}, skipping history save`);
      this.current = snapshot;
      this.past = [];
      this.future = [];
      console.log(`[HISTORY.add] Added. Total: ${this.getAll().length} (past: ${this.past.length}, current: ${this.current ? 1 : 0}, future: ${this.future.length})`);
      return;
    }
    
    // First, push current to past if it exists
    if (this.current) {
      this.past.push(this.current);
      console.log(`[HISTORY.add] Pushed current to past, past.length now: ${this.past.length}`);
    }
    
    // Update current and clear future
    this.current = snapshot;
    this.future = [];
    
    // Enforce maxHistory limit: past + current <= maxHistory
    // We need to keep at most (maxHistory - 1) items in past
    // because current counts as one slot
    const maxPastSize = this.maxHistory - 1;
    
    if (this.past.length > maxPastSize) {
      // Calculate how many items to remove from the beginning
      const itemsToRemove = this.past.length - maxPastSize;
      
      // Keep only the most recent (maxPastSize) items
      this.past = this.past.slice(itemsToRemove);
      console.log(`[HISTORY.add] Trimmed past from ${this.past.length + itemsToRemove} to ${this.past.length} items (maxPastSize: ${maxPastSize})`);
    }
    
    // Apply compression if strategy is configured and should compress
    if (this.compressionStrategy && this.compressionStrategy.shouldCompress(this.getAll(), this.past.length)) {
      console.log(`[HISTORY.add] Applying compression`);
      this.applyCompression();
    }
    
    console.log(`[HISTORY.add] Added. Total: ${this.getAll().length} (past: ${this.past.length}, current: ${this.current ? 1 : 0}, future: ${this.future.length})`);
  }

  getCurrent(): Snapshot | null {
    return this.current;
  }

  getAll(): Snapshot[] {
    return [
      ...this.past,
      ...(this.current ? [this.current] : []),
      ...this.future,
    ];
  }

  // Методы для навигации
  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  undo(): Snapshot | null {
    console.log(`[HISTORY.undo] canUndo: ${this.canUndo()}, past.length: ${this.past.length}, future.length: ${this.future.length}`);
    if (!this.canUndo()) return null;

    const newFuture = this.current;
    const newCurrent = this.past.pop() || null;
    
    if (newCurrent && newFuture) {
      this.future.unshift(newFuture);
      this.current = newCurrent;
      console.log(`[HISTORY.undo] Popped from past, new current: ${newCurrent.metadata.action || 'unknown'}, value: ${Object.values(newCurrent.state)[0]?.value}`);
    }
    
    return newCurrent;
  }

  redo(): Snapshot | null {
    if (!this.canRedo()) return null;

    const newPast = this.current;
    const newCurrent = this.future.shift() || null;
    
    if (newCurrent && newPast) {
      this.past.push(newPast);
      this.current = newCurrent;
    }
    
    return newCurrent;
  }

  jumpTo(index: number): Snapshot | null {
    const allSnapshots = this.getAll();
    
    // Check if index is valid
    if (index < 0 || index >= allSnapshots.length) {
      return null;
    }

    // If already at the target index, return current snapshot
    const currentIndex = this.past.length;
    if (index === currentIndex) {
      return this.current;
    }

    const targetSnapshot = allSnapshots[index];

    // Reset history
    this.past = allSnapshots.slice(0, index);
    this.future = allSnapshots.slice(index + 1);
    this.current = targetSnapshot;

    return targetSnapshot;
  }

  /**
   * Apply compression to the current history
   */
  private applyCompression(): void {
    if (!this.compressionStrategy) {
      return;
    }
    
    // Record original size
    const allSnapshots = this.getAll();
    this.originalHistorySize = allSnapshots.length;
    
    console.log(`[HISTORY.compression] Original history size: ${this.originalHistorySize}`);
    
    // Apply compression
    const compressedHistory = this.compressionStrategy.compress(allSnapshots);
    this.compressedHistorySize = compressedHistory.length;
    
    console.log(`[HISTORY.compression] Compressed history size: ${this.compressedHistorySize}`);
    
    // To preserve navigation capabilities, we need to rebuild past/future
    // from the compressed history while keeping the same current snapshot
    const currentIndex = this.past.length;  // This was the current position BEFORE add
    
    // Find the current snapshot in the compressed history
    // We use the snapshot ID to find it
    const currentSnapshotIndex = compressedHistory.findIndex(
      (s) => s.id === this.current?.id,
    );
    
    if (currentSnapshotIndex !== -1) {
      // Found current in compressed history
      // The past should be all snapshots before current in compressed history
      this.past = compressedHistory.slice(0, currentSnapshotIndex);
      // The future should be all snapshots after current in compressed history
      this.future = compressedHistory.slice(currentSnapshotIndex + 1);
      
      // The current is the snapshot at currentSnapshotIndex
      this.current = compressedHistory[currentSnapshotIndex];
      
      console.log(`[HISTORY.compression] Rebuilt history: past=${this.past.length}, current=${this.current?.metadata.action}, future=${this.future.length}`);
    } else {
      // Current snapshot not found in compressed history
      // This should not happen in normal operation, but we have a fallback
      console.warn(`[HISTORY.compression] Current snapshot not found in compressed history`);
      
      // Use the index from before compression
      if (currentIndex < compressedHistory.length) {
        this.past = compressedHistory.slice(0, currentIndex);
        this.future = compressedHistory.slice(currentIndex + 1);
        this.current = compressedHistory[currentIndex];
        
        console.log(`[HISTORY.compression] Fallback: using index ${currentIndex}`);
      }
    }
    
    // Reset compression strategy
    this.compressionStrategy.reset?.();
  }

  // Остальные методы...

  /**
   * Clear all history
   */
  clear(): void {
    this.past = [];
    this.future = [];
    this.current = null;
    
    // Reset compression tracking
    this.originalHistorySize = 0;
    this.compressedHistorySize = 0;
    
    this.emit({
      type: "change",
      operation: { type: "clear" },
      timestamp: Date.now(),
    });
  }

  /**
   * Get history statistics
   */
  getStats(): HistoryStats {
    const all = this.getAll();
    return {
      totalSnapshots: all.length,
      pastCount: this.past.length,
      futureCount: this.future.length,
      hasCurrent: !!this.current,
      estimatedMemoryUsage: this.estimateMemoryUsage(),
      oldestTimestamp: this.past.length > 0 ? this.past[0].metadata.timestamp : undefined,
      newestTimestamp: this.current ? this.current.metadata.timestamp : undefined,
      // Add compression stats if available
      compressionMetadata: this.compressionStrategy?.getMetadata() || undefined,
      originalHistorySize: this.originalHistorySize,
      compressedHistorySize: this.compressedHistorySize,
    };
  }

  /**
   * Get snapshot by ID
   * @param snapshotId Snapshot ID
   * @returns Snapshot or null if not found
   */
  getById(snapshotId: string): Snapshot | null {
    const all = this.getAll();
    return all.find((s) => s.id === snapshotId) || null;
  }

  /**
   * Subscribe to history events
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: (event: HistoryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    // Simple estimation: count properties and approx size
    let size = 0;
    
    const estimateSnapshotSize = (snapshot: Snapshot): number => {
      let snapshotSize = 0;
      snapshotSize += snapshot.id.length * 2; // UTF-16
      snapshotSize += (snapshot.metadata.action?.length || 0) * 2;
      snapshotSize += 24; // metadata overhead
      snapshotSize += Object.keys(snapshot.state).length * 50; // rough estimate per atom
      return snapshotSize;
    };
    
    this.past.forEach((s) => (size += estimateSnapshotSize(s)));
    this.future.forEach((s) => (size += estimateSnapshotSize(s)));
    if (this.current) {
      size += estimateSnapshotSize(this.current);
    }
    
    return size;
  }

  /**
   * Emit history event
   */
  private emit(event: HistoryEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Dispose the history manager and clean up all resources
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.log("Disposing HistoryManager");

    // Clear all listeners
    this.listeners.clear();

    // Clear all timers
    this.timers.forEach(clearTimeout);
    this.timers.clear();

    // Clear references to snapshots (helps GC)
    this.past = [];
    this.future = [];
    this.current = null;

    // Reset compression tracking
    this.originalHistorySize = 0;
    this.compressedHistorySize = 0;
    this.compressionStrategy = null;
    this.compressionConfig = null;

    // Dispose children
    await this.disposeChildren();

    // Run callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
    this.log("HistoryManager disposed");
  }
}

// Extend HistoryStats to include compression metadata
declare module "./types" {
  interface HistoryStats {
    compressionMetadata?: import("../types").CompressionMetadata;
    originalHistorySize?: number;
    compressedHistorySize?: number;
  }
}

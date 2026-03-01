/**
 * Disposable interface and BaseDisposable class
 *
 * Provides a standardized pattern for resource cleanup and disposal
 * across all time travel components.
 */

/**
 * Error thrown when disposal fails
 */
export class DisposalError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "DisposalError";
    this.cause = cause;
  }
}

/**
 * Error thrown when multiple disposal errors occur
 */
export class AggregateDisposalError extends Error {
  public readonly errors: Error[];

  constructor(errors: Error[]) {
    super(`Multiple disposal errors occurred (${errors.length} errors)`);
    this.name = "AggregateDisposalError";
    this.errors = errors;
  }
}

/**
 * Interface for disposable objects
 */
export interface Disposable {
  /**
   * Dispose the resource and clean up
   */
  dispose(): Promise<void> | void;

  /**
   * Check if the resource has been disposed
   */
  isDisposed(): boolean;

  /**
   * Register a callback to be called on disposal
   * @param callback Callback to call on disposal
   * @returns Unsubscribe function to remove the callback
   */
  onDispose(callback: () => void): () => void;
}

/**
 * Configuration for disposable resources
 */
export interface DisposableConfig {
  /**
   * Whether to automatically dispose child resources
   * @default true
   */
  autoDisposeChildren?: boolean;

  /**
   * Timeout for async disposal in milliseconds
   * If disposal takes longer, it will be aborted
   */
  timeout?: number;

  /**
   * Error handler for disposal errors
   * If not provided, errors are logged to console
   */
  onError?: (error: Error) => void;

  /**
   * Whether to throw errors on disposal failure
   * @default false
   */
  throwOnError?: boolean;

  /**
   * Whether to log disposal steps
   * @default false
   */
  logDisposal?: boolean;
}

/**
 * Base class for disposable resources
 *
 * Provides common disposal functionality including:
 * - Child resource management
 * - Disposal callbacks
 * - Disposal state tracking
 * - Error handling
 */
export abstract class BaseDisposable implements Disposable {
  protected disposed: boolean = false;
  protected disposeCallbacks: Set<() => void> = new Set();
  protected children: Set<Disposable> = new Set();
  protected config: DisposableConfig;

  constructor(config?: DisposableConfig) {
    this.config = {
      autoDisposeChildren: true,
      timeout: 30000, // 30 seconds default timeout
      throwOnError: false,
      logDisposal: false,
      ...config,
    };
  }

  /**
   * Dispose the resource and clean up
   * Must be implemented by subclasses
   */
  abstract dispose(): Promise<void> | void;

  /**
   * Check if the resource has been disposed
   */
  isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * Register a callback to be called on disposal
   * @param callback Callback to call on disposal
   * @returns Unsubscribe function to remove the callback
   */
  onDispose(callback: () => void): () => void {
    if (this.disposed) {
      // Already disposed, call callback immediately
      try {
        callback();
      } catch (error) {
        console.error("Error in immediate dispose callback:", error);
      }
      return () => {};
    }

    this.disposeCallbacks.add(callback);
    return () => this.disposeCallbacks.delete(callback);
  }

  /**
   * Register a child resource for automatic disposal
   * @param child Child resource to dispose
   */
  protected registerChild(child: Disposable): void {
    if (this.disposed) {
      // Already disposed, dispose child immediately
      try {
        child.dispose();
      } catch (error) {
        this.handleError(error);
      }
      return;
    }
    this.children.add(child);
  }

  /**
   * Unregister a child resource
   * @param child Child resource to remove
   */
  protected unregisterChild(child: Disposable): void {
    this.children.delete(child);
  }

  /**
   * Dispose all child resources
   */
  protected async disposeChildren(): Promise<void> {
    const errors: Error[] = [];

    for (const child of this.children) {
      try {
        if (!child.isDisposed()) {
          await child.dispose();
        }
      } catch (error) {
        errors.push(error as Error);
        this.handleError(error);
      }
    }

    this.children.clear();

    if (errors.length > 0 && this.config.throwOnError) {
      throw new AggregateDisposalError(errors);
    }
  }

  /**
   * Run all disposal callbacks
   */
  protected async runDisposeCallbacks(): Promise<void> {
    const callbacks = Array.from(this.disposeCallbacks);
    this.disposeCallbacks.clear();

    for (const callback of callbacks) {
      try {
        await callback();
      } catch (error) {
        console.error("Error in dispose callback:", error);
      }
    }
  }

  /**
   * Handle disposal error
   * @param error Error to handle
   */
  protected handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));

    if (this.config.onError) {
      this.config.onError(err);
    } else {
      console.error("Disposal error:", err);
    }

    if (this.config.throwOnError) {
      throw err;
    }
  }

  /**
   * Log disposal step
   * @param message Message to log
   */
  protected log(message: string): void {
    if (this.config.logDisposal) {
      console.log(`[DISPOSAL] ${message}`);
    }
  }

  /**
   * Execute disposal with timeout
   * @param disposeFn Disposal function
   * @param timeout Timeout in milliseconds
   */
  protected async disposeWithTimeout(
    disposeFn: () => Promise<void>,
    timeout?: number,
  ): Promise<void> {
    const disposalTimeout = timeout ?? this.config.timeout;

    if (!disposalTimeout) {
      // No timeout, just execute
      await disposeFn();
      return;
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new DisposalError(`Disposal timed out after ${disposalTimeout}ms`));
      }, disposalTimeout);
    });

    await Promise.race([disposeFn(), timeoutPromise]);
  }
}

/**
 * Leak detector for tracking disposable resources
 *
 * Uses WeakRef to track instances and detect potential memory leaks
 * when instances are garbage collected without being disposed.
 */
export class LeakDetector {
  private static instances: Map<string, any> = new Map(); // WeakRef wrapper
  private static interval: ReturnType<typeof setInterval> | null = null;
  private static leakCallbacks: Set<(id: string, instance: Disposable) => void> = new Set();

  /**
   * Track a disposable instance
   * @param instance Instance to track
   * @param id Unique identifier for the instance
   */
  static track(instance: Disposable, id: string): void {
    // Use WeakRef if available, otherwise just store reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const WeakRefCtor: any = (globalThis as any).WeakRef;
    const ref = WeakRefCtor ? new WeakRefCtor(instance) : { deref: () => instance };
    this.instances.set(id, ref);

    if (!this.interval) {
      this.startMonitoring();
    }
  }

  /**
   * Stop tracking an instance
   * @param id Instance identifier
   */
  static untrack(id: string): void {
    this.instances.delete(id);
  }

  /**
   * Start monitoring for leaks
   * @param intervalMs Monitoring interval in milliseconds
   */
  static startMonitoring(intervalMs: number = 60000): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.checkForLeaks();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Check for potential leaks
   */
  private static checkForLeaks(): void {
    const leaked: string[] = [];

    for (const [id, ref] of this.instances.entries()) {
      const instance = ref.deref?.() as Disposable | undefined;

      if (!instance) {
        // Instance was garbage collected - good, remove from tracking
        this.instances.delete(id);
        continue;
      }

      if (!instance.isDisposed()) {
        // Instance is still alive but might be leaked
        leaked.push(id);
        this.emitLeak(id, instance);
      }
    }

    if (leaked.length > 0) {
      console.warn(
        `[LeakDetector] Potential memory leaks detected: ${leaked.length} instance(s) not disposed before GC`,
      );
    }
  }

  /**
   * Register a callback for leak detection
   * @param callback Callback to call when leak is detected
   * @returns Unsubscribe function
   */
  static onLeakDetected(
    callback: (id: string, instance: Disposable) => void,
  ): () => void {
    this.leakCallbacks.add(callback);
    return () => this.leakCallbacks.delete(callback);
  }

  /**
   * Emit leak event
   * @param id Instance identifier
   * @param instance Leaked instance
   */
  private static emitLeak(id: string, instance: Disposable): void {
    for (const callback of this.leakCallbacks) {
      try {
        callback(id, instance);
      } catch (error) {
        console.error("Error in leak callback:", error);
      }
    }
  }

  /**
   * Get all tracked instances
   * @returns Map of instance IDs to WeakRefs
   */
  static getTrackedInstances(): Map<string, any> {
    return new Map(this.instances);
  }

  /**
   * Get count of tracked instances
   */
  static getTrackedCount(): number {
    return this.instances.size;
  }

  /**
   * Clear all tracked instances
   */
  static clear(): void {
    this.instances.clear();
    this.stop();
  }
}

/**
 * Finalization registry helper for cleanup
 */
export class FinalizationHelper {
  private registry: any | null = null; // FinalizationRegistry wrapper
  private trackedIds: Set<string> = new Set();

  constructor(private logCallback?: (message: string) => void) {
    // Only use FinalizationRegistry if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FinalizationRegistryCtor: any = (globalThis as any).FinalizationRegistry;
    if (FinalizationRegistryCtor) {
      this.registry = new FinalizationRegistryCtor((heldValue: string) => {
        this.trackedIds.delete(heldValue);
        this.log(`Finalized: ${heldValue}`);
      });
    }
  }

  /**
   * Track an instance for finalization
   * @param instance Instance to track
   * @param id Instance identifier
   */
  track(instance: object, id: string): void {
    if (this.registry) {
      this.registry.register(instance, id);
    }
    this.trackedIds.add(id);
  }

  /**
   * Untrack an instance
   * @param id Instance identifier
   */
  untrack(id: string): void {
    this.trackedIds.delete(id);
  }

  /**
   * Log a message
   * @param message Message to log
   */
  private log(message: string): void {
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  /**
   * Get count of tracked instances
   */
  getTrackedCount(): number {
    return this.trackedIds.size;
  }
}

/**
 * PollingService - Provides fallback polling for DevTools
 *
 * This service provides polling functionality for stores that don't
 * have metadata support. It's used as a fallback mechanism to send
 * state updates to DevTools at regular intervals.
 */

/**
 * Polling service options
 */
export interface PollingServiceOptions {
  /** Polling interval in milliseconds (default: 100) */
  interval?: number;
  /** Whether to start polling immediately (default: false) */
  autoStart?: boolean;
  /** Maximum number of polling cycles (0 = unlimited, default: 0) */
  maxCycles?: number;
  /** Whether to log polling activity (default: false) */
  debug?: boolean;
}

/**
 * Polling callback function
 */
export type PollingCallback = () => void;

/**
 * Polling statistics
 */
export interface PollingStats {
  /** Total number of polling cycles */
  cycles: number;
  /** Last poll timestamp */
  lastPoll: number | null;
  /** Average interval between polls */
  averageInterval: number | null;
  /** Whether polling is currently active */
  isActive: boolean;
  /** Start timestamp */
  startTime: number | null;
  /** Total runtime in milliseconds */
  totalRuntime: number | null;
}

/**
 * PollingService class for fallback polling
 */
export class PollingService {
  private intervalId: NodeJS.Timeout | number | null = null;
  private isRunning = false;
  private options: Required<PollingServiceOptions>;
  private callback: PollingCallback | null = null;
  private stats: PollingStats;
  private startTimestamp: number | null = null;
  private lastPollTimestamp: number | null = null;
  private intervalSum = 0;
  private intervalCount = 0;

  constructor(options: PollingServiceOptions = {}) {
    this.options = {
      interval: options.interval ?? 100,
      autoStart: options.autoStart ?? false,
      maxCycles: options.maxCycles ?? 0,
      debug: options.debug ?? false,
    };

    this.stats = {
      cycles: 0,
      lastPoll: null,
      averageInterval: null,
      isActive: false,
      startTime: null,
      totalRuntime: null,
    };

    if (this.options.autoStart && this.callback) {
      this.start(this.options.interval, this.callback);
    }
  }

  /**
   * Start polling
   * @param interval Polling interval in milliseconds
   * @param callback Callback function to execute on each poll
   */
  start(interval: number, callback: PollingCallback): void {
    if (this.isRunning) {
      if (this.options.debug) {
        console.warn("PollingService: Already running");
      }
      return;
    }

    if (interval <= 0) {
      throw new Error("Polling interval must be greater than 0");
    }

    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }

    this.callback = callback;
    this.isRunning = true;
    this.startTimestamp = Date.now();
    this.stats.startTime = this.startTimestamp;
    this.stats.isActive = true;

    if (this.options.debug) {
      console.log(`PollingService: Starting with interval ${interval}ms`);
    }

    this.intervalId = setInterval(() => {
      this.executePoll();
    }, interval);
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId as NodeJS.Timeout);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.stats.isActive = false;
    this.stats.totalRuntime = this.startTimestamp
      ? Date.now() - this.startTimestamp
      : null;

    if (this.options.debug) {
      console.log("PollingService: Stopped");
    }
  }

  /**
   * Execute a single poll
   */
  private executePoll(): void {
    if (!this.isRunning || !this.callback) {
      return;
    }

    const now = Date.now();

    // Update interval statistics
    if (this.lastPollTimestamp) {
      const interval = now - this.lastPollTimestamp;
      this.intervalSum += interval;
      this.intervalCount++;
      this.stats.averageInterval = this.intervalSum / this.intervalCount;
    }

    this.lastPollTimestamp = now;
    this.stats.lastPoll = now;
    this.stats.cycles++;

    try {
      if (this.options.debug) {
        console.log(`PollingService: Executing poll #${this.stats.cycles}`);
      }

      this.callback();

      // Check max cycles
      if (
        this.options.maxCycles > 0 &&
        this.stats.cycles >= this.options.maxCycles
      ) {
        if (this.options.debug) {
          console.log(
            `PollingService: Reached max cycles (${this.options.maxCycles})`,
          );
        }
        this.stop();
      }
    } catch (error) {
      if (this.options.debug) {
        console.error("PollingService: Error in callback:", error);
      }
    }
  }

  /**
   * Check if polling is running
   * @returns True if polling is active
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get polling statistics
   * @returns Current polling statistics
   */
  getStats(): PollingStats {
    return {
      ...this.stats,
      totalRuntime: this.startTimestamp
        ? Date.now() - this.startTimestamp
        : null,
    };
  }

  /**
   * Update polling interval
   * @param newInterval New interval in milliseconds
   */
  updateInterval(newInterval: number): void {
    if (newInterval <= 0) {
      throw new Error("Polling interval must be greater than 0");
    }

    if (this.options.interval === newInterval) {
      return;
    }

    this.options.interval = newInterval;

    // Restart polling with new interval if currently running
    if (this.isRunning && this.callback) {
      const wasRunning = this.isRunning;
      const savedCallback = this.callback;

      this.stop();

      if (wasRunning) {
        this.start(newInterval, savedCallback);
      }
    }

    if (this.options.debug) {
      console.log(`PollingService: Interval updated to ${newInterval}ms`);
    }
  }

  /**
   * Reset polling statistics
   */
  resetStats(): void {
    this.stats = {
      cycles: 0,
      lastPoll: null,
      averageInterval: null,
      isActive: this.stats.isActive,
      startTime: this.stats.startTime,
      totalRuntime: this.stats.totalRuntime,
    };
    this.intervalSum = 0;
    this.intervalCount = 0;

    if (this.options.debug) {
      console.log("PollingService: Statistics reset");
    }
  }

  /**
   * Get current options
   * @returns Current options
   */
  getOptions(): Required<PollingServiceOptions> {
    return { ...this.options };
  }

  /**
   * Update options
   * @param newOptions New options
   */
  updateOptions(newOptions: PollingServiceOptions): void {
    const oldOptions = { ...this.options };
    this.options = { ...this.options, ...newOptions };

    // Handle interval change if polling is running
    if (
      newOptions.interval &&
      newOptions.interval !== oldOptions.interval &&
      this.isRunning &&
      this.callback
    ) {
      this.updateInterval(newOptions.interval);
    }

    if (this.options.debug && !oldOptions.debug) {
      console.log("PollingService: Debug mode enabled");
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.callback = null;
    this.stats.isActive = false;
    this.stats.totalRuntime = this.startTimestamp
      ? Date.now() - this.startTimestamp
      : null;

    if (this.options.debug) {
      console.log("PollingService: Disposed");
    }
  }
}

/**
 * Create a new PollingService instance
 * @param options Polling service options
 * @returns New PollingService instance
 */
export function createPollingService(
  options: PollingServiceOptions = {},
): PollingService {
  return new PollingService(options);
}

/**
 * Default polling service instance for convenience
 */
export const defaultPollingService = createPollingService();

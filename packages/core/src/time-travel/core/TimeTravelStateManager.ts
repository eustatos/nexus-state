/**
 * TimeTravelStateManager - Manages time travel state
 *
 * Responsibilities:
 * - Track isTimeTraveling flag
 * - Manage autoCapture mode
 * - Provide state query methods
 */

export interface TimeTravelStateManagerConfig {
  /** Auto-capture mode */
  autoCapture?: boolean;
}

export class TimeTravelStateManager {
  private isTimeTraveling: boolean = false;
  private autoCapture: boolean;

  constructor(config?: TimeTravelStateManagerConfig) {
    this.autoCapture = config?.autoCapture ?? false;
  }

  /**
   * Check if time travel is in progress
   */
  isTraveling(): boolean {
    return this.isTimeTraveling;
  }

  /**
   * Start time travel operation
   */
  startTimeTravel(): void {
    this.isTimeTraveling = true;
  }

  /**
   * End time travel operation
   */
  endTimeTravel(): void {
    this.isTimeTraveling = false;
  }

  /**
   * Execute callback with time travel state
   */
  withTimeTravel<T>(callback: () => T): T {
    this.startTimeTravel();
    try {
      return callback();
    } finally {
      this.endTimeTravel();
    }
  }

  /**
   * Check if auto-capture is enabled
   */
  isAutoCaptureEnabled(): boolean {
    return this.autoCapture;
  }

  /**
   * Enable auto-capture
   */
  enableAutoCapture(): void {
    this.autoCapture = true;
  }

  /**
   * Disable auto-capture
   */
  disableAutoCapture(): void {
    this.autoCapture = false;
  }

  /**
   * Set auto-capture mode
   */
  setAutoCapture(enabled: boolean): void {
    this.autoCapture = enabled;
  }

  /**
   * Get current state
   */
  getState(): {
    isTimeTraveling: boolean;
    autoCapture: boolean;
  } {
    return {
      isTimeTraveling: this.isTimeTraveling,
      autoCapture: this.autoCapture,
    };
  }

  /**
   * Reset state to defaults
   */
  reset(): void {
    this.isTimeTraveling = false;
    this.autoCapture = false;
  }

  /**
   * Update configuration
   */
  configure(config: Partial<TimeTravelStateManagerConfig>): void {
    if (config.autoCapture !== undefined) {
      this.autoCapture = config.autoCapture;
    }
  }
}

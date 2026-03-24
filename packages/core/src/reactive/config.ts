/**
 * Reactive backend configuration
 *
 * Controls which backend (Store or Signal) is used for reactive values.
 * Supports A/B testing and gradual rollout.
 */
export interface ReactiveConfig {
  /**
   * Enable TC39 Signal-based backend
   *
   * When true, attempts to use SignalBasedReactive if available.
   * Falls back to StoreBasedReactive if Signals not available or on error.
   *
   * @default false
   */
  ENABLE_SIGNAL_BACKEND: boolean;

  /**
   * Percentage of users to enable Signal backend (0-100)
   *
   * Used for gradual rollout and A/B testing.
   * Only applies when ENABLE_SIGNAL_BACKEND is true.
   *
   * @default 0
   * @example
   * // 10% of users
   * SIGNAL_BACKEND_PERCENTAGE: 10
   */
  SIGNAL_BACKEND_PERCENTAGE: number;

  /**
   * Fallback to Store if Signal backend fails
   *
   * When true, errors in SignalBasedReactive will fall back to StoreBasedReactive.
   * When false, errors will be thrown.
   *
   * @default true
   */
  FALLBACK_TO_STORE: boolean;

  /**
   * Log backend selection decisions
   *
   * Useful for debugging and monitoring rollout.
   *
   * @default false (only in production)
   */
  LOG_BACKEND_SELECTION: boolean;
}

/**
 * Default reactive configuration
 */
const DEFAULT_CONFIG: ReactiveConfig = {
  ENABLE_SIGNAL_BACKEND: false,
  SIGNAL_BACKEND_PERCENTAGE: 0,
  FALLBACK_TO_STORE: true,
  LOG_BACKEND_SELECTION: process.env.NODE_ENV !== 'production',
};

/**
 * Current reactive configuration (mutable)
 */
export let REACTIVE_CONFIG: ReactiveConfig = { ...DEFAULT_CONFIG };

/**
 * Update reactive configuration
 *
 * Allows runtime configuration changes without restart.
 * Useful for feature flag systems and A/B testing.
 *
 * @param updates Partial config updates
 *
 * @example
 * ```typescript
 * // Enable Signals for 10% of users
 * updateReactiveConfig({
 *   ENABLE_SIGNAL_BACKEND: true,
 *   SIGNAL_BACKEND_PERCENTAGE: 10,
 * });
 * ```
 */
export function updateReactiveConfig(updates: Partial<ReactiveConfig>): void {
  REACTIVE_CONFIG = { ...REACTIVE_CONFIG, ...updates };

  if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
    console.log('[ReactiveConfig] Updated:', REACTIVE_CONFIG);
  }
}

/**
 * Reset configuration to defaults
 */
export function resetReactiveConfig(): void {
  REACTIVE_CONFIG = { ...DEFAULT_CONFIG };
}

/**
 * Get current configuration (immutable copy)
 */
export function getReactiveConfig(): Readonly<ReactiveConfig> {
  return { ...REACTIVE_CONFIG };
}

/**
 * Load configuration from environment variables
 *
 * Supports:
 * - NEXUS_ENABLE_SIGNALS=true|false
 * - NEXUS_SIGNAL_PERCENTAGE=0-100
 * - NEXUS_FALLBACK_TO_STORE=true|false
 */
export function loadConfigFromEnv(): void {
  const env = process.env;

  if (env.NEXUS_ENABLE_SIGNALS !== undefined) {
    REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND = env.NEXUS_ENABLE_SIGNALS === 'true';
  }

  if (env.NEXUS_SIGNAL_PERCENTAGE !== undefined) {
    const percentage = parseInt(env.NEXUS_SIGNAL_PERCENTAGE, 10);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE = percentage;
    }
  }

  if (env.NEXUS_FALLBACK_TO_STORE !== undefined) {
    REACTIVE_CONFIG.FALLBACK_TO_STORE = env.NEXUS_FALLBACK_TO_STORE === 'true';
  }

  if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
    console.log('[ReactiveConfig] Loaded from env:', REACTIVE_CONFIG);
  }
}

// Auto-load from env on module load
loadConfigFromEnv();

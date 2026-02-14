/**
 * Stack trace capture utilities for development debugging
 * Implements stack trace capture as per TASK-005 and DEV-003-B
 */

export interface StackTraceConfig {
  enableStackTrace: boolean;
  traceLimit: number;
  isDevelopment: boolean;
  /** Optional custom filter; if not set, default noise patterns are used */
  filterFrames?: (frames: string[]) => string[];
}

export interface CapturedStackTrace {
  frames: string[];
  timestamp: number;
  source?: string;
}

export interface StackTraceFilterOptions {
  /** Patterns to exclude (frame is dropped if it includes any of these) */
  excludePatterns?: RegExp[];
  /** Max number of frames to keep after filtering */
  maxFrames?: number;
}

/** Default patterns to strip from stack (noise: libs, test runners, bundler) */
const DEFAULT_EXCLUDE_PATTERNS = [
  /node_modules/,
  /nexus-state[/\\]node_modules/,
  /\.test\.(ts|tsx|js|jsx)/,
  /\.spec\.(ts|tsx|js|jsx)/,
  /jest|vitest|mocha|__tests__/,
  /webpack|vite|rollup/,
  /stack-tracer\.ts/, // capture site itself
];

/**
 * Default stack trace configuration
 */
export const DEFAULT_STACK_TRACE_CONFIG: StackTraceConfig = {
  enableStackTrace: false,
  traceLimit: 10,
  isDevelopment: process.env.NODE_ENV === "development",
};

/**
 * Filter stack frames to remove noise (node_modules, tests, bundler, etc.)
 * @param frames - Raw stack frame strings
 * @param options - Optional exclude patterns and max frames
 * @returns Filtered array of frame strings
 */
export function filterStackTraceFrames(
  frames: string[],
  options: StackTraceFilterOptions = {},
): string[] {
  const {
    excludePatterns = DEFAULT_EXCLUDE_PATTERNS,
    maxFrames = frames.length,
  } = options;

  let result = frames.filter(
    (frame) => !excludePatterns.some((re) => re.test(frame)),
  );
  if (maxFrames < result.length) {
    result = result.slice(0, maxFrames);
  }
  return result;
}

/**
 * Format a captured stack trace as a single string for DevTools (preserves
 * format for browser/DevTools source map resolution).
 */
export function formatStackTraceForDevTools(
  captured: CapturedStackTrace,
): string {
  return captured.frames.join("\n");
}

/**
 * Capture stack trace with configurable depth and optional filtering
 * @param limit - Number of stack frames to capture (before filtering)
 * @param options - Optional filter options; if omitted, default filtering is applied
 * @returns Captured stack trace or null if not in development
 */
export function captureStackTrace(
  limit: number = 10,
  options: StackTraceFilterOptions = {},
): CapturedStackTrace | null {
  // Only capture in development environment
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const stack = new Error().stack;
  if (!stack) {
    return null;
  }

  // Parse stack frames (skip first frame which is this function)
  const rawFrames = stack
    .split("\n")
    .slice(1, limit + 1)
    .map((frame) => frame.trim())
    .filter((frame) => frame.length > 0);

  const frames = filterStackTraceFrames(rawFrames, {
    ...options,
    maxFrames: options.maxFrames ?? limit,
  });

  return {
    frames,
    timestamp: Date.now(),
  };
}

/**
 * Lazy stack trace generator
 * @param config - Stack trace configuration
 * @returns Function that captures stack trace when called
 */
export function createStackTraceGenerator(
  config: StackTraceConfig,
): () => CapturedStackTrace | null {
  return () => {
    if (!config.enableStackTrace || !config.isDevelopment) {
      return null;
    }

    return captureStackTrace(config.traceLimit);
  };
}

/**
 * Check if stack trace capture is enabled
 * @param config - Stack trace configuration
 * @returns True if stack trace capture is enabled
 */
export function isStackTraceEnabled(config: StackTraceConfig): boolean {
  return config.enableStackTrace && config.isDevelopment;
}

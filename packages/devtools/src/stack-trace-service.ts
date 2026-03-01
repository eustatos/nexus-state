/**
 * StackTraceService - Captures and formats stack traces for DevTools
 * 
 * This service provides utilities for capturing stack traces and formatting
 * them for display in DevTools. It handles different environments and
 * provides configurable trace limits.
 */

/**
 * Stack trace frame information
 */
export interface StackTraceFrame {
  functionName?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  source?: string;
}

/**
 * Captured stack trace
 */
export interface StackTrace {
  frames: StackTraceFrame[];
  timestamp: number;
  limit: number;
}

/**
 * Stack trace capture options
 */
export interface StackTraceCaptureOptions {
  /** Maximum number of frames to capture (default: 10) */
  limit?: number;
  /** Whether to skip internal frames (default: true) */
  skipInternal?: boolean;
  /** Whether to include source code snippets (default: false) */
  includeSource?: boolean;
}

/**
 * Stack trace formatting options
 */
export interface StackTraceFormatOptions {
  /** Maximum frames to include in formatted output (default: 5) */
  maxFrames?: number;
  /** Whether to include file paths (default: true) */
  includeFilePaths?: boolean;
  /** Whether to include line numbers (default: true) */
  includeLineNumbers?: boolean;
  /** Whether to include column numbers (default: false) */
  includeColumnNumbers?: boolean;
  /** Whether to include function names (default: true) */
  includeFunctionNames?: boolean;
  /** Whether to format for DevTools display (default: true) */
  formatForDevTools?: boolean;
}

/**
 * StackTraceService class for capturing and formatting stack traces
 */
export class StackTraceService {
  /**
   * Capture a stack trace
   * @param options Capture options
   * @returns Captured stack trace or null if capture failed
   */
  capture(options: StackTraceCaptureOptions = {}): StackTrace | null {
    const limit = options.limit ?? 10;
    const skipInternal = options.skipInternal ?? true;
    
    try {
      // Create an Error to capture the stack trace
      const error = new Error();
      const stack = error.stack;
      
      if (!stack) {
        return null;
      }

      // Parse stack trace lines
      const lines = stack.split('\n').slice(1); // Skip the first line (Error message)
      const frames: StackTraceFrame[] = [];
      
      for (const line of lines) {
        if (frames.length >= limit) {
          break;
        }

        const frame = this.parseStackTraceLine(line);
        if (frame) {
          // Skip internal frames if requested
          if (skipInternal && this.isInternalFrame(frame)) {
            continue;
          }
          
          frames.push(frame);
        }
      }

      return {
        frames,
        timestamp: Date.now(),
        limit,
      };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to capture stack trace:", error);
      }
      return null;
    }
  }

  /**
   * Format a stack trace for display
   * @param trace The stack trace to format
   * @param options Formatting options
   * @returns Formatted stack trace string
   */
  format(trace: StackTrace, options: StackTraceFormatOptions = {}): string {
    const {
      maxFrames = 5,
      includeFilePaths = true,
      includeLineNumbers = true,
      includeColumnNumbers = false,
      includeFunctionNames = true,
      formatForDevTools = true,
    } = options;

    const frames = trace.frames.slice(0, maxFrames);
    const lines: string[] = [];

    for (const frame of frames) {
      const parts: string[] = [];

      if (includeFunctionNames && frame.functionName) {
        parts.push(frame.functionName);
      }

      if (includeFilePaths && frame.fileName) {
        let location = frame.fileName;
        
        if (includeLineNumbers && frame.lineNumber !== undefined) {
          location += `:${frame.lineNumber}`;
          
          if (includeColumnNumbers && frame.columnNumber !== undefined) {
            location += `:${frame.columnNumber}`;
          }
        }
        
        parts.push(`(${location})`);
      }

      if (parts.length > 0) {
        const line = parts.join(' ');
        lines.push(formatForDevTools ? `  at ${line}` : line);
      }
    }

    if (formatForDevTools) {
      return lines.join('\n');
    } else {
      return lines.join('\n');
    }
  }

  /**
   * Format a stack trace specifically for DevTools display
   * @param trace The stack trace to format
   * @returns Formatted stack trace string for DevTools
   */
  formatForDevTools(trace: StackTrace): string {
    return this.format(trace, {
      maxFrames: 5,
      includeFilePaths: true,
      includeLineNumbers: true,
      includeColumnNumbers: false,
      includeFunctionNames: true,
      formatForDevTools: true,
    });
  }

  /**
   * Parse a stack trace line into a frame object
   * @param line The stack trace line
   * @returns Parsed stack trace frame or null
   */
  private parseStackTraceLine(line: string): StackTraceFrame | null {
    // Trim whitespace
    line = line.trim();
    
    // Common stack trace patterns:
    // 1. at functionName (fileName:line:column)
    // 2. at fileName:line:column
    // 3. functionName@fileName:line:column
    
    // Pattern 1: at functionName (fileName:line:column)
    const pattern1 = /^at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/;
    const match1 = line.match(pattern1);
    if (match1) {
      return {
        functionName: match1[1],
        fileName: match1[2],
        lineNumber: parseInt(match1[3], 10),
        columnNumber: parseInt(match1[4], 10),
      };
    }

    // Pattern 2: at fileName:line:column
    const pattern2 = /^at\s+(.+?):(\d+):(\d+)$/;
    const match2 = line.match(pattern2);
    if (match2) {
      return {
        fileName: match2[1],
        lineNumber: parseInt(match2[2], 10),
        columnNumber: parseInt(match2[3], 10),
      };
    }

    // Pattern 3: functionName@fileName:line:column (Firefox style)
    const pattern3 = /^(.+?)@(.+?):(\d+):(\d+)$/;
    const match3 = line.match(pattern3);
    if (match3) {
      return {
        functionName: match3[1],
        fileName: match3[2],
        lineNumber: parseInt(match3[3], 10),
        columnNumber: parseInt(match3[4], 10),
      };
    }

    // Pattern 4: Just a function name
    const pattern4 = /^at\s+(.+?)$/;
    const match4 = line.match(pattern4);
    if (match4) {
      return {
        functionName: match4[1],
      };
    }

    return null;
  }

  /**
   * Check if a frame is internal (should be skipped)
   * @param frame The stack trace frame
   * @returns True if frame is internal
   */
  private isInternalFrame(frame: StackTraceFrame): boolean {
    // Skip frames from internal DevTools code
    if (frame.fileName?.includes('devtools-plugin') ||
        frame.fileName?.includes('devtools-connector') ||
        frame.fileName?.includes('stack-trace-service') ||
        frame.fileName?.includes('action-naming') ||
        frame.fileName?.includes('state-serializer') ||
        frame.fileName?.includes('command-handler')) {
      return true;
    }

    // Skip anonymous functions
    if (frame.functionName === '' || frame.functionName === '<anonymous>') {
      return true;
    }

    return false;
  }

  /**
   * Get a simplified stack trace (just function names)
   * @param trace The stack trace
   * @returns Array of function names
   */
  getFunctionNames(trace: StackTrace): string[] {
    return trace.frames
      .map(frame => frame.functionName)
      .filter((name): name is string => !!name);
  }

  /**
   * Get the caller function name (skip internal frames)
   * @param options Capture options
   * @returns Caller function name or null
   */
  getCallerFunctionName(options: StackTraceCaptureOptions = {}): string | null {
    const trace = this.capture({
      limit: 5,
      skipInternal: true,
      ...options,
    });

    if (!trace || trace.frames.length === 0) {
      return null;
    }

    // Return the first non-internal frame
    return trace.frames[0].functionName || null;
  }
}

/**
 * Create a new StackTraceService instance
 * @returns New StackTraceService instance
 */
export function createStackTraceService(): StackTraceService {
  return new StackTraceService();
}

/**
 * Default stack trace service instance for convenience
 */
export const defaultStackTraceService = createStackTraceService();
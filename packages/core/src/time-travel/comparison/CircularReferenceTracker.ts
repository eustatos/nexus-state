/**
 * CircularReferenceTracker - Tracks circular references during comparison
 *
 * Provides circular reference detection and tracking for deep comparison operations.
 */

/**
 * Circular reference detection strategy
 */
export type CircularStrategy = 'path' | 'ignore' | 'throw';

/**
 * Circular reference result
 */
export interface CircularResult {
  /** Whether circular reference was detected */
  isCircular: boolean;
  /** Path where circular reference was detected */
  path?: string[];
  /** Strategy used for detection */
  strategy: CircularStrategy;
}

/**
 * CircularReferenceTracker provides circular reference tracking
 * without external dependencies
 */
export class CircularReferenceTracker {
  private seenA: WeakMap<object, boolean>;
  private seenB: WeakMap<object, boolean>;
  private pathA: string[];
  private pathB: string[];
  private strategy: CircularStrategy;

  constructor(strategy: CircularStrategy = 'path') {
    this.strategy = strategy;
    this.seenA = new WeakMap();
    this.seenB = new WeakMap();
    this.pathA = [];
    this.pathB = [];
  }

  /**
   * Check if objects have been seen before
   * @param a - First object
   * @param b - Second object
   * @returns Circular result
   */
  checkCircular(a: object, b: object): CircularResult {
    const aSeen = this.seenA.has(a);
    const bSeen = this.seenB.has(b);

    if (this.strategy === 'ignore') {
      return {
        isCircular: false,
        strategy: 'ignore',
      };
    }

    if (aSeen && bSeen) {
      // Both seen - circular reference detected
      if (this.strategy === 'throw') {
        throw new Error(`Circular reference detected at path: ${this.pathA.join('.')}`);
      }

      return {
        isCircular: true,
        path: [...this.pathA],
        strategy: 'path',
      };
    }

    // Mark as seen
    this.seenA.set(a, true);
    this.seenB.set(b, true);

    return {
      isCircular: false,
      strategy: 'path',
    };
  }

  /**
   * Mark objects as seen
   * @param a - First object
   * @param b - Second object
   */
  markAsSeen(a: object, b: object): void {
    this.seenA.set(a, true);
    this.seenB.set(b, true);
  }

  /**
   * Check if object has been seen
   * @param a - Object to check
   * @returns True if seen
   */
  hasSeen(a: object): boolean {
    return this.seenA.has(a);
  }

  /**
   * Push path segment
   * @param segment - Path segment
   */
  pushPath(segment: string): void {
    this.pathA.push(segment);
    this.pathB.push(segment);
  }

  /**
   * Pop path segment
   * @returns Path segment or undefined
   */
  popPath(): string | undefined {
    const a = this.pathA.pop();
    this.pathB.pop();
    return a;
  }

  /**
   * Get current path
   * @returns Current path array
   */
  getPath(): string[] {
    return [...this.pathA];
  }

  /**
   * Reset tracker state
   */
  reset(): void {
    this.seenA = new WeakMap();
    this.seenB = new WeakMap();
    this.pathA = [];
    this.pathB = [];
  }

  /**
   * Get seen count for debugging
   * @returns Object with seen counts
   */
  getSeenCount(): { seenA: number; seenB: number } {
    // Note: WeakMap doesn't have size property, this is approximate
    return {
      seenA: 0,
      seenB: 0,
    };
  }

  /**
   * Get current strategy
   * @returns Current circular strategy
   */
  getStrategy(): CircularStrategy {
    return this.strategy;
  }

  /**
   * Set strategy
   * @param strategy - New strategy
   */
  setStrategy(strategy: CircularStrategy): void {
    this.strategy = strategy;
  }
}

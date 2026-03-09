/**
 * ValueCoordinator - Coordinates all comparators for unified value comparison
 *
 * Provides a unified API for comparing values of any type,
 * delegating to specialized comparators as needed.
 */

import { PrimitiveComparator } from './PrimitiveComparator';
import { ArrayComparator } from './ArrayComparator';
import { ObjectComparator } from './ObjectComparator';
import { MapSetComparator } from './MapSetComparator';
import { DateRegExpComparator } from './DateRegExpComparator';
import { DiffGenerator, type ValueDiff } from './DiffGenerator';
import { CircularReferenceTracker } from './CircularReferenceTracker';

/**
 * Comparison options
 */
export interface ComparisonOptions {
  /** Maximum depth for deep comparison */
  maxDepth: number;
  /** Whether to use deep comparison */
  deepComparison: boolean;
  /** Whether to track circular references */
  trackCircular: boolean;
  /** Whether to ignore functions */
  ignoreFunctions: boolean;
  /** Whether to ignore undefined */
  ignoreUndefined: boolean;
  /** Whether to include symbol keys */
  includeSymbols: boolean;
}

/**
 * Default comparison options
 */
export const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  maxDepth: 10,
  deepComparison: true,
  trackCircular: true,
  ignoreFunctions: false,
  ignoreUndefined: false,
  includeSymbols: false,
};

/**
 * Comparison result
 */
export interface ComparisonResult {
  /** Whether values are equal */
  equal: boolean;
  /** Type of first value */
  typeA: string;
  /** Type of second value */
  typeB: string;
  /** Detailed diff (if not equal) */
  diff?: ValueDiff;
}

/**
 * ValueCoordinator provides unified value comparison
 * by coordinating all specialized comparators
 */
export class ValueCoordinator {
  private primitiveComparator: PrimitiveComparator;
  private arrayComparator: ArrayComparator;
  private objectComparator: ObjectComparator;
  private mapSetComparator: MapSetComparator;
  private dateRegExpComparator: DateRegExpComparator;
  private diffGenerator: DiffGenerator;
  private circularTracker: CircularReferenceTracker;
  private options: ComparisonOptions;

  constructor(options: Partial<ComparisonOptions> = {}) {
    this.options = { ...DEFAULT_COMPARISON_OPTIONS, ...options };

    // Initialize comparators
    this.primitiveComparator = new PrimitiveComparator();
    this.arrayComparator = new ArrayComparator(this.primitiveComparator);
    this.objectComparator = new ObjectComparator(this.primitiveComparator);
    this.mapSetComparator = new MapSetComparator(this.primitiveComparator);
    this.dateRegExpComparator = new DateRegExpComparator();
    this.circularTracker = new CircularReferenceTracker();

    // Initialize diff generator with all comparators
    this.diffGenerator = new DiffGenerator(
      this.options,
      this.primitiveComparator,
      this.arrayComparator,
      this.objectComparator,
      this.mapSetComparator,
      this.dateRegExpComparator
    );
  }

  /**
   * Compare two values
   * @param a - First value
   * @param b - Second value
   * @param options - Comparison options
   * @returns Comparison result
   */
  compare(a: unknown, b: unknown, options?: Partial<ComparisonOptions>): ComparisonResult {
    const opts = { ...this.options, ...options };

    // Reset circular tracker
    this.circularTracker.reset();

    // Check circular references
    if (opts.trackCircular && typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const circularResult = this.circularTracker.checkCircular(a as object, b as object);
      if (circularResult.isCircular) {
        return {
          equal: true,
          typeA: this.getType(a),
          typeB: this.getType(b),
          diff: {
            type: 'circular',
            equal: true,
            circularPath: circularResult.path,
          },
        };
      }
    }

    // Delegate to appropriate comparator
    const equal = this.areEqual(a, b, opts);

    const result: ComparisonResult = {
      equal,
      typeA: this.getType(a),
      typeB: this.getType(b),
    };

    // Generate diff if not equal and deep comparison enabled
    if (!equal && opts.deepComparison) {
      result.diff = this.diffGenerator.generateDiff(a, b);
    }

    return result;
  }

  /**
   * Check if two values are equal
   * @param a - First value
   * @param b - Second value
   * @param options - Comparison options
   * @returns True if equal
   */
  areEqual(a: unknown, b: unknown, options?: Partial<ComparisonOptions>): boolean {
    const opts = { ...this.options, ...options };

    // Handle primitives
    if (this.primitiveComparator.isPrimitive(a) || this.primitiveComparator.isPrimitive(b)) {
      return this.primitiveComparator.areEqual(a, b);
    }

    // Handle functions
    if (typeof a === 'function' || typeof b === 'function') {
      if (opts.ignoreFunctions) return true;
      return typeof a === 'function' && typeof b === 'function' && a.toString() === b.toString();
    }

    // Handle dates
    if (this.dateRegExpComparator.isDate(a) || this.dateRegExpComparator.isDate(b)) {
      return this.dateRegExpComparator.areEqual(a as Date, b as Date);
    }

    // Handle regexps
    if (this.dateRegExpComparator.isRegExp(a) || this.dateRegExpComparator.isRegExp(b)) {
      return this.dateRegExpComparator.areEqual(a as RegExp, b as RegExp);
    }

    // Handle maps
    if (this.mapSetComparator.isMap(a) || this.mapSetComparator.isMap(b)) {
      return this.mapSetComparator.areEqual(a as Map<unknown, unknown>, b as Map<unknown, unknown>, opts.deepComparison);
    }

    // Handle sets
    if (this.mapSetComparator.isSet(a) || this.mapSetComparator.isSet(b)) {
      return this.mapSetComparator.areEqual(a as Set<unknown>, b as Set<unknown>, opts.deepComparison);
    }

    // Handle arrays
    if (Array.isArray(a) || Array.isArray(b)) {
      return this.arrayComparator.areEqual(a as unknown[], b as unknown[], opts.deepComparison);
    }

    // Handle objects
    if (this.objectComparator.isObject(a) || this.objectComparator.isObject(b)) {
      return this.objectComparator.areEqual(
        a as Record<string, unknown>,
        b as Record<string, unknown>,
        opts.deepComparison,
        opts.includeSymbols
      );
    }

    // Fallback
    return Object.is(a, b);
  }

  /**
   * Generate diff between two values
   * @param a - First value
   * @param b - Second value
   * @returns Value diff
   */
  diff(a: unknown, b: unknown): ValueDiff {
    return this.diffGenerator.generateDiff(a, b);
  }

  /**
   * Get type of value
   * @param value - Value to get type
   * @returns Type string
   */
  getType(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (this.dateRegExpComparator.isDate(value)) return 'date';
    if (this.dateRegExpComparator.isRegExp(value)) return 'regexp';
    if (this.mapSetComparator.isMap(value)) return 'map';
    if (this.mapSetComparator.isSet(value)) return 'set';
    if (this.objectComparator.isObject(value)) return 'object';
    return typeof value;
  }

  /**
   * Get comparison options
   * @returns Current options
   */
  getOptions(): ComparisonOptions {
    return { ...this.options };
  }

  /**
   * Set comparison options
   * @param options - New options
   */
  setOptions(options: Partial<ComparisonOptions>): void {
    this.options = { ...this.options, ...options };
    this.diffGenerator.setOptions(this.options);
  }

  /**
   * Get primitive comparator
   * @returns Primitive comparator
   */
  getPrimitiveComparator(): PrimitiveComparator {
    return this.primitiveComparator;
  }

  /**
   * Get array comparator
   * @returns Array comparator
   */
  getArrayComparator(): ArrayComparator {
    return this.arrayComparator;
  }

  /**
   * Get object comparator
   * @returns Object comparator
   */
  getObjectComparator(): ObjectComparator {
    return this.objectComparator;
  }

  /**
   * Get map/set comparator
   * @returns Map/set comparator
   */
  getMapSetComparator(): MapSetComparator {
    return this.mapSetComparator;
  }

  /**
   * Get date/regexp comparator
   * @returns Date/regexp comparator
   */
  getDateRegExpComparator(): DateRegExpComparator {
    return this.dateRegExpComparator;
  }

  /**
   * Get diff generator
   * @returns Diff generator
   */
  getDiffGenerator(): DiffGenerator {
    return this.diffGenerator;
  }

  /**
   * Get circular reference tracker
   * @returns Circular reference tracker
   */
  getCircularTracker(): CircularReferenceTracker {
    return this.circularTracker;
  }

  /**
   * Get diff summary
   * @param diff - Value diff
   * @returns Summary string
   */
  getDiffSummary(diff: ValueDiff): string {
    return this.diffGenerator.getSummary(diff);
  }
}

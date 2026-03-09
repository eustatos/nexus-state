/**
 * DiffGenerator - Generates detailed diffs between values
 *
 * Provides diff generation for all types with path tracking
 * and detailed change information.
 */

import type { PrimitiveComparator } from './PrimitiveComparator';
import type { ArrayComparator } from './ArrayComparator';
import type { ObjectComparator } from './ObjectComparator';
import type { MapSetComparator } from './MapSetComparator';
import type { DateRegExpComparator } from './DateRegExpComparator';

/**
 * Diff type enumeration
 */
export type DiffType = 'primitive' | 'object' | 'array' | 'map' | 'set' | 'date' | 'regexp' | 'function' | 'circular';

/**
 * Value diff result
 */
export interface ValueDiff {
  /** Type of diff */
  type: DiffType;
  /** Whether values are equal */
  equal: boolean;
  /** Old primitive value */
  oldPrimitive?: unknown;
  /** New primitive value */
  newPrimitive?: unknown;
  /** Object changes */
  objectChanges?: Record<string, ValueDiff>;
  /** Array changes */
  arrayChanges?: {
    added: number[];
    removed: number[];
    moved: number[];
    modified: Array<{ index: number; diff: ValueDiff }>;
  };
  /** Circular reference path */
  circularPath?: string[];
}

/**
 * Diff generation options
 */
export interface DiffOptions {
  /** Maximum depth to traverse */
  maxDepth: number;
  /** Whether to use deep comparison */
  deepComparison: boolean;
  /** Whether to track circular references */
  trackCircular: boolean;
  /** Whether to ignore functions */
  ignoreFunctions: boolean;
  /** Whether to ignore undefined */
  ignoreUndefined: boolean;
}

/**
 * Default diff options
 */
export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  maxDepth: 10,
  deepComparison: true,
  trackCircular: true,
  ignoreFunctions: false,
  ignoreUndefined: false,
};

/**
 * DiffGenerator provides detailed diff generation
 * for all value types
 */
export class DiffGenerator {
  private primitiveComparator?: PrimitiveComparator;
  private arrayComparator?: ArrayComparator;
  private objectComparator?: ObjectComparator;
  private mapSetComparator?: MapSetComparator;
  private dateRegExpComparator?: DateRegExpComparator;
  private options: DiffOptions;

  constructor(
    options: Partial<DiffOptions> = {},
    primitiveComparator?: PrimitiveComparator,
    arrayComparator?: ArrayComparator,
    objectComparator?: ObjectComparator,
    mapSetComparator?: MapSetComparator,
    dateRegExpComparator?: DateRegExpComparator
  ) {
    this.options = { ...DEFAULT_DIFF_OPTIONS, ...options };
    this.primitiveComparator = primitiveComparator;
    this.arrayComparator = arrayComparator;
    this.objectComparator = objectComparator;
    this.mapSetComparator = mapSetComparator;
    this.dateRegExpComparator = dateRegExpComparator;
  }

  /**
   * Generate diff between two values
   * @param a - First value
   * @param b - Second value
   * @param path - Current path in object tree
   * @param depth - Current depth
   * @returns Value diff result
   */
  generateDiff(a: unknown, b: unknown, path: string[] = [], depth: number = 0): ValueDiff {
    // Check max depth
    if (depth > this.options.maxDepth) {
      return {
        type: 'primitive',
        equal: true,
        oldPrimitive: a,
        newPrimitive: b,
      };
    }

    // Handle primitives
    if (this.isPrimitive(a) || this.isPrimitive(b)) {
      return this.diffPrimitives(a, b);
    }

    // Handle functions
    if (typeof a === 'function' || typeof b === 'function') {
      return this.diffFunctions(a, b);
    }

    // Handle dates
    if (this.isDate(a) || this.isDate(b)) {
      return this.diffDates(a as Date, b as Date);
    }

    // Handle regexps
    if (this.isRegExp(a) || this.isRegExp(b)) {
      return this.diffRegExps(a as RegExp, b as RegExp);
    }

    // Handle maps
    if (this.isMap(a) || this.isMap(b)) {
      return this.diffMaps(a as Map<unknown, unknown>, b as Map<unknown, unknown>, path, depth);
    }

    // Handle sets
    if (this.isSet(a) || this.isSet(b)) {
      return this.diffSets(a as Set<unknown>, b as Set<unknown>);
    }

    // Handle arrays
    if (Array.isArray(a) || Array.isArray(b)) {
      return this.diffArrays(a as unknown[], b as unknown[], path, depth);
    }

    // Handle objects
    return this.diffObjects(a as Record<string, unknown>, b as Record<string, unknown>, path, depth);
  }

  /**
   * Check if value is primitive
   */
  private isPrimitive(value: unknown): boolean {
    return (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'symbol' ||
      typeof value === 'bigint' ||
      value === undefined
    );
  }

  /**
   * Diff primitive values
   */
  private diffPrimitives(a: unknown, b: unknown): ValueDiff {
    const equal = Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b));

    return {
      type: 'primitive',
      equal,
      oldPrimitive: a,
      newPrimitive: b,
    };
  }

  /**
   * Diff functions
   */
  private diffFunctions(a: unknown, b: unknown): ValueDiff {
    if (this.options.ignoreFunctions) {
      return {
        type: 'function',
        equal: true,
      };
    }

    const aStr = typeof a === 'function' ? a.toString() : String(a);
    const bStr = typeof b === 'function' ? b.toString() : String(b);
    const equal = aStr === bStr;

    return {
      type: 'function',
      equal,
      oldPrimitive: aStr,
      newPrimitive: bStr,
    };
  }

  /**
   * Diff dates
   */
  private diffDates(a: Date, b: Date): ValueDiff {
    if (!this.dateRegExpComparator) {
      return this.createSimpleDiff('date', a, b);
    }

    const equal = this.dateRegExpComparator.areEqual(a, b);

    return {
      type: 'date',
      equal,
      oldPrimitive: a.getTime(),
      newPrimitive: b.getTime(),
    };
  }

  /**
   * Diff regexps
   */
  private diffRegExps(a: RegExp, b: RegExp): ValueDiff {
    if (!this.dateRegExpComparator) {
      return this.createSimpleDiff('regexp', a, b);
    }

    const equal = this.dateRegExpComparator.areEqual(a, b);

    return {
      type: 'regexp',
      equal,
      oldPrimitive: a.toString(),
      newPrimitive: b.toString(),
    };
  }

  /**
   * Diff maps
   */
  private diffMaps(a: Map<unknown, unknown>, b: Map<unknown, unknown>, path: string[], depth: number): ValueDiff {
    if (!this.mapSetComparator) {
      return this.createSimpleDiff('map', a, b);
    }

    const equal = this.mapSetComparator.areEqual(a, b, this.options.deepComparison);

    if (equal) {
      return {
        type: 'map',
        equal: true,
      };
    }

    // Compute detailed changes
    const changes: Record<string, ValueDiff> = {};

    for (const [key, value] of a.entries()) {
      const keyStr = String(key);
      if (!b.has(key)) {
        changes[keyStr] = {
          type: 'primitive',
          equal: false,
          oldPrimitive: value,
          newPrimitive: undefined,
        };
      } else {
        const bValue = b.get(key);
        if (!this.mapSetComparator.areEqual(new Map([[key, value]]), new Map([[key, bValue]]), this.options.deepComparison)) {
          changes[keyStr] = this.generateDiff(value, bValue, [...path, keyStr], depth + 1);
        }
      }
    }

    for (const [key, value] of b.entries()) {
      const keyStr = String(key);
      if (!a.has(key)) {
        changes[keyStr] = {
          type: 'primitive',
          equal: false,
          oldPrimitive: undefined,
          newPrimitive: value,
        };
      }
    }

    return {
      type: 'map',
      equal: false,
      objectChanges: changes,
    };
  }

  /**
   * Diff sets
   */
  private diffSets(a: Set<unknown>, b: Set<unknown>): ValueDiff {
    if (!this.mapSetComparator) {
      return this.createSimpleDiff('set', a, b);
    }

    const equal = this.mapSetComparator.areEqual(a, b, this.options.deepComparison);

    if (equal) {
      return {
        type: 'set',
        equal: true,
      };
    }

    const added: number[] = [];
    const removed: number[] = [];

    let index = 0;
    for (const value of a.values()) {
      if (!b.has(value)) {
        removed.push(index);
      }
      index++;
    }

    index = 0;
    for (const value of b.values()) {
      if (!a.has(value)) {
        added.push(index);
      }
      index++;
    }

    return {
      type: 'set',
      equal: false,
      arrayChanges: {
        added,
        removed,
        moved: [],
        modified: [],
      },
    };
  }

  /**
   * Diff arrays
   */
  private diffArrays(a: unknown[], b: unknown[], path: string[], depth: number): ValueDiff {
    if (!this.arrayComparator) {
      return this.createSimpleDiff('array', a, b);
    }

    const equal = this.arrayComparator.areEqual(a, b, this.options.deepComparison);

    if (equal) {
      return {
        type: 'array',
        equal: true,
      };
    }

    const changes = this.arrayComparator.computeChanges(a, b, this.options.deepComparison);

    // Convert modified diffs to ValueDiff
    const modifiedDiffs = changes.modified.map(m => ({
      index: m.index,
      diff: this.generateDiff((a as any)[m.index], (b as any)[m.index], [...path, String(m.index)], depth + 1),
    }));

    return {
      type: 'array',
      equal: false,
      arrayChanges: {
        added: changes.added,
        removed: changes.removed,
        moved: changes.moved,
        modified: modifiedDiffs,
      },
    };
  }

  /**
   * Diff objects
   */
  private diffObjects(a: Record<string, unknown>, b: Record<string, unknown>, path: string[], depth: number): ValueDiff {
    if (!this.objectComparator) {
      return this.createSimpleDiff('object', a, b);
    }

    const equal = this.objectComparator.areEqual(a, b, this.options.deepComparison, false);

    if (equal) {
      return {
        type: 'object',
        equal: true,
      };
    }

    const changes = this.objectComparator.computeChanges(a, b, this.options.deepComparison, false);

    // Convert modified diffs to ValueDiff
    const objectChanges: Record<string, ValueDiff> = {};

    for (const key of changes.removed) {
      objectChanges[key] = {
        type: 'primitive',
        equal: false,
        oldPrimitive: a[key as keyof typeof a],
        newPrimitive: undefined,
      };
    }

    for (const key of changes.added) {
      objectChanges[key] = {
        type: 'primitive',
        equal: false,
        oldPrimitive: undefined,
        newPrimitive: b[key as keyof typeof b],
      };
    }

    for (const mod of changes.modified) {
      objectChanges[mod.key] = this.generateDiff(
        a[mod.key as keyof typeof a],
        b[mod.key as keyof typeof b],
        [...path, mod.key],
        depth + 1
      );
    }

    return {
      type: 'object',
      equal: false,
      objectChanges,
    };
  }

  /**
   * Create simple diff for types without dedicated comparators
   */
  private createSimpleDiff(type: DiffType, a: unknown, b: unknown): ValueDiff {
    const equal = Object.is(a, b);

    return {
      type,
      equal,
      oldPrimitive: a,
      newPrimitive: b,
    };
  }

  /**
   * Check if value is Date
   */
  private isDate(value: unknown): value is Date {
    return value instanceof Date;
  }

  /**
   * Check if value is RegExp
   */
  private isRegExp(value: unknown): value is RegExp {
    return value instanceof RegExp;
  }

  /**
   * Check if value is Map
   */
  private isMap(value: unknown): value is Map<unknown, unknown> {
    return value instanceof Map;
  }

  /**
   * Check if value is Set
   */
  private isSet(value: unknown): value is Set<unknown> {
    return value instanceof Set;
  }

  /**
   * Get diff summary
   * @param diff - Value diff
   * @returns Summary string
   */
  getSummary(diff: ValueDiff): string {
    if (diff.equal) {
      return 'No changes';
    }

    const parts: string[] = [];

    if (diff.type === 'object' && diff.objectChanges) {
      const keys = Object.keys(diff.objectChanges);
      if (keys.length > 0) {
        parts.push(`${keys.length} properties changed`);
      }
    }

    if (diff.type === 'array' && diff.arrayChanges) {
      const { added, removed, modified } = diff.arrayChanges;
      if (added.length > 0) parts.push(`${added.length} added`);
      if (removed.length > 0) parts.push(`${removed.length} removed`);
      if (modified.length > 0) parts.push(`${modified.length} modified`);
    }

    if (diff.type === 'primitive' && !diff.equal) {
      parts.push(`Changed from ${this.stringify(diff.oldPrimitive)} to ${this.stringify(diff.newPrimitive)}`);
    }

    return parts.join(', ') || 'Changed';
  }

  /**
   * Stringify value for summary
   */
  private stringify(value: unknown): string {
    if (typeof value === 'string') return `"${value}"`;
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Object]';
      }
    }
    return String(value);
  }

  /**
   * Get options
   */
  getOptions(): DiffOptions {
    return { ...this.options };
  }

  /**
   * Set options
   */
  setOptions(options: Partial<DiffOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

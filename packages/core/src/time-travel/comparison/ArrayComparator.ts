/**
 * ArrayComparator - Compares Array objects
 *
 * Provides comparison for Array types with support for sparse arrays,
 * moved detection, and deep comparison for elements.
 */

import type { PrimitiveComparator } from './PrimitiveComparator';

/**
 * Array comparison result
 */
export interface ArrayResult {
  /** Whether arrays are equal */
  isEqual: boolean;
  /** Length difference */
  lengthDifference: number;
  /** Number of added elements */
  added: number;
  /** Number of removed elements */
  removed: number;
  /** Number of moved elements */
  moved: number;
  /** Number of modified elements */
  modified: number;
}

/**
 * Array change details
 */
export interface ArrayChanges {
  /** Indices of added elements */
  added: number[];
  /** Indices of removed elements */
  removed: number[];
  /** Indices of moved elements */
  moved: number[];
  /** Indices and diffs of modified elements */
  modified: Array<{ index: number; diff: unknown }>;
}

/**
 * ArrayComparator provides Array comparison
 * with support for sparse arrays and moved detection
 */
export class ArrayComparator {
  private primitiveComparator?: PrimitiveComparator;

  constructor(primitiveComparator?: PrimitiveComparator) {
    this.primitiveComparator = primitiveComparator;
  }

  /**
   * Check if value is Array
   * @param value - Value to check
   * @returns True if Array
   */
  isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  /**
   * Compare two arrays
   * @param a - First array
   * @param b - Second array
   * @param useDeepComparison - Whether to use deep comparison for elements
   * @returns Comparison result
   */
  compare(a: unknown[], b: unknown[], useDeepComparison: boolean = false): ArrayResult {
    const isEqual = this.areEqual(a, b, useDeepComparison);
    const changes = this.computeChanges(a, b, useDeepComparison);

    return {
      isEqual,
      lengthDifference: a.length - b.length,
      added: changes.added.length,
      removed: changes.removed.length,
      moved: changes.moved.length,
      modified: changes.modified.length,
    };
  }

  /**
   * Check if two arrays are equal
   * @param a - First array
   * @param b - Second array
   * @param useDeepComparison - Whether to use deep comparison for elements
   * @returns True if equal
   */
  areEqual(a: unknown[], b: unknown[], useDeepComparison: boolean = false): boolean {
    // Different lengths - not equal
    if (a.length !== b.length) return false;

    // Empty arrays are equal
    if (a.length === 0) return true;

    // Check each element
    for (let i = 0; i < a.length; i++) {
      // Handle sparse arrays - check if index exists in both
      const aHasIndex = i in a;
      const bHasIndex = i in b;

      if (aHasIndex !== bHasIndex) return false;

      // Both don't have index - continue (sparse)
      if (!aHasIndex) continue;

      const aValue = a[i];
      const bValue = b[i];

      if (useDeepComparison && this.primitiveComparator) {
        if (!this.primitiveComparator.areEqual(aValue, bValue)) {
          return false;
        }
      } else {
        if (!Object.is(aValue, bValue)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Compute detailed changes between arrays
   * @param a - First array
   * @param b - Second array
   * @param useDeepComparison - Whether to use deep comparison
   * @returns Array changes
   */
  computeChanges(a: unknown[], b: unknown[], useDeepComparison: boolean = false): ArrayChanges {
    const added: number[] = [];
    const removed: number[] = [];
    const moved: number[] = [];
    const modified: Array<{ index: number; diff: unknown }> = [];

    const maxLength = Math.max(a.length, b.length);

    // Track which values in b have been matched
    const matchedInB = new Set<number>();

    for (let i = 0; i < maxLength; i++) {
      const aHasIndex = i in a;
      const bHasIndex = i in b;

      if (aHasIndex && !bHasIndex) {
        // Removed from a
        removed.push(i);
      } else if (!aHasIndex && bHasIndex) {
        // Added in b
        added.push(i);
      } else if (aHasIndex && bHasIndex) {
        // Both exist - check if moved or modified
        const aValue = a[i];
        const bValue = b[i];

        // Check if value moved
        const movedIndex = this.findMovedValue(aValue, b, i, matchedInB, useDeepComparison);
        if (movedIndex !== -1) {
          moved.push(i);
          matchedInB.add(movedIndex);
        } else if (useDeepComparison && this.primitiveComparator) {
          if (!this.primitiveComparator.areEqual(aValue, bValue)) {
            modified.push({ index: i, diff: { old: aValue, new: bValue } });
          }
        } else if (!Object.is(aValue, bValue)) {
          modified.push({ index: i, diff: { old: aValue, new: bValue } });
        }
      }
    }

    return { added, removed, moved, modified };
  }

  /**
   * Find if a value has moved to a different position in b
   * @param value - Value to find
   * @param b - Target array
   * @param currentIndex - Current index in a
   * @param matchedInB - Set of already matched indices in b
   * @param useDeepComparison - Whether to use deep comparison
   * @returns Index in b where value was found, or -1
   */
  private findMovedValue(
    value: unknown,
    b: unknown[],
    currentIndex: number,
    matchedInB: Set<number>,
    useDeepComparison: boolean = false
  ): number {
    for (let j = 0; j < b.length; j++) {
      // Skip if already matched or same index
      if (matchedInB.has(j) || j === currentIndex) continue;

      const bValue = b[j];

      if (useDeepComparison && this.primitiveComparator) {
        if (this.primitiveComparator.areEqual(value, bValue)) {
          return j;
        }
      } else if (Object.is(value, bValue)) {
        return j;
      }
    }

    return -1;
  }

  /**
   * Get array length
   * @param array - Array
   * @returns Length of array
   */
  getLength(array: unknown[]): number {
    return array.length;
  }

  /**
   * Check if array is sparse
   * @param array - Array to check
   * @returns True if sparse
   */
  isSparse(array: unknown[]): boolean {
    let definedCount = 0;
    for (let i = 0; i < array.length; i++) {
      if (i in array) {
        definedCount++;
      }
    }
    return definedCount < array.length;
  }

  /**
   * Get sparse indices
   * @param array - Array to check
   * @returns Array of indices that are defined
   */
  getSparseIndices(array: unknown[]): number[] {
    const indices: number[] = [];
    for (let i = 0; i < array.length; i++) {
      if (i in array) {
        indices.push(i);
      }
    }
    return indices;
  }

  /**
   * Get dense values (skip holes)
   * @param array - Array to process
   * @returns Array of defined values
   */
  getDenseValues(array: unknown[]): unknown[] {
    const values: unknown[] = [];
    for (let i = 0; i < array.length; i++) {
      if (i in array) {
        values.push(array[i]);
      }
    }
    return values;
  }

  /**
   * Check if array is empty
   * @param array - Array to check
   * @returns True if empty
   */
  isEmpty(array: unknown[]): boolean {
    return array.length === 0;
  }

  /**
   * Get array display value
   * @param array - Array
   * @returns String representation
   */
  getDisplayValue(array: unknown[]): string {
    const parts: string[] = [];
    for (let i = 0; i < array.length; i++) {
      if (!(i in array)) {
        parts.push('<empty>');
      } else {
        parts.push(this.stringify(array[i]));
      }
    }
    return `[${parts.join(', ')}]`;
  }

  /**
   * Stringify value for display
   * @param value - Value to stringify
   * @returns String representation
   */
  private stringify(value: unknown): string {
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'symbol') return value.toString();
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'function') return value.toString();
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
   * Create array from values
   * @param values - Values to create array from
   * @returns New array
   */
  createArray(...values: unknown[]): unknown[] {
    return [...values];
  }

  /**
   * Create sparse array
   * @param length - Length of array
   * @param definedIndices - Indices to define
   * @param value - Value for defined indices
   * @returns Sparse array
   */
  createSparseArray(length: number, definedIndices: number[], value: unknown = 'defined'): unknown[] {
    const array: unknown[] = new Array(length);
    for (const index of definedIndices) {
      if (index >= 0 && index < length) {
        array[index] = value;
      }
    }
    return array;
  }

  /**
   * Get element at index with bounds checking
   * @param array - Array
   * @param index - Index to get
   * @returns Value at index or undefined
   */
  getElement(array: unknown[], index: number): unknown {
    if (index < 0 || index >= array.length) return undefined;
    return array[index];
  }

  /**
   * Check if index exists in array
   * @param array - Array
   * @param index - Index to check
   * @returns True if index exists
   */
  hasIndex(array: unknown[], index: number): boolean {
    return index >= 0 && index < array.length && index in array;
  }

  /**
   * Get first element
   * @param array - Array
   * @returns First element or undefined
   */
  getFirst(array: unknown[]): unknown {
    return array.length > 0 ? array[0] : undefined;
  }

  /**
   * Get last element
   * @param array - Array
   * @returns Last element or undefined
   */
  getLast(array: unknown[]): unknown {
    return array.length > 0 ? array[array.length - 1] : undefined;
  }

  /**
   * Get unique values from array
   * @param array - Array
   * @returns Array of unique values
   */
  getUniqueValues(array: unknown[]): unknown[] {
    const seen = new Set();
    const unique: unknown[] = [];
    for (const value of array) {
      if (!seen.has(value)) {
        seen.add(value);
        unique.push(value);
      }
    }
    return unique;
  }

  /**
   * Check if arrays have same length
   * @param a - First array
   * @param b - Second array
   * @returns True if same length
   */
  haveSameLength(a: unknown[], b: unknown[]): boolean {
    return a.length === b.length;
  }

  /**
   * Get length difference
   * @param a - First array
   * @param b - Second array
   * @returns Length difference
   */
  getLengthDifference(a: unknown[], b: unknown[]): number {
    return a.length - b.length;
  }

  /**
   * Find index of value
   * @param array - Array
   * @param value - Value to find
   * @param useDeepComparison - Whether to use deep comparison
   * @returns Index of value or -1
   */
  indexOf(array: unknown[], value: unknown, useDeepComparison: boolean = false): number {
    for (let i = 0; i < array.length; i++) {
      if (!(i in array)) continue;

      const arrayValue = array[i];

      if (useDeepComparison && this.primitiveComparator) {
        if (this.primitiveComparator.areEqual(value, arrayValue)) {
          return i;
        }
      } else if (Object.is(value, arrayValue)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Check if array includes value
   * @param array - Array
   * @param value - Value to check
   * @param useDeepComparison - Whether to use deep comparison
   * @returns True if includes value
   */
  includes(array: unknown[], value: unknown, useDeepComparison: boolean = false): boolean {
    return this.indexOf(array, value, useDeepComparison) !== -1;
  }
}

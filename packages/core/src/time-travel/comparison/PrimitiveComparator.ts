/**
 * PrimitiveComparator - Compares primitive values
 *
 * Provides comparison for numbers, strings, booleans, null, undefined, symbols, and bigints.
 */

/**
 * Primitive comparison result
 */
export interface PrimitiveResult {
  /** Whether values are equal */
  isEqual: boolean;
  /** Type of first value */
  typeA: string;
  /** Type of second value */
  typeB: string;
  /** Whether both are primitives */
  bothPrimitives: boolean;
}

/**
 * PrimitiveComparator provides primitive value comparison
 * without external dependencies
 */
export class PrimitiveComparator {
  /**
   * Check if value is primitive
   * @param value - Value to check
   * @returns True if primitive
   */
  isPrimitive(value: unknown): boolean {
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
   * Compare two primitive values
   * @param a - First value
   * @param b - Second value
   * @returns Comparison result
   */
  compare(a: unknown, b: unknown): PrimitiveResult {
    return {
      isEqual: this.areEqual(a, b),
      typeA: this.getType(a),
      typeB: this.getType(b),
      bothPrimitives: this.isPrimitive(a) && this.isPrimitive(b),
    };
  }

  /**
   * Check if two primitive values are equal
   * @param a - First value
   * @param b - Second value
   * @returns True if equal
   */
  areEqual(a: unknown, b: unknown): boolean {
    // Handle same value (includes null, undefined, true, false)
    if (a === b) return true;

    // Handle NaN (NaN !== NaN but should be equal for comparison)
    if (this.isNaN(a) && this.isNaN(b)) return true;

    // Handle +0 and -0 (Object.is handles this)
    if (this.isZero(a) && this.isZero(b)) return true;

    // Handle different types
    if (typeof a !== typeof b) return false;

    // Handle primitives
    if (this.isPrimitive(a) && this.isPrimitive(b)) {
      return Object.is(a, b);
    }

    // Not primitives - delegate to other comparators
    return false;
  }

  /**
   * Get type of value
   * @param value - Value to get type
   * @returns Type string
   */
  getType(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    return typeof value;
  }

  /**
   * Check if value is NaN
   * @param value - Value to check
   * @returns True if NaN
   */
  isNaN(value: unknown): boolean {
    return typeof value === 'number' && Number.isNaN(value);
  }

  /**
   * Check if value is zero (+0 or -0)
   * @param value - Value to check
   * @returns True if zero
   */
  isZero(value: unknown): boolean {
    return typeof value === 'number' && value === 0;
  }

  /**
   * Compare numbers with special handling for NaN and zeros
   * @param a - First number
   * @param b - Second number
   * @returns True if equal
   */
  compareNumbers(a: number, b: number): boolean {
    // Handle NaN
    if (Number.isNaN(a) && Number.isNaN(b)) return true;

    // Handle +0 and -0
    if (a === 0 && b === 0) return true;

    // Regular comparison
    return a === b;
  }

  /**
   * Compare strings
   * @param a - First string
   * @param b - Second string
   * @returns True if equal
   */
  compareStrings(a: string, b: string): boolean {
    return a === b;
  }

  /**
   * Compare booleans
   * @param a - First boolean
   * @param b - Second boolean
   * @returns True if equal
   */
  compareBooleans(a: boolean, b: boolean): boolean {
    return a === b;
  }

  /**
   * Compare symbols
   * @param a - First symbol
   * @param b - Second symbol
   * @returns True if equal
   */
  compareSymbols(a: symbol, b: symbol): boolean {
    return a === b;
  }

  /**
   * Compare bigints
   * @param a - First bigint
   * @param b - Second bigint
   * @returns True if equal
   */
  compareBigints(a: bigint, b: bigint): boolean {
    return a === b;
  }

  /**
   * Compare null values
   * @param a - First value
   * @param b - Second value
   * @returns True if both null
   */
  compareNull(a: unknown, b: unknown): boolean {
    return a === null && b === null;
  }

  /**
   * Compare undefined values
   * @param a - First value
   * @param b - Second value
   * @returns True if both undefined
   */
  compareUndefined(a: unknown, b: unknown): boolean {
    return a === undefined && b === undefined;
  }

  /**
   * Get primitive value for display
   * @param value - Primitive value
   * @returns String representation
   */
  getDisplayValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (this.isNaN(value)) return 'NaN';
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'bigint') return value.toString() + 'n';
    return String(value);
  }
}

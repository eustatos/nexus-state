/**
 * DateRegExpComparator - Compares Date and RegExp objects
 *
 * Provides comparison for Date and RegExp types with special handling.
 */

/**
 * Date/RegExp comparison result
 */
export interface DateRegExpResult {
  /** Whether values are equal */
  isEqual: boolean;
  /** Type of first value */
  typeA: 'date' | 'regexp' | 'other';
  /** Type of second value */
  typeB: 'date' | 'regexp' | 'other';
  /** Whether both are same type */
  sameType: boolean;
}

/**
 * DateRegExpComparator provides Date and RegExp comparison
 * without external dependencies
 */
export class DateRegExpComparator {
  /**
   * Check if value is Date
   * @param value - Value to check
   * @returns True if Date
   */
  isDate(value: unknown): value is Date {
    return value instanceof Date;
  }

  /**
   * Check if value is RegExp
   * @param value - Value to check
   * @returns True if RegExp
   */
  isRegExp(value: unknown): value is RegExp {
    return value instanceof RegExp;
  }

  /**
   * Compare Date or RegExp values
   * @param a - First value
   * @param b - Second value
   * @returns Comparison result
   */
  compare(a: unknown, b: unknown): DateRegExpResult {
    const typeA = this.getType(a);
    const typeB = this.getType(b);

    return {
      isEqual: this.areEqual(a, b),
      typeA,
      typeB,
      sameType: typeA === typeB && typeA !== 'other',
    };
  }

  /**
   * Check if two Date/RegExp values are equal
   * @param a - First value
   * @param b - Second value
   * @returns True if equal
   */
  areEqual(a: unknown, b: unknown): boolean {
    // Handle Date
    if (this.isDate(a) && this.isDate(b)) {
      return this.compareDates(a, b);
    }

    // Handle RegExp
    if (this.isRegExp(a) && this.isRegExp(b)) {
      return this.compareRegExps(a, b);
    }

    // Different types or not Date/RegExp
    return false;
  }

  /**
   * Get type of value
   * @param value - Value to get type
   * @returns Type string
   */
  getType(value: unknown): 'date' | 'regexp' | 'other' {
    if (this.isDate(value)) return 'date';
    if (this.isRegExp(value)) return 'regexp';
    return 'other';
  }

  /**
   * Compare two Date objects
   * @param a - First Date
   * @param b - Second Date
   * @returns True if equal
   */
  compareDates(a: Date, b: Date): boolean {
    // Handle invalid dates
    if (this.isInvalidDate(a) || this.isInvalidDate(b)) {
      return this.isInvalidDate(a) && this.isInvalidDate(b);
    }

    // Compare timestamps
    return a.getTime() === b.getTime();
  }

  /**
   * Compare two RegExp objects
   * @param a - First RegExp
   * @param b - Second RegExp
   * @returns True if equal
   */
  compareRegExps(a: RegExp, b: RegExp): boolean {
    // Compare source pattern
    if (a.source !== b.source) return false;

    // Compare flags
    if (a.flags !== b.flags) return false;

    // Compare lastIndex (usually 0, but can be set)
    if (a.lastIndex !== b.lastIndex) return false;

    return true;
  }

  /**
   * Check if Date is invalid
   * @param date - Date to check
   * @returns True if invalid
   */
  isInvalidDate(date: Date): boolean {
    return Number.isNaN(date.getTime());
  }

  /**
   * Get timestamp from Date
   * @param date - Date object
   * @returns Timestamp in milliseconds
   */
  getTimestamp(date: Date): number {
    return date.getTime();
  }

  /**
   * Get ISO string from Date
   * @param date - Date object
   * @returns ISO 8601 string
   */
  getISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Get RegExp source pattern
   * @param regexp - RegExp object
   * @returns Source pattern string
   */
  getRegExpSource(regexp: RegExp): string {
    return regexp.source;
  }

  /**
   * Get RegExp flags
   * @param regexp - RegExp object
   * @returns Flags string
   */
  getRegExpFlags(regexp: RegExp): string {
    return regexp.flags;
  }

  /**
   * Get RegExp string representation
   * @param regexp - RegExp object
   * @returns String representation (e.g., "/pattern/flags")
   */
  getRegExpString(regexp: RegExp): string {
    return regexp.toString();
  }

  /**
   * Get display value for Date
   * @param date - Date object
   * @returns String representation
   */
  getDateDisplayValue(date: Date): string {
    if (this.isInvalidDate(date)) {
      return 'Invalid Date';
    }
    return date.toISOString();
  }

  /**
   * Get display value for RegExp
   * @param regexp - RegExp object
   * @returns String representation
   */
  getRegExpDisplayValue(regexp: RegExp): string {
    return regexp.toString();
  }

  /**
   * Create Date from timestamp
   * @param timestamp - Timestamp in milliseconds
   * @returns Date object
   */
  createDateFromTimestamp(timestamp: number): Date {
    return new Date(timestamp);
  }

  /**
   * Create RegExp from source and flags
   * @param source - Source pattern
   * @param flags - Flags string
   * @returns RegExp object
   */
  createRegExp(source: string, flags?: string): RegExp {
    return new RegExp(source, flags);
  }

  /**
   * Check if RegExp has specific flag
   * @param regexp - RegExp object
   * @param flag - Flag to check
   * @returns True if has flag
   */
  hasRegExpFlag(regexp: RegExp, flag: string): boolean {
    return regexp.flags.includes(flag);
  }

  /**
   * Get common RegExp flags
   * @param regexp - RegExp object
   * @returns Object with flag states
   */
  getRegExpFlagStates(regexp: RegExp): {
    global: boolean;
    ignoreCase: boolean;
    multiline: boolean;
    dotAll: boolean;
    sticky: boolean;
    unicode: boolean;
  } {
    return {
      global: regexp.global,
      ignoreCase: regexp.ignoreCase,
      multiline: regexp.multiline,
      dotAll: regexp.dotAll,
      sticky: regexp.sticky,
      unicode: regexp.unicode,
    };
  }
}

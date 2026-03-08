/**
 * MapSetComparator - Compares Map and Set objects
 *
 * Provides comparison for Map and Set types with deep comparison for values.
 */

import type { PrimitiveComparator } from './PrimitiveComparator';

/**
 * Map/Set comparison result
 */
export interface MapSetResult {
  /** Whether values are equal */
  isEqual: boolean;
  /** Type of first value */
  typeA: 'map' | 'set' | 'other';
  /** Type of second value */
  typeB: 'map' | 'set' | 'other';
  /** Whether both are same type */
  sameType: boolean;
  /** Size difference */
  sizeDifference: number;
}

/**
 * MapSetComparator provides Map and Set comparison
 * with optional deep comparison for values
 */
export class MapSetComparator {
  private primitiveComparator?: PrimitiveComparator;

  constructor(primitiveComparator?: PrimitiveComparator) {
    this.primitiveComparator = primitiveComparator;
  }

  /**
   * Check if value is Map
   * @param value - Value to check
   * @returns True if Map
   */
  isMap(value: unknown): value is Map<unknown, unknown> {
    return value instanceof Map;
  }

  /**
   * Check if value is Set
   * @param value - Value to check
   * @returns True if Set
   */
  isSet(value: unknown): value is Set<unknown> {
    return value instanceof Set;
  }

  /**
   * Compare Map or Set values
   * @param a - First value
   * @param b - Second value
   * @param useDeepComparison - Whether to use deep comparison for values
   * @returns Comparison result
   */
  compare(
    a: unknown,
    b: unknown,
    useDeepComparison: boolean = false
  ): MapSetResult {
    const typeA = this.getType(a);
    const typeB = this.getType(b);

    let isEqual = this.areEqual(a, b, useDeepComparison);
    let sizeDifference = 0;

    if (this.isMap(a) && this.isMap(b)) {
      sizeDifference = a.size - b.size;
    } else if (this.isSet(a) && this.isSet(b)) {
      sizeDifference = a.size - b.size;
    }

    return {
      isEqual,
      typeA,
      typeB,
      sameType: typeA === typeB && typeA !== 'other',
      sizeDifference,
    };
  }

  /**
   * Check if two Map/Set values are equal
   * @param a - First value
   * @param b - Second value
   * @param useDeepComparison - Whether to use deep comparison for values
   * @returns True if equal
   */
  areEqual(
    a: unknown,
    b: unknown,
    useDeepComparison: boolean = false
  ): boolean {
    // Handle Map
    if (this.isMap(a) && this.isMap(b)) {
      return this.compareMaps(a, b, useDeepComparison);
    }

    // Handle Set
    if (this.isSet(a) && this.isSet(b)) {
      return this.compareSets(a, b, useDeepComparison);
    }

    // Different types or not Map/Set
    return false;
  }

  /**
   * Get type of value
   * @param value - Value to get type
   * @returns Type string
   */
  getType(value: unknown): 'map' | 'set' | 'other' {
    if (this.isMap(value)) return 'map';
    if (this.isSet(value)) return 'set';
    return 'other';
  }

  /**
   * Compare two Map objects
   * @param a - First Map
   * @param b - Second Map
   * @param useDeepComparison - Whether to use deep comparison for values
   * @returns True if equal
   */
  compareMaps(
    a: Map<unknown, unknown>,
    b: Map<unknown, unknown>,
    useDeepComparison: boolean = false
  ): boolean {
    // Different sizes - not equal
    if (a.size !== b.size) return false;

    // Empty maps are equal
    if (a.size === 0) return true;

    // Check each entry in a exists in b with equal value
    for (const [key, value] of a.entries()) {
      if (!b.has(key)) return false;

      const bValue = b.get(key);

      if (useDeepComparison && this.primitiveComparator) {
        // Use deep comparison if available
        if (!this.primitiveComparator.areEqual(value, bValue)) {
          return false;
        }
      } else {
        // Use Object.is for shallow comparison
        if (!Object.is(value, bValue)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Compare two Set objects
   * @param a - First Set
   * @param b - Second Set
   * @param useDeepComparison - Whether to use deep comparison for values
   * @returns True if equal
   */
  compareSets(
    a: Set<unknown>,
    b: Set<unknown>,
    useDeepComparison: boolean = false
  ): boolean {
    // Different sizes - not equal
    if (a.size !== b.size) return false;

    // Empty sets are equal
    if (a.size === 0) return true;

    // Check each value in a exists in b
    for (const value of a.values()) {
      if (!b.has(value)) return false;

      if (useDeepComparison && this.primitiveComparator) {
        // For deep comparison, check if any value in b is equal
        let found = false;
        for (const bValue of b.values()) {
          if (this.primitiveComparator.areEqual(value, bValue)) {
            found = true;
            break;
          }
        }
        if (!found) return false;
      }
    }

    return true;
  }

  /**
   * Get Map size
   * @param map - Map object
   * @returns Size of Map
   */
  getMapSize(map: Map<unknown, unknown>): number {
    return map.size;
  }

  /**
   * Get Set size
   * @param set - Set object
   * @returns Size of Set
   */
  getSetSize(set: Set<unknown>): number {
    return set.size;
  }

  /**
   * Get Map keys as array
   * @param map - Map object
   * @returns Array of keys
   */
  getMapKeys(map: Map<unknown, unknown>): unknown[] {
    return Array.from(map.keys());
  }

  /**
   * Get Map values as array
   * @param map - Map object
   * @returns Array of values
   */
  getMapValues(map: Map<unknown, unknown>): unknown[] {
    return Array.from(map.values());
  }

  /**
   * Get Map entries as array
   * @param map - Map object
   * @returns Array of [key, value] tuples
   */
  getMapEntries(map: Map<unknown, unknown>): Array<[unknown, unknown]> {
    return Array.from(map.entries());
  }

  /**
   * Get Set values as array
   * @param set - Set object
   * @returns Array of values
   */
  getSetValues(set: Set<unknown>): unknown[] {
    return Array.from(set.values());
  }

  /**
   * Check if Map has key
   * @param map - Map object
   * @param key - Key to check
   * @returns True if Map has key
   */
  mapHasKey(map: Map<unknown, unknown>, key: unknown): boolean {
    return map.has(key);
  }

  /**
   * Check if Set has value
   * @param set - Set object
   * @param value - Value to check
   * @returns True if Set has value
   */
  setHasValue(set: Set<unknown>, value: unknown): boolean {
    return set.has(value);
  }

  /**
   * Get Map value by key
   * @param map - Map object
   * @param key - Key to get
   * @returns Value or undefined
   */
  getMapValue(map: Map<unknown, unknown>, key: unknown): unknown {
    return map.get(key);
  }

  /**
   * Create Map from entries
   * @param entries - Array of [key, value] tuples
   * @returns New Map
   */
  createMapFromEntries(entries: Array<[unknown, unknown]>): Map<unknown, unknown> {
    return new Map(entries);
  }

  /**
   * Create Set from values
   * @param values - Array of values
   * @returns New Set
   */
  createSetFromValues(values: unknown[]): Set<unknown> {
    return new Set(values);
  }

  /**
   * Get Map display value
   * @param map - Map object
   * @returns String representation
   */
  getMapDisplayValue(map: Map<unknown, unknown>): string {
    const entries = this.getMapEntries(map);
    const entryStrings = entries.map(([key, value]) => {
      return `${this.stringify(key)} => ${this.stringify(value)}`;
    });
    return `Map(${map.size}) { ${entryStrings.join(', ')} }`;
  }

  /**
   * Get Set display value
   * @param set - Set object
   * @returns String representation
   */
  getSetDisplayValue(set: Set<unknown>): string {
    const values = this.getSetValues(set);
    const valueStrings = values.map(v => this.stringify(v));
    return `Set(${set.size}) { ${valueStrings.join(', ')} }`;
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
   * Check if Map is empty
   * @param map - Map object
   * @returns True if empty
   */
  isMapEmpty(map: Map<unknown, unknown>): boolean {
    return map.size === 0;
  }

  /**
   * Check if Set is empty
   * @param set - Set object
   * @returns True if empty
   */
  isSetEmpty(set: Set<unknown>): boolean {
    return set.size === 0;
  }

  /**
   * Get common keys between two Maps
   * @param a - First Map
   * @param b - Second Map
   * @returns Array of common keys
   */
  getCommonMapKeys(
    a: Map<unknown, unknown>,
    b: Map<unknown, unknown>
  ): unknown[] {
    const commonKeys: unknown[] = [];
    for (const key of a.keys()) {
      if (b.has(key)) {
        commonKeys.push(key);
      }
    }
    return commonKeys;
  }

  /**
   * Get common values between two Sets
   * @param a - First Set
   * @param b - Second Set
   * @returns Array of common values
   */
  getCommonSetValues(a: Set<unknown>, b: Set<unknown>): unknown[] {
    const commonValues: unknown[] = [];
    for (const value of a.values()) {
      if (b.has(value)) {
        commonValues.push(value);
      }
    }
    return commonValues;
  }

  /**
   * Get Map keys only in first Map
   * @param a - First Map
   * @param b - Second Map
   * @returns Array of keys only in a
   */
  getMapKeysOnlyInFirst(
    a: Map<unknown, unknown>,
    b: Map<unknown, unknown>
  ): unknown[] {
    const onlyInA: unknown[] = [];
    for (const key of a.keys()) {
      if (!b.has(key)) {
        onlyInA.push(key);
      }
    }
    return onlyInA;
  }

  /**
   * Get Set values only in first Set
   * @param a - First Set
   * @param b - Second Set
   * @returns Array of values only in a
   */
  getSetValuesOnlyInFirst(a: Set<unknown>, b: Set<unknown>): unknown[] {
    const onlyInA: unknown[] = [];
    for (const value of a.values()) {
      if (!b.has(value)) {
        onlyInA.push(value);
      }
    }
    return onlyInA;
  }
}

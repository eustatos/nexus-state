/**
 * ObjectComparator - Compares Object values
 *
 * Provides comparison for Object types with support for symbol keys,
 * prototype chain handling, and deep comparison for values.
 */

import type { PrimitiveComparator } from './PrimitiveComparator';

/**
 * Object comparison result
 */
export interface ObjectResult {
  /** Whether objects are equal */
  isEqual: boolean;
  /** Number of keys in first object */
  keysA: number;
  /** Number of keys in second object */
  keysB: number;
  /** Number of added keys */
  added: number;
  /** Number of removed keys */
  removed: number;
  /** Number of modified keys */
  modified: number;
}

/**
 * Object change details
 */
export interface ObjectChanges {
  /** Keys that were added */
  added: string[];
  /** Keys that were removed */
  removed: string[];
  /** Keys that were modified with diffs */
  modified: Array<{ key: string; diff: unknown }>;
}

/**
 * ObjectComparator provides Object comparison
 * with support for symbol keys and prototype chain
 */
export class ObjectComparator {
  private primitiveComparator?: PrimitiveComparator;

  constructor(primitiveComparator?: PrimitiveComparator) {
    this.primitiveComparator = primitiveComparator;
  }

  /**
   * Check if value is plain Object
   * @param value - Value to check
   * @returns True if plain Object
   */
  isObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
  }

  /**
   * Compare two objects
   * @param a - First object
   * @param b - Second object
   * @param useDeepComparison - Whether to use deep comparison for values
   * @param includeSymbols - Whether to include symbol keys
   * @returns Comparison result
   */
  compare(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
    useDeepComparison: boolean = false,
    includeSymbols: boolean = false
  ): ObjectResult {
    const isEqual = this.areEqual(a, b, useDeepComparison, includeSymbols);
    const changes = this.computeChanges(a, b, useDeepComparison, includeSymbols);

    const keysA = this.getKeys(a, includeSymbols);
    const keysB = this.getKeys(b, includeSymbols);

    return {
      isEqual,
      keysA: keysA.length,
      keysB: keysB.length,
      added: changes.added.length,
      removed: changes.removed.length,
      modified: changes.modified.length,
    };
  }

  /**
   * Check if two objects are equal
   * @param a - First object
   * @param b - Second object
   * @param useDeepComparison - Whether to use deep comparison for values
   * @param includeSymbols - Whether to include symbol keys
   * @returns True if equal
   */
  areEqual(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
    useDeepComparison: boolean = false,
    includeSymbols: boolean = false
  ): boolean {
    const keysA = this.getKeys(a, includeSymbols);
    const keysB = this.getKeys(b, includeSymbols);

    // Different number of keys - not equal
    if (keysA.length !== keysB.length) return false;

    // Empty objects are equal
    if (keysA.length === 0) return true;

    // Check each key in a exists in b with equal value
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;

      const aValue = a[key as keyof typeof a];
      const bValue = b[key as keyof typeof b];

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
   * Compute detailed changes between objects
   * @param a - First object
   * @param b - Second object
   * @param useDeepComparison - Whether to use deep comparison
   * @param includeSymbols - Whether to include symbol keys
   * @returns Object changes
   */
  computeChanges(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
    useDeepComparison: boolean = false,
    includeSymbols: boolean = false
  ): ObjectChanges {
    const added: string[] = [];
    const removed: string[] = [];
    const modified: Array<{ key: string; diff: unknown }> = [];

    const keysA = this.getKeys(a, includeSymbols);
    const keysB = this.getKeys(b, includeSymbols);
    const keysBSet = new Set(keysB);

    // Check for removed and modified keys
    for (const key of keysA) {
      if (!keysBSet.has(key)) {
        removed.push(key);
      } else {
        const aValue = a[key as keyof typeof a];
        const bValue = b[key as keyof typeof b];

        if (useDeepComparison && this.primitiveComparator) {
          if (!this.primitiveComparator.areEqual(aValue, bValue)) {
            modified.push({ key, diff: { old: aValue, new: bValue } });
          }
        } else if (!Object.is(aValue, bValue)) {
          modified.push({ key, diff: { old: aValue, new: bValue } });
        }
      }
    }

    // Check for added keys
    const keysASet = new Set(keysA);
    for (const key of keysB) {
      if (!keysASet.has(key)) {
        added.push(key);
      }
    }

    return { added, removed, modified };
  }

  /**
   * Get all keys (string and optionally symbol)
   * @param obj - Object
   * @param includeSymbols - Whether to include symbol keys
   * @returns Array of keys
   */
  getKeys(obj: Record<string, unknown>, includeSymbols: boolean = false): string[] {
    const keys = Object.keys(obj);

    if (includeSymbols) {
      const symbols = Object.getOwnPropertySymbols(obj);
      for (const sym of symbols) {
        if (Object.prototype.propertyIsEnumerable.call(obj, sym)) {
          keys.push(sym.toString());
        }
      }
    }

    return keys;
  }

  /**
   * Get object values
   * @param obj - Object
   * @returns Array of values
   */
  getValues(obj: Record<string, unknown>): unknown[] {
    return Object.values(obj);
  }

  /**
   * Get object entries
   * @param obj - Object
   * @returns Array of [key, value] tuples
   */
  getEntries(obj: Record<string, unknown>): Array<[string, unknown]> {
    return Object.entries(obj);
  }

  /**
   * Get object size (number of keys)
   * @param obj - Object
   * @returns Number of keys
   */
  getSize(obj: Record<string, unknown>): number {
    return Object.keys(obj).length;
  }

  /**
   * Check if object is empty
   * @param obj - Object
   * @returns True if empty
   */
  isEmpty(obj: Record<string, unknown>): boolean {
    return Object.keys(obj).length === 0;
  }

  /**
   * Get object value by key
   * @param obj - Object
   * @param key - Key to get
   * @returns Value or undefined
   */
  getValue(obj: Record<string, unknown>, key: string): unknown {
    return obj[key as keyof typeof obj];
  }

  /**
   * Check if object has key
   * @param obj - Object
   * @param key - Key to check
   * @returns True if has key
   */
  hasKey(obj: Record<string, unknown>, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /**
   * Get object display value
   * @param obj - Object
   * @param maxDepth - Maximum depth for nested objects
   * @returns String representation
   */
  getDisplayValue(obj: Record<string, unknown>, maxDepth: number = 2): string {
    const entries = this.getEntries(obj);
    const entryStrings = entries.map(([key, value]) => {
      return `${key}: ${this.stringify(value, maxDepth)}`;
    });
    return `{ ${entryStrings.join(', ')} }`;
  }

  /**
   * Stringify value for display
   * @param value - Value to stringify
   * @param depth - Current depth
   * @returns String representation
   */
  private stringify(value: unknown, depth: number = 0): string {
    if (depth > 2) return '...';

    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'symbol') return value.toString();
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'function') return value.toString();
    if (typeof value === 'object') {
      try {
        if (Array.isArray(value)) {
          return `[${value.map(v => this.stringify(v, depth + 1)).join(', ')}]`;
        }
        return JSON.stringify(value);
      } catch {
        return '[Object]';
      }
    }
    return String(value);
  }

  /**
   * Create object from entries
   * @param entries - Array of [key, value] tuples
   * @returns New object
   */
  createFromEntries(entries: Array<[string, unknown]>): Record<string, unknown> {
    return Object.fromEntries(entries);
  }

  /**
   * Get prototype of object
   * @param obj - Object
   * @returns Prototype or null
   */
  getPrototype(obj: Record<string, unknown>): object | null {
    return Object.getPrototypeOf(obj);
  }

  /**
   * Check if object has prototype chain
   * @param obj - Object
   * @returns True if has prototype chain
   */
  hasPrototypeChain(obj: Record<string, unknown>): boolean {
    const proto = this.getPrototype(obj);
    return proto !== null && proto !== Object.prototype;
  }

  /**
   * Get own property names
   * @param obj - Object
   * @returns Array of own property names
   */
  getOwnPropertyNames(obj: Record<string, unknown>): string[] {
    return Object.getOwnPropertyNames(obj);
  }

  /**
   * Get own property symbols
   * @param obj - Object
   * @returns Array of own property symbols
   */
  getOwnPropertySymbols(obj: Record<string, unknown>): symbol[] {
    return Object.getOwnPropertySymbols(obj);
  }

  /**
   * Get property descriptor
   * @param obj - Object
   * @param key - Property key
   * @returns Property descriptor or undefined
   */
  getPropertyDescriptor(obj: Record<string, unknown>, key: string): PropertyDescriptor | undefined {
    return Object.getOwnPropertyDescriptor(obj, key);
  }

  /**
   * Check if property is enumerable
   * @param obj - Object
   * @param key - Property key
   * @returns True if enumerable
   */
  isPropertyEnumerable(obj: Record<string, unknown>, key: string): boolean {
    return Object.prototype.propertyIsEnumerable.call(obj, key);
  }

  /**
   * Get common keys between two objects
   * @param a - First object
   * @param b - Second object
   * @returns Array of common keys
   */
  getCommonKeys(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
    const keysA = new Set(Object.keys(a));
    const commonKeys: string[] = [];
    for (const key of Object.keys(b)) {
      if (keysA.has(key)) {
        commonKeys.push(key);
      }
    }
    return commonKeys;
  }

  /**
   * Get keys only in first object
   * @param a - First object
   * @param b - Second object
   * @returns Array of keys only in a
   */
  getKeysOnlyInFirst(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
    const keysB = new Set(Object.keys(b));
    const onlyInA: string[] = [];
    for (const key of Object.keys(a)) {
      if (!keysB.has(key)) {
        onlyInA.push(key);
      }
    }
    return onlyInA;
  }

  /**
   * Pick keys from object
   * @param obj - Object
   * @param keys - Keys to pick
   * @returns New object with picked keys
   */
  pick(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      if (this.hasKey(obj, key)) {
        result[key] = obj[key as keyof typeof obj];
      }
    }
    return result;
  }

  /**
   * Omit keys from object
   * @param obj - Object
   * @param keys - Keys to omit
   * @returns New object without omitted keys
   */
  omit(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const keysToOmit = new Set(keys);
    for (const key of Object.keys(obj)) {
      if (!keysToOmit.has(key)) {
        result[key] = obj[key as keyof typeof obj];
      }
    }
    return result;
  }

  /**
   * Invert object (swap keys and values)
   * @param obj - Object
   * @returns Inverted object
   */
  invert(obj: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' || typeof value === 'number') {
        result[String(value)] = key;
      }
    }
    return result;
  }

  /**
   * Merge objects
   * @param objects - Objects to merge
   * @returns Merged object
   */
  merge(...objects: Array<Record<string, unknown>>): Record<string, unknown> {
    return Object.assign({}, ...objects);
  }

  /**
   * Deep clone object
   * @param obj - Object to clone
   * @returns Cloned object
   */
  deepClone(obj: Record<string, unknown>): Record<string, unknown> {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      // Fallback for non-JSON-serializable objects
      return { ...obj };
    }
  }

  /**
   * Check if objects have same keys
   * @param a - First object
   * @param b - Second object
   * @returns True if same keys
   */
  haveSameKeys(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => keysB.includes(key));
  }

  /**
   * Get key difference
   * @param a - First object
   * @param b - Second object
   * @returns Object with added and removed keys
   */
  getKeyDifference(a: Record<string, unknown>, b: Record<string, unknown>): {
    added: string[];
    removed: string[];
  } {
    return {
      added: this.getKeysOnlyInFirst(b, a),
      removed: this.getKeysOnlyInFirst(a, b),
    };
  }
}

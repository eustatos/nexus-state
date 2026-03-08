/**
 * ChangeComparisonStrategy - Strategies for comparing values
 *
 * Provides different comparison strategies for detecting changes.
 */

/**
 * Change type enumeration
 */
export type ChangeType = 'created' | 'deleted' | 'value' | 'type' | 'unchanged';

/**
 * Comparison result
 */
export interface ComparisonResult {
  /** Type of change detected */
  changeType: ChangeType;
  /** Whether values are different */
  hasChanged: boolean;
  /** Old value */
  oldValue: unknown;
  /** New value */
  newValue: unknown;
}

/**
 * ChangeComparisonStrategy provides value comparison
 * for change detection without external dependencies
 */
export class ChangeComparisonStrategy {
  /**
   * Detect type of change between old and new values
   * @param oldValue - Previous value
   * @param newValue - New value
   * @returns Type of change
   */
  detectChangeType(oldValue: unknown, newValue: unknown): ChangeType {
    if (oldValue === undefined && newValue !== undefined) {
      return 'created';
    }

    if (oldValue !== undefined && newValue === undefined) {
      return 'deleted';
    }

    if (typeof oldValue !== typeof newValue) {
      return 'type';
    }

    if (this.valuesAreDifferent(oldValue, newValue)) {
      return 'value';
    }

    return 'unchanged';
  }

  /**
   * Check if values are different
   * @param oldValue - Previous value
   * @param newValue - New value
   * @returns True if different
   */
  hasChanged(oldValue: unknown, newValue: unknown): boolean {
    const changeType = this.detectChangeType(oldValue, newValue);
    return changeType !== 'unchanged';
  }

  /**
   * Compare values and return detailed result
   * @param oldValue - Previous value
   * @param newValue - New value
   * @returns Comparison result
   */
  compare(oldValue: unknown, newValue: unknown): ComparisonResult {
    const changeType = this.detectChangeType(oldValue, newValue);
    return {
      changeType,
      hasChanged: changeType !== 'unchanged',
      oldValue,
      newValue,
    };
  }

  /**
   * Check if two values are different using deep comparison
   * @param oldValue - Previous value
   * @param newValue - New value
   * @returns True if different
   */
  private valuesAreDifferent(oldValue: unknown, newValue: unknown): boolean {
    // Handle null/undefined
    if (oldValue === null || newValue === null) {
      return oldValue !== newValue;
    }

    // Handle primitives
    if (this.isPrimitive(oldValue) && this.isPrimitive(newValue)) {
      return oldValue !== newValue;
    }

    // Handle arrays
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      return this.arraysAreDifferent(oldValue, newValue);
    }

    // Handle objects
    if (this.isObject(oldValue) && this.isObject(newValue)) {
      return this.objectsAreDifferent(oldValue, newValue);
    }

    // Fallback to string comparison
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }

  /**
   * Check if value is primitive
   * @param value - Value to check
   * @returns True if primitive
   */
  private isPrimitive(value: unknown): boolean {
    return (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'symbol' ||
      typeof value === 'bigint'
    );
  }

  /**
   * Check if value is object
   * @param value - Value to check
   * @returns True if object
   */
  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Check if arrays are different
   * @param oldArray - Previous array
   * @param newArray - New array
   * @returns True if different
   */
  private arraysAreDifferent(oldArray: unknown[], newArray: unknown[]): boolean {
    if (oldArray.length !== newArray.length) {
      return true;
    }

    for (let i = 0; i < oldArray.length; i++) {
      if (this.valuesAreDifferent(oldArray[i], newArray[i])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if objects are different
   * @param oldObj - Previous object
   * @param newObj - New object
   * @returns True if different
   */
  private objectsAreDifferent(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>
  ): boolean {
    const oldKeys = Object.keys(oldObj);
    const newKeys = Object.keys(newObj);

    if (oldKeys.length !== newKeys.length) {
      return true;
    }

    for (const key of oldKeys) {
      if (!Object.prototype.hasOwnProperty.call(newObj, key)) {
        return true;
      }

      if (this.valuesAreDifferent(oldObj[key], newObj[key])) {
        return true;
      }
    }

    return false;
  }
}

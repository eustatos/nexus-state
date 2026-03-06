/**
 * DeepCloneService - Safe deep cloning service
 *
 * Provides safe deep cloning without JSON.parse/stringify limitations.
 * Handles Date, RegExp, Map, Set, and circular references.
 */

export interface CloneOptions {
  /** Clone Maps */
  cloneMaps: boolean;
  /** Clone Sets */
  cloneSets: boolean;
  /** Clone Dates */
  cloneDates: boolean;
  /** Clone RegExp */
  cloneRegExp: boolean;
  /** Handle circular references */
  handleCircular: boolean;
  /** Max depth (0 = unlimited) */
  maxDepth: number;
}

const DEFAULT_OPTIONS: CloneOptions = {
  cloneMaps: true,
  cloneSets: true,
  cloneDates: true,
  cloneRegExp: true,
  handleCircular: true,
  maxDepth: 0,
};

/**
 * DeepCloneService provides safe deep cloning
 */
export class DeepCloneService {
  private options: CloneOptions;

  constructor(options?: Partial<CloneOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Clone any value safely
   * @param value Value to clone
   * @returns Cloned value
   */
  clone<T>(value: T): T {
    return this.cloneInternal(value, new Map(), 0);
  }

  /**
   * Internal clone implementation with circular reference tracking
   */
  private cloneInternal<T>(
    value: T,
    visited: Map<any, any>,
    depth: number
  ): T {
    // Check max depth
    if (this.options.maxDepth > 0 && depth >= this.options.maxDepth) {
      return value;
    }

    // Handle null/undefined/primitives
    if (value === null || typeof value !== 'object') {
      return value;
    }

    // Handle circular references
    if (this.options.handleCircular && visited.has(value)) {
      return visited.get(value);
    }

    // Handle Date
    if (value instanceof Date) {
      return (this.options.cloneDates ? new Date(value.getTime()) : value) as T;
    }

    // Handle RegExp
    if (value instanceof RegExp) {
      return (this.options.cloneRegExp
        ? new RegExp(value.source, value.flags)
        : value) as T;
    }

    // Handle Map
    if (value instanceof Map) {
      if (!this.options.cloneMaps) {
        return value;
      }
      const clonedMap = new Map();
      if (this.options.handleCircular) {
        visited.set(value, clonedMap);
      }
      for (const [key, val] of value.entries()) {
        clonedMap.set(
          key,
          this.cloneInternal(val, visited, depth + 1)
        );
      }
      return clonedMap as T;
    }

    // Handle Set
    if (value instanceof Set) {
      if (!this.options.cloneSets) {
        return value;
      }
      const clonedSet = new Set();
      if (this.options.handleCircular) {
        visited.set(value, clonedSet);
      }
      for (const val of value.values()) {
        clonedSet.add(this.cloneInternal(val, visited, depth + 1));
      }
      return clonedSet as T;
    }

    // Handle Array
    if (Array.isArray(value)) {
      const clonedArray: any[] = [];
      if (this.options.handleCircular) {
        visited.set(value, clonedArray);
      }
      for (let i = 0; i < value.length; i++) {
        clonedArray[i] = this.cloneInternal(value[i], visited, depth + 1);
      }
      return clonedArray as T;
    }

    // Handle Object
    const clonedObject: any = {};
    if (this.options.handleCircular) {
      visited.set(value, clonedObject);
    }
    for (const key of Object.keys(value)) {
      clonedObject[key] = this.cloneInternal(
        (value as any)[key],
        visited,
        depth + 1
      );
    }
    return clonedObject as T;
  }

  /**
   * Clone snapshot specifically (optimized for snapshot structure)
   * @param snapshot Snapshot to clone
   * @returns Cloned snapshot
   */
  cloneSnapshot<T extends { state: Record<string, any>; metadata: any }>(
    snapshot: T
  ): T {
    const clonedState: Record<string, any> = {};

    // Clone state entries
    for (const [key, entry] of Object.entries(snapshot.state)) {
      if (entry && typeof entry === 'object') {
        clonedState[key] = {
          value: this.clone(entry.value),
          type: entry.type,
          name: entry.name,
          atomId: entry.atomId,
        };
      } else {
        clonedState[key] = entry;
      }
    }

    return {
      ...snapshot,
      state: clonedState,
      metadata: this.clone(snapshot.metadata),
    };
  }

  /**
   * Quick clone for simple objects (no circular refs, no special types)
   * Faster than full clone but less safe
   * @param value Value to clone
   * @returns Cloned value
   */
  quickClone<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.quickClone(item)) as T;
    }

    const cloned: any = {};
    for (const key of Object.keys(value)) {
      cloned[key] = this.quickClone((value as any)[key]);
    }
    return cloned as T;
  }

  /**
   * Update options
   * @param options New options
   */
  configure(options: Partial<CloneOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): CloneOptions {
    return { ...this.options };
  }
}

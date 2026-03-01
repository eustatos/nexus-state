// State serialization utilities for DevTools integration
// Implements requirements from TASK-002-ENHANCE-STORE-DEVTOOLS-INTEGRATION

import type { Store } from '../types';

/**
 * Configuration options for state serialization
 */
export type SerializationOptions = {
  /**
   * Maximum depth to serialize objects
   * @default 10
   */
  maxDepth?: number;
  
  /**
   * Custom serializers for specific types
   */
  customSerializers?: Map<string, (value: any) => any>;
  
  /**
   * Whether to include atom metadata in serialized state
   * @default true
   */
  includeMetadata?: boolean;
  
  /**
   * Whether to handle circular references
   * @default true
   */
  handleCircularRefs?: boolean;
};

/**
 * Default serialization options
 */
const DEFAULT_OPTIONS: SerializationOptions = {
  maxDepth: 10,
  includeMetadata: true,
  handleCircularRefs: true,
};

/**
 * Serialization utilities class for state management
 */
export class SerializationUtils {
  /**
   * Serialize a value safely
   * @param value - The value to serialize
   * @param options - Serialization options
   * @returns Serialized value
   */
  serialize(value: any, options: SerializationOptions = {}): any {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const seen = opts.handleCircularRefs ? new WeakMap() : null;
    return serializeValue(value, opts, seen, 0);
  }

  /**
   * Serialize the entire store state safely
   * @param store - The store to serialize
   * @param options - Serialization options
   * @returns Serialized state object
   */
  serializeState(store: Store, options: SerializationOptions = {}): Record<string, any> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const state = store.getState();
    const seen = opts.handleCircularRefs ? new WeakMap() : null;
    
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(state)) {
      try {
        result[key] = serializeValue(value, opts, seen, 0);
      } catch (error) {
        result[key] = `[Serialization Error: ${error instanceof Error ? error.message : String(error)}]`;
      }
    }
    
    return result;
  }

  /**
   * Register a custom serializer for a specific type
   * @param typeName - The name of the type to serialize
   * @param serializer - Function to serialize the type
   * @param options - Current serialization options to modify
   */
  registerCustomSerializer(
    typeName: string,
    serializer: (value: any) => any,
    options: SerializationOptions
  ): void {
    if (!options.customSerializers) {
      options.customSerializers = new Map();
    }
    options.customSerializers.set(typeName, serializer);
  }

  /**
   * Create a serializer for Map objects
   * @param map - The Map to serialize
   * @returns Serialized representation of the Map
   */
  serializeMap(map: Map<any, any>): Record<string, any> {
    const result: Record<string, any> = { __type: 'Map', entries: [] };
    
    for (const [key, value] of map.entries()) {
      result.entries.push([key, value]);
    }
    
    return result;
  }

  /**
   * Create a serializer for Set objects
   * @param set - The Set to serialize
   * @returns Serialized representation of the Set
   */
  serializeSet(set: Set<any>): Record<string, any> {
    const result: Record<string, any> = { __type: 'Set', values: [] };
    
    for (const value of set) {
      result.values.push(value);
    }
    
    return result;
  }

  /**
   * Create a serializer for Error objects
   * @param error - The Error to serialize
   * @returns Serialized representation of the Error
   */
  serializeError(error: Error): Record<string, any> {
    return {
      __type: 'Error',
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
}

/**
 * Safely serialize a value with circular reference handling
 * @param value - The value to serialize
 * @param options - Serialization options
 * @param seen - WeakMap to track circular references
 * @param depth - Current depth in serialization
 * @returns Serialized value
 */
function serializeValue(
  value: any,
  options: SerializationOptions,
  seen: WeakMap<object, string> | null,
  depth: number
): any {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return value;
  }
  
  // Handle primitive types
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  // Check depth limit
  if (depth >= (options.maxDepth ?? 10)) {
    return `[Max Depth Reached]`;
  }
  
  // Handle circular references
  if (seen && typeof value === 'object' && value !== null) {
    if (seen.has(value)) {
      return `[Circular Reference: ${seen.get(value)}]`;
    }
    // Mark this object as seen
    seen.set(value, `Object@${depth}`);
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => serializeValue(item, options, seen, depth + 1));
  }
  
  // Handle functions
  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }
  
  // Handle Date objects
  if (value instanceof Date) {
    return `[Date: ${value.toISOString()}]`;
  }
  
  // Handle RegExp objects
  if (value instanceof RegExp) {
    return `[RegExp: ${value.toString()}]`;
  }
  
  // Handle custom serializers
  if (options.customSerializers) {
    const constructorName = value.constructor?.name;
    if (constructorName && options.customSerializers.has(constructorName)) {
      const serializer = options.customSerializers.get(constructorName);
      if (serializer) {
        return serializer(value);
      }
    }
  }
  
  // Handle plain objects
  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    
    for (const [key, val] of Object.entries(value)) {
      try {
        result[key] = serializeValue(val, options, seen, depth + 1);
      } catch (error) {
        result[key] = `[Serialization Error: ${error instanceof Error ? error.message : String(error)}]`;
      }
    }
    
    return result;
  }
  
  // Fallback for other types
  return `[${typeof value}]`;
}

/**
 * Serialize the entire store state safely
 * @param store - The store to serialize
 * @param options - Serialization options
 * @returns Serialized state object
 */
export function serializeState(store: Store, options: SerializationOptions = {}): Record<string, any> {
  const serializationUtils = new SerializationUtils();
  return serializationUtils.serializeState(store, options);
}

/**
 * Register a custom serializer for a specific type
 * @param typeName - The name of the type to serialize
 * @param serializer - Function to serialize the type
 * @param options - Current serialization options to modify
 */
export function registerCustomSerializer(
  typeName: string,
  serializer: (value: any) => any,
  options: SerializationOptions
): void {
  const serializationUtils = new SerializationUtils();
  serializationUtils.registerCustomSerializer(typeName, serializer, options);
}

/**
 * Create a serializer for Map objects
 * @param map - The Map to serialize
 * @returns Serialized representation of the Map
 */
export function serializeMap(map: Map<any, any>): Record<string, any> {
  const serializationUtils = new SerializationUtils();
  return serializationUtils.serializeMap(map);
}

/**
 * Create a serializer for Set objects
 * @param set - The Set to serialize
 * @returns Serialized representation of the Set
 */
export function serializeSet(set: Set<any>): Record<string, any> {
  const serializationUtils = new SerializationUtils();
  return serializationUtils.serializeSet(set);
}

/**
 * Create a serializer for Error objects
 * @param error - The Error to serialize
 * @returns Serialized representation of the Error
 */
export function serializeError(error: Error): Record<string, any> {
  const serializationUtils = new SerializationUtils();
  return serializationUtils.serializeError(error);
}
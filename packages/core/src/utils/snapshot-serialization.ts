/**
 * Snapshot serialization utilities for state persistence and time travel
 * Provides safe serialization and deserialization of complex state objects
 */

export type SerializableValue = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined 
  | SerializableValue[] 
  | { [key: string]: SerializableValue }
  | Date
  | RegExp;

export interface ObjectReference {
  id: string;
  type: string;
  path: string;
}

export interface SerializationContext {
  references: Map<any, ObjectReference>;
  serialized: Map<string, any>;
  circularRefs: Set<string>;
}

/**
 * Safely serialize complex objects for state snapshots
 * Handles circular references, functions, and special objects
 * @param obj - Object to serialize
 * @param context - Serialization context for handling references
 * @returns Serializable representation of the object
 */
export function snapshotSerialization(obj: any, context?: SerializationContext): SerializableValue {
  const ctx = context || {
    references: new Map(),
    serialized: new Map(),
    circularRefs: new Set()
  };
  
  // Handle primitive types
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'boolean' || typeof obj === 'number' || typeof obj === 'string') {
    return obj;
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return {
      __type: 'Date',
      value: obj.toISOString()
    };
  }
  
  // Handle RegExp objects
  if (obj instanceof RegExp) {
    return {
      __type: 'RegExp',
      source: obj.source,
      flags: obj.flags
    };
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => snapshotSerialization(item, ctx)) as SerializableValue[];
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    // Check for circular reference
    if (ctx.references.has(obj)) {
      const ref = ctx.references.get(obj)!;
      ctx.circularRefs.add(ref.id);
      return {
        __ref: ref.id
      };
    }
    
    // Create reference for this object
    const refId = generateObjectId(obj);
    const ref: ObjectReference = {
      id: refId,
      type: obj.constructor?.name || 'Object',
      path: ''
    };
    
    ctx.references.set(obj, ref);
    
    // Serialize object properties
    const result: Record<string, SerializableValue> = {
      __id: refId,
      __type: ref.type
    };
    
    for (const [key, value] of Object.entries(obj)) {
      try {
        result[key] = snapshotSerialization(value, ctx);
      } catch (error) {
        // Handle unserializable properties
        result[key] = {
          __error: 'Unserializable value',
          __type: typeof value
        };
      }
    }
    
    return result;
  }
  
  // Handle functions and other non-serializable types
  return {
    __type: typeof obj,
    __value: typeof obj === 'function' ? obj.toString() : String(obj)
  };
}

/**
 * Deserialize snapshot data back to objects
 * @param data - Serialized data
 * @param context - Deserialization context
 * @returns Deserialized object
 */
export function deserializeSnapshot(data: SerializableValue, context?: Map<string, any>): any {
  const ctx = context || new Map();
  
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'boolean' || typeof data === 'number' || typeof data === 'string') {
    return data;
  }
  
  // Handle special objects
  if (typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, any>;
    
    // Handle Date
    if (obj.__type === 'Date' && obj.value) {
      return new Date(obj.value);
    }
    
    // Handle RegExp
    if (obj.__type === 'RegExp' && obj.source) {
      return new RegExp(obj.source, obj.flags);
    }
    
    // Handle references
    if (obj.__ref && ctx.has(obj.__ref)) {
      return ctx.get(obj.__ref);
    }
    
    // Handle regular objects
    if (obj.__id) {
      // Check if already deserialized
      if (ctx.has(obj.__id)) {
        return ctx.get(obj.__id);
      }
      
      // Create new object
      const result: Record<string, any> = {};
      ctx.set(obj.__id, result);
      
      // Deserialize properties
      for (const [key, value] of Object.entries(obj)) {
        if (!key.startsWith('__')) {
          result[key] = deserializeSnapshot(value, ctx);
        }
      }
      
      return result;
    }
    
    // Handle regular object without ID
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deserializeSnapshot(value, ctx);
    }
    return result;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => deserializeSnapshot(item, ctx));
  }
  
  return data;
}

/**
 * Generate unique ID for objects
 * @param obj - Object to generate ID for
 * @returns Unique ID string
 */
function generateObjectId(obj: any): string {
  // In a real implementation, this would generate a proper unique ID
  // For now, we'll use a simple approach based on object properties
  try {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return btoa(str).slice(0, 16); // Simple base64 encoding
  } catch {
    // Fallback for unserializable objects
    return Math.random().toString(36).substring(2, 10);
  }
}

/**
 * Check if value is serializable
 * @param value - Value to check
 * @returns True if value is serializable
 */
export function isSerializable(value: any): boolean {
  try {
    snapshotSerialization(value);
    return true;
  } catch {
    return false;
  }
}
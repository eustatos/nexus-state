// Advanced Serializer with circular reference support

import {
  SerializationStrategy,
  SerializationContext,
  DeserializationContext,
  SerializationOptions,
  DeserializationOptions,
  SerializedValue,
  SerializedObject,
  SerializedProperty,
  DEFAULT_SERIALIZATION_OPTIONS,
  StrategyRegistry,
  createDefaultRegistry,
} from "./index";

// Import strategies synchronously
import { PrimitivesStrategy } from "./strategies/primitives-strategy";
import { BuiltInObjectsStrategy } from "./strategies/builtin-objects-strategy";
import { CollectionsStrategy } from "./strategies/collections-strategy";
import { FunctionsStrategy } from "./strategies/functions-strategy";
import { CustomClassesStrategy } from "./strategies/custom-classes-strategy";

/**
 * Main serializer class with advanced features
 */
export class AdvancedSerializer {
  private strategies: SerializationStrategy[] = [];
  private _registry: StrategyRegistry;
  private _refCounter: number = 0;
  private _refMap: WeakMap<object, string> = new WeakMap();
  private options: SerializationOptions;

  constructor(options: Partial<SerializationOptions> = {}) {
    this._registry = createDefaultRegistry();
    void this._registry;
    void this._refCounter;
    void this._refMap;
    this.options = { ...DEFAULT_SERIALIZATION_OPTIONS, ...options };
    this.registerDefaultStrategies();
  }

  /**
   * Register default serialization strategies
   */
  private registerDefaultStrategies(): void {
    // Import strategies synchronously
    this.strategies.push(new PrimitivesStrategy());
    this.strategies.push(new BuiltInObjectsStrategy());
    this.strategies.push(new CollectionsStrategy());
    this.strategies.push(new FunctionsStrategy());
    this.strategies.push(new CustomClassesStrategy());
  }

  /**
   * Register a custom strategy
   */
  registerStrategy(strategy: SerializationStrategy, _priority: number = 0): void {
    this.strategies.push(strategy);
    // Re-sort strategies by priority (higher first)
    this.strategies.sort((a, b) => {
      const priorityA = "priority" in a ? (a as any).priority : 0;
      const priorityB = "priority" in b ? (b as any).priority : 0;
      return priorityB - priorityA;
    });
  }

  /**
   * Serialize a value
   */
  serialize(value: unknown, options?: Partial<SerializationOptions>): SerializedValue {
    const opts = { ...this.options, ...options };
    const context: SerializationContext = {
      seen: new WeakMap(),
      path: [],
      options: opts,
      refCounter: 0,
    };

    return this.serializeWithContext(value, context);
  }

  /**
   * Internal serialization with context
   */
  private serializeWithContext(
    value: unknown,
    context: SerializationContext,
  ): SerializedValue {
    // Check for max depth
    if (context.options.maxDepth > 0 && context.path.length > context.options.maxDepth) {
      return {
        __serializedType: "maxdepth",
        __message: `Max depth ${context.options.maxDepth} exceeded at path: ${context.path.join(".")}`,
      };
    }

    // Handle null and undefined explicitly
    if (value === null) {
      return { __serializedType: "null" };
    }
    if (value === undefined) {
      return { __serializedType: "undefined" };
    }

    // Check if value is a primitive (not null or undefined)
    if (this.isPrimitive(value)) {
      return this.serializePrimitive(value);
    }

    // Handle circular references
    if (context.options.detectCircular && typeof value === "object" && value !== null) {
      if (context.seen.has(value)) {
        const refId = context.seen.get(value)!;
        return {
          __serializedType: "reference",
          __refId: refId,
          __path: context.path.join("."),
        };
      }

      // Register this object
      const refId = `ref_${++context.refCounter}`;
      context.seen.set(value, refId);
    }

    // Try each strategy
    for (const strategy of this.strategies) {
      if (strategy.canHandle(value)) {
        return strategy.serialize(value, context);
      }
    }

    // Fallback: serialize as object
    return this.serializeObject(value as object, context);
  }

  /**
   * Check if value is a primitive
   */
  private isPrimitive(value: unknown): boolean {
    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    );
  }

  /**
   * Serialize a primitive value
   */
  private serializePrimitive(value: unknown): SerializedValue {
    if (typeof value === "bigint") {
      return {
        __serializedType: "bigint",
        value: value.toString(),
      };
    }
    if (typeof value === "symbol") {
      return {
        __serializedType: "symbol",
        description: value.description,
      };
    }
    return value as SerializedValue;
  }

  /**
   * Serialize an object
   */
  private serializeObject(obj: object, context: SerializationContext): SerializedObject {
    const result: SerializedObject = {
      __serializedType: "object",
      __refId: context.seen.get(obj) || `ref_${++context.refCounter}`,
      __className: obj.constructor?.name || "Object",
      properties: {},
    };

    // Get all property names
    const propNames = this.getPropertyNames(obj, context.options);

    for (const key of propNames) {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);

        if (!descriptor) {
          continue;
        }

        // Skip getters without setters if not configured
        if (
          descriptor.get &&
          !descriptor.set &&
          !context.options.includeGetters
        ) {
          continue;
        }

        const value = (obj as any)[key];
        context.path.push(String(key));

        result.properties[String(key)] = this.serializeProperty(value, descriptor, context);

        context.path.pop();
      } catch (error) {
        // Handle property access errors
        if (context.options.errorHandling === "throw") {
          throw error;
        }
        if (context.options.errorHandling === "skip") {
          continue;
        }
        // Replace with error marker
        result.properties[String(key)] = {
          value: {
            __serializedType: "propertyerror",
            __error: (error as Error).message,
          },
          enumerable: false,
          writable: false,
          configurable: false,
          type: "error",
          error: true,
        };
      }
    }

    return result;
  }

  /**
   * Serialize a property
   */
  private serializeProperty(
    value: unknown,
    descriptor: PropertyDescriptor,
    context: SerializationContext,
  ): SerializedProperty {
    return {
      value: this.serializeWithContext(value, context),
      enumerable: descriptor.enumerable ?? true,
      writable: descriptor.writable ?? true,
      configurable: descriptor.configurable ?? true,
      type: this.getValueType(value),
    };
  }

  /**
   * Get value type
   */
  private getValueType(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return "array";
    return typeof value;
  }

  /**
   * Get all property names (including symbols and non-enumerable if configured)
   */
  private getPropertyNames(
    obj: object,
    opts: SerializationOptions,
  ): (string | symbol)[] {
    const names = new Set<string | symbol>();

    // Add regular keys
    if (opts.includeNonEnumerable) {
      Object.getOwnPropertyNames(obj).forEach((key) => names.add(key));
    } else {
      Object.keys(obj).forEach((key) => names.add(key));
    }

    // Add symbol keys
    if (opts.includeSymbols) {
      Object.getOwnPropertySymbols(obj).forEach((key) => names.add(key));
    }

    return Array.from(names);
  }

  /**
   * Deserialize a serialized value
   */
  deserialize(serialized: SerializedValue, options?: Partial<DeserializationOptions>): unknown {
    const opts = {
      allowedConstructors: ["Object", "Array", "Date", "Map", "Set"],
      restoreSpecialTypes: true,
      ...options,
    };

    const context: DeserializationContext = {
      refs: new Map(),
      classRegistry: new Map(),
      options: opts,
    };

    return this.deserializeWithContext(serialized, context);
  }

  /**
   * Internal deserialization with context
   */
  private deserializeWithContext(
    serialized: SerializedValue,
    context: DeserializationContext,
  ): unknown {
    if (serialized === null || serialized === undefined) {
      return serialized;
    }

    // Handle primitive types
    if (typeof serialized !== "object") {
      return serialized;
    }

    // Handle reference to previously deserialized object
    if (serialized.__serializedType === "reference" && serialized.__refId) {
      const existing = context.refs.get(serialized.__refId);
      if (existing !== undefined) {
        return existing;
      }
    }

    // Handle special types
    if (serialized.__serializedType === "null") {
      return null;
    }
    if (serialized.__serializedType === "undefined") {
      return undefined;
    }
    if (serialized.__serializedType === "bigint") {
      return BigInt(serialized.value as string);
    }
    if (serialized.__serializedType === "symbol") {
      return Symbol((serialized.description as string) || "");
    }
    if (serialized.__serializedType === "date") {
      return new Date(serialized.value as string);
    }
    if (serialized.__serializedType === "regexp") {
      return new RegExp(serialized.source as string, serialized.flags as string);
    }
    if (serialized.__serializedType === "map") {
      const map = new Map();
      if (serialized.__refId) {
        context.refs.set(serialized.__refId, map);
      }
      for (const [k, v] of serialized.entries as [SerializedValue, SerializedValue][]) {
        map.set(
          this.deserializeWithContext(k, context),
          this.deserializeWithContext(v, context),
        );
      }
      return map;
    }
    if (serialized.__serializedType === "set") {
      const set = new Set();
      if (serialized.__refId) {
        context.refs.set(serialized.__refId, set);
      }
      for (const v of serialized.values as SerializedValue[]) {
        set.add(this.deserializeWithContext(v, context));
      }
      return set;
    }
    if (serialized.__serializedType === "array") {
      const arr: unknown[] = [];
      if (serialized.__refId) {
        context.refs.set(serialized.__refId, arr);
      }
      for (const v of serialized.values as SerializedValue[]) {
        arr.push(this.deserializeWithContext(v, context));
      }
      return arr;
    }
    if (serialized.__serializedType === "object") {
      return this.deserializeObject(serialized as SerializedObject, context);
    }

    // Handle max depth exceeded
    if (serialized.__serializedType === "maxdepth") {
      return { __maxDepthExceeded: true, message: serialized.__message };
    }

    // Handle property errors
    if (serialized.__serializedType === "propertyerror") {
      return { __serializationError: serialized.__error };
    }

    // Handle functions (simplified - source code only)
    if (serialized.__serializedType === "function") {
      return {
        __functionSource: serialized.source,
        name: serialized.name,
      };
    }

    // For unknown types, return as-is
    return serialized;
  }

  /**
   * Deserialize an object
   */
  private deserializeObject(
    serialized: SerializedObject,
    context: DeserializationContext,
  ): unknown {
    const result: Record<string, unknown> = {};

    // Register the object for reference resolution
    if (serialized.__refId) {
      context.refs.set(serialized.__refId, result);
    }

    // Set prototype if available
    if (serialized.__className && serialized.__className !== "Object") {
      const ctor = (globalThis as any)[serialized.__className];
      if (ctor && ctor.prototype) {
        Object.setPrototypeOf(result, ctor.prototype);
      }
    }

    // Restore properties
    for (const [key, prop] of Object.entries(serialized.properties)) {
      result[key] = this.deserializeWithContext(prop.value, context);
    }

    return result;
  }

  /**
   * Get the current options
   */
  getOptions(): SerializationOptions {
    return { ...this.options };
  }

  /**
   * Update options
   */
  setOptions(options: Partial<SerializationOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

// Custom Classes Serialization Strategy
import {
  SerializationStrategy,
  SerializationContext,
  SerializedValue,
  ExtractedProperty,
} from "../types";

/**
 * Strategy for handling custom class instances
 */
export class CustomClassesStrategy implements SerializationStrategy {
  private classRegistry: Map<string, new (...args: unknown[]) => unknown> = new Map();

  constructor() {
    this.registerBuiltInClasses();
  }

  private registerBuiltInClasses(): void {
    // Register common built-in classes that should be deserializable
    const builtInClasses = [
      "Object",
      "Array",
      "Date",
      "RegExp",
      "Map",
      "Set",
      "Error",
      "WeakMap",
      "WeakSet",
    ];
    builtInClasses.forEach((className) => {
      const ctor = (globalThis as any)[className];
      if (ctor) {
        this.classRegistry.set(className, ctor);
      }
    });
  }

  canHandle(value: unknown): boolean {
    if (value === null || typeof value !== "object") {
      return false;
    }

    // Check if it's a plain object or custom class instance
    const proto = Object.getPrototypeOf(value);
    return (
      proto !== null &&
      proto !== Object.prototype &&
      proto !== Array.prototype &&
      !Array.isArray(value) &&
      !(
        value instanceof Date ||
        value instanceof RegExp ||
        value instanceof Map ||
        value instanceof Set ||
        value instanceof Error ||
        value instanceof WeakMap ||
        value instanceof WeakSet
      )
    );
  }

  serialize(value: unknown, context: SerializationContext): SerializedValue {
    const obj = value as object;
    const refId = context.seen.get(obj);
    const constructorName = obj.constructor?.name || "Object";

    // Extract all properties
    const properties = this.extractProperties(obj, context);

    return {
      __serializedType: "object",
      __refId: refId,
      __className: constructorName,
      properties,
    };
  }

  private extractProperties(
    obj: object,
    context: SerializationContext,
  ): Record<string, ExtractedProperty> {
    const properties: Record<string, ExtractedProperty> = {};

    // Get all property keys (including symbols and non-enumerable if configured)
    let keys: (string | symbol)[] = [];

    if (context.options.includeSymbols) {
      keys = keys.concat(Object.getOwnPropertySymbols(obj));
    }

    if (context.options.includeNonEnumerable) {
      keys = keys.concat(Object.getOwnPropertyNames(obj));
    } else {
      keys = keys.concat(Object.keys(obj));
    }

    // Remove duplicates
    keys = Array.from(new Set(keys));

    for (const key of keys) {
      const keyStr = String(key);
      context.path.push(keyStr);

      try {
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);

        if (!descriptor) {
          continue;
        }

        // Skip getters if not configured
        if (
          descriptor.get &&
          !descriptor.set &&
          !context.options.includeGetters
        ) {
          context.path.pop();
          continue;
        }

        // Get the value
        let value: unknown;
        try {
          value = (obj as any)[key];
        } catch (error) {
          // If getter throws, mark as error
          if (context.options.errorHandling === "throw") {
            throw error;
          }
          if (context.options.errorHandling === "skip") {
            context.path.pop();
            continue;
          }
          // Replace with error marker
          properties[keyStr] = {
            key,
            descriptor,
            isError: true,
            errorMessage: (error as Error).message,
          };
          context.path.pop();
          continue;
        }

        properties[keyStr] = {
          key,
          descriptor,
          value,
        };
      } catch (error) {
        if (context.options.errorHandling === "throw") {
          throw error;
        }
        if (context.options.errorHandling === "skip") {
          context.path.pop();
          continue;
        }
        // Replace with error marker
        properties[keyStr] = {
          key,
          descriptor: {},
          isError: true,
          errorMessage: (error as Error).message,
        };
      }

      context.path.pop();
    }

    return properties;
  }

  registerClass(name: string, ctor: new (...args: unknown[]) => unknown): void {
    this.classRegistry.set(name, ctor);
  }

  unregisterClass(name: string): boolean {
    return this.classRegistry.delete(name);
  }

  getClass(name: string): (new (...args: unknown[]) => unknown) | undefined {
    return this.classRegistry.get(name) as (new (...args: unknown[]) => unknown) | undefined;
  }

  deserialize?(serialized: SerializedValue, context: { refs: Map<string, unknown> }): unknown {
    if (serialized.__serializedType === "object" && serialized.__className) {
      const className = serialized.__className;
      const properties = serialized.properties as Record<string, ExtractedProperty>;

      // Try to get the constructor from registry
      const ctor = this.classRegistry.get(className);

      if (ctor) {
        // Create instance
        const instance = new ctor();
        context.refs.set(serialized.__refId as string, instance);

        // Set properties
        for (const [key, prop] of Object.entries(properties)) {
          if (!prop.isError && prop.value !== undefined) {
            try {
              (instance as any)[key] = prop.value;
            } catch (e) {
              // Skip properties that can't be set
            }
          }
        }

        return instance;
      }
    }
    return serialized;
  }
}

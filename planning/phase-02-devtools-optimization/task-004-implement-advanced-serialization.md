## Task 4: Implement Advanced Serialization with Circular Reference Support

**Filename:** `task-004-implement-advanced-serialization.md`

### Context

The current `SnapshotCreator.serializeValue()` method has limited support for complex data types and completely fails on circular references. This causes snapshot corruption and potential crashes when atoms contain objects with cycles, functions, or other non-serializable data.

### Requirements

1. **Create Serialization Strategy System**

```typescript
interface SerializationStrategy {
  canHandle(value: unknown): boolean;
  serialize(value: unknown, context: SerializationContext): SerializedValue;
  deserialize(value: SerializedValue, context: DeserializationContext): unknown;
}

interface SerializationContext {
  seen: WeakMap<object, string>; // Track visited objects
  path: string[]; // Current path for debugging
  options: SerializationOptions;
}
```

2. **Implement Strategies for All Types**
   - **Primitives**: string, number, boolean, null, undefined, bigint, symbol
   - **Built-in Objects**: Date, RegExp, Map, Set, WeakMap, WeakSet, Promise
   - **Collections**: Array, TypedArray, ArrayBuffer
   - **Functions**: with source code and closure capture warning
   - **Custom Classes**: with class metadata
   - **Circular References**: with reference markers

3. **Add Circular Reference Detection**

```typescript
interface CircularReference {
  id: string;
  path: string[];
  targetId: string; // Reference to previously serialized object
}

interface SerializedWithRefs {
  __serializedType: "object";
  __refId: string;
  properties: Record<string, SerializedValue>;
  circularRefs?: CircularReference[];
}
```

4. **Enhance SnapshotStateEntry**

```typescript
interface EnhancedSnapshotStateEntry extends SnapshotStateEntry {
  serializationMetadata?: {
    hasCircularRefs: boolean;
    totalSize: number;
    originalType: string;
    strategies: string[];
  };
}
```

### Technical Implementation

**Advanced Serializer:**

```typescript
export class AdvancedSerializer {
  private strategies: SerializationStrategy[] = [];
  private refCounter: number = 0;
  private refMap: WeakMap<object, string> = new WeakMap();

  constructor() {
    this.registerDefaultStrategies();
  }

  serialize(value: unknown, options?: SerializationOptions): SerializedValue {
    const context: SerializationContext = {
      seen: new WeakMap(),
      path: [],
      options: options || { detectCircular: true, maxDepth: 100 },
    };

    return this.serializeWithContext(value, context);
  }

  private serializeWithContext(
    value: unknown,
    context: SerializationContext,
  ): SerializedValue {
    // Handle primitives
    if (this.isPrimitive(value)) {
      return this.serializePrimitive(value);
    }

    // Handle circular references
    if (
      context.options.detectCircular &&
      typeof value === "object" &&
      value !== null
    ) {
      if (context.seen.has(value)) {
        return {
          __serializedType: "reference",
          __refId: context.seen.get(value),
          __path: context.path.join("."),
        };
      }

      // Generate new reference ID
      const refId = `ref_${++this.refCounter}`;
      context.seen.set(value, refId);
    }

    // Find appropriate strategy
    for (const strategy of this.strategies) {
      if (strategy.canHandle(value)) {
        return strategy.serialize(value, context);
      }
    }

    // Fallback to deep object traversal
    return this.serializeObject(value as object, context);
  }

  private serializeObject(
    obj: object,
    context: SerializationContext,
  ): SerializedObject {
    const result: SerializedObject = {
      __serializedType: "object",
      __refId: context.seen.get(obj),
      __className: obj.constructor?.name,
      properties: {},
    };

    // Get all property names, including symbols and non-enumerable if configured
    const propNames = this.getPropertyNames(obj, context.options);

    for (const key of propNames) {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);

        // Skip getters without setters if not configured to include
        if (
          descriptor?.get &&
          !descriptor?.set &&
          !context.options.includeGetters
        ) {
          continue;
        }

        const value = (obj as any)[key];
        context.path.push(String(key));

        result.properties[String(key)] = {
          value: this.serializeWithContext(value, context),
          enumerable: descriptor?.enumerable ?? true,
          writable: descriptor?.writable ?? true,
          configurable: descriptor?.configurable ?? true,
          type: this.getValueType(value),
        };

        context.path.pop();
      } catch (error) {
        // Handle property access errors
        result.properties[String(key)] = {
          value: { __serializedType: "error", message: error.message },
          enumerable: false,
          error: true,
        };
      }
    }

    return result;
  }

  deserialize(serialized: SerializedValue): unknown {
    const refs: Map<string, any> = new Map();
    return this.deserializeWithRefs(serialized, refs);
  }
}
```

**Strategy Implementations:**

```typescript
class MapStrategy implements SerializationStrategy {
  canHandle(value: unknown): boolean {
    return value instanceof Map;
  }

  serialize(map: Map<any, any>, context: SerializationContext): SerializedMap {
    const entries: [SerializedValue, SerializedValue][] = [];

    for (const [key, value] of map.entries()) {
      entries.push([
        this.serializeWithContext(key, context),
        this.serializeWithContext(value, context),
      ]);
    }

    return {
      __serializedType: "map",
      __refId: context.seen.get(map),
      entries,
      size: map.size,
    };
  }

  deserialize(data: SerializedMap, refs: Map<string, any>): Map<any, any> {
    const map = new Map();
    refs.set(data.__refId, map);

    for (const [key, value] of data.entries) {
      map.set(
        this.deserializeWithRefs(key, refs),
        this.deserializeWithRefs(value, refs),
      );
    }

    return map;
  }
}
```

### Configuration Options

```typescript
interface SerializationOptions {
  detectCircular: boolean;
  maxDepth: number;
  includeGetters: boolean;
  includeNonEnumerable: boolean;
  includeSymbols: boolean;
  functionHandling: "source" | "ignore" | "error";
  errorHandling: "throw" | "replace" | "skip";
  onCircular: "error" | "reference" | "ignore";
  customStrategies?: SerializationStrategy[];
}
```

### Testing Requirements

1. **Complex Object Tests**
   - Deeply nested objects (depth > 100)
   - Objects with circular references
   - Self-referencing arrays
   - Multiple references to same object

2. **Type Coverage Tests**
   - All primitive types including Symbol and BigInt
   - Built-in objects (Date, Map, Set, WeakMap, Promise)
   - Custom classes with inheritance
   - Functions and arrow functions
   - DOM elements (if in browser)

3. **Edge Cases**
   - Objects with getters that throw
   - Non-extensible objects
   - Frozen objects
   - Proxy objects
   - Object with null prototype

4. **Performance Tests**
   - Serialization time for large objects (10k+ properties)
   - Memory usage during serialization
   - Comparison with JSON.stringify()
   - Deserialization performance

### Integration with SnapshotCreator

```typescript
export class SnapshotCreator {
  private serializer: AdvancedSerializer;

  constructor(store: Store, config?: Partial<SnapshotCreatorConfig>) {
    this.serializer = new AdvancedSerializer(config?.serializationOptions);
  }

  private serializeValue(value: unknown): unknown {
    return this.serializer.serialize(value, {
      detectCircular: true,
      maxDepth: 100,
      includeGetters: false,
      functionHandling: "source",
    });
  }

  private deserializeValue(value: SerializedValue): unknown {
    return this.serializer.deserialize(value);
  }
}
```

### Definition of Done

- [ ] All serialization strategies implemented and tested
- [ ] Circular reference detection working with proper restoration
- [ ] Configuration options fully functional
- [ ] 100% test coverage for serialization scenarios
- [ ] Performance benchmarks showing < 2x overhead vs JSON.stringify
- [ ] Memory leak tests passing
- [ ] Documentation with examples of complex object serialization
- [ ] Migration guide for existing snapshots

### SPR Requirements

- Each strategy in separate file with single responsibility
- Strategy registry for easy extension
- Clear separation between serialization and snapshot creation
- Immutable context objects
- Pure functions where possible
- Comprehensive error handling without side effects

---

**Note:** After completion, provide examples of serializing complex object graphs and benchmark results comparing with current implementation.

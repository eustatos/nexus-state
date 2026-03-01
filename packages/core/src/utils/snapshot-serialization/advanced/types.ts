// Advanced Serialization System Types

// TypedArray type for type checking
export type TypedArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/**
 * Context for serialization operations
 */
export interface SerializationContext {
  /**
   * Track visited objects to detect circular references
   * Maps object instances to their reference IDs
   */
  seen: WeakMap<object, string>;
  /**
   * Current path in the object tree for debugging
   */
  path: string[];
  /**
   * Serialization options
   */
  options: SerializationOptions;
  /**
   * Internal counter for generating unique reference IDs
   */
  refCounter: number;
}

/**
 * Context for deserialization operations
 */
export interface DeserializationContext {
  /**
   * Map of reference IDs to actual objects
   */
  refs: Map<string, unknown>;
  /**
   * Registry of class constructors for deserialization
   */
  classRegistry: Map<string, new (...args: unknown[]) => unknown>;
  /**
   * Deserialization options
   */
  options: DeserializationOptions;
}

/**
 * Options for serialization
 */
export interface SerializationOptions {
  /**
   * Detect and handle circular references (default: true)
   */
  detectCircular: boolean;
  /**
   * Maximum depth to serialize (default: 100, 0 means unlimited)
   */
  maxDepth: number;
  /**
   * Include getters in serialization (default: false)
   */
  includeGetters: boolean;
  /**
   * Include non-enumerable properties (default: false)
   */
  includeNonEnumerable: boolean;
  /**
   * Include symbol properties (default: false)
   */
  includeSymbols: boolean;
  /**
   * How to handle functions (default: "source")
   * - "source": serialize function source code
   * - "ignore": omit functions
   * - "error": throw error on functions
   */
  functionHandling: "source" | "ignore" | "error";
  /**
   * How to handle errors during serialization (default: "replace")
   * - "throw": throw the error
   * - "replace": replace with error marker
   * - "skip": omit the property
   */
  errorHandling: "throw" | "replace" | "skip";
  /**
   * How to handle circular references (default: "reference")
   * - "error": throw error
   * - "reference": create reference marker
   * - "ignore": omit the circular property
   */
  circularHandling: "error" | "reference" | "ignore";
  /**
   * Custom serialization strategies
   */
  customStrategies?: SerializationStrategy[];
}

/**
 * Default options for serialization
 */
export const DEFAULT_SERIALIZATION_OPTIONS: Required<SerializationOptions> = {
  detectCircular: true,
  maxDepth: 100,
  includeGetters: false,
  includeNonEnumerable: false,
  includeSymbols: false,
  functionHandling: "source",
  errorHandling: "replace",
  circularHandling: "reference",
  customStrategies: [],
};

/**
 * Options for deserialization
 */
export interface DeserializationOptions {
  /**
   * List of allowed constructor names for object creation
   */
  allowedConstructors: string[];
  /**
   * Whether to restore special types (Date, Map, Set, etc.) (default: true)
   */
  restoreSpecialTypes: boolean;
  /**
   * Custom deserialization handlers
   */
  customRevivers?: Map<string, (value: unknown, ctx: DeserializationContext) => unknown>;
}

/**
 * Result of serialization
 */
export interface SerializedValue {
  /**
   * Type marker for special serialization types
   */
  __serializedType?: string;
  /**
   * Reference ID for circular reference handling
   */
  __refId?: string;
  /**
   * Path for debugging
   */
  __path?: string;
  /**
   * Class name for custom objects
   */
  __className?: string;
  /**
   * Actual value or serialized representation
   */
  value?: unknown;
  /**
   * Error information if serialization failed
   */
  __error?: string;
  /**
   * Additional metadata
   */
  [key: string]: unknown;
}

/**
 * Serialized object representation
 */
export interface SerializedObject extends SerializedValue {
  __serializedType: "object";
  __refId: string;
  __className?: string;
  properties: Record<string, SerializedProperty>;
}

/**
 * Serialized property with metadata
 */
export interface SerializedProperty {
  /**
   * The serialized value
   */
  value: SerializedValue;
  /**
   * Whether the property is enumerable
   */
  enumerable: boolean;
  /**
   * Whether the property is writable
   */
  writable: boolean;
  /**
   * Whether the property is configurable
   */
  configurable: boolean;
  /**
   * Property type
   */
  type: string;
  /**
   * Whether this property had an error during serialization
   */
  error?: boolean;
}

/**
 * Serialized Map
 */
export interface SerializedMap extends SerializedValue {
  __serializedType: "map";
  __refId: string;
  entries: [SerializedValue, SerializedValue][];
  size: number;
}

/**
 * Serialized Set
 */
export interface SerializedSet extends SerializedValue {
  __serializedType: "set";
  __refId: string;
  values: SerializedValue[];
  size: number;
}

/**
 * Serialized Date
 */
export interface SerializedDate extends SerializedValue {
  __serializedType: "date";
  __refId?: string;
  value: string; // ISO string
}

/**
 * Serialized RegExp
 */
export interface SerializedRegExp extends SerializedValue {
  __serializedType: "regexp";
  __refId?: string;
  source: string;
  flags: string;
}

/**
 * Serialized BigInt
 */
export interface SerializedBigInt extends SerializedValue {
  __serializedType: "bigint";
  __refId?: string;
  value: string;
}

/**
 * Serialized Symbol
 */
export interface SerializedSymbol extends SerializedValue {
  __serializedType: "symbol";
  __refId?: string;
  description?: string;
}

/**
 * Serialized Function
 */
export interface SerializedFunction extends SerializedValue {
  __serializedType: "function";
  __refId?: string;
  name: string;
  source: string;
  length: number;
}

/**
 * Serialized TypedArray
 */
export interface SerializedTypedArray extends SerializedValue {
  __serializedType: "typedarray";
  __refId: string;
  __className: string;
  buffer: ArrayBuffer;
  length: number;
  byteOffset: number;
}

/**
 * Serialized ArrayBuffer
 */
export interface SerializedArrayBuffer extends SerializedValue {
  __serializedType: "arraybuffer";
  __refId: string;
  data: string; // Base64 encoded
}

/**
 * Serialized Promise
 */
export interface SerializedPromise extends SerializedValue {
  __serializedType: "promise";
  __refId: string;
  status: "pending" | "fulfilled" | "rejected";
  value?: unknown;
  reason?: unknown;
}

/**
 * Serialized Error
 */
export interface SerializedError extends SerializedValue {
  __serializedType: "error";
  __refId?: string;
  name: string;
  message: string;
  stack?: string;
}

/**
 * Serialized WeakMap
 */
export interface SerializedWeakMap extends SerializedValue {
  __serializedType: "weakmap";
  __refId: string;
  entries: [string, SerializedValue][]; // Keys are stringified
}

/**
 * Serialized WeakSet
 */
export interface SerializedWeakSet extends SerializedValue {
  __serializedType: "weakset";
  __refId: string;
  values: string[]; // Keys are stringified
}

/**
 * Serialized circular reference
 */
export interface SerializedReference extends SerializedValue {
  __serializedType: "reference";
  __refId: string;
  __path?: string;
}

/**
 * Serialized error during property access
 */
export interface SerializedPropertyError extends SerializedValue {
  __serializedType: "propertyerror";
  __error: string;
  __originalType?: string;
}

/**
 * Serialized null
 */
export interface SerializedNull extends SerializedValue {
  __serializedType: "null";
}

/**
 * Serialized undefined
 */
export interface SerializedUndefined extends SerializedValue {
  __serializedType: "undefined";
}

/**
 * Max depth exceeded marker
 */
export interface SerializedMaxDepth extends SerializedValue {
  __serializedType: "maxdepth";
  __message: string;
}

/**
 * Union type of all possible serialized values
 */
export type AnySerializedValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SerializedValue[]
  | Record<string, unknown>
  | SerializedObject
  | SerializedMap
  | SerializedSet
  | SerializedDate
  | SerializedRegExp
  | SerializedBigInt
  | SerializedSymbol
  | SerializedFunction
  | SerializedTypedArray
  | SerializedArrayBuffer
  | SerializedPromise
  | SerializedError
  | SerializedWeakMap
  | SerializedWeakSet
  | SerializedReference
  | SerializedPropertyError
  | SerializedNull
  | SerializedUndefined
  | SerializedMaxDepth;

/**
 * Serialization strategy interface
 */
export interface SerializationStrategy {
  /**
   * Check if this strategy can handle the given value
   */
  canHandle(value: unknown): boolean;
  /**
   * Serialize the value using the provided context
   */
  serialize(value: unknown, context: SerializationContext): SerializedValue;
  /**
   * Deserialize the serialized value
   */
  deserialize?(serialized: SerializedValue, context: DeserializationContext): unknown;
}

/**
 * Class metadata for custom class serialization
 */
export interface ClassMetadata {
  /**
   * Constructor name
   */
  name: string;
  /**
   * Property descriptors
   */
  properties: Record<string, PropertyDescriptor>;
  /**
   * Prototype chain information
   */
  prototype?: string;
}

/**
 * Function metadata
 */
export interface FunctionMetadata {
  /**
   * Function name
   */
  name: string;
  /**
   * Function source code
   */
  source: string;
  /**
   * Number of arguments
   */
  length: number;
  /**
   * Whether it's an arrow function
   */
  isArrow?: boolean;
  /**
   * Whether it's a generator function
   */
  isGenerator?: boolean;
  /**
   * Whether it's an async function
   */
  isAsync?: boolean;
}

/**
 * Result of property extraction
 */
export interface ExtractedProperty {
  /**
   * Property key
   */
  key: string | symbol;
  /**
   * Property descriptor
   */
  descriptor: PropertyDescriptor;
  /**
   * Property value
   */
  value?: unknown;
  /**
   * Whether this is an error property
   */
  isError?: boolean;
  /**
   * Error message if applicable
   */
  errorMessage?: string;
}

/**
 * Strategy registration result
 */
export interface StrategyRegistration {
  /**
   * Strategy name
   */
  name: string;
  /**
   * Priority (higher priority strategies are checked first)
   */
  priority: number;
  /**
   * The strategy instance
   */
  strategy: SerializationStrategy;
}
// packages/core/utils/snapshot-serialization/types.ts

// Type for constructor functions (classes or functions intended for use with 'new')
export type Constructor<T = unknown> = new (...args: unknown[]) => T;

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

export type SerializableInput =
  | string
  | number
  | boolean
  | null
  | undefined
  | bigint
  | SerializableInput[]
  | { [key: string]: SerializableInput }
  | Date
  | RegExp
  | Map<SerializableInput, SerializableInput>
  | Set<SerializableInput>
  | Error
  | ((...args: unknown[]) => unknown);

export type SerializedValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SerializedValue[]
  | { [key: string]: SerializedValue }
  | { __type: "Date"; value: string }
  | { __type: "RegExp"; source: string; flags: string }
  | { __type: "Map"; entries: [SerializedValue, SerializedValue][] }
  | { __type: "Set"; values: SerializedValue[] }
  | { __type: "BigInt"; value: string }
  | { __type: "Error"; name: string; message: string; stack?: string }
  | { __type: "Function"; name: string; source: string }
  | { __ref: string }
  | { __id: string; __type: string; [key: string]: SerializedValue }
  | { __error: string; __originalType: string; __value?: string }
  | { __type: "MaxDepthExceeded"; __message: string };

export interface ObjectReference {
  id: string;
  type: string;
  path: string;
  createdAt: number;
}

export interface SerializationContext {
  references: Map<Record<string, unknown>, ObjectReference>;
  serialized: Map<string, SerializedValue>;
  circularRefs: Set<string>;
  nextId: number;
  options: Required<SerializationOptions>;
}

export interface DeserializationContext {
  registry: Map<string, unknown>;
  options: Required<DeserializationOptions>;
}

export interface SerializationOptions {
  maxDepth?: number;
  skipKeys?: string[];
  customTransformers?: Map<
    Constructor,
    (value: unknown, ctx: SerializationContext) => SerializedValue
  >;
  preserveType?: boolean;
  escapePrefix?: string;
}

export interface DeserializationOptions {
  allowedConstructors?: string[];
  restoreSpecialTypes?: boolean;
  customRevivers?: Map<
    string,
    (value: unknown, ctx: DeserializationContext) => unknown
  >;
}

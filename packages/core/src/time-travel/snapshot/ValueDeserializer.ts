/**
 * ValueDeserializer - Deserializes values based on atom type
 */

export type DeserializedValue = unknown;

export interface DeserializationResult {
  /** Deserialized value */
  value: DeserializedValue;
  /** Whether deserialization was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Original type */
  type: string;
}

/**
 * Custom type deserializer function
 */
export type TypeDeserializer = (value: unknown) => DeserializedValue;

/**
 * ValueDeserializer provides functionality to deserialize values
 * based on their atom type (date, regexp, map, set, etc.)
 */
export class ValueDeserializer {
  private customDeserializers: Map<string, TypeDeserializer> = new Map();

  constructor() {
    this.setupDefaultDeserializers();
  }

  /**
   * Setup default deserializers for built-in types
   */
  private setupDefaultDeserializers(): void {
    // Date deserializer
    this.customDeserializers.set('date', (value: unknown) => {
      if (typeof value === 'string') {
        return new Date(value);
      }
      if (typeof value === 'number') {
        return new Date(value);
      }
      return value;
    });

    // RegExp deserializer
    this.customDeserializers.set('regexp', (value: unknown) => {
      if (typeof value === 'string') {
        return new RegExp(value);
      }
      return value;
    });

    // Map deserializer
    this.customDeserializers.set('map', (value: unknown) => {
      if (Array.isArray(value)) {
        return new Map(value);
      }
      return value;
    });

    // Set deserializer
    this.customDeserializers.set('set', (value: unknown) => {
      if (Array.isArray(value)) {
        return new Set(value);
      }
      return value;
    });
  }

  /**
   * Deserialize a value based on its type
   * @param value The serialized value
   * @param type The atom type
   * @returns Deserialized value
   */
  deserialize(value: unknown, type: string): DeserializedValue {
    // Check for custom deserializer first
    const customDeserializer = this.customDeserializers.get(type);
    if (customDeserializer) {
      try {
        return customDeserializer(value);
      } catch (error) {
        console.warn(
          `[ValueDeserializer] Custom deserializer for type "${type}" failed:`,
          error
        );
        return value;
      }
    }

    // Handle special cases based on type
    if (type === 'date' && typeof value === 'string') {
      return new Date(value);
    }
    if (type === 'regexp' && typeof value === 'string') {
      return new RegExp(value);
    }
    if (type === 'map' && Array.isArray(value)) {
      return new Map(value);
    }
    if (type === 'set' && Array.isArray(value)) {
      return new Set(value);
    }

    // For primitives and unknown types, return as-is
    return value;
  }

  /**
   * Deserialize with detailed result
   * @param value The serialized value
   * @param type The atom type
   * @returns Deserialization result with metadata
   */
  deserializeWithResult(value: unknown, type: string): DeserializationResult {
    try {
      const deserializedValue = this.deserialize(value, type);
      return {
        value: deserializedValue,
        success: true,
        type,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        value,
        success: false,
        error: errorMessage,
        type,
      };
    }
  }

  /**
   * Register a custom deserializer for a specific type
   * @param type The type name
   * @param deserializer The deserializer function
   */
  registerDeserializer(type: string, deserializer: TypeDeserializer): void {
    this.customDeserializers.set(type, deserializer);
  }

  /**
   * Unregister a custom deserializer
   * @param type The type name
   */
  unregisterDeserializer(type: string): void {
    this.customDeserializers.delete(type);
  }

  /**
   * Check if a deserializer is registered for a type
   * @param type The type name
   * @returns True if deserializer exists
   */
  hasDeserializer(type: string): boolean {
    return this.customDeserializers.has(type);
  }

  /**
   * Get all registered deserializer types
   * @returns Array of type names
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.customDeserializers.keys());
  }

  /**
   * Clear all custom deserializers (keep defaults)
   */
  resetToDefaults(): void {
    this.customDeserializers.clear();
    this.setupDefaultDeserializers();
  }
}

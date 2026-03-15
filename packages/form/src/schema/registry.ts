import type { SchemaPlugin, SchemaType, SchemaValidator } from './types';

/**
 * Configuration for the schema registry
 */
export interface SchemaRegistryConfig {
  /** Automatically register built-in plugins */
  autoRegisterBuiltins?: boolean;
  /** Strict mode (throw error on duplicate registration) */
  strict?: boolean;
}

/**
 * Schema validation registry
 *
 * @example
 * ```typescript
 * const registry = new SchemaRegistry();
 * registry.register('zod', zodPlugin);
 *
 * const validator = registry.create('zod', myZodSchema);
 * const errors = await validator.validate(values);
 * ```
 */
export class SchemaRegistry {
  private plugins = new Map<SchemaType, SchemaPlugin<unknown, Record<string, unknown>>>();
  private readonly config: Required<SchemaRegistryConfig>;

  constructor(config: SchemaRegistryConfig = {}) {
    this.config = {
      autoRegisterBuiltins: true,
      strict: false,
      ...config,
    };

    if (this.config.autoRegisterBuiltins) {
      this.registerBuiltins();
    }
  }

  /**
   * Register a plugin
   * @param type - Schema type (unique key)
   * @param plugin - Plugin to register
   * @throws Error if plugin is already registered (in strict mode)
   */
  register<TSchema, TValues extends Record<string, unknown>>(
    type: SchemaType,
    plugin: SchemaPlugin<TSchema, TValues>
  ): void {
    if (this.plugins.has(type)) {
      if (this.config.strict) {
        throw new Error(
          `Schema plugin "${type}" is already registered`
        );
      }
      console.warn(
        `Schema plugin "${type}" is already registered. Overwriting.`
      );
    }
    this.plugins.set(type, plugin as SchemaPlugin<unknown, Record<string, unknown>>);
  }

  /**
   * Get a plugin by type
   * @param type - Schema type
   * @returns Plugin or null if not found
   */
  get<TSchema, TValues extends Record<string, unknown>>(
    type: SchemaType
  ): SchemaPlugin<TSchema, TValues> | null {
    return (
      (this.plugins.get(type) as SchemaPlugin<TSchema, TValues>) ?? null
    );
  }

  /**
   * Check if a plugin exists
   * @param type - Schema type
   * @returns true if plugin is registered
   */
  has(type: SchemaType): boolean {
    return this.plugins.has(type);
  }

  /**
   * Create a validator from a schema
   * @param type - Schema type
   * @param schema - Original schema
   * @returns Validator or null if plugin not found
   */
  create<TSchema, TValues extends Record<string, unknown>>(
    type: SchemaType,
    schema: TSchema
  ): SchemaValidator<TValues> | null {
    const plugin = this.get<TSchema, TValues>(type);
    if (!plugin) {
      return null;
    }
    return plugin.create(schema) as SchemaValidator<TValues>;
  }

  /**
   * Get all registered schema types
   * @returns Array of schema types
   */
  getRegisteredTypes(): SchemaType[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.plugins.clear();
  }

  /**
   * Register built-in plugins
   * Override this method for custom plugin sets
   */
  protected registerBuiltins(): void {
    // Built-in plugins are registered separately
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    pluginCount: number;
    types: SchemaType[];
  } {
    return {
      pluginCount: this.plugins.size,
      types: this.getRegisteredTypes(),
    };
  }
}

/**
 * Global default schema registry
 *
 * @example
 * ```typescript
 * import { defaultSchemaRegistry } from '@nexus-state/form/schema';
 *
 * const validator = defaultSchemaRegistry.create('zod', mySchema);
 * ```
 */
export const defaultSchemaRegistry = new SchemaRegistry();

/**
 * SDK for developing validation schema plugins
 * @packageDocumentation
 */

// Types
export type {
  SchemaType,
  FieldError,
  ValidationErrors,
  ValidationContext,
  SchemaPlugin,
  SchemaValidator,
  SchemaPluginMeta,
  SchemaPluginWithMeta,
} from './types';

// Registry
export { SchemaRegistry, defaultSchemaRegistry } from './registry';
export type { SchemaRegistryConfig } from './registry';

// Builder
export {
  createSchemaPlugin,
  createSyncValidator,
  createAsyncValidator,
  createFieldValidator,
  composeValidators,
} from './builder';
export type { PluginBuilderConfig } from './builder';

// Utils
export {
  normalizeFieldPath,
  mergeValidationErrors,
  mergeValidationErrorsWith,
  createFieldError,
  createI18nFieldError,
  isEmpty,
  isNotEmpty,
  deepEqual,
  debounce,
  cache,
} from './utils';
export type { CacheOptions } from './utils';

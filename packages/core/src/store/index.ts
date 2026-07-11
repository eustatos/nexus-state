/**
 * Store module exports
 *
 * @packageDocumentation
 * Provides store implementation components.
 */

// Main store creation
export { createStore, createEnhancedStore, type StoreEnhancementOptions } from '../store';

// Store implementation (facade)
export { StoreImpl } from './StoreImpl';

// Core components
export {
  type AtomState,
  type StoreOptions,
} from './types';
export { DependencyTracker } from './DependencyTracker';
export { NotificationManager } from './NotificationManager';
export { PluginSystem } from './PluginSystem';
export { ComputedEvaluator } from './ComputedEvaluator';
/** @deprecated Use `devtools()` plugin from `@nexus-state/core/devtools` instead */
export { DevToolsIntegration, type DevToolsConfig } from './DevToolsIntegration';
export { BatchProcessor } from './BatchProcessor';

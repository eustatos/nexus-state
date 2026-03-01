/**
 * DevTools configuration utilities
 * Implements configuration system as per TASK-005
 */

import { ActionNamingStrategy } from '../utils/action-naming';
import { StackTraceConfig, DEFAULT_STACK_TRACE_CONFIG } from '../utils/stack-tracer';

export interface DevToolsConfig extends StackTraceConfig {
  actionNaming: ActionNamingStrategy;
  enableGrouping: boolean;
  maxGroupSize: number;
}

/**
 * Default DevTools configuration
 */
export const DEFAULT_DEVTOOLS_CONFIG: DevToolsConfig = {
  ...DEFAULT_STACK_TRACE_CONFIG,
  actionNaming: 'auto',
  enableGrouping: true,
  maxGroupSize: 100
};

/**
 * Global DevTools configuration
 */
let globalConfig: DevToolsConfig = { ...DEFAULT_DEVTOOLS_CONFIG };

/**
 * Get current DevTools configuration
 * @returns Current configuration
 */
export function getDevToolsConfig(): DevToolsConfig {
  return { ...globalConfig };
}

/**
 * Update DevTools configuration
 * @param config - Partial configuration to update
 */
export function updateDevToolsConfig(config: Partial<DevToolsConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Reset DevTools configuration to defaults
 */
export function resetDevToolsConfig(): void {
  globalConfig = { ...DEFAULT_DEVTOOLS_CONFIG };
}

/**
 * Check if development mode is enabled
 * @returns True if in development mode
 */
export function isDevelopmentMode(): boolean {
  return globalConfig.isDevelopment;
}

/**
 * Check if action grouping is enabled
 * @returns True if action grouping is enabled
 */
export function isActionGroupingEnabled(): boolean {
  return globalConfig.enableGrouping;
}
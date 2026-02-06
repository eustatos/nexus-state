// Action metadata tracking utilities for DevTools integration
// Implements requirements from TASK-002-ENHANCE-STORE-DEVTOOLS-INTEGRATION

import type { Atom } from '../types';

/**
 * Action metadata structure
 */
export type ActionMetadata = {
  /**
   * Unique identifier for the action
   */
  id: string;
  
  /**
   * Type of action (e.g., 'SET', 'COMPUTED_UPDATE')
   */
  type: string;
  
  /**
   * Source of the action (e.g., component name, user action)
   */
  source?: string;
  
  /**
   * Timestamp when the action occurred
   */
  timestamp: number;
  
  /**
   * Stack trace if enabled in development
   */
  stackTrace?: string;
  
  /**
   * Atom that was affected by this action
   */
  atom?: Atom<any>;
  
  /**
   * Previous value of the atom
   */
  previousValue?: any;
  
  /**
   * New value of the atom
   */
  newValue?: any;
  
  /**
   * Additional custom metadata
   */
  custom?: Record<string, any>;
};

/**
 * Action tracking configuration
 */
export type ActionTrackingOptions = {
  /**
   * Whether to enable action tracking
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Whether to capture stack traces (performance impact)
   * @default false
   */
  captureStackTrace?: boolean;
  
  /**
   * Maximum number of actions to keep in history
   * @default 100
   */
  maxHistorySize?: number;
  
  /**
   * Whether to include atom values in action history
   * @default false
   */
  includeValues?: boolean;
};

/**
 * Default action tracking options
 */
const DEFAULT_OPTIONS: ActionTrackingOptions = {
  enabled: true,
  captureStackTrace: false,
  maxHistorySize: 100,
  includeValues: false,
};

/**
 * Action tracker class for managing action metadata
 */
export class ActionTracker {
  private actions: ActionMetadata[] = [];
  private options: ActionTrackingOptions;
  
  constructor(options: ActionTrackingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Track an action
   * @param metadata - Action metadata
   */
  trackAction(metadata: ActionMetadata): void {
    if (!this.options.enabled) {
      return;
    }
    
    // Capture stack trace if enabled
    if (this.options.captureStackTrace && !metadata.stackTrace) {
      metadata.stackTrace = new Error().stack;
    }
    
    // Add to history
    this.actions.push(metadata);
    
    // Trim history to max size
    if (this.actions.length > (this.options.maxHistorySize ?? 100)) {
      this.actions.shift();
    }
  }
  
  /**
   * Get recent actions
   * @param limit - Maximum number of actions to return
   * @returns Array of recent actions
   */
  getRecentActions(limit: number = 10): ActionMetadata[] {
    return this.actions.slice(-limit);
  }
  
  /**
   * Get actions by type
   * @param type - Action type to filter by
   * @returns Array of actions of the specified type
   */
  getActionsByType(type: string): ActionMetadata[] {
    return this.actions.filter(action => action.type === type);
  }
  
  /**
   * Get actions by source
   * @param source - Source to filter by
   * @returns Array of actions from the specified source
   */
  getActionsBySource(source: string): ActionMetadata[] {
    return this.actions.filter(action => action.source === source);
  }
  
  /**
   * Clear action history
   */
  clearHistory(): void {
    this.actions = [];
  }
  
  /**
   * Get total action count
   * @returns Number of tracked actions
   */
  getActionCount(): number {
    return this.actions.length;
  }
  
  /**
   * Create action metadata for a SET operation
   * @param atom - The atom being set
   * @param previousValue - Previous value of the atom
   * @param newValue - New value of the atom
   * @param source - Source of the action
   * @param custom - Custom metadata
   * @returns Action metadata
   */
  createSetActionMetadata(
    atom: Atom<any>,
    previousValue: any,
    newValue: any,
    source?: string,
    custom?: Record<string, any>
  ): ActionMetadata {
    return {
      id: this.generateId(),
      type: 'SET',
      atom,
      previousValue: this.options.includeValues ? previousValue : undefined,
      newValue: this.options.includeValues ? newValue : undefined,
      source,
      timestamp: Date.now(),
      custom,
    };
  }
  
  /**
   * Create action metadata for a computed update
   * @param atom - The computed atom being updated
   * @param previousValue - Previous value of the atom
   * @param newValue - New value of the atom
   * @param dependencies - Dependencies that triggered the update
   * @returns Action metadata
   */
  createComputedUpdateMetadata(
    atom: Atom<any>,
    previousValue: any,
    newValue: any,
    dependencies: Atom<any>[] = []
  ): ActionMetadata {
    return {
      id: this.generateId(),
      type: 'COMPUTED_UPDATE',
      atom,
      previousValue: this.options.includeValues ? previousValue : undefined,
      newValue: this.options.includeValues ? newValue : undefined,
      timestamp: Date.now(),
      custom: {
        dependencies: dependencies.map(dep => dep.toString()),
      },
    };
  }
  
  /**
   * Generate a unique ID for an action
   * @returns Unique ID string
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Global action tracker instance
 */
export const globalActionTracker = new ActionTracker();

/**
 * Helper function to create action metadata with stack trace
 * @param type - Action type
 * @param source - Action source
 * @param custom - Custom metadata
 * @returns Action metadata with stack trace
 */
export function createActionWithStackTrace(
  type: string,
  source?: string,
  custom?: Record<string, any>
): ActionMetadata {
  const metadata: ActionMetadata = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    source,
    timestamp: Date.now(),
    custom,
  };
  
  // Capture stack trace
  metadata.stackTrace = new Error().stack;
  
  return metadata;
}
/**
 * Types for action naming system
 */

import type { BasicAtom } from '../types';

/**
 * Context information for naming an action
 */
export interface ActionNamingContext {
  /** The atom that the action is performed on */
  atom: BasicAtom;
  
  /** The display name of the atom (from atom registry or toString) */
  atomName: string;
  
  /** The operation being performed (e.g., "SET", "UPDATE", "RESET") */
  operation: string;
  
  /** Timestamp when the action occurred */
  timestamp: number;
  
  /** Optional current state at the time of action */
  state?: unknown;
  
  /** Optional metadata about the action */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for action naming strategies
 */
export interface ActionNamingStrategy {
  /** Unique name identifier for the strategy */
  readonly name: string;
  
  /** Description of the strategy for documentation/debugging */
  readonly description: string;
  
  /**
   * Generate an action name based on context
   * @param context The context for naming the action
   * @returns The generated action name
   */
  getName(context: ActionNamingContext): string;
}

/**
 * Built-in strategy types
 */
export type BuiltInActionNamingStrategyType = 
  | 'auto'      // atomName + " " + operation (default)
  | 'simple'    // operation only
  | 'pattern';  // custom pattern with placeholders

/**
 * Union type for all strategy types
 */
export type ActionNamingStrategyType = 
  | BuiltInActionNamingStrategyType
  | 'custom'    // user-defined function
  | string;     // custom strategy name

/**
 * Configuration for pattern-based naming strategy
 */
export interface PatternNamingConfig {
  /** Pattern template with placeholders */
  pattern: string;
  
  /** Available placeholders for the pattern */
  placeholders?: {
    /** Include atom name placeholder {atomName} */
    atomName?: boolean;
    
    /** Include operation placeholder {operation} */
    operation?: boolean;
    
    /** Include timestamp placeholder {timestamp} */
    timestamp?: boolean;
    
    /** Include date placeholder {date} (YYYY-MM-DD) */
    date?: boolean;
    
    /** Include time placeholder {time} (HH:MM:SS) */
    time?: boolean;
    
    /** Custom placeholder definitions {customName: valueProvider} */
    custom?: Record<string, (context: ActionNamingContext) => string>;
  };
}

/**
 * Configuration for custom naming function
 */
export interface CustomNamingConfig {
  /** Custom naming function */
  namingFunction: (context: ActionNamingContext) => string;
}

/**
 * Options for configuring action naming
 */
export interface ActionNamingOptions {
  /** The strategy to use (type or instance) */
  strategy?: ActionNamingStrategyType | ActionNamingStrategy;
  
  /** Configuration for pattern-based strategy */
  patternConfig?: PatternNamingConfig;
  
  /** Configuration for custom naming function */
  customConfig?: CustomNamingConfig;
  
  /** Default strategy if none specified */
  defaultStrategy?: BuiltInActionNamingStrategyType;
}

/**
 * Registry entry for a naming strategy
 */
export interface ActionNamingStrategyRegistration {
  /** The strategy instance */
  strategy: ActionNamingStrategy;
  
  /** Whether this is the default strategy */
  isDefault: boolean;
  
  /** Description for documentation/debugging */
  description: string;
}

/**
 * Result of action name generation
 */
export interface ActionNamingResult {
  /** The generated action name */
  name: string;
  
  /** The strategy used to generate the name */
  strategyName: string;
  
  /** The context used for generation */
  context: ActionNamingContext;
  
  /** Any errors that occurred during generation */
  error?: string;
}
/**
 * Action Naming System
 * 
 * Configurable action naming strategies for DevTools debugging
 * 
 * @example
 * ```typescript
 * import { defaultActionNamingSystem } from './action-naming';
 * 
 * // Generate action name with default (auto) strategy
 * const name = defaultActionNamingSystem.getName({
 *   atom: userAtom,
 *   atomName: 'user',
 *   operation: 'SET',
 * });
 * // Result: "user SET"
 * 
 * // Use simple strategy
 * const simpleName = defaultActionNamingSystem.getName({
 *   atom: userAtom,
 *   atomName: 'user',
 *   operation: 'SET',
 * }, { strategy: 'simple' });
 * // Result: "SET"
 * 
 * // Use pattern strategy
 * const patternName = defaultActionNamingSystem.getName({
 *   atom: userAtom,
 *   atomName: 'user',
 *   operation: 'SET',
 * }, {
 *   strategy: 'pattern',
 *   patternConfig: {
 *     pattern: '[{timestamp}] {atomName}.{operation}',
 *     placeholders: { timestamp: true }
 *   }
 * });
 * // Result: "[1234567890] user.SET"
 * ```
 */

export type {
  ActionNamingContext,
  ActionNamingStrategy,
  ActionNamingStrategyType,
  BuiltInActionNamingStrategyType,
  PatternNamingConfig,
  CustomNamingConfig,
  ActionNamingOptions,
  ActionNamingStrategyRegistration,
  ActionNamingResult,
} from './types';

export {
  // Strategies
  AutoNamingStrategy,
  SimpleNamingStrategy,
  PatternNamingStrategy,
  CustomNamingStrategy,
  CompositeNamingStrategy,
  createBuiltInStrategy,
  defaultAutoStrategy,
  defaultSimpleStrategy,
  defaultPatternStrategy,
} from './strategies';

export {
  // Registry and System
  ActionNamingRegistry,
  ActionNamingSystem,
  defaultActionNamingSystem,
  createActionNamingSystem,
} from './registry';
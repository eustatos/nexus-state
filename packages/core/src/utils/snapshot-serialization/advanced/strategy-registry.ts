// Advanced Serialization System - Strategy Registry

import { SerializationStrategy, StrategyRegistration } from "./types";

/**
 * Registry for serialization strategies
 */
export class StrategyRegistry {
  private strategies: Map<string, StrategyRegistration> = new Map();

  /**
   * Register a new strategy
   * @param strategy The strategy to register
   * @param name Optional name for the strategy
   * @param priority Optional priority (higher priority checked first)
   */
  register(
    strategy: SerializationStrategy,
    name?: string,
    priority: number = 0,
  ): void {
    const strategyName = name || strategy.constructor.name;
    this.strategies.set(strategyName, {
      name: strategyName,
      priority,
      strategy,
    });
  }

  /**
   * Register multiple strategies at once
   * @param strategies Array of strategies to register
   */
  registerMany(strategies: SerializationStrategy[]): void {
    strategies.forEach((strategy, index) => {
      this.register(strategy, undefined, -index);
    });
  }

  /**
   * Get all registered strategies sorted by priority
   */
  getStrategies(): StrategyRegistration[] {
    return Array.from(this.strategies.values()).sort(
      (a, b) => b.priority - a.priority,
    );
  }

  /**
   * Get a strategy by name
   * @param name Strategy name
   */
  getStrategy(name: string): StrategyRegistration | undefined {
    return this.strategies.get(name);
  }

  /**
   * Check if a strategy exists
   * @param name Strategy name
   */
  hasStrategy(name: string): boolean {
    return this.strategies.has(name);
  }

  /**
   * Remove a strategy by name
   * @param name Strategy name
   */
  unregister(name: string): boolean {
    return this.strategies.delete(name);
  }

  /**
   * Clear all registered strategies
   */
  clear(): void {
    this.strategies.clear();
  }

  /**
   * Get strategy count
   */
  size(): number {
    return this.strategies.size;
  }
}

/**
 * Default strategy registry with common strategies pre-registered
 */
export const createDefaultRegistry = (): StrategyRegistry => {
  const registry = new StrategyRegistry();
  // Strategies will be registered by the AdvancedSerializer
  return registry;
};

/**
 * Registry for action naming strategies
 */

import type {
  ActionNamingStrategy,
  ActionNamingStrategyType,
  ActionNamingStrategyRegistration,
  ActionNamingOptions,
  PatternNamingConfig,
  CustomNamingConfig,
} from "./types";
import {
  createBuiltInStrategy,
  defaultAutoStrategy,
  defaultSimpleStrategy,
  defaultPatternStrategy,
  CustomNamingStrategy,
} from "./strategies";

/**
 * ActionNamingRegistry - Manages registration and lookup of naming strategies
 */
export class ActionNamingRegistry {
  private strategies: Map<string, ActionNamingStrategyRegistration> = new Map();
  private defaultStrategyName = "auto";

  constructor() {
    // Register built-in strategies by default
    this.register(defaultAutoStrategy, true, "Default auto naming strategy");
    this.register(defaultSimpleStrategy, false, "Simple operation-only naming");
    this.register(
      defaultPatternStrategy,
      false,
      "Pattern-based naming with timestamps",
    );
  }

  /**
   * Register a naming strategy
   */
  register(
    strategy: ActionNamingStrategy,
    isDefault = false,
    description?: string,
  ): void {
    const registration: ActionNamingStrategyRegistration = {
      strategy,
      isDefault,
      description: description || strategy.description,
    };

    this.strategies.set(strategy.name, registration);

    // Update default if specified
    if (isDefault) {
      this.defaultStrategyName = strategy.name;

      // Ensure only one default
      for (const [name, reg] of this.strategies.entries()) {
        if (name !== strategy.name) {
          reg.isDefault = false;
        }
      }
    }
  }

  /**
   * Get a strategy by name
   */
  get(name: string): ActionNamingStrategy | undefined {
    return this.strategies.get(name)?.strategy;
  }

  /**
   * Get the default strategy
   */
  getDefault(): ActionNamingStrategy {
    const defaultReg = this.strategies.get(this.defaultStrategyName);
    if (!defaultReg) {
      throw new Error(
        `Default strategy '${this.defaultStrategyName}' not found`,
      );
    }
    return defaultReg.strategy;
  }

  /**
   * Get all registered strategies
   */
  getAll(): ActionNamingStrategy[] {
    return Array.from(this.strategies.values()).map((reg) => reg.strategy);
  }

  /**
   * Get all strategy registrations with metadata
   */
  getAllRegistrations(): ActionNamingStrategyRegistration[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Check if a strategy is registered
   */
  has(name: string): boolean {
    return this.strategies.has(name);
  }

  /**
   * Remove a strategy from the registry
   */
  remove(name: string): boolean {
    if (name === this.defaultStrategyName) {
      throw new Error(
        `Cannot remove default strategy '${name}'. Set a new default first.`,
      );
    }
    return this.strategies.delete(name);
  }

  /**
   * Set the default strategy
   */
  setDefault(name: string): void {
    const registration = this.strategies.get(name);
    if (!registration) {
      throw new Error(`Strategy '${name}' not found`);
    }

    this.defaultStrategyName = name;

    // Update all registrations
    for (const [strategyName, reg] of this.strategies.entries()) {
      reg.isDefault = strategyName === name;
    }
  }

  /**
   * Clear all strategies (except built-ins if specified)
   */
  clear(keepBuiltIns = true): void {
    if (keepBuiltIns) {
      // Keep only auto, simple, and pattern strategies
      const builtInNames = new Set(["auto", "simple", "pattern"]);
      const toDelete: string[] = [];

      for (const name of this.strategies.keys()) {
        if (!builtInNames.has(name)) {
          toDelete.push(name);
        }
      }

      for (const name of toDelete) {
        this.strategies.delete(name);
      }
    } else {
      this.strategies.clear();
      // Re-add built-ins
      this.register(defaultAutoStrategy, true, "Default auto naming strategy");
      this.register(
        defaultSimpleStrategy,
        false,
        "Simple operation-only naming",
      );
      this.register(
        defaultPatternStrategy,
        false,
        "Pattern-based naming with timestamps",
      );
    }
  }
}

/**
 * ActionNamingSystem - Main system for generating action names
 */
export class ActionNamingSystem {
  private registry: ActionNamingRegistry;
  private defaultOptions?: ActionNamingOptions;

  constructor(
    registry = new ActionNamingRegistry(),
    options?: ActionNamingOptions,
  ) {
    this.registry = registry;
    this.defaultOptions = options;
    // Apply options if provided
    if (options?.defaultStrategy) {
      this.registry.setDefault(options.defaultStrategy);
    }

    // If strategy is specified and is an instance, register it
    if (
      options?.strategy &&
      typeof options.strategy === "object" &&
      "getName" in options.strategy
    ) {
      this.registry.register(options.strategy as ActionNamingStrategy, true);
    }
  }

  /**
   * Get a strategy based on options
   */
  private getStrategy(options?: ActionNamingOptions): ActionNamingStrategy {
    // Use provided options, then default options, then registry default
    const effectiveOptions = options || this.defaultOptions;

    if (!effectiveOptions || !effectiveOptions.strategy) {
      return this.registry.getDefault();
    }

    const { strategy, patternConfig, customConfig } = effectiveOptions;

    // If strategy is already an instance, use it
    if (typeof strategy === "object" && "getName" in strategy) {
      return strategy;
    }

    // Handle string strategy types
    const strategyType = strategy as ActionNamingStrategyType;

    // Check for custom strategy
    if (strategyType === "custom") {
      if (!customConfig?.namingFunction) {
        throw new Error(
          "Custom strategy requires namingFunction in customConfig",
        );
      }
      return new CustomNamingStrategy(customConfig.namingFunction);
    }

    // Check for registered strategy by name
    if (this.registry.has(strategyType)) {
      const found = this.registry.get(strategyType);
      if (found) return found;
    }

    // Handle built-in types
    if (
      strategyType === "auto" ||
      strategyType === "simple" ||
      strategyType === "pattern"
    ) {
      if (strategyType === "pattern" && !patternConfig) {
        throw new Error("Pattern strategy requires patternConfig");
      }
      return createBuiltInStrategy(strategyType, patternConfig);
    }

    // Unknown strategy, fall back to default
    console.warn(`Unknown strategy type: ${strategyType}. Using default.`);
    return this.registry.getDefault();
  }

  /**
   * Generate an action name
   */
  getName(
    context: {
      atom: any;
      atomName: string;
      operation: string;
      state?: unknown;
      metadata?: Record<string, unknown>;
    },
    options?: ActionNamingOptions,
  ): string {
    const strategy = this.getStrategy(options);

    const fullContext = {
      ...context,
      timestamp: Date.now(),
    };

    try {
      return strategy.getName(fullContext);
    } catch (error) {
      console.warn(`Failed to generate action name: ${error}`);
      return `action-${Date.now()}`; // Fallback name
    }
  }

  /**
   * Get the underlying registry
   */
  getRegistry(): ActionNamingRegistry {
    return this.registry;
  }
}

/**
 * Default singleton instance
 */
export const defaultActionNamingSystem = new ActionNamingSystem();

/**
 * Factory function to create action naming system
 */
export function createActionNamingSystem(
  options?: ActionNamingOptions,
): ActionNamingSystem {
  return new ActionNamingSystem(new ActionNamingRegistry(), options);
}

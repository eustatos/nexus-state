/**
 * Built-in action naming strategies
 */

import type {
  ActionNamingStrategy,
  ActionNamingContext,
  PatternNamingConfig,
} from "./types";

/**
 * Auto naming strategy: atomName + " " + operation
 * Example: "user SET", "counter INCREMENT"
 */
export class AutoNamingStrategy implements ActionNamingStrategy {
  readonly name = "auto";
  readonly description =
    'Combines atom name with operation (atomName + " " + operation)';

  getName(context: ActionNamingContext): string {
    return `${context.atomName} ${context.operation}`;
  }
}

/**
 * Simple naming strategy: operation only
 * Example: "SET", "INCREMENT", "RESET"
 */
export class SimpleNamingStrategy implements ActionNamingStrategy {
  readonly name = "simple";
  readonly description = "Uses only the operation name";

  getName(context: ActionNamingContext): string {
    return context.operation;
  }
}

/**
 * Pattern naming strategy: custom pattern with placeholders
 * Example pattern: "[{timestamp}] {atomName}.{operation}"
 */
export class PatternNamingStrategy implements ActionNamingStrategy {
  readonly name = "pattern";
  readonly description: string;

  private readonly pattern: string;
  private readonly placeholders: {
    atomName: boolean;
    operation: boolean;
    timestamp: boolean;
    date: boolean;
    time: boolean;
    custom?: Record<string, (context: ActionNamingContext) => string>;
  };
  private readonly customPlaceholders: Record<
    string,
    (context: ActionNamingContext) => string
  >;

  constructor(config: PatternNamingConfig) {
    this.pattern = config.pattern;
    this.description = `Pattern-based naming: ${config.pattern}`;
    // Default placeholders
    this.placeholders = {
      atomName: true,
      operation: true,
      timestamp: false,
      date: false,
      time: false,
      ...config.placeholders,
    };

    // Custom placeholders
    this.customPlaceholders = config.placeholders?.custom || {};
  }

  getName(context: ActionNamingContext): string {
    let result = this.pattern;

    // Replace built-in placeholders
    if (this.placeholders.atomName) {
      result = result.replace(/\{atomName\}/g, context.atomName);
    }

    if (this.placeholders.operation) {
      result = result.replace(/\{operation\}/g, context.operation);
    }

    if (this.placeholders.timestamp) {
      result = result.replace(/\{timestamp\}/g, context.timestamp.toString());
    }

    if (this.placeholders.date || this.placeholders.time) {
      const date = new Date(context.timestamp);

      if (this.placeholders.date) {
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        result = result.replace(/\{date\}/g, dateStr);
      }

      if (this.placeholders.time) {
        const timeStr = date.toISOString().split("T")[1].split(".")[0]; // HH:MM:SS
        result = result.replace(/\{time\}/g, timeStr);
      }
    }

    // Replace custom placeholders
    for (const [placeholder, valueProvider] of Object.entries(
      this.customPlaceholders,
    )) {
      const regex = new RegExp(`\\{${placeholder}\\}`, "g");
      const value = valueProvider(context);
      result = result.replace(regex, value);
    }

    return result;
  }
}

/**
 * Custom naming strategy: user-defined function
 */
export class CustomNamingStrategy implements ActionNamingStrategy {
  readonly name = "custom";
  readonly description: string;

  private readonly namingFunction: (context: ActionNamingContext) => string;

  constructor(
    namingFunction: (context: ActionNamingContext) => string,
    description?: string,
  ) {
    this.namingFunction = namingFunction;
    this.description = description || "Custom user-defined naming function";
  }

  getName(context: ActionNamingContext): string {
    return this.namingFunction(context);
  }
}

/**
 * Composite naming strategy: fallback through multiple strategies
 * Useful for trying multiple strategies until one works
 */
export class CompositeNamingStrategy implements ActionNamingStrategy {
  readonly name = "composite";
  readonly description: string;

  private readonly strategies: ActionNamingStrategy[];
  private readonly fallbackName: string;

  constructor(strategies: ActionNamingStrategy[], fallbackName = "unknown") {
    this.strategies = strategies;
    this.fallbackName = fallbackName;
    this.description = `Composite strategy with ${strategies.length} fallback strategies`;
  }

  getName(context: ActionNamingContext): string {
    for (const strategy of this.strategies) {
      try {
        const name = strategy.getName(context);
        if (name && name.trim().length > 0) {
          return name;
        }
      } catch (error) {
        // Try next strategy
        continue;
      }
    }

    return this.fallbackName;
  }
}

/**
 * Factory function to create built-in strategy instances
 */
export function createBuiltInStrategy(
  strategyType: "auto" | "simple" | "pattern",
  config?: PatternNamingConfig,
): ActionNamingStrategy {
  switch (strategyType) {
    case "auto":
      return new AutoNamingStrategy();
    case "simple":
      return new SimpleNamingStrategy();
    case "pattern":
      if (!config) {
        throw new Error("Pattern strategy requires config with pattern");
      }
      return new PatternNamingStrategy(config);
    default:
      throw new Error(`Unknown built-in strategy: ${strategyType}`);
  }
}

/**
 * Default auto naming strategy instance
 */
export const defaultAutoStrategy = new AutoNamingStrategy();

/**
 * Default simple naming strategy instance
 */
export const defaultSimpleStrategy = new SimpleNamingStrategy();

/**
 * Default pattern naming strategy with common pattern
 */
export const defaultPatternStrategy = new PatternNamingStrategy({
  pattern: "[{timestamp}] {atomName} {operation}",
  placeholders: {
    timestamp: true,
    atomName: true,
    operation: true,
  },
});

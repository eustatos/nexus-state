/**
 * Delta compression factory
 * Creates compression strategies based on configuration
 */

import type {
  DeltaCompressionFactoryConfig,
  DeltaCompressionStrategyType,
} from "./types";

import {
  NoDeltaCompressionStrategy,
  TimeBasedDeltaCompressionStrategy,
  ChangesBasedDeltaCompressionStrategy,
  SizeBasedDeltaCompressionStrategy,
  SignificanceBasedDeltaCompressionStrategy,
} from "./strategy";

/**
 * Factory for creating delta compression strategies
 */
export class DeltaCompressionFactory {
  /**
   * Create a compression strategy based on configuration
   */
  static create(config: DeltaCompressionFactoryConfig): any {
    // If already a strategy instance, return it
    if (typeof config.strategy !== "string") {
      return config.strategy;
    }

    // Create strategy based on type
    switch (config.strategy) {
      case "none":
        return new NoDeltaCompressionStrategy({
          enabled: config.enabled ?? true,
          minChainLength: config.minChainLength,
        });

      case "time":
        return new TimeBasedDeltaCompressionStrategy({
          enabled: config.enabled ?? true,
          minChainLength: config.minChainLength,
          maxAge: config.time?.maxAge,
        });

      case "changes":
        return new ChangesBasedDeltaCompressionStrategy({
          enabled: config.enabled ?? true,
          minChainLength: config.minChainLength,
          maxDeltas: config.changes?.maxDeltas,
        });

      case "size":
        return new SizeBasedDeltaCompressionStrategy({
          enabled: config.enabled ?? true,
          minChainLength: config.minChainLength,
          maxSize: config.size?.maxSize,
        });

      case "significance":
        return new SignificanceBasedDeltaCompressionStrategy({
          enabled: config.enabled ?? true,
          minChainLength: config.minChainLength,
        });

      default:
        throw new Error(`Unknown delta compression strategy: ${config.strategy}`);
    }
  }

  /**
   * Get list of available strategies
   */
  static getAvailableStrategies(): { 
    name: string; 
    description: string; 
    type: DeltaCompressionStrategyType 
  }[] {
    return [
      {
        name: "none",
        description: "No compression - keep all deltas",
        type: "none",
      },
      {
        name: "time",
        description: "Create full snapshot based on time",
        type: "time",
      },
      {
        name: "changes",
        description: "Create full snapshot after N changes",
        type: "changes",
      },
      {
        name: "size",
        description: "Create full snapshot when chain exceeds size limit",
        type: "size",
      },
      {
        name: "significance",
        description: "Create full snapshot for important changes",
        type: "significance",
      },
    ];
  }
}

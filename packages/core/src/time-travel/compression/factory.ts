/**
 * Factory for creating compression strategies
 */

import type { CompressionStrategy } from "./strategy";
import { NoCompressionStrategy } from "./strategy";
import { TimeBasedCompression } from "./time-based";
import { SizeBasedCompression } from "./size-based";
import { SignificanceBasedCompression } from "./significance-based";

/**
 * Compression strategy types
 */
export type CompressionStrategyType = "none" | "time" | "size" | "significance";

/**
 * Configuration for compression factory
 */
export interface CompressionFactoryConfig {
  strategy: CompressionStrategyType | CompressionStrategy;
  /** Time-based strategy options */
  time?: {
    keepRecentForMs?: number;
    keepEvery?: number;
  };
  /** Size-based strategy options */
  size?: {
    maxSnapshots?: number;
    keepEvery?: number;
  };
  /** Significance-based strategy options */
  significance?: {
    minChangeThreshold?: number;
    maxConsecutiveSimilar?: number;
  };
  /** Minimum snapshots to keep */
  minSnapshots?: number;
  /** Enable/disable compression */
  enabled?: boolean;
}

/**
 * Factory for creating compression strategies
 */
export class CompressionFactory {
  /**
   * Create a compression strategy based on configuration
   */
  static create(config: CompressionFactoryConfig): CompressionStrategy {
    // If already a strategy instance, return it
    if (typeof config.strategy !== "string") {
      return config.strategy;
    }
    
    // Create strategy based on type
    switch (config.strategy) {
      case "none":
        return new NoCompressionStrategy({
          enabled: config.enabled ?? true,
          minSnapshots: config.minSnapshots,
        });
      
      case "time":
        return new TimeBasedCompression({
          enabled: config.enabled ?? true,
          minSnapshots: config.minSnapshots,
          keepRecentForMs: config.time?.keepRecentForMs,
          keepEvery: config.time?.keepEvery,
        });
      
      case "size":
        return new SizeBasedCompression({
          enabled: config.enabled ?? true,
          minSnapshots: config.minSnapshots,
          maxSnapshots: config.size?.maxSnapshots,
          keepEvery: config.size?.keepEvery,
        });
      
      case "significance":
        return new SignificanceBasedCompression({
          enabled: config.enabled ?? true,
          minSnapshots: config.minSnapshots,
          minChangeThreshold: config.significance?.minChangeThreshold,
          maxConsecutiveSimilar: config.significance?.maxConsecutiveSimilar,
        });
      
      default:
        throw new Error(`Unknown compression strategy: ${config.strategy}`);
    }
  }
}

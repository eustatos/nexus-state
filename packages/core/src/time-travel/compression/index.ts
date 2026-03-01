/**
 * Compression module exports
 * Provides configurable history compression strategies for Time Travel
 */

export { BaseCompressionStrategy, NoCompressionStrategy } from "./strategy";

export type {
  CompressionStrategy,
  CompressionStrategyConfig,
} from "./strategy";

export type { CompressionMetadata } from "../types";

export type { TimeBasedCompressionConfig } from "./time-based";
export { TimeBasedCompression } from "./time-based";

export type { SizeBasedCompressionConfig } from "./size-based";
export { SizeBasedCompression } from "./size-based";

export type { SignificanceBasedCompressionConfig } from "./significance-based";
export { SignificanceBasedCompression, compareSnapshots } from "./significance-based";

export type {
  CompressionFactoryConfig,
  CompressionStrategyType,
} from "./factory";
export { CompressionFactory } from "./factory";

// Re-export delta compression types and strategies
export {
  BaseDeltaCompressionStrategy,
  NoDeltaCompressionStrategy,
  TimeBasedDeltaCompressionStrategy,
  ChangesBasedDeltaCompressionStrategy,
  SizeBasedDeltaCompressionStrategy,
  SignificanceBasedDeltaCompressionStrategy,
} from "../delta/compression/strategy";

export { DeltaCompressionFactory } from "../delta/compression/factory";

export type {
  DeltaCompressionStrategy,
  DeltaCompressionConfig,
  DeltaCompressionFactoryConfig,
  DeltaCompressionStrategyType,
  DeltaCompressionMetadata,
} from "../delta/compression/types";

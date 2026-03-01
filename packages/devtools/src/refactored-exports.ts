/**
 * Exports for refactored DevTools components
 * 
 * This file exports all the decomposed components for use in other parts
 * of the application or for testing.
 */

export { DevToolsConnector, createDevToolsConnector } from "./devtools-connector";
export { StateSerializer, createStateSerializer } from "./state-serializer";
export { ActionNamingSystem, createActionNamingSystem } from "./action-naming";
export { MessageHandler, createMessageHandler } from "./message-handler";
export { StackTraceService, createStackTraceService } from "./stack-trace-service";
export { AtomNameResolver, createAtomNameResolver } from "./atom-name-resolver";
export { PollingService, createPollingService } from "./polling-service";
export { DevToolsPluginRefactored, createDevToolsPluginRefactored } from "./devtools-plugin-refactored";

// Re-export existing components for compatibility
export { CommandHandler } from "./command-handler";
export { createBatchUpdater } from "./batch-updater";
export { createActionGrouper } from "./action-grouper";
export { createActionMetadata } from "./action-metadata";
export { createSnapshotMapper } from "./snapshot-mapper";
export { createFallbackConnection } from "./createFallbackConnection";
export { detectDevToolsFeatures } from "./detectDevToolsFeatures";

// Export types
import type {
  DevToolsConfig,
  DevToolsConnection,
  DevToolsMessage,
  EnhancedStore,
  BasicAtom,
  DevToolsMode,
  ActionMetadata,
  Command,
  JumpToStateCommand,
  JumpToActionCommand,
  ImportStateCommand,
  CommandHandlerConfig,
  SerializationConfig,
  BatchUpdateConfig,
  ActionGroupOptions,
} from "./types";

export type {
  DevToolsConfig,
  DevToolsConnection,
  DevToolsMessage,
  EnhancedStore,
  BasicAtom,
  DevToolsMode,
  ActionMetadata,
  Command,
  JumpToStateCommand,
  JumpToActionCommand,
  ImportStateCommand,
  CommandHandlerConfig,
  SerializationConfig,
  BatchUpdateConfig,
  ActionGroupOptions,
};
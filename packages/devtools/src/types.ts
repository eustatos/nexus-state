// Import action naming types
export type {
  ActionNamingContext,
  ActionNamingStrategy,
  ActionNamingStrategyType,
  BuiltInActionNamingStrategyType,
  PatternNamingConfig,
  CustomNamingConfig,
  ActionNamingOptions,
} from "./action-naming/index";

/**
 * Configuration for DevTools plugin with action naming support
 */
export interface DevToolsConfig {
  /** The name to display in DevTools for this store instance */
  name?: string;

  /** Enable stack traces for actions in DevTools */
  trace?: boolean;

  /** Debounce time (in ms) for sending updates to DevTools */
  latency?: number;

  /** Maximum number of actions to keep in DevTools history */
  maxAge?: number;

  /** Predicate function to determine if an action should be sent to DevTools */
  actionSanitizer?: (action: string, state: unknown) => boolean;

  /** Function to sanitize state before sending to DevTools */
  stateSanitizer?: (state: unknown) => unknown;

  /** Enable display of atom names in DevTools actions */
  showAtomNames?: boolean;

  /** Custom formatter for atom names */
  atomNameFormatter?: (atom: BasicAtom, defaultName: string) => string;

  /** Strategy for naming actions in DevTools */
  actionNamingStrategy?: ActionNamingStrategyType | ActionNamingStrategy;

  /** Custom pattern for pattern-based naming */
  actionNamingPattern?: string;

  /** Custom function for naming actions */
  actionNamingFunction?: (context: ActionNamingContext) => string;

  /** Default strategy type if using pattern or custom */
  defaultNamingStrategy?: BuiltInActionNamingStrategyType;
}
/**
 * Connection interface for DevTools integration
 */
export interface DevToolsConnection {
  /** Send action and state to DevTools */
  send: (action: string | { type: string }, state: unknown) => void;

  /** Subscribe to messages from DevTools */
  subscribe: (listener: (message: DevToolsMessage) => void) => () => void;

  /** Initialize DevTools with initial state */
  init: (state: unknown) => void;

  /** Unsubscribe from DevTools */
  unsubscribe: () => void;
}
/**
 * Fallback connection interface for when DevTools is unavailable
 * Implements no-op behavior for graceful degradation
 */
export interface DevToolsConnectionFallback {
  send: (action: string | { type: string }, state: unknown) => void;
  subscribe: (listener: (message: DevToolsMessage) => void) => () => void;
  init: (state: unknown) => void;
  unsubscribe: () => void;
}
/**
 * Result of DevTools feature detection
 */
export interface DevToolsFeatureDetectionResult {
  /** Whether DevTools extension is available */
  isAvailable: boolean;
  /** Whether current environment is SSR */
  isSSR: boolean;
  /** Current mode: active, fallback, or disabled */
  mode: "active" | "fallback" | "disabled";
  /** Error message if any, null if none */
  error: Error | null;
}
/**
 * Message interface from DevTools
 */
export interface DevToolsMessage {
  /** Message type */
  type: string;

  /** Message payload */
  payload?: unknown;

  /** State as JSON string */
  state?: string;
}
/**
 * Command interface for JUMP_TO_STATE
 */
export interface JumpToStateCommand {
  /** Command type */
  type: "JUMP_TO_STATE";
  /** Index to jump to in history */
  payload: {
    index: number;
  };
}

/**
 * Command interface for JUMP_TO_ACTION
 */
export interface JumpToActionCommand {
  /** Command type */
  type: "JUMP_TO_ACTION";
  /** Action name to jump to */
  payload: {
    actionName: string;
    /** Optional current state for validation */
    state?: unknown;
  };
}

/**
 * Configuration for CommandHandler
 */
export interface CommandHandlerConfig {
  /** Maximum number of history entries to consider */
  maxHistory?: number;
  /** Callback when command is executed successfully */
  onCommandExecuted?: (command: Command, success: boolean) => void;
  /** Callback when command execution fails */
  onCommandError?: (command: Command, error: Error) => void;
}

/**
 * Basic atom interface for type definitions
 */
export interface BasicAtom {
  id?: {
    toString(): string;
  };
}

/**
 * Extended store interface with enhanced DevTools support
 */
export interface EnhancedStore {
  /** Get the current value of an atom */
  get: <Value>(atom: BasicAtom) => Value;

  /** Set the value of an atom */
  set: <Value>(
    atom: BasicAtom,
    update: Value | ((prev: Value) => Value),
  ) => void;

  /** Get the state of all atoms in the store */
  getState: () => Record<string, unknown>;

  /** Set the value of an atom with metadata for DevTools */
  setWithMetadata?: <Value>(
    atom: BasicAtom,
    update: Value | ((prev: Value) => Value),
    metadata?: Record<string, unknown>,
  ) => void;

  /** Serialize the state of all atoms in the store */
  serializeState?: () => Record<string, unknown>;
}

/**
 * DevTools mode for current environment
 */
export type DevToolsMode = "active" | "fallback" | "disabled";

/**
 * Snapshot mapping entry
 */
export interface SnapshotMapping {
  /** The snapshot ID from SimpleTimeTravel */
  snapshotId: string;
  /** The action ID (typically action name or type) */
  actionId: string;
  /** Timestamp when the mapping was created */
  timestamp: number;
  /** Optional metadata about the action */
  metadata?: Record<string, unknown>;
}

/**
 * Map from action ID to snapshot ID
 */
export type ActionToSnapshotMap = Map<string, string>;

/**
 * Map from snapshot ID to action ID
 */
export type SnapshotToActionMap = Map<string, string>;

/**
 * Result of a mapping operation
 */
export interface SnapshotMapperResult {
  /** Whether the mapping was successful */
  success: boolean;
  /** The created mapping if successful */
  mapping?: SnapshotMapping;
  /** Error message if failed */
  error?: string;
}

/**
 * Configuration for SnapshotMapper
 */
export interface SnapshotMapperConfig {
  /** Maximum number of mappings to keep */
  maxMappings?: number;
  /** Whether to automatically cleanup when max exceeded */
  autoCleanup?: boolean;
  /** Callback when a mapping is added */
  onMappingAdded?: (mapping: SnapshotMapping) => void;
  /** Callback when cleanup is performed */
  onCleanup?: (cleanedCount: number) => void;
}

/**
 * Serialized state format for DevTools compatibility
 */
export interface SerializedState {
  /** The serialized state object */
  state: Record<string, unknown>;
  /** Timestamp when state was serialized */
  timestamp: number;
  /** Checksum for data integrity verification */
  checksum: string;
  /** Optional metadata about the state */
  metadata?: Record<string, unknown>;
}

/**
 * Result of state deserialization
 */
export interface DeserializeResult {
  /** Whether deserialization was successful */
  success: boolean;
  /** The deserialized state if successful */
  state?: Record<string, unknown>;
  /** Error message if failed */
  error?: string;
  /** Checksum verification result */
  checksumValid?: boolean;
}

/**
 * State import format (from DevTools)
 */
export interface ImportStateFormat {
  /** The state object */
  state: Record<string, unknown>;
  /** Timestamp of import */
  timestamp: number;
  /** Checksum for verification */
  checksum: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * State export format (for sharing)
 * @deprecated Use ExportStateFormat from './state-serializer' instead
 */
export type ExportStateFormat = import("./state-serializer").ExportStateFormat;
/**
 * Checksum verification result
 */
export interface ChecksumResult {
  /** Whether checksum is valid */
  valid: boolean;
  /** Expected checksum */
  expected: string;
  /** Computed checksum */
  computed: string;
}

/**
 * Command interface for IMPORT_STATE
 */
export interface ImportStateCommand {
  /** Command type */
  type: "IMPORT_STATE";
  /** The imported state data */
  payload: ImportStateFormat;
}

/**
 * Union type for all command types
 */
export type Command =
  | JumpToStateCommand
  | JumpToActionCommand
  | ImportStateCommand
  | { type: string; payload?: unknown };

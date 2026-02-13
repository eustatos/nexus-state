/**
 * CommandHandler - Processes DevTools time travel commands
 *
 * This class handles JUMP_TO_STATE and JUMP_TO_ACTION commands
 * from Redux DevTools, integrating with SimpleTimeTravel for
 * state navigation.
 *
 */

import type {
  Command,
  JumpToStateCommand,
  JumpToActionCommand,
  ImportStateCommand,
  ImportStateFormat,
  CommandHandlerConfig,
} from "./types";
import { SnapshotMapper } from "./snapshot-mapper";
import type { SimpleTimeTravel } from "@nexus-state/core";
import { StateSerializer, createStateSerializer } from "./state-serializer";

/**
 * CommandHandler class for processing DevTools time travel commands
 *
 * This class provides type-safe command handling for JUMP_TO_STATE
 * and JUMP_TO_ACTION commands from Redux DevTools, with integration
 * to SimpleTimeTravel for state navigation.
 *
 * @class CommandHandler
 */
export class CommandHandler {
  private timeTravel: SimpleTimeTravel | null = null;
  private snapshotMapper: SnapshotMapper | null = null;
  private config: Required<CommandHandlerConfig>;
  private history: Command[] = [];
  private stateSerializer: StateSerializer;

  /**
   * Creates a new CommandHandler instance
   * @param config Configuration options for the handler
   */
  constructor(config: CommandHandlerConfig = {}) {
    this.config = {
      maxHistory: config.maxHistory ?? 50,
      onCommandExecuted: config.onCommandExecuted ?? (() => {}),
      onCommandError: config.onCommandError ?? (() => {}),
    };
    this.stateSerializer = createStateSerializer();
  }

  /**
   * Set the SimpleTimeTravel instance for command execution
   * @param timeTravel The SimpleTimeTravel instance to use
   */
  setTimeTravel(timeTravel: SimpleTimeTravel): void {
    this.timeTravel = timeTravel;
  }

  /**
   * Set the SnapshotMapper instance for action-to-snapshot lookups
   * @param mapper The SnapshotMapper instance to use
   */
  setSnapshotMapper(mapper: SnapshotMapper): void {
    this.snapshotMapper = mapper;
  }

  /**
   * Handle a command from DevTools
   * @param command The command to handle
   * @returns true if command was executed successfully, false otherwise
   */
  handleCommand(command: Command): boolean {
    try {
      // Validate command type
      if (!command || typeof (command as Command).type !== "string") {
        throw new Error("Invalid command: missing type");
      }

      // Validate command payload
      if (!(command as Command).payload) {
        throw new Error(
          `Invalid command payload for ${(command as Command).type}`,
        );
      }

      // Route to appropriate handler
      switch ((command as Command).type) {
        case "JUMP_TO_STATE":
          return this.handleJumpToState(command as JumpToStateCommand);

        case "JUMP_TO_ACTION":
          return this.handleJumpToAction(command as JumpToActionCommand);

        case "IMPORT_STATE":
          return this.handleImportState(command as ImportStateCommand);

        default:
          throw new Error(`Unknown command type: ${(command as Command).type}`);
      }
    } catch (error) {
      this.handleCommandError(command as Command, error as Error);
      return false;
    }
  }

  /**
   * Handle JUMP_TO_STATE command
   * @param command The JUMP_TO_STATE command
   * @returns true if successful, false otherwise
   */
  private handleJumpToState(command: JumpToStateCommand): boolean {
    // Validate index
    const { index } = command.payload;
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`Invalid index: ${index}`);
    }

    // Check SimpleTimeTravel integration
    if (!this.timeTravel) {
      throw new Error(
        "SimpleTimeTravel not initialized. Call setTimeTravel() first.",
      );
    }

    // Get current history length
    const history = this.timeTravel.getHistory();
    if (index >= history.length) {
      throw new Error(
        `Index ${index} out of bounds. History length: ${history.length}`,
      );
    }

    // Execute jump
    const success = this.timeTravel.jumpTo(index);

    if (success) {
      this.history.push(command);
      this.config.onCommandExecuted(command, true);
      return true;
    } else {
      throw new Error(`Failed to jump to index ${index}`);
    }
  }

  /**
   * Handle JUMP_TO_ACTION command
   * @param command The JUMP_TO_ACTION command
   * @returns true if successful, false otherwise
   */
  private handleJumpToAction(command: JumpToActionCommand): boolean {
    const { actionName } = command.payload;

    // Validate action name
    if (!actionName || typeof actionName !== "string") {
      throw new Error("Invalid action name: must be non-empty string");
    }

    // Check SimpleTimeTravel integration
    if (!this.timeTravel) {
      throw new Error(
        "SimpleTimeTravel not initialized. Call setTimeTravel() first.",
      );
    }

    // Use SnapshotMapper to find snapshot ID for the action
    let snapshotId: string | undefined;
    if (this.snapshotMapper) {
      snapshotId = this.snapshotMapper.getSnapshotIdByActionId(actionName);
    }

    // If no snapshot found via mapper, search history directly
    const history = this.timeTravel.getHistory();
    let foundIndex = -1;

    if (snapshotId) {
      // Find the index of the snapshot with the matched ID
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].id === snapshotId) {
          foundIndex = i;
          break;
        }
      }
    }

    // Fallback: search by action name in metadata if mapper didn't find
    if (foundIndex === -1) {
      for (let i = history.length - 1; i >= 0; i--) {
        const snapshot = history[i];
        if (snapshot.metadata.action === actionName) {
          foundIndex = i;
          break;
        }
      }
    }

    if (foundIndex === -1) {
      throw new Error(`Action "${actionName}" not found in history`);
    }

    // Execute jump
    const success = this.timeTravel.jumpTo(foundIndex);

    if (success) {
      this.history.push(command);
      this.config.onCommandExecuted(command, true);
      return true;
    } else {
      throw new Error(`Failed to jump to action "${actionName}"`);
    }
  }

  /**
   * Handle command execution errors
   * @param command The command that failed
   * @param error The error that occurred
   */
  private handleCommandError(command: Command, error: Error): void {
    this.config.onCommandError(command, error);

    // Log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[DevTools] Command execution failed:`,
        command.type,
        error.message,
      );
    }
  }

  /**
   * Get the command execution history
   * @returns Array of executed commands
   */
  getCommandHistory(): Command[] {
    return [...this.history];
  }

  /**
   * Clear the command history
   */
  clearCommandHistory(): void {
    this.history = [];
  }

  /**
   * Handle IMPORT_STATE command
   * @param command The IMPORT_STATE command
   * @returns true if successful, false otherwise
   */
  private handleImportState(command: ImportStateCommand): boolean {
    const { payload } = command;

    // Validate payload
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid import state payload");
    }

    // Use StateSerializer to validate and deserialize
    const result = this.stateSerializer.importState(payload);

    if (!result.success) {
      throw new Error(`Failed to import state: ${result.error}`);
    }

    // Check SimpleTimeTravel integration
    if (!this.timeTravel) {
      throw new Error(
        "SimpleTimeTravel not initialized. Call setTimeTravel() first.",
      );
    }

    // Extract values from SnapshotStateEntry format if needed
    const stateToImport: Record<string, unknown> = {};
    for (const [atomIdStr, atomData] of Object.entries(result.state!)) {
      if (atomData && typeof atomData === "object" && "value" in atomData) {
        // This is a SnapshotStateEntry object, extract the value
        stateToImport[atomIdStr] = (atomData as any).value;
      } else {
        // This is already a plain value
        stateToImport[atomIdStr] = atomData;
      }
    }

    // Import state into SimpleTimeTravel
    const success = this.timeTravel.importState(stateToImport);

    if (success) {
      this.history.push(command);
      this.config.onCommandExecuted(command, true);
      return true;
    } else {
      throw new Error("Failed to import state into SimpleTimeTravel");
    }
  }

  /**
   * Export current state in DevTools-compatible format
   * @returns Serialized state with checksum
   */
  exportState(): Record<string, unknown> | null {
    try {
      // Check SimpleTimeTravel integration
      if (!this.timeTravel) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "SimpleTimeTravel not initialized. Call setTimeTravel() first.",
          );
        }
        return null;
      }

      // Get current state from SimpleTimeTravel
      const history = this.timeTravel.getHistory();
      if (history.length === 0) {
        return null;
      }

      const currentSnapshot = history[history.length - 1];
      const state: Record<string, unknown> = {};

      // Convert snapshot state to plain object
      for (const [atomIdStr, atomData] of Object.entries(
        currentSnapshot.state,
      )) {
        state[atomIdStr] = atomData.value;
      }

      // Use StateSerializer to export with checksum
      const exported = this.stateSerializer.exportState(state, {
        source: "CommandHandler",
        snapshotId: currentSnapshot.id,
        timestamp: currentSnapshot.metadata.timestamp,
      });

      return exported;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to export state:", error);
      }
      return null;
    }
  }
}

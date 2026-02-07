/**
 * CommandHandler - Processes DevTools time travel commands
 *
 * This class handles JUMP_TO_STATE and JUMP_TO_ACTION commands
 * from Redux DevTools, integrating with SimpleTimeTravel for
 * state navigation.
 *
 * @example
 * ```typescript
 * const handler = new CommandHandler({
 *   maxHistory: 100,
 *   onCommandError: (command, error) => {
 *     console.warn("Command failed:", command, error);
 *   },
 * });
 *
 * handler.setTimeTravel(timeTravel);
 * handler.handleCommand({ type: "JUMP_TO_STATE", payload: { index: 5 } });
 * ```
 */

import type {
  Command,
  JumpToStateCommand,
  JumpToActionCommand,
  CommandHandlerConfig,
} from "./types";
import type { SimpleTimeTravel } from "@nexus-state/core";

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
  private config: Required<CommandHandlerConfig>;
  private history: Command[] = [];

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
  }

  /**
   * Set the SimpleTimeTravel instance for command execution
   * @param timeTravel The SimpleTimeTravel instance to use
   */
  setTimeTravel(timeTravel: SimpleTimeTravel): void {
    this.timeTravel = timeTravel;
  }

  /**
   * Handle a command from DevTools
   * @param command The command to handle
   * @returns true if command was executed successfully, false otherwise
   */
  handleCommand(command: Command): boolean {
    try {
      // Validate command type
      if (!command || typeof command.type !== "string") {
        throw new Error("Invalid command: missing type");
      }

      // Validate command payload
      if (!command.payload) {
        throw new Error(`Invalid command payload for ${command.type}`);
      }

      // Route to appropriate handler
      switch (command.type) {
        case "JUMP_TO_STATE":
          return this.handleJumpToState(command as JumpToStateCommand);

        case "JUMP_TO_ACTION":
          return this.handleJumpToAction(command as JumpToActionCommand);

        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }
    } catch (error) {
      this.handleCommandError(command, error as Error);
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

    // Find action in history
    const history = this.timeTravel.getHistory();
    let foundIndex = -1;

    // Search for matching action name in reverse order (most recent first)
    for (let i = history.length - 1; i >= 0; i--) {
      const snapshot = history[i];
      if (snapshot.metadata.action === actionName) {
        foundIndex = i;
        break;
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
}
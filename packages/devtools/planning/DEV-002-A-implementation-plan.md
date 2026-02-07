# DEV-002-A Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for DEV-002-A: Command Handler Base with JUMP_TO_STATE/JUMP_TO_ACTION.

## Implementation Steps

### Step 1: Command Type Definitions ✅ (TODO: IMPLEMENT)

**File:** `packages/devtools/src/types.ts`

**Changes:**

1. Add `JumpToStateCommand` interface
2. Add `JumpToActionCommand` interface  
3. Add `Command` union type
4. Add `CommandHandlerConfig` interface
5. Export new types

**Expected Types:**

```typescript
export interface JumpToStateCommand {
  type: "JUMP_TO_STATE";
  payload: {
    index: number;
  };
}

export interface JumpToActionCommand {
  type: "JUMP_TO_ACTION";
  payload: {
    actionName: string;
    state?: unknown;
  };
}

export type Command = JumpToStateCommand | JumpToActionCommand;

export interface CommandHandlerConfig {
  maxHistory?: number;
  onCommandExecuted?: (command: Command, success: boolean) => void;
  onCommandError?: (command: Command, error: Error) => void;
}
```

**Tests to Run:**
- `pnpm test:types` - TypeScript strict mode
- `pnpm lint` - Check for linting errors

**Fix:**
- Fix any TypeScript errors
- Fix any linting errors

---

### Step 2: Create Command Handler Class ✅ (TODO: IMPLEMENT)

**File:** `packages/devtools/src/command-handler.ts`

**Implementation:**

1. Create `CommandHandler` class
2. Implement `handleCommand(command: Command): boolean` method
3. Implement `JUMP_TO_STATE` handling with SimpleTimeTravel integration
4. Implement `JUMP_TO_ACTION` handling with action name lookup
5. Add error handling and validation
6. Add configuration support

**Key Methods:**

```typescript
export class CommandHandler {
  private timeTravel: SimpleTimeTravel | null = null;
  private config: Required<CommandHandlerConfig>;
  
  constructor(config: CommandHandlerConfig = {}) {
    this.config = {
      maxHistory: config.maxHistory ?? 50,
      onCommandExecuted: config.onCommandExecuted ?? (() => {}),
      onCommandError: config.onCommandError ?? (() => {}),
    };
  }
  
  setTimeTravel(timeTravel: SimpleTimeTravel): void {
    this.timeTravel = timeTravel;
  }
  
  handleCommand(command: Command): boolean {
    // Validate command
    // Execute appropriate handler
    // Handle errors
    // Return success status
  }
  
  private handleJumpToState(command: JumpToStateCommand): boolean;
  private handleJumpToAction(command: JumpToActionCommand): boolean;
}
```

**Tests to Run:**
- `pnpm test packages/devtools/src/__tests__/command-handler.test.ts`
- `pnpm lint packages/devtools/src/command-handler.ts`

**Fix:**
- Fix any test failures
- Fix any linting errors

---

### Step 3: Create Test Fixtures ✅ (TODO: IMPLEMENT)

**File:** `packages/devtools/src/__fixtures__/command-handler-fixtures.ts`

**Content:**

1. Create test scenarios for JUMP_TO_STATE
2. Create test scenarios for JUMP_TO_ACTION
3. Create error scenarios (out of bounds, invalid data)

**Fixtures:**

```typescript
export const validJumpToStateCommands = [
  { index: 0 },
  { index: 1 },
  { index: 5 },
];

export const invalidJumpToStateCommands = [
  { index: -1 },
  { index: 1000 },
  { index: NaN },
];

export const validJumpToActionCommands = [
  { actionName: "INCREMENT" },
  { actionName: "SET" },
];

export const invalidJumpToActionCommands = [
  { actionName: "" },
  { actionName: null },
];
```

**Tests to Run:**
- No direct tests, but verify fixtures work with command-handler.test.ts

**Fix:**
- Update fixtures if they don't match test expectations

---

### Step 4: Implement Tests ✅ (TODO: IMPLEMENT)

**File:** `packages/devtools/src/command-handler.test.ts`

**Test Cases:**

1. Command parsing tests
   - Valid JUMP_TO_STATE command parsing
   - Valid JUMP_TO_ACTION command parsing
   - Invalid command rejection

2. Time travel execution tests (with fixtures)
   - JUMP_TO_STATE successful execution
   - JUMP_TO_ACTION successful execution
   - Out of bounds handling

3. Error handling tests
   - Missing time travel integration
   - Invalid command data
   - Null/undefined handling

**Test Structure:**

```typescript
describe("CommandHandler", () => {
  describe("JUMP_TO_STATE", () => {
    it("should handle valid state jumps", () => {
      // Test with fixtures
    });
    
    it("should handle out of bounds indices", () => {
      // Test error handling
    });
  });
  
  describe("JUMP_TO_ACTION", () => {
    it("should handle valid action jumps", () => {
      // Test with fixtures
    });
    
    it("should handle unknown action names", () => {
      // Test error handling
    });
  });
});
```

**Tests to Run:**
- `pnpm test packages/devtools/src/__tests__/command-handler.test.ts`
- `pnpm lint packages/devtools/src/command-handler.test.ts`

**Fix:**
- Fix any test failures
- Fix any linting errors
- Ensure >90% coverage

---

### Step 5: Integrate with DevToolsPlugin ✅ (TODO: IMPLEMENT)

**File:** `packages/devtools/src/devtools-plugin.ts`

**Changes:**

1. Import CommandHandler and types
2. Create CommandHandler instance in DevToolsPlugin constructor
3. Update `setupMessageListeners` to use CommandHandler
4. Update `handleDevToolsMessage` to delegate to CommandHandler
5. Setup SimpleTimeTravel integration

**Integration Pattern:**

```typescript
import { CommandHandler } from "./command-handler";

export class DevToolsPlugin {
  private commandHandler: CommandHandler;
  
  constructor(config: DevToolsConfig = {}) {
    // ... existing code ...
    this.commandHandler = new CommandHandler();
  }
  
  private setupMessageListeners(store: EnhancedStore): void {
    const unsubscribe = this.connection?.subscribe(
      (message: DevToolsMessage) => {
        try {
          this.handleDevToolsMessage(message, store);
        } catch (error) {
          // Error handling
        }
      }
    );
  }
  
  private handleDevToolsMessage(
    message: DevToolsMessage,
    store: EnhancedStore,
  ): void {
    if (message.type === "DISPATCH") {
      const payload = message.payload as { type: string };
      
      if (payload.type === "JUMP_TO_STATE" || payload.type === "JUMP_TO_ACTION") {
        const command: Command = {
          type: payload.type,
          payload: payload as any,
        };
        
        const success = this.commandHandler.handleCommand(command);
        
        if (!success) {
          console.warn("Command execution failed", command);
        }
      }
    }
  }
}
```

**Tests to Run:**
- `pnpm test packages/devtools/src/__tests__/` - All devtools tests
- `pnpm lint packages/devtools/src/devtools-plugin.ts`

**Fix:**
- Fix any integration test failures
- Fix any linting errors

---

## Quality Gates (MUST PASS Before Completion)

### Code Quality:

- [ ] TypeScript strict mode passes (0 errors)
- [ ] No `any` types in implementation
- [ ] All linting checks pass
- [ ] No performance regressions

### Testing:

- [ ] All tests pass
- [ ] Tests use fixtures from `tests/fixtures/`
- [ ] >90% code coverage
- [ ] Edge cases covered

### Documentation:

- [ ] JSDoc complete (2+ examples per public method)
- [ ] README updated with command handler section
- [ ] Integration guide complete

### Performance:

- [ ] Bundle size < 5KB added
- [ ] Command handling < 1ms runtime
- [ ] Memory overhead < 10KB

---

## Timeline

- Step 1-2: 30 minutes
- Step 3-4: 45 minutes  
- Step 5: 30 minutes
- Testing & Documentation: 30 minutes

**Total Estimate:** 2-2.5 hours

---

## Notes

- Follow strict TypeScript rules (no `any`, explicit types)
- Use existing fixtures when possible
- Run tests and lint:fix after each step
- Update context file every 30 minutes
- Document architectural decisions as they're made

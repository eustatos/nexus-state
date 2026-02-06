## AI Context Management Protocol

### 🎯 Core Principle: Proactive Context Management Saves Tokens ($$$)

## 1. Context Limit Awareness

### Token Budget Monitoring:

```typescript
// ✅ CONSTANTLY monitor approximate token usage
const CONTEXT_LIMITS = {
  MODEL_MAX_TOKENS: 128000, // Standard context window
  WARNING_THRESHOLD: 102400, // 80% - Start wrapping up
  SPLIT_THRESHOLD: 115200, // 90% - MUST propose split
  STOP_THRESHOLD: 121600, // 95% - STOP immediately

  // Rough token estimates (varies by model)
  ESTIMATES: {
    CODE_LINE: 4, // 1 line of code ≈ 4 tokens
    COMMENT_LINE: 3, // 1 comment line ≈ 3 tokens
    DOC_PARAGRAPH: 100, // Documentation paragraph
    FILE_REFERENCE: 20, // Mentioning a file
    EXPLANATION: 50, // Per explanation paragraph
  },
} as const;
```

## 2. Proactive Task Splitting Protocol

### When to Split (Automatic Triggers):

```typescript
// ✅ SPLIT TASK IMMEDIATELY if ANY of these are true:
const SPLIT_TRIGGERS = {
  // Code complexity triggers
  LINES_OF_CODE: 300, // >300 lines of new code
  FILES_MODIFIED: 5, // >5 files significantly changed
  MAJOR_FUNCTIONS: 3, // Implementing >3 major functions
  TEST_CASES: 10, // Writing >10 test cases

  // Context complexity triggers
  SOURCE_FILES: 10, // Referencing >10 different files
  EXAMPLE_CODE: 5000, // >5KB of example code in context
  ARCHITECTURE_APPROACHES: 3, // Discussing >3 different approaches

  // Task complexity triggers
  ACCEPTANCE_CRITERIA: 5, // Task has >5 acceptance criteria
  SUBSYSTEMS: 3, // Requires understanding >3 subsystems
  BREAKING_CHANGES: true, // Involves breaking API changes
  COORDINATION_NEEDED: true, // Needs coordination with other features
} as const;

// ✅ USE this checklist BEFORE starting any task:
function shouldSplitTask(task: Task): boolean {
  return (
    task.estimatedLines > SPLIT_TRIGGERS.LINES_OF_CODE ||
    task.filesToModify > SPLIT_TRIGGERS.FILES_MODIFIED ||
    task.acceptanceCriteria > SPLIT_TRIGGERS.ACCEPTANCE_CRITERIA ||
    task.requiresCoordination ||
    task.hasBreakingChanges
  );
}
```

## 3. Smart Splitting Strategies

### Strategy 1: By Responsibility (Most Common):

```typescript
// ORIGINAL: "Implement complete feature with UI, logic, and tests"
//
// SPLIT by responsibility:
const SPLIT_BY_RESPONSIBILITY = {
  TASK_1: {
    name: "Core Business Logic",
    focus: "Pure functions, no side effects",
    deliverables: ["src/logic/", "tests/unit/logic.test.ts"],
    estimatedTokens: 2000,
  },
  TASK_2: {
    name: "Data Layer & API Integration",
    focus: "API clients, data transformations",
    deliverables: ["src/api/", "tests/integration/api.test.ts"],
    estimatedTokens: 2500,
  },
  TASK_3: {
    name: "UI Components",
    focus: "React/Vue components, styling",
    deliverables: ["src/components/", "tests/ui/"],
    estimatedTokens: 3000,
  },
  TASK_4: {
    name: "Integration & Polish",
    focus: "Connect layers, error handling, final tests",
    deliverables: ["App integration", "E2E tests"],
    estimatedTokens: 1500,
  },
};
```

### Strategy 2: By Data Flow:

```typescript
// ORIGINAL: "Process user input → validate → transform → store → notify"
//
// SPLIT by data flow stages:
const SPLIT_BY_DATA_FLOW = [
  {
    phase: "INPUT_VALIDATION",
    description: "Parse and validate raw input",
    inputs: "Raw user data",
    outputs: "Validated structured data",
    tests: "Validation edge cases",
  },
  {
    phase: "DATA_TRANSFORMATION",
    description: "Transform validated data",
    inputs: "Validated data",
    outputs: "Business-ready data",
    tests: "Transformation logic",
  },
  {
    phase: "STORAGE_PERSISTENCE",
    description: "Store and retrieve data",
    inputs: "Business data",
    outputs: "Persisted state",
    tests: "CRUD operations, transactions",
  },
  {
    phase: "NOTIFICATION_DISPATCH",
    description: "Notify system of changes",
    inputs: "State changes",
    outputs: "Events, updates, side effects",
    tests: "Event delivery, error recovery",
  },
];
```

### Strategy 3: By Testability:

```typescript
// ORIGINAL: "Full feature with all edge cases"
//
// SPLIT by test scope:
const SPLIT_BY_TESTABILITY = {
  PHASE_1: {
    name: "Happy Path MVP",
    goal: "Basic functionality working",
    tests: "Simple success cases only",
    exitCriteria: "Feature works in ideal conditions",
  },
  PHASE_2: {
    name: "Error Handling & Edge Cases",
    goal: "Robust error handling",
    tests: "All error paths, edge cases",
    exitCriteria: "Feature handles failures gracefully",
  },
  PHASE_3: {
    name: "Performance & Optimization",
    goal: "Meet performance budgets",
    tests: "Load tests, memory tests, benchmarks",
    exitCriteria: "All performance budgets met",
  },
  PHASE_4: {
    name: "Integration & Real-world Testing",
    goal: "Works in production-like environment",
    tests: "Integration tests, E2E tests",
    exitCriteria: "Feature ready for production",
  },
};
```

## 4. Context Optimization Techniques

### Token-Saving Patterns:

```typescript
// ❌ WASTEFUL: Including full file contents
const wastefulExample = `
// File: user-service.ts (150 lines)
export class UserService {
  // ... 150 lines of code ...
}
`;

// ✅ EFFICIENT: Reference and summarize
// UserService implementation (see src/services/user-service.ts)
// Key methods: createUser(), updateUser(), deleteUser()
// Uses: UserRepository for persistence, EventBus for notifications

// ❌ WASTEFUL: Multiple similar examples
const example1 = `// Example 1: Basic usage (50 lines)`;
const example2 = `// Example 2: Advanced usage (50 lines)`;
const example3 = `// Example 3: Error handling (50 lines)`;

// ✅ EFFICIENT: Show pattern once
// Pattern: createInstance(config).process(data).then(handleResult)
// Variations:
// - Basic: See examples/basic-usage.ts
// - Advanced: See examples/advanced-usage.ts
// - Error handling: See examples/error-handling.ts

// ❌ WASTEFUL: Including generated/boilerplate code
const fullComponent = `
import React from 'react';
import PropTypes from 'prop-types';
// ... imports ...

export default class Component extends React.Component {
  // ... 100 lines of boilerplate ...
}
`;

// ✅ EFFICIENT: Focus on unique logic
// Component unique logic (full file at src/components/Component.tsx):
// - Custom hook: useCustomLogic()
// - Handler: handleSpecialEvent()
// - Render: renderComplexSection()
```

### File Reference Patterns:

```typescript
// ✅ OPTIMAL file reference format:
const optimalReferences = {
  // Reference existing implementations
  existingPatterns: "Similar to UserService in src/services/user-service.ts",

  // Reference test fixtures
  testData: "Use fixtures from tests/fixtures/user-data.ts",

  // Reference utilities
  utilities: "Import helpers from src/utils/validation.ts",

  // Reference types
  types: "Use types from src/types/api.types.ts",

  // Summarize instead of copy
  summary:
    "Authentication follows same pattern as AuthService: validate → token → session",
};

// ✅ CREATE checkpoints in code:
// Checkpoint 1: Core type definitions (COMPLETE)
interface User {
  /* ... */
}

// Checkpoint 2: Main service class (COMPLETE)
class UserService {
  /* ... */
}

// Checkpoint 3: API integration (NEXT SESSION)
class UserApi {
  /* ... */
}
```

## 5. Task Splitting Communication Protocol

### Standard Splitting Proposal Template:

```markdown
## 🔄 CONTEXT LIMIT APPROACHING - Task Splitting Required

### 📊 Current Context Usage: ~{percentage}% used

### ✅ Completed in This Session:

- [ ] {Feature A} implemented ({lines} lines)
- [ ] Tests for {scenario X} written
- [ ] Type definitions updated
- [ ] Documentation started

### 🔄 Partially Complete:

- {Feature B} ~{percentage}% done (needs: {specifics})
- Integration with {Module C} started
- {Documentation section} outlined

### 📋 Proposed Subtasks:

#### TASK-1A: Complete {Core Feature} (PRIORITY 1 ⭐)

**Scope:**

- Finish {remaining functionality}
- Add unit tests with fixtures
- Update type definitions

**Files:**

- `src/{module}/{feature}.ts` (+100 lines estimated)
- `tests/unit/{feature}.test.ts` (+50 lines)

**Estimated:** {tokenEstimate} tokens, {timeEstimate}

#### TASK-1B: Implement {Integration Feature} (PRIORITY 2)

**Scope:**

- Integrate with {other module}
- Add integration tests
- Handle edge cases

**Files:**

- `src/{integration}/` (2-3 files)
- `tests/integration/`

**Estimated:** {tokenEstimate} tokens, {timeEstimate}

#### TASK-1C: {Polish & Documentation} (PRIORITY 3)

**Scope:**

- Complete documentation
- Add performance optimizations
- Final integration tests

**Files:**

- Documentation updates
- Performance benchmarks
- E2E tests

**Estimated:** {tokenEstimate} tokens, {timeEstimate}

### 🎯 Recommended Next Step:

Complete **TASK-1A** now, then proceed to **TASK-1B** in next session.

### ❓ Questions for User:

1. Should I finish current subtask ({estimated} tokens remaining)?
2. Does this splitting approach make sense?
3. Any priority changes to proposed subtasks?
```

## 6. Progress Tracking and Continuation

### Progress Snapshot Format:

```typescript
// ✅ ALWAYS create progress snapshot before splitting
interface ProgressSnapshot {
  sessionId: string;
  timestamp: string;
  contextUsed: number; // percentage

  completed: {
    files: string[];
    functions: string[];
    tests: string[];
    documentation: string[];
  };

  partial: {
    files: Array<{
      path: string;
      completion: number;
      nextSteps: string[];
    }>;
  };

  nextSession: {
    priority: "HIGH" | "MEDIUM" | "LOW";
    startingPoint: string;
    estimatedTokens: number;
    filesToModify: string[];
  };

  // Save for continuation
  context: {
    lastCodeWritten: string;
    decisionsMade: string[];
    alternativesConsidered: string[];
  };
}

// ✅ USE this when continuing a task:
function continueTask(previousSnapshot: ProgressSnapshot): void {
  console.log(`Continuing from: ${previousSnapshot.timestamp}`);
  console.log(`Last completed: ${previousSnapshot.completed.functions[0]}`);
  console.log(`Next: ${previousSnapshot.nextSession.startingPoint}`);

  // Re-establish context efficiently
  loadMinimalContext(previousSnapshot);
}
```

## 7. Natural Breaking Points

### Code Checkpoint Pattern:

```typescript
// ✅ DESIGN code with natural breakpoints:

// === CHECKPOINT 1: Type Definitions ===
// Complete ALL type definitions before moving on
export interface User {
  /* ... */
}
export interface UserPreferences {
  /* ... */
}
export type UserStatus = "active" | "inactive" | "suspended";

// === CHECKPOINT 2: Core Data Structures ===
// Complete core classes/interfaces
export class UserRepository {
  /* ... */
}
export class UserValidator {
  /* ... */
}

// === CHECKPOINT 3: Main Business Logic ===
// Implement primary use cases
export class UserService {
  // Implement CRUD operations
  createUser() {
    /* ... */
  }
  updateUser() {
    /* ... */
  }
  // STOP HERE if context limited
}

// === CHECKPOINT 4: Integration Points ===
// Connect with other systems (NEXT SESSION)
export class UserApiIntegration {
  /* ... */
}
export class UserEventPublisher {
  /* ... */
}
```

### Test-Driven Checkpoints:

```typescript
// ✅ USE tests as natural breakpoints:
describe("UserService", () => {
  // PHASE 1: Basic CRUD (COMPLETE THIS SESSION)
  describe("createUser", () => {
    it("should create user with valid data", () => {
      /* ... */
    });
    it("should validate required fields", () => {
      /* ... */
    });
  });

  // PHASE 2: Advanced features (NEXT SESSION)
  describe("updateUser", () => {
    it("should update existing user", () => {
      /* TO DO */
    });
  });

  // PHASE 3: Edge cases (FINAL SESSION)
  describe("error handling", () => {
    it("should handle concurrent updates", () => {
      /* TO DO */
    });
  });
});
```

## 8. Context Management Checklist

### Before Starting ANY Task:

- [ ] Estimate task complexity (lines, files, tests)
- [ ] Check if splitting needed (use triggers above)
- [ ] Plan natural breakpoints in code
- [ ] Identify which files need full vs reference context
- [ ] Set token budget for this session

### During Implementation:

- [ ] Monitor approximate token usage
- [ ] Use reference patterns instead of full copies
- [ ] Create progress snapshots at checkpoints
- [ ] Watch for split triggers
- [ ] Optimize explanations (concise but clear)

### When Nearing Limits (80-90%):

- [ ] Start wrapping up current logical unit
- [ ] Create comprehensive progress snapshot
- [ ] Propose clear splitting plan
- [ ] Document decisions and context
- [ ] Leave code in compilable state

### For Continuation Tasks:

- [ ] Load previous progress snapshot first
- [ ] Re-establish minimal necessary context
- [ ] Continue from exact checkpoint
- [ ] Maintain consistency with previous decisions

## 9. Special Cases

### Large Refactorings:

```typescript
// For large refactors, use this pattern:
const REFACTOR_PHASES = {
  PHASE_1: {
    goal: "Create new interface alongside old",
    risk: "Low - backward compatible",
    deliverable: "New API exists, old API unchanged",
  },
  PHASE_2: {
    goal: "Migrate internal usage to new interface",
    risk: "Medium - internal changes only",
    deliverable: "Core uses new interface internally",
  },
  PHASE_3: {
    goal: "Update public API to use new interface",
    risk: "High - breaking changes",
    deliverable: "Public API updated, deprecation warnings",
  },
  PHASE_4: {
    goal: "Remove old interface",
    risk: "High - final removal",
    deliverable: "Clean codebase, only new interface",
  },
};
```

### Bug Fix Investigations:

```typescript
// For bug fixes, split investigation from fix:
const BUG_FIX_PHASES = {
  INVESTIGATION: {
    goal: "Reproduce and identify root cause",
    deliverable: "Minimal reproduction case, root cause analysis",
    context: "Debugging tools, logs, test cases",
  },
  FIX_IMPLEMENTATION: {
    goal: "Implement and test fix",
    deliverable: "Working fix with tests",
    context: "Codebase, existing tests, edge cases",
  },
  VALIDATION: {
    goal: "Verify fix doesn't break existing functionality",
    deliverable: "Regression tests, integration tests",
    context: "Full test suite, related features",
  },
};
```

## 10. Emergency Context Management

### If Context Suddenly Full:

```markdown
## 🚨 EMERGENCY: Context Limit Reached

### Immediate Actions:

1. **STOP** writing new code
2. **SUMMARIZE** current progress
3. **SAVE** work state
4. **PROPOSE** continuation plan

### Recovery Template:
```

Progress lost due to context limit. Last known state:

**Completed:**

- [Brief summary of what was done]

**Next Steps Needed:**

1. [Most critical next action]
2. [Secondary actions]

**Files Modified:**

- `path/to/file.ts` (partial, needs completion)

**Continue from:** [Last function/class implemented]

```

Please provide minimal context to continue from this point.
```

---

**Remember:** Proactive context management is not just about saving tokens—it's about creating better, more maintainable code through focused, incremental development. Small, well-defined tasks lead to better outcomes than monolithic implementations. Always split early and split often.

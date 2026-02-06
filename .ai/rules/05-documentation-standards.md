## Documentation Standards for AI-Assisted Development

### 🎯 Core Principle: Documentation is Code

## 1. JSDoc Standards (Mandatory for All Exports)

### Complete JSDoc Template:

````typescript
/**
 * Brief one-line description of what the function/class does.
 *
 * Detailed explanation of purpose, behavior, and important details.
 * Explain the "why" not just the "what". Include any architectural decisions,
 * performance considerations, or special behavior.
 *
 * @template TData - Description of type parameter and any constraints.
 * @template TResult - Additional type parameters as needed.
 *
 * @param {Type} paramName - Description of parameter purpose and expectations.
 * @param {Options} [options] - Optional parameter description.
 * @param {Config} [options.config] - Nested option properties.
 *
 * @returns {ReturnType} Description of what's returned and any special properties.
 *
 * @throws {ErrorType} When and why this error is thrown.
 * @throws {OtherError} Additional error conditions.
 *
 * @example
 * Basic usage example:
 * ```typescript
 * const result = functionName(exampleData);
 * console.log(result); // Expected output
 * ```
 *
 * @example
 * Advanced usage with configuration:
 * ```typescript
 * const complexResult = functionName(data, {
 *   maxRetries: 3,
 *   timeout: 5000,
 *   onError: (err) => console.error(err),
 * });
 * ```
 *
 * @example
 * Real-world scenario:
 * ```typescript
 * // In a React component:
 * const { data, loading } = useAsyncData(() =>
 *   functionName(userId, { cache: true })
 * );
 * ```
 *
 * @see {@link RelatedFunction} for related functionality.
 * @see {@link https://external.docs} for external documentation.
 *
 * @since Version when this was added (e.g., "v1.2.0")
 * @deprecated If deprecated, explain why and what to use instead.
 *
 * @public | @internal | @alpha | @beta - Exactly one required
 */
export function functionName<TData, TResult>(
  paramName: Type,
  options?: Options,
): ReturnType {
  // Implementation
}
````

### Required Sections (All Must Be Present):

#### 1. Description Section:

```typescript
/**
 * Creates a reactive store for managing application state.
 *
 * Uses atomic updates with fine-grained reactivity. Each piece of state
 * is an independent "atom" that can be subscribed to individually.
 * This enables optimal re-rendering in UI frameworks.
 *
 * The store automatically batches synchronous updates and provides
 * debugging capabilities via the DevTools plugin.
 */
```

#### 2. Type Parameters (for Generics):

```typescript
/**
 * @template T - The type of data stored in the atom.
 * Must be serializable for persistence and time travel.
 *
 * @template TScope - The visibility scope of the atom.
 * Defaults to 'global' but can be 'component' for local state.
 */
```

#### 3. Parameter Documentation:

```typescript
/**
 * @param {T} initialValue - The initial value for the atom.
 * If a function is provided, it will be called lazily on first access.
 *
 * @param {AtomOptions} [options] - Configuration options for the atom.
 * @param {string} [options.name] - Human-readable name for debugging.
 * @param {boolean} [options.persist=false] - Whether to save to storage.
 * @param {ValidationFunction} [options.validate] - Custom validation logic.
 */
```

#### 4. Returns Documentation:

```typescript
/**
 * @returns {Atom<T>} A reactive atom instance.
 * The atom provides `.get()`, `.set()`, and `.subscribe()` methods.
 *
 * @returns {Promise<Atom<T>>} If initialization is async.
 */
```

#### 5. Examples (Minimum 2 Required):

````typescript
/**
 * @example
 * Basic primitive atom:
 * ```typescript
 * const count = atom(0, { name: 'counter' });
 * store.set(count, 5);
 * console.log(store.get(count)); // 5
 * ```
 *
 * @example
 * Computed atom with dependencies:
 * ```typescript
 * const price = atom(100);
 * const taxRate = atom(0.08);
 * const total = atom((get) => {
 *   return get(price) * (1 + get(taxRate));
 * });
 * ```
 */
````

#### 6. Error Documentation:

```typescript
/**
 * @throws {InvalidInitialValueError}
 * When initialValue cannot be serialized for persistence.
 *
 * @throws {AtomNameConflictError}
 * When an atom with the same name already exists (in dev mode).
 */
```

#### 7. Visibility Tags (Exactly One Required):

```typescript
// Public API - For external consumers
/** @public */

// Internal use only - Not for external consumers
/** @internal */

// Experimental - May change
/** @alpha */

// Beta - Mostly stable but may change
/** @beta */

// Deprecated - Will be removed
/** @deprecated Use {@link NewFunction} instead */
```

## 2. Inline Code Comments

### Comment Standards:

```typescript
// ✅ GOOD: Explain "why" not "what"
// Using WeakMap here allows garbage collection when atoms are no longer referenced
// This is critical for memory management in long-running applications
private atomCache = new WeakMap<Atom, CachedValue>();

// ✅ GOOD: Explain complex algorithms
// Fisher-Yates shuffle algorithm (O(n) time, O(1) space)
// We use this instead of sort(random) for uniform distribution
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ✅ GOOD: Document workarounds and hacks
// WORKAROUND: Chrome bug with IntersectionObserver and display: none
// See: https://bugs.chromium.org/p/chromium/issues/detail?id=999939
// Remove this when Chrome fixes the issue (expected v115)
if (isChrome) {
  useAlternativeImplementation();
}

// ❌ BAD: Redundant comments
let count = 0; // set count to 0
count++; // increment count

// ❌ BAD: Outdated comments
// TODO: Fix this later (added 2020-01-01)
function oldFunction() {
  // Still not fixed
}
```

### TODO/Comment Patterns:

```typescript
// ✅ Use consistent TODO format:
// TODO(username|team): [YYYY-MM-DD] Description with context
// FIXME: Critical issue that must be addressed
// HACK: Temporary workaround with explanation
// OPTIMIZE: Performance improvement opportunity
// NOTE: Important information for maintainers

// Examples:
// TODO(ai-agent): 2024-01-15 Implement time travel undo/redo
// FIXME: Memory leak when unmounting component
// HACK: Using setTimeout to work around React 18 batching issue
// OPTIMIZE: This loop could use memoization for large datasets
// NOTE: This must remain synchronous for SSR compatibility
```

## 3. Commit Message Standards

### Conventional Commits Format:

```
<type>(<scope>): <description>

<body>

<footer>
```

### Types (Exactly One):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, missing semi-colons)
- `refactor`: Code change that neither fixes bug nor adds feature
- `perf`: Performance improvement
- `test`: Adding or correcting tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI configuration
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Scope (Optional but Recommended):

- Module name: `core`, `react`, `devtools`, `persist`
- Feature area: `time-travel`, `atom-registry`, `serialization`
- File type: `types`, `tests`, `docs`

### Examples:

```bash
# Good examples:
feat(core): add time travel support with undo/redo
fix(devtools): handle connection errors gracefully
docs: update API reference with examples
test(time-travel): add fixtures for edge cases
perf(store): implement update batching
refactor(types): simplify atom interfaces
chore(deps): update TypeScript to v5.3

# Bad examples:
update stuff              # No type, no scope
fixed bug                # No scope, vague description
some changes             # Unclear what changed
```

### Body Requirements:

```bash
feat(time-travel): implement state snapshot system

- Add StateSnapshot class for capturing store state
- Implement StateRestorer for time travel operations
- Add snapshot serialization with versioning
- Support computed atoms in snapshots

Performance characteristics:
- Capture: < 5ms for 1000 atoms
- Restore: < 10ms for 1000 atoms
- Memory: < 1MB per 50 snapshots

BREAKING CHANGE: Store interface now requires atom IDs
to be symbols instead of strings. Migration script provided.

Closes #123
See also: #456, #789
```

## 4. README and Guide Documentation

### README Structure:

````markdown
# Project Name

> One-line description of what it does and why it's useful.

[![Build Status](https://img.shields.io/badge/build-passing-green)]()
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)]()
[![Bundle Size](https://img.shields.io/badge/bundle-3KB-blue)]()

## ✨ Features

- **Feature 1**: Brief description with benefits
- **Feature 2**: Another key feature
- **Feature 3**: Performance or DX benefit

## 🚀 Quick Start

### Installation

```bash
npm install @project/core
```
````

### Basic Usage

```typescript
import { atom, createStore } from "@project/core";

// Simple example
const counter = atom(0);
const store = createStore();
```

### Advanced Example

```typescript
// More complex real-world usage
```

## 📚 Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Recipes & Patterns](./docs/recipes/)
- [Migration Guide](./docs/migration.md)

## 🔧 Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup.

## 📄 License

MIT © [Your Name/Organization]

````

### Guide Documentation Standards:
```markdown
# Guide Title

## Introduction
What problem this solves and who should read this guide.

## Prerequisites
What readers need to know before starting.

## Step-by-Step Instructions

### Step 1: Setup
```bash
# Commands to run
````

### Step 2: Basic Configuration

```typescript
// Code examples
```

### Step 3: Advanced Usage

More detailed examples.

## Common Patterns

### Pattern 1: [Use Case]

When to use and example.

### Pattern 2: [Another Use Case]

When to use and example.

## Troubleshooting

### Problem 1

**Symptoms**: What you see
**Cause**: Why it happens  
**Solution**: How to fix

### Problem 2

**Symptoms**: What you see
**Cause**: Why it happens
**Solution**: How to fix

## Performance Considerations

Important performance implications.

## See Also

- Related documentation
- External resources

````

## 5. Type Documentation

### Complex Type Documentation:
```typescript
/**
 * Configuration options for creating an atom.
 *
 * Atoms are the fundamental unit of state in the system.
 * This interface defines all configurable aspects of atom creation.
 *
 * @template T - The type of value stored in the atom.
 */
export interface AtomOptions<T = any> {
  /**
   * Human-readable name for debugging and DevTools.
   *
   * If not provided, a unique name will be generated.
   * Names must be unique across the application in development mode.
   */
  name?: string;

  /**
   * Whether to persist this atom's value across page reloads.
   *
   * When enabled, the atom's value will be saved to localStorage
   * (or another configured storage) and restored on initialization.
   *
   * @default false
   */
  persist?: boolean;

  /**
   * Custom validation function for atom values.
   *
   * Called before setting a new value. If it returns false or throws,
   * the update is rejected.
   *
   * @param newValue - The proposed new value
   * @param oldValue - The current value
   * @returns true if the value is valid, false or throws otherwise
   */
  validate?: (newValue: T, oldValue: T) => boolean;

  /**
   * Comparison function for determining if value changed.
   *
   * By default uses Object.is for comparison. Provide a custom
   * function for deep comparison or special equality logic.
   *
   * @default Object.is
   */
  equals?: (a: T, b: T) => boolean;
}

/**
 * Represents a reactive piece of state.
 *
 * Atoms are the fundamental unit of state in reactive systems.
 * They provide a getter/setter interface with subscription support.
 *
 * @template T - The type of value stored in the atom.
 */
export interface Atom<T> {
  /** Unique identifier for the atom. */
  readonly id: symbol;

  /** Human-readable name for debugging. */
  readonly name: string;

  /**
   * Get the current value of the atom.
   *
   * In development mode, this call is tracked for dependency
   * detection in computed atoms.
   *
   * @returns The current value
   */
  get(): T;

  /**
   * Set a new value for the atom.
   *
   * Notifies all subscribers of the change. If the new value is
   * equal to the current value (according to the equals function),
   * subscribers are not notified.
   *
   * @param newValue - The new value or an updater function
   */
  set(newValue: T | ((prev: T) => T)): void;

  /**
   * Subscribe to value changes.
   *
   * @param listener - Function called when value changes
   * @returns Unsubscribe function
   */
  subscribe(listener: (value: T) => void): () => void;
}
````

## 6. Error Message Documentation

### User-Facing Error Messages:

```typescript
// ✅ GOOD: Helpful, actionable error messages
throw new AppError(
  "ATOM_NOT_FOUND",
  `Atom with ID "${atomId.toString()}" not found in registry.`,
  {
    suggestion: "Make sure the atom is registered before accessing it.",
    possibleCauses: [
      "Atom was created in a different store instance",
      "Atom was garbage collected",
      "Registry was cleared",
    ],
    documentation: "https://docs.example.com/atoms/registration",
  },
);

// ✅ GOOD: Validation errors with examples
throw new ValidationError(
  "INVALID_OPTIONS",
  'The "timeout" option must be a positive number.',
  {
    received: options.timeout,
    expected: "number > 0",
    example: "{ timeout: 5000 }",
  },
);

// ❌ BAD: Unhelpful error messages
throw new Error("Invalid input"); // What input? Why invalid?
throw new Error("Something went wrong"); // What went wrong?
```

## 7. Code Examples in Documentation

### Example Standards:

````typescript
// ✅ GOOD: Complete, runnable examples
/**
 * @example
 * Creating and using a counter atom:
 * ```typescript
 * import { atom, createStore } from '@project/core';
 *
 * // Create atom with initial value
 * const counter = atom(0, { name: 'counter' });
 *
 * // Create store
 * const store = createStore();
 *
 * // Set value
 * store.set(counter, 5);
 *
 * // Get value
 * console.log(store.get(counter)); // 5
 *
 * // Subscribe to changes
 * const unsubscribe = store.subscribe(counter, (value) => {
 *   console.log('Counter changed:', value);
 * });
 * ```
 */

// ✅ GOOD: Examples show error handling
/**
 * @example
 * Handling errors in async operations:
 * ```typescript
 * try {
 *   const data = await fetchData();
 *   store.set(dataAtom, data);
 * } catch (error) {
 *   if (error instanceof NetworkError) {
 *     store.set(errorAtom, 'Network connection failed');
 *   } else {
 *     store.set(errorAtom, 'Unknown error occurred');
 *   }
 * }
 * ```
 */

// ❌ BAD: Incomplete examples
/**
 * @example
 * Using the function:
 * ```typescript
 * doSomething(); // Missing imports, setup, context
 * ```
 */
````

## 8. Documentation Maintenance

### Documentation Checklist:

```typescript
// For every PR, verify:
const DOCUMENTATION_CHECKLIST = {
  PUBLIC_API: [
    "All exported functions have complete JSDoc",
    "All exported types/interfaces are documented",
    "Examples cover basic and advanced usage",
    "Error conditions documented",
    "Visibility tag (@public/@internal) present",
  ],

  INTERNAL_CODE: [
    'Complex logic has inline comments explaining "why"',
    "TODOs are formatted and dated",
    "Workarounds/hacks are documented",
    "Performance considerations noted",
  ],

  PROJECT_DOCS: [
    "README updated for new features",
    "Migration guide updated for breaking changes",
    "Type definitions exported correctly",
    "Examples in docs are runnable",
  ],

  CHANGELOG: [
    "Breaking changes clearly marked",
    "Migration path provided",
    "Deprecations documented",
    "Performance changes noted",
  ],
};
```

### Documentation Review Guidelines:

```typescript
// When reviewing documentation:
function reviewDocumentation(docs: Documentation): ReviewResult {
  return {
    // Technical accuracy
    isAccurate: checkTechnicalAccuracy(docs),

    // Completeness
    hasExamples: docs.examples.length >= 2,
    coversEdgeCases: docs.mentionsErrorConditions,

    // Clarity
    isClear: !containsJargonOrAmbiguity(docs),
    isActionable: providesActionableGuidance(docs),

    // Maintenance
    isMaintainable: docs.structuredForUpdates,
    hasOwnership: docs.authorContactable,

    // Accessibility
    isAccessible: usesClearLanguage(docs),
    hasVisualAids: includesDiagramsOrExamples(docs),
  };
}
```

## 9. Automated Documentation Checks

### ESLint Rules for Documentation:

```json
{
  "rules": {
    "require-jsdoc": [
      "error",
      {
        "require": {
          "FunctionDeclaration": true,
          "MethodDefinition": true,
          "ClassDeclaration": true,
          "ArrowFunctionExpression": true,
          "FunctionExpression": true
        }
      }
    ],

    "valid-jsdoc": [
      "error",
      {
        "requireReturn": true,
        "requireReturnType": true,
        "requireParamDescription": true,
        "requireReturnDescription": true,
        "matchDescription": ".+",
        "requireParamType": true
      }
    ],

    "jsdoc/require-param": "error",
    "jsdoc/require-param-type": "error",
    "jsdoc/require-returns": "error",
    "jsdoc/require-returns-type": "error",
    "jsdoc/require-example": "error",
    "jsdoc/require-throws": "error"
  }
}
```

### Documentation Generation:

```bash
# Recommended tools:
# - TypeDoc for API documentation
# - Vitepress for guides
# - Changesets for changelogs
# - JSDoc for inline documentation

# Example scripts in package.json:
{
  "scripts": {
    "docs:generate": "typedoc --out docs/api src/",
    "docs:serve": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:check": "eslint --rule 'require-jsdoc: error' src/"
  }
}
```

## Checklist Before Submission:

### JSDoc Checklist:

- [ ] All exports have complete JSDoc comments
- [ ] Each JSDoc has at least 2 examples
- [ ] Type parameters documented with constraints
- [ ] Parameters documented with purpose and expectations
- [ ] Return value documented with description
- [ ] Error conditions documented with @throws
- [ ] Visibility tag present (@public/@internal/@alpha/@beta)
- [ ] Related functions linked with @see
- [ ] Since/Deprecated tags if applicable

### Code Comments Checklist:

- [ ] Complex algorithms explained
- [ ] Workarounds/hacks documented with issue links
- [ ] TODOs formatted with dates and assignees
- [ ] Performance considerations noted
- [ ] No redundant "what" comments
- [ ] English language used exclusively

### Commit Message Checklist:

- [ ] Conventional commit format used
- [ ] Type and scope specified
- [ ] Description under 72 characters
- [ ] Body explains "why" not just "what"
- [ ] Breaking changes clearly marked
- [ ] Issue references included
- [ ] English language used

### Documentation Maintenance:

- [ ] README updated for new features
- [ ] Examples tested and runnable
- [ ] Migration guide for breaking changes
- [ ] Changelog entry added
- [ ] Type definitions exported correctly
- [ ] Error messages helpful and actionable

---

**Remember:** Documentation is the first thing users see and the last thing you write. Good documentation makes your code accessible, maintainable, and trustworthy. Write documentation that explains decisions, not just declarations. Document for the next developer who will maintain your code—which might be you in six months.

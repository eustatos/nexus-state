## TypeScript Development Standards

### 🎯 Core Principle: Type Safety Over Everything

## 1. Strict Mode (Non-negotiable)

```typescript
// ✅ ALWAYS: Use strict TypeScript configuration
// tsconfig.json must have:
// "strict": true,
// "noImplicitAny": true,
// "strictNullChecks": true,
// "explicitFunctionReturnTypes": true (for public APIs)

// ✅ Public API functions MUST have explicit return types
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ NEVER: Inferred return types for public APIs
export function calculateTotal(items: Item[]) {
  // NO!
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## 2. Zero Tolerance for `any`

```typescript
// ❌ ABSOLUTELY NEVER
function processData(data: any): any {} // FORBIDDEN!

// ✅ ALTERNATIVE 1: Use `unknown` with type guards
function processData(data: unknown): ProcessedData {
  if (isValidData(data)) {
    // data is now properly typed
    return transformData(data);
  }
  throw new ValidationError("Invalid data format");
}

// ✅ ALTERNATIVE 2: Use generics with constraints
function processData<T extends BaseData>(data: T): Processed<T> {
  return {
    ...data,
    processedAt: new Date(),
  };
}

// ✅ ALTERNATIVE 3: Specific union types
function handleInput(input: string | number | boolean): Result {
  if (typeof input === "string") {
    return processString(input);
  } else if (typeof input === "number") {
    return processNumber(input);
  }
  return processBoolean(input);
}
```

## 3. Type Inference Best Practices

```typescript
// ✅ DO: Let TypeScript infer simple internal functions
const getFullName = (user: User) => `${user.firstName} ${user.lastName}`;

// ✅ DO: Explicit types for complex logic
interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: Date;
}

// ✅ DO: Use `as const` for literal types
const COLORS = ["red", "green", "blue"] as const;
type Color = (typeof COLORS)[number]; // 'red' | 'green' | 'blue'

// ✅ DO: Use template literal types when appropriate
type Route = `/${string}`;
type EventName = `${string}Changed`;
```

## 4. Interface vs Type Alias

```typescript
// ✅ USE Interface for:
// 1. Object shapes that will be extended
interface User {
  id: string;
  name: string;
  email: string;
}

// 2. Declaration merging (when needed)
interface ApiConfig {
  endpoint: string;
}
interface ApiConfig {
  timeout: number;
}

// ✅ USE Type Alias for:
// 1. Union types
type Status = "loading" | "success" | "error";

// 2. Tuple types
type Point = [number, number];

// 3. Complex type transformations
type PartialUser = Partial<User>;
type UserKeys = keyof User;
```

## 5. Generics Usage

```typescript
// ✅ DO: Constrain generics appropriately
function getById<T extends { id: string }>(
  items: T[],
  id: string,
): T | undefined {
  return items.find((item) => item.id === id);
}

// ✅ DO: Use default type parameters when appropriate
interface PaginatedResponse<T = any> {
  data: T[];
  page: number;
  total: number;
}

// ✅ DO: Document complex generics
/**
 * Creates a memoized selector for derived state.
 * @template TState - The shape of the state object
 * @template TResult - The type of the derived value
 */
function createSelector<TState, TResult>(
  selector: (state: TState) => TResult,
): (state: TState) => TResult {
  // implementation
}
```

## 6. Utility Types

```typescript
// ✅ DO: Use built-in utility types
type ReadonlyUser = Readonly<User>;
type OptionalUser = Partial<User>;
type RequiredUser = Required<User>;
type UserName = Pick<User, "firstName" | "lastName">;
type UserWithoutId = Omit<User, "id">;

// ✅ DO: Create project-specific utility types
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type Maybe<T> = T | null | undefined;
```

## 7. Error Handling with Types

```typescript
// ✅ DO: Create typed error classes
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ✅ DO: Use discriminated unions for error states
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

function fetchData(): Result<Data> {
  try {
    return { success: true, data: getData() };
  } catch (error) {
    return {
      success: false,
      error: new AppError("FETCH_FAILED", "Failed to fetch data", { error }),
    };
  }
}
```

## 8. Type Assertions (Use Sparingly)

```typescript
// ❌ AVOID: Type assertions unless absolutely necessary
const element = document.getElementById("app") as HTMLDivElement; // Risky!

// ✅ PREFER: Type guards
function isDivElement(el: HTMLElement): el is HTMLDivElement {
  return el.tagName === "DIV";
}

const element = document.getElementById("app");
if (element && isDivElement(element)) {
  // element is now HTMLDivElement
}

// ✅ WHEN NECESSARY: Use `as` with explanation
// We know this element exists because it's rendered by our component
const container = document.getElementById("root") as HTMLElement;
```

## 9. Module Structure

```typescript
// ✅ DO: Separate type-only imports
import { useState, useEffect } from "react";
import type { User, ApiResponse } from "./types";
import { fetchData } from "./api";

// ✅ DO: Export types separately from values
export { fetchData, processData };
export type { User, ApiResponse, Result };

// ✅ DO: Use barrel files wisely
// index.ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
export { Input } from "./Input";
export type { InputProps } from "./Input";

// ❌ DON'T: Use wildcard exports
export * from "./utils"; // Makes tree-shaking harder
```

## 10. Code Organization

```typescript
// ✅ File structure within a module:
// 1. Imports (external → internal → relative)
// 2. Type/interface definitions
// 3. Constants
// 4. Utility functions
// 5. Main exports
// 6. Internal helpers (not exported)

// ✅ Example structure:
import { ReactNode } from "react";
import type { User, ApiConfig } from "../types";
import { API_ENDPOINT, MAX_RETRIES } from "../constants";

interface Props {
  user: User;
  onUpdate: (user: User) => void;
}

const validateUser = (user: User): boolean => {
  // internal helper
};

export function UserProfile({ user, onUpdate }: Props): ReactNode {
  // component implementation
}
```

## 11. Compiler Flags to Respect

```typescript
// These should NEVER trigger:
// @ts-expect-error - Only with explanation and TODO
// @ts-ignore - NEVER use this
// @ts-nocheck - NEVER use this

// ✅ Use @ts-expect-error with explanation:
// @ts-expect-error - Library types are outdated, fixed in v2.0
const result = oldLibrary.doSomething(modernData);

// ✅ Always fix type errors, don't suppress them:
// If you see a type error, FIX IT, don't ignore it.
```

## 12. Performance Considerations

```typescript
// ✅ DO: Use `ReadonlyArray` for immutable arrays
function processItems(items: ReadonlyArray<Item>): Result[] {
  // Can't modify items accidentally
  return items.map(processItem);
}

// ✅ DO: Avoid excessive generic nesting
// ❌ Bad: Too many nested generics
type DeepNested<T> = Promise<Result<Option<T[]>>>;

// ✅ Better: Flatten when possible
type DataResult<T> = {
  data: T[];
  error?: Error;
};

// ✅ DO: Use `satisfies` operator for validation
const config = {
  endpoint: "/api",
  timeout: 5000,
} satisfies ApiConfig;
```

## Checklist Before Submission:

- [ ] No `any` types (search for `: any`)
- [ ] All public functions have explicit return types
- [ ] All exports are typed (no implicit `any`)
- [ ] Type guards used for runtime type checking
- [ ] Generic constraints are appropriate
- [ ] No `@ts-ignore` or `@ts-nocheck`
- [ ] `@ts-expect-error` has explanation and TODO
- [ ] Union types instead of `any` or `unknown` where possible
- [ ] Error types are properly defined and used
- [ ] Module structure follows conventions

---

**Remember:** TypeScript is your documentation. The types should tell the story of what the code does and how to use it correctly.

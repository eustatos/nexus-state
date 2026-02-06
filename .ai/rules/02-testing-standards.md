## Testing Standards and Best Practices

### 🎯 Core Principle: Test Intent, Not Implementation

## 1. Test Structure and Organization

### Mandatory Test File Structure:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// 1. IMPORTS FIRST
import { functionToTest } from './module';

// 2. FIXTURE IMPORTS
import {
  mockUser,
  testProducts,
  ERROR_RESPONSE,
  LARGE_DATASET
} from '../../tests/fixtures/data';

describe('ModuleName or ComponentName', () => {
  // 3. SETUP AND TEARDOWN
  let mockApi: MockApi;

  beforeEach(() => {
    mockApi = createMockApi();
    vi.clearAllMocks();
    resetTestState();
  });

  afterEach(() => {
    mockApi.cleanup();
    vi.restoreAllMocks();
  });

  // 4. HAPPY PATH TESTS (ALWAYS REQUIRED)
  describe('happy path', () => {
    it('should work with valid input', () => {
      const result = functionToTest(mockUser);
      expect(result).toEqual(expectedOutput);
    });

    it('should handle normal use case', async () => {
      const { container } = render(<Component />);
      await waitFor(() => {
        expect(screen.getByText('Loaded')).toBeInTheDocument();
      });
    });
  });

  // 5. EDGE CASES (ALWAYS REQUIRED)
  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(functionToTest([])).toEqual([]);
    });

    it('should handle null values', () => {
      expect(() => functionToTest(null)).toThrow(ValidationError);
    });

    it('should handle undefined', () => {
      expect(functionToTest(undefined)).toBeUndefined();
    });

    it('should handle extreme values', () => {
      expect(functionToTest(Number.MAX_SAFE_INTEGER)).toBeDefined();
    });
  });

  // 6. ERROR CASES (ALWAYS REQUIRED)
  describe('error handling', () => {
    it('should throw specific error for invalid input', () => {
      expect(() => functionToTest(invalidData))
        .toThrow(ValidationError);
      expect(() => functionToTest(invalidData))
        .toThrow('INVALID_INPUT'); // Error code
    });

    it('should handle API errors gracefully', async () => {
      mockApi.mockReject(ERROR_RESPONSE);
      const { findByText } = render(<Component />);
      expect(await findByText('Error occurred')).toBeInTheDocument();
    });
  });

  // 7. PERFORMANCE TESTS (REQUIRED for data operations)
  describe('performance', () => {
    it('should handle large datasets efficiently', () => {
      const start = performance.now();
      const result = functionToTest(LARGE_DATASET);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Budget: 100ms
      expect(result).toHaveLength(LARGE_DATASET.length);
    });

    it('should not leak memory', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      for (let i = 0; i < 1000; i++) {
        functionToTest(testProducts);
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const leakage = finalMemory - initialMemory;

      expect(leakage).toBeLessThan(5 * 1024 * 1024); // < 5MB
    });
  });
});
```

## 2. Fixtures System (MANDATORY)

### Fixture Structure:

```
tests/fixtures/
├── data/                    # Test data fixtures
│   ├── users.ts            # User-related fixtures
│   ├── products.ts         # Product fixtures
│   ├── api-responses.ts    # API response mocks
│   └── edge-cases.ts       # Edge case scenarios
├── mocks/                  # Mock objects
│   ├── api-client.ts
│   ├── window.ts
│   └── timers.ts
├── utils/                  # Test utilities
│   ├── render-helpers.ts
│   └── assertion-helpers.ts
└── setup.ts               # Global test setup
```

### Fixture Creation Guidelines:

```typescript
// ✅ DO: Create reusable, realistic fixtures
// tests/fixtures/data/users.ts
export const mockUser = {
  id: "user_123",
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  roles: ["admin", "user"],
  createdAt: new Date("2023-01-01"),
  metadata: {
    lastLogin: new Date(),
    preferences: { theme: "dark" },
  },
} as const;

export const invalidUser = {
  id: "",
  name: "", // Empty name
  email: "invalid-email",
  age: -5, // Negative age
} as const;

export const LARGE_USER_LIST = Array.from({ length: 10000 }, (_, i) => ({
  id: `user_${i}`,
  name: `User ${i}`,
  email: `user${i}@example.com`,
}));

// ✅ DO: Export fixture factories for dynamic data
export const createUser = (overrides?: Partial<User>): User => ({
  ...mockUser,
  ...overrides,
  id: overrides?.id || `user_${Math.random().toString(36).slice(2)}`,
});

// ✅ DO: Group related fixtures
export const PRODUCT_FIXTURES = {
  valid: { id: "prod_1", name: "Product", price: 99.99 },
  discounted: { id: "prod_2", name: "Sale Item", price: 49.99 },
  outOfStock: { id: "prod_3", name: "Unavailable", price: 0, stock: 0 },
} as const;
```

## 3. Test Coverage Requirements

### Minimum Coverage Standards:

- **Public API:** 100% coverage (non-negotiable)
- **Internal utilities:** 90%+ coverage
- **Error paths:** All error throws MUST be tested
- **Edge cases:** All documented edge cases MUST be tested
- **Type safety:** Type tests for complex generics

### Coverage Validation:

```typescript
// ✅ DO: Write tests that validate type inference
describe("type inference", () => {
  it("should infer correct return type", () => {
    const result = processData<User>(userData);
    // Type test - ensures generics work correctly
    expectTypeOf(result).toEqualTypeOf<ProcessedUser>();
  });

  it("should enforce type constraints", () => {
    // @ts-expect-error - Should reject invalid type
    processData<string>("invalid");

    // Test should still compile
    expect(true).toBe(true);
  });
});

// ✅ DO: Test all code paths
describe("all code paths", () => {
  it("should handle if condition true", () => {
    setupCondition(true);
    expect(functionToTest()).toBe(trueResult);
  });

  it("should handle if condition false", () => {
    setupCondition(false);
    expect(functionToTest()).toBe(falseResult);
  });

  it("should handle early return", () => {
    setupEarlyReturnCondition();
    expect(functionToTest()).toBe(earlyReturnValue);
  });
});
```

## 4. Mocking Standards

### Mock Creation Guidelines:

```typescript
// ✅ DO: Use vi.mock() for module mocks
import { vi } from "vitest";
import { apiClient } from "../api";

vi.mock("../api", () => ({
  apiClient: {
    fetch: vi.fn(),
    post: vi.fn(),
  },
}));

// ✅ DO: Create mock factories
const createMockApi = (overrides = {}) => ({
  fetch: vi.fn().mockResolvedValue({ data: [] }),
  post: vi.fn().mockResolvedValue({ success: true }),
  subscribe: vi.fn().mockReturnValue(() => {}),
  ...overrides,
});

// ✅ DO: Use mock implementations with type safety
const mockFetch = vi.fn<typeof fetch>();
mockFetch.mockImplementation(async (input, init) => {
  if (typeof input === "string" && input.includes("/users")) {
    return new Response(JSON.stringify({ users: [] }));
  }
  return new Response(null, { status: 404 });
});

// ❌ DON'T: Mock everything, mock only external dependencies
// Test business logic, not third-party library behavior
```

## 5. Async Testing Best Practices

```typescript
// ✅ DO: Use proper async testing patterns
describe('async operations', () => {
  it('should resolve with data', async () => {
    const promise = fetchData();
    await expect(promise).resolves.toEqual(expectedData);
  });

  it('should reject on error', async () => {
    mockApi.mockReject(new Error('Network error'));
    const promise = fetchData();
    await expect(promise).rejects.toThrow('Network error');
  });

  it('should handle timeouts', async () => {
    vi.useFakeTimers();
    const promise = fetchWithTimeout();
    vi.advanceTimersByTime(5000);
    await expect(promise).rejects.toThrow('Timeout');
    vi.useRealTimers();
  });

  it('should update state after async operation', async () => {
    const { rerender, getByText } = render(<Component />);

    fireEvent.click(getByText('Load Data'));

    await waitFor(() => {
      expect(getByText('Loading...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(getByText('Data loaded')).toBeInTheDocument();
    });
  });
});
```

## 6. Performance and Load Testing

```typescript
// ✅ DO: Include performance assertions
describe("performance characteristics", () => {
  it("should process 10k items under 100ms", () => {
    const data = generateTestData(10000);
    const start = performance.now();
    const result = processBatch(data);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
    expect(result).toHaveLength(10000);
  });

  it("should have O(n) complexity", () => {
    const sizes = [100, 1000, 10000];
    const durations = sizes.map((size) => {
      const data = generateTestData(size);
      const start = performance.now();
      processBatch(data);
      return performance.now() - start;
    });

    // Check linear scaling (allow some variance)
    const ratio1 = durations[1] / durations[0]; // ~10x
    const ratio2 = durations[2] / durations[1]; // ~10x
    expect(ratio1).toBeGreaterThan(8);
    expect(ratio1).toBeLessThan(12);
    expect(ratio2).toBeGreaterThan(8);
    expect(ratio2).toBeLessThan(12);
  });

  it("should not cause memory leaks", () => {
    const iterations = 1000;
    const references = new Set();

    for (let i = 0; i < iterations; i++) {
      const instance = createInstance();
      references.add(instance);
      // Simulate cleanup
      if (i % 10 === 0) {
        references.clear();
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Memory should not grow unbounded
    expect(references.size).toBeLessThan(100);
  });
});
```

## 7. Integration and E2E Testing

```typescript
// ✅ DO: Test module integration
describe("integration: User + Auth modules", () => {
  it("should authenticate user and load profile", async () => {
    // Setup
    const auth = createAuthService();
    const userService = createUserService();

    // Execute integrated flow
    const token = await auth.login("user", "pass");
    const profile = await userService.getProfile(token);

    // Verify integration works
    expect(profile).toBeDefined();
    expect(profile.id).toBe("user_123");
    expect(auth.isAuthenticated).toBe(true);
  });

  it("should handle integration errors", async () => {
    mockApi.auth.reject();
    mockApi.users.reject();

    await expect(integratedFlow()).rejects.toThrow("Authentication failed");
  });
});

// ✅ DO: Test with real (but isolated) dependencies
describe("e2e: data flow", () => {
  it("should complete full user journey", async () => {
    // 1. User registers
    const registerResult = await registerUser(testUser);
    expect(registerResult.success).toBe(true);

    // 2. User logs in
    const loginResult = await loginUser(testUser.email, "password");
    expect(loginResult.token).toBeDefined();

    // 3. User performs action
    const actionResult = await performUserAction(loginResult.token);
    expect(actionResult.completed).toBe(true);

    // 4. Verify state consistency
    const finalState = await getUserState(loginResult.token);
    expect(finalState.actions).toContain(actionResult.id);
  });
});
```

## 8. Test Maintenance and Quality

### Test Quality Checklist:

```typescript
// Each test MUST:
// [ ] Test ONE thing only
// [ ] Have a descriptive name (what + why)
// [ ] Use fixtures from tests/fixtures/
// [ ] Clean up after itself
// [ ] Be deterministic (same result every time)
// [ ] Be independent (not rely on other tests)
// [ ] Run fast (< 100ms ideally)
// [ ] Fail clearly (good error messages)

// Test names should follow:
// "should [expected behavior] when [condition]"
// Example: "should return empty array when input is null"
```

### Flaky Test Prevention:

```typescript
// ❌ DON'T: Use random data in tests
it("should handle random input", () => {
  const random = Math.random(); // Flaky!
  // ...
});

// ✅ DO: Use deterministic fixtures
it("should handle specific edge case", () => {
  const edgeCase = FIXTURES.edgeCases.specific;
  // ...
});

// ❌ DON'T: Rely on external services
it("should fetch from API", async () => {
  const data = await fetch("https://api.example.com"); // Flaky!
  // ...
});

// ✅ DO: Mock external dependencies
it("should handle API response", async () => {
  mockApi.fetch.mockResolvedValue(FIXTURES.api.success);
  // ...
});
```

## 9. Test Execution and Reporting

### Vitest Configuration Standards:

```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: "node", // or 'jsdom' for React
    setupFiles: ["./tests/setup.ts"],

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 80,
        statements: 90,
      },
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.d.ts",
        "**/tests/**",
        "**/fixtures/**",
      ],
    },

    // Performance monitoring
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

## Checklist Before Submission:

- [ ] All tests use fixtures from `tests/fixtures/`
- [ ] 100% coverage for public API functions
- [ ] Edge cases tested (empty, null, undefined, extremes)
- [ ] Error paths tested (all throws)
- [ ] Performance tests for data operations
- [ ] No flaky tests (deterministic only)
- [ ] Async tests use proper waiting patterns
- [ ] Mocks only external dependencies
- [ ] Tests clean up after themselves
- [ ] Test names follow naming convention
- [ ] Type tests for complex generics
- [ ] Integration tests for module interactions
- [ ] Memory leak tests for long-running operations

---

**Remember:** Tests are documentation. Good tests explain how the code should be used and what behavior to expect. Write tests that will help the next developer understand your code.

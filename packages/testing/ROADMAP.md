# @nexus-state/testing - Roadmap

> **Testing utilities and mocks - First-class testing support for Nexus State**

---

## 📦 Package Overview

**Current Version:** Not yet released  
**Status:** Planning phase  
**Target First Release:** Q4 2026  
**Maintainer:** Nexus State Team  
**Last Updated:** 2026-02-26

### Purpose
Comprehensive testing utilities making it easy to test applications built with Nexus State, including mocks, test stores, time travel, and framework-specific helpers.

### Dependencies
- `@nexus-state/core`: workspace:*
- `@testing-library/react`: ^14.0.0 (peer, optional)
- `vitest` or `jest`: (peer)

---

## 🎯 Vision

### Why Build This?

**Problem:** Testing state management is hard:
- Complex setup/teardown
- Isolating tests
- Mocking async data
- Time travel testing
- Framework integration

**Solution:** Nexus Testing
- Simple test store creation
- Automatic cleanup
- Mock utilities
- Time travel helpers
- Framework-agnostic + framework-specific utilities

### Core Principles
1. **Easy setup** - Minimal boilerplate
2. **Isolated tests** - No shared state
3. **Type-safe** - Full TypeScript inference
4. **Framework support** - React, Vue, Svelte helpers
5. **Time travel** - Test state history

---

## 🗓️ Roadmap by Version

---

## v0.1.0 - Alpha Release

**Target:** October 31, 2026  
**Focus:** Core testing utilities

### Goals
- Test store creation
- Atom mocking
- Basic assertions
- Cleanup utilities

### Features

#### 🧪 Test Store

```typescript
import { createTestStore } from '@nexus-state/testing';

describe('User flow', () => {
  let store: Store;
  
  beforeEach(() => {
    // Create isolated store for each test
    store = createTestStore();
  });
  
  afterEach(() => {
    // Automatic cleanup
    store.cleanup();
  });
  
  it('should update user', () => {
    store.set(userAtom, { name: 'John' });
    expect(store.get(userAtom).name).toBe('John');
  });
});
```

#### 🎭 Atom Mocking

```typescript
import { mockAtom } from '@nexus-state/testing';

it('should handle async data', async () => {
  // Mock async atom
  const mockedUser = mockAtom(userAtom, {
    data: { id: 1, name: 'Test User' },
    loading: false,
    error: null
  });
  
  store.set(userAtom, mockedUser);
  
  const user = store.get(userAtom);
  expect(user.name).toBe('Test User');
});
```

#### ✅ Assertions

```typescript
import { expectAtom } from '@nexus-state/testing';

it('should validate state', () => {
  store.set(countAtom, 5);
  
  // Custom assertions
  expectAtom(store, countAtom).toBe(5);
  expectAtom(store, countAtom).toBeGreaterThan(0);
  expectAtom(store, countAtom).toMatchSchema(z.number().positive());
});
```

#### 🧹 Cleanup Utilities

```typescript
import { cleanupStores, resetAtoms } from '@nexus-state/testing';

afterEach(() => {
  // Clean up all test stores
  cleanupStores();
  
  // Reset specific atoms
  resetAtoms([userAtom, postsAtom]);
});
```

---

## v0.2.0 - React Testing

**Target:** November 30, 2026  
**Focus:** React-specific testing utilities

### Features

#### ⚛️ React Test Renderer

```typescript
import { renderWithStore } from '@nexus-state/testing/react';

it('should render user profile', () => {
  const { getByText, store } = renderWithStore(
    <UserProfile />,
    {
      initialValues: new Map([
        [userAtom, { name: 'John Doe' }]
      ])
    }
  );
  
  expect(getByText('John Doe')).toBeInTheDocument();
  
  // Access store in test
  expect(store.get(userAtom).name).toBe('John Doe');
});
```

#### 🎯 Hook Testing

```typescript
import { renderHookWithStore } from '@nexus-state/testing/react';

it('should use atom hook', () => {
  const { result, store } = renderHookWithStore(
    () => useAtom(countAtom),
    {
      initialValues: new Map([[countAtom, 0]])
    }
  );
  
  expect(result.current[0]).toBe(0);
  
  act(() => {
    result.current[1](5);
  });
  
  expect(result.current[0]).toBe(5);
  expect(store.get(countAtom)).toBe(5);
});
```

#### 🔄 User Interactions

```typescript
import { userEvent } from '@testing-library/user-event';

it('should handle click', async () => {
  const user = userEvent.setup();
  const { getByRole, store } = renderWithStore(<Counter />);
  
  const button = getByRole('button', { name: 'Increment' });
  await user.click(button);
  
  expect(store.get(countAtom)).toBe(1);
});
```

#### ⏱️ Async Testing

```typescript
import { waitForAtom } from '@nexus-state/testing/react';

it('should load user data', async () => {
  const { getByText, store } = renderWithStore(<UserProfile />);
  
  // Wait for async atom to resolve
  await waitForAtom(store, userAtom, {
    timeout: 5000,
    predicate: (value) => value.loading === false
  });
  
  expect(getByText('John Doe')).toBeInTheDocument();
});
```

---

## v1.0.0 - Production Ready

**Target:** December 31, 2026  
**Focus:** Comprehensive testing toolkit

### Features

#### 🎬 Scenario Testing

```typescript
import { createScenario } from '@nexus-state/testing';

const loginScenario = createScenario('User login flow', (scenario) => {
  scenario.step('Initial state', ({ store }) => {
    expect(store.get(userAtom)).toBeNull();
  });
  
  scenario.step('Login attempt', async ({ store, dispatch }) => {
    await dispatch(loginAction({ email: 'test@example.com', password: 'pass' }));
  });
  
  scenario.step('User logged in', ({ store }) => {
    expect(store.get(userAtom)).toMatchObject({
      email: 'test@example.com'
    });
  });
});

// Run scenario
it('should login user', async () => {
  await loginScenario.run();
});
```

#### 🕰️ Time Travel Testing

```typescript
import { createTimeTravelStore } from '@nexus-state/testing';

it('should support time travel', () => {
  const store = createTimeTravelStore();
  
  store.set(countAtom, 1);
  store.set(countAtom, 2);
  store.set(countAtom, 3);
  
  // Travel back
  store.undo();
  expect(store.get(countAtom)).toBe(2);
  
  store.undo();
  expect(store.get(countAtom)).toBe(1);
  
  // Travel forward
  store.redo();
  expect(store.get(countAtom)).toBe(2);
  
  // Get history
  const history = store.getHistory();
  expect(history).toHaveLength(3);
});
```

#### 📸 Snapshot Testing

```typescript
import { snapshotStore } from '@nexus-state/testing';

it('should match snapshot', () => {
  store.set(userAtom, { name: 'John', age: 30 });
  store.set(postsAtom, [{ id: 1, title: 'Hello' }]);
  
  // Snapshot all atoms
  expect(snapshotStore(store)).toMatchSnapshot();
  
  // Snapshot specific atoms
  expect(snapshotStore(store, [userAtom, postsAtom])).toMatchSnapshot();
});
```

#### 🎭 Mock Factories

```typescript
import { createMockFactory } from '@nexus-state/testing';

// Define mock factory
const mockUser = createMockFactory({
  id: (i) => i,
  name: (i) => `User ${i}`,
  email: (i) => `user${i}@example.com`,
  age: () => Math.floor(Math.random() * 80) + 18
});

// Generate mocks
const user1 = mockUser(1);
// { id: 1, name: 'User 1', email: 'user1@example.com', age: 42 }

const user2 = mockUser(2);
// { id: 2, name: 'User 2', email: 'user2@example.com', age: 27 }

// Generate many
const users = mockUser.many(10);
// Array of 10 users
```

#### 🔍 Spy Utilities

```typescript
import { spyOnAtom } from '@nexus-state/testing';

it('should track atom changes', () => {
  const spy = spyOnAtom(store, countAtom);
  
  store.set(countAtom, 1);
  store.set(countAtom, 2);
  store.set(countAtom, 3);
  
  expect(spy).toHaveBeenCalledTimes(3);
  expect(spy).toHaveBeenCalledWith(1);
  expect(spy).toHaveBeenLastCalledWith(3);
  
  // Get call history
  expect(spy.calls).toEqual([1, 2, 3]);
});
```

---

## v1.1.0 - Advanced Testing

**Target:** Q1 2027  
**Focus:** Advanced patterns and integrations

### Features

#### 🧪 Fixture Management

```typescript
import { defineFixture } from '@nexus-state/testing';

// Define reusable fixtures
const userFixture = defineFixture({
  name: 'authenticated-user',
  setup: (store) => {
    store.set(userAtom, {
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    });
    store.set(authTokenAtom, 'mock-token');
  },
  teardown: (store) => {
    store.set(userAtom, null);
    store.set(authTokenAtom, null);
  }
});

// Use in tests
it('should show user dashboard', () => {
  const store = createTestStore();
  userFixture.apply(store);
  
  // Test with authenticated user
  expect(store.get(userAtom)).toBeTruthy();
});
```

#### 🔄 State Builders

```typescript
import { buildState } from '@nexus-state/testing';

const testState = buildState()
  .withUser({ name: 'John' })
  .withPosts([
    { id: 1, title: 'Post 1' },
    { id: 2, title: 'Post 2' }
  ])
  .withSettings({ theme: 'dark' })
  .build();

const store = createTestStore(testState);
```

#### 🎯 Custom Matchers

```typescript
import { expect } from 'vitest';
import { matchers } from '@nexus-state/testing';

// Extend expect
expect.extend(matchers);

it('should have custom matchers', () => {
  // toHaveAtomValue
  expect(store).toHaveAtomValue(countAtom, 5);
  
  // toHaveAtomMatching
  expect(store).toHaveAtomMatching(userAtom, {
    name: expect.any(String),
    age: expect.any(Number)
  });
  
  // toHaveAtomError
  expect(store).toHaveAtomError(asyncAtom, /network error/i);
  
  // toHaveAtomLoading
  expect(store).toHaveAtomLoading(asyncAtom);
});
```

#### 📊 Test Coverage Analysis

```typescript
import { analyzeTestCoverage } from '@nexus-state/testing';

afterAll(() => {
  const coverage = analyzeTestCoverage(store);
  
  console.log(`
    Atoms tested: ${coverage.atomsCovered}/${coverage.totalAtoms}
    Coverage: ${coverage.percentage}%
    Untested atoms: ${coverage.untestedAtoms.join(', ')}
  `);
  
  // Fail if coverage too low
  expect(coverage.percentage).toBeGreaterThan(80);
});
```

---

## v2.0.0 - Next Generation

**Target:** Q3 2027  
**Status:** Vision / Exploration

### Potential Features

#### 🤖 AI-Powered Test Generation

```typescript
import { generateTests } from '@nexus-state/testing/ai';

// AI generates tests from component
const tests = await generateTests(UserProfile, {
  atoms: [userAtom, postsAtom],
  scenarios: ['happy-path', 'error-handling', 'edge-cases']
});

// Generated tests:
// ✅ should render user name
// ✅ should handle missing user
// ✅ should display error message
// ✅ should show loading state
```

#### 🎬 Visual Regression Testing

```typescript
import { visualTest } from '@nexus-state/testing/visual';

it('should match visual snapshot', async () => {
  const { container, store } = renderWithStore(<UserProfile />);
  
  store.set(userAtom, mockUser);
  
  await visualTest(container, {
    name: 'user-profile',
    states: [
      { name: 'default', store },
      { name: 'loading', store: storeWithLoading },
      { name: 'error', store: storeWithError }
    ]
  });
});
```

#### 🔍 Mutation Testing

```typescript
// Test resilience of tests
import { runMutationTests } from '@nexus-state/testing/mutation';

const results = await runMutationTests({
  atoms: [userAtom, postsAtom],
  mutations: [
    'change-initial-value',
    'remove-validation',
    'change-computed-logic'
  ]
});

// Report:
// ✅ 87% of mutations caught by tests
// ⚠️ 13% of mutations not detected
```

---

## 🚫 Non-Goals

### Will NOT Support
- ❌ E2E testing (use Playwright/Cypress)
- ❌ Performance testing (use Lighthouse)
- ❌ Visual testing (use Percy/Chromatic)
- ❌ Load testing (use k6/Artillery)

### Design Principles
1. **Unit testing focus** - Test atoms and components
2. **Easy mocking** - Simple mock creation
3. **Framework support** - React, Vue, Svelte helpers
4. **Type-safe** - Full TypeScript support
5. **Integration friendly** - Works with existing test frameworks

---

## 📊 Success Metrics

### Quality Gates

#### v1.0.0
- [ ] <2KB bundle size
- [ ] 95%+ test coverage (dogfooding)
- [ ] React, Vue, Svelte support
- [ ] Full TypeScript support
- [ ] Comprehensive documentation

#### v1.5.0
- [ ] AI test generation
- [ ] Visual regression testing
- [ ] Test coverage analysis
- [ ] Custom matchers library

#### v2.0.0
- [ ] Mutation testing
- [ ] Property-based testing
- [ ] Fuzz testing
- [ ] 99%+ coverage

---

## 🎯 Framework Support

| Framework | Renderer | Hooks | Async | Priority |
|-----------|----------|-------|-------|----------|
| React | ✅ v0.2 | ✅ v0.2 | ✅ v0.2 | **High** |
| Vue | ✅ v1.0 | ✅ v1.0 | ✅ v1.0 | **Medium** |
| Svelte | ✅ v1.0 | ✅ v1.0 | ✅ v1.0 | **Medium** |
| Vanilla | ✅ v0.1 | ❌ | ✅ v0.1 | **High** |

---

## 🐛 Bug Triage Priority

### P0 - Critical
- Test utilities broken
- Memory leaks in tests
- False positives/negatives

### P1 - High
- Missing framework support
- TypeScript errors
- Documentation gaps

### P2 - Medium
- Missing utilities
- Performance issues
- Better error messages

### P3 - Low
- Nice-to-have features
- Additional matchers
- More examples

---

## 📞 Contributing

### How to Propose Features
1. Check this roadmap
2. Open GitHub Discussion with "Testing: " prefix
3. Describe testing use case
4. Wait for maintainer feedback

### Testing Requirements
- All utilities must have tests (meta-testing!)
- Examples for each utility
- TypeScript types validated
- Documentation complete

---

## 🔗 Related Packages

### Dependencies
- `@nexus-state/core` - Core state management
- `@nexus-state/react` - React integration
- `@nexus-state/vue` - Vue integration

### Test Framework Support
- Vitest ✅
- Jest ✅
- Mocha/Chai ⏳
- AVA ⏳

---

## 📚 Resources

### Documentation
- [Testing Guide](../../docs/guides/testing.md)
- [React Testing](../../docs/recipes/testing-react.md)
- [Best Practices](../../docs/guides/best-practices.md)

### Examples
- [Unit Tests](../../examples/testing/unit-tests)
- [Integration Tests](../../examples/testing/integration)
- [E2E Tests](../../examples/testing/e2e)

### Community
- [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)
- [Discord #testing Channel](https://discord.gg/nexus-state)

---

**Roadmap Owner:** Testing Team  
**Review Cadence:** Monthly  
**Next Review:** 2026-10-01

---

> 💡 **Feedback Welcome:** Testing Nexus State apps? Share your patterns in [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)!

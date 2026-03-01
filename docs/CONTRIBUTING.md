# Contributing to Nexus State

Thank you for your interest in contributing to Nexus State! This document provides guidelines for contributing to the project.

## Pre-commit Hooks

This project uses **Husky** for automated pre-commit hooks to ensure code quality.

### What runs on pre-commit?

1. **Prettier** - Automatically formats code
2. **ESLint** - Checks code style (run separately via `npm run lint`)
3. **Type Check** - Validates TypeScript types (run in CI)
4. **Tests** - Runs tests for changed packages (run in CI)

### Commit Message Format

We follow **Conventional Commits** specification. Your commit messages will be validated by commitlint.

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Formatting, missing semi-colons, etc. (no code change)
- `refactor`: Code refactoring (no bug fix or feature)
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, build config, etc.
- `ci`: CI configuration changes
- `build`: Build system changes
- `revert`: Reverts a previous commit

**Examples:**

```bash
# Good commits
git commit -m "feat(core): add time travel support"
git commit -m "fix(react): resolve stale closure in useAtom"
git commit -m "docs: update README with installation instructions"
git commit -m "test(core): add unit tests for atom creation"
git commit -m "refactor(persist): simplify storage adapter interface"

# Bad commits (will be rejected)
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "asdfasdf"
```

### Skipping Hooks

In emergency situations, you can skip hooks:

```bash
git commit --no-verify -m "emergency fix"
```

⚠️ **Use sparingly** - hooks exist for quality assurance. If you skip them, make sure to:

1. Run `npm run lint` manually
2. Run `npm run test` to verify tests pass
3. Create a follow-up PR if needed

## Development Workflow

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/nexus-state.git
cd nexus-state
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Create Branch

```bash
git checkout -b feat/your-feature-name
```

### 4. Make Changes

Make your changes and ensure:

- Code is formatted: `npm run format`
- Lint passes: `npm run lint`
- Tests pass: `npm run test`

### 5. Commit Changes

```bash
git add .
git commit -m "feat(scope): describe your change"
```

### 6. Push and Create PR

```bash
git push origin feat/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

### TypeScript

- Use strict mode
- Prefer interfaces over type aliases for object shapes
- Use explicit return types for exported functions
- Avoid `any` - use `unknown` or proper types

### Naming Conventions

- **Files**: lowercase with hyphens (e.g., `my-file.ts`)
- **Classes/Types**: PascalCase
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE

### Imports

- External packages first
- Internal imports second
- Type imports last
- Sort alphabetically within groups

```typescript
// External
import { useState } from 'react';
import { atom } from '@nexus-state/core';

// Internal
import { createStore } from './store';
import { types } from './types';

// Types
import type { Atom } from './types';
import type { Store } from './store';
```

## Testing

### Running Tests

```bash
# All tests
npm run test

# Specific package
npm run test --workspace=@nexus-state/core

# Watch mode
npm run test -- --watch
```

### Writing Tests

- Use Vitest for unit tests
- Name test files: `*.test.ts`
- Group related tests with `describe`
- Use descriptive test names

```typescript
import { describe, it, expect } from 'vitest';
import { atom } from '../index';

describe('atom', () => {
  it('should create an atom with initial value', () => {
    const myAtom = atom(42);
    expect(myAtom.read()).toBe(42);
  });
});
```

## Release Process

### Versioning

We use [Changesets](https://github.com/changesets/changesets) for versioning.

### Creating a Release

1. Add changeset: `npm run changeset`
2. Version packages: `npm run version-packages`
3. Release: `npm run release`

## Questions?

- Check existing issues
- Read the [README](../README.md)
- Review [documentation](../docs/)

Thank you for contributing! 🎉

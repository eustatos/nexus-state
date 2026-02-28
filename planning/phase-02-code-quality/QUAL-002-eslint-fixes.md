# QUAL-002: Fix ESLint Errors and Warnings

## 📋 Task Overview

**Priority:** 🔴 High  
**Estimated Time:** 3-4 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Eliminate all ESLint errors and warnings across the codebase to ensure consistent code style and catch potential bugs.

---

## 📦 Affected Components

**All packages** and **root configuration:**
- Root `.eslintrc.js`
- All package-specific `.eslintrc.js` files
- All `.ts`, `.tsx`, `.js`, `.jsx` files

---

## 🔍 Current State Analysis

```bash
# Check current ESLint status
npm run lint 2>&1 | tee /tmp/eslint-before.txt

# Count errors and warnings
grep -E "(error|warning)" /tmp/eslint-before.txt | wc -l
```

**Expected Issues:**
- Unused variables
- Missing return types
- Inconsistent import order
- Console.log statements
- Missing dependencies in useEffect
- Unsafe any usage

---

## ✅ Acceptance Criteria

- [ ] Zero ESLint errors in production code
- [ ] Zero ESLint warnings in production code
- [ ] Consistent ESLint config across all packages
- [ ] All imports properly sorted
- [ ] No disabled ESLint rules without justification
- [ ] CI lint check passes

---

## 📝 Implementation Steps

### Step 1: Audit Current ESLint Configuration

**Check root ESLint config:**

```bash
cat .eslintrc.js
```

**Check for package-specific overrides:**

```bash
find packages -name ".eslintrc.js" -exec echo "=== {} ===" \; -exec cat {} \;
```

### Step 2: Standardize ESLint Configuration

**File:** `.eslintrc.js` (root)

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript specific
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Import organization
    'sort-imports': ['error', {
      ignoreCase: true,
      ignoreDeclarationSort: true,
    }],
  },
  overrides: [
    {
      // Test files can be less strict
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
};
```

### Step 3: Fix Common ESLint Errors

#### Error 1: Unused Variables

```typescript
// ❌ Before (ESLint error)
import { atom, createStore } from './index';

const store = createStore();

// ✅ After - Remove unused import
import { createStore } from './index';

const store = createStore();

// Or prefix with underscore if intentionally unused
const _unusedValue = 42;
```

#### Error 2: No Explicit Any

```typescript
// ❌ Before (ESLint error)
function process(data: any) {
  return data;
}

// ✅ After - Use unknown or proper type
function process(data: unknown) {
  return data;
}

// Or with generic
function process<T>(data: T): T {
  return data;
}
```

#### Error 3: Console Statements

```typescript
// ❌ Before (ESLint warning)
function debug() {
  console.log('Debug info');
}

// ✅ After - Remove or use allowed methods
function debug() {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Debug info'); // console.warn is allowed
  }
}

// Or use proper logger
import { logger } from './logger';
function debug() {
  logger.debug('Debug info');
}
```

#### Error 4: Missing Return Types

```typescript
// ❌ Before (ESLint warning)
export function createAtom(value) {
  return atom(value);
}

// ✅ After - Add explicit return type
export function createAtom<T>(value: T): Atom<T> {
  return atom(value);
}
```

#### Error 5: Import Order

```typescript
// ❌ Before (ESLint error)
import { useState } from 'react';
import type { Atom } from './types';
import { createStore } from './store';

// ✅ After - Group and sort imports
import { useState } from 'react';

import { createStore } from './store';
import type { Atom } from './types';
```

### Step 4: Run ESLint with Auto-fix

```bash
# Fix all auto-fixable issues
npm run lint -- --fix

# Check what's left
npm run lint

# Save output for review
npm run lint 2>&1 | tee /tmp/eslint-remaining.txt
```

### Step 5: Fix Remaining Issues Manually

**For each remaining error:**

```bash
# 1. Identify the error
# Example: packages/core/src/store.ts:45:3 - '@typescript-eslint/no-explicit-any'

# 2. Open the file
cat packages/core/src/store.ts | head -n 50 | tail -n 10

# 3. Fix the issue
# (Apply appropriate fix from Step 3)

# 4. Verify fix
npm run lint packages/core

# 5. Move to next error
```

### Step 6: Update Package-Specific ESLint Configs

Some packages may need specific overrides:

**File:** `packages/react/.eslintrc.js`

```javascript
module.exports = {
  extends: '../../.eslintrc.js',
  rules: {
    // React-specific rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['*.tsx'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
  ],
};
```

### Step 7: Add ESLint Scripts to package.json

**File:** `package.json` (root)

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "lint:ci": "eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0"
  }
}
```

### Step 8: Configure ESLint Ignore

**File:** `.eslintignore`

```
# Build output
dist/
build/
*.min.js

# Dependencies
node_modules/

# Generated files
coverage/
.turbo/

# Config files
*.config.js
jest.config.js
vitest.config.js

# Temporary
*.bak
*.backup
```

---

## 🧪 Validation Commands

```bash
# 1. Run ESLint on all files
npm run lint

# Expected output: 0 errors, 0 warnings

# 2. Try auto-fix
npm run lint:fix

# 3. Check for remaining issues
npm run lint

# 4. Strict CI check (fail on warnings)
npm run lint:ci

# Should exit with code 0

# 5. Verify build still works
npm run build

# 6. Verify tests still pass
npm run test
```

---

## 📚 Context & Background

### Why ESLint Matters

1. **Consistency:** Enforces uniform code style
2. **Bug Prevention:** Catches common mistakes
3. **Best Practices:** Encourages good patterns
4. **Team Collaboration:** Everyone follows same rules
5. **Automation:** Reduces manual code review burden

### Common ESLint Issues in TypeScript Projects

- `any` type usage (defeats TypeScript benefits)
- Unused variables/imports (dead code)
- Missing error handling
- Inconsistent formatting
- Unsafe type assertions

---

## 🔗 Related Tasks

- **Depends On:** QUAL-001 (TypeScript strict mode may reveal ESLint issues)
- **Blocks:** QUAL-003 (Pre-commit hooks need clean baseline)
- **Related:** QUAL-007 (Type safety improvements)

---

## 📊 Definition of Done

- [ ] `npm run lint` shows 0 errors
- [ ] `npm run lint` shows 0 warnings
- [ ] `.eslintrc.js` properly configured
- [ ] `.eslintignore` excludes appropriate files
- [ ] All packages follow same ESLint rules
- [ ] CI lint check passes
- [ ] No ESLint disable comments without explanation

---

## 🚀 Implementation Checklist

```bash
# 1. Check current state
npm run lint 2>&1 | tee /tmp/eslint-before.txt
echo "Errors found: $(grep -c error /tmp/eslint-before.txt)"

# 2. Update ESLint config
# (Copy template from Step 2)

# 3. Run auto-fix
npm run lint:fix

# 4. Check remaining issues
npm run lint 2>&1 | tee /tmp/eslint-after-autofix.txt

# 5. Fix remaining issues manually
# (Follow Step 5)

# 6. Verify clean lint
npm run lint

# 7. Verify build and tests
npm run build
npm run test

# 8. Commit
git add .eslintrc.js .eslintignore packages/
git commit -m "fix(lint): resolve all ESLint errors and warnings

- Update ESLint configuration with strict rules
- Fix all 'no-explicit-any' errors
- Remove unused imports and variables
- Add explicit return types where needed
- Organize imports consistently
- Remove debug console.log statements

ESLint: 0 errors, 0 warnings (was: X errors, Y warnings)

Resolves: QUAL-002"
```

---

## 📝 Notes for AI Agent

### ESLint Error Priority

Fix in this order:
1. **Errors first** - These block CI
2. **High-impact warnings** - no-explicit-any, unused-vars
3. **Low-impact warnings** - formatting, comments
4. **Disable rules** - Only as last resort with justification

### When to Disable ESLint Rules

Only disable when:
- External library requires it
- Technical limitation
- Edge case that's safe

Always add comment explaining why:

```typescript
// ESLint disabled: Third-party library returns 'any'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result: any = externalLib.getData();
```

### Common Pitfalls

```typescript
// ❌ Don't just disable the rule
// eslint-disable-next-line
const x = value;

// ✅ Fix the underlying issue
const x: string = value;

// ❌ Don't use any
function fn(data: any) { }

// ✅ Use unknown or proper type
function fn(data: unknown) { }
```

---

**Created:** 2026-02-23  
**Estimated Completion:** 2026-02-24  
**Actual Completion:** TBD

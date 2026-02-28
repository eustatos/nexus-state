# QUERY-001: Create Base Package Structure

## 📋 Task Overview

**Priority:** 🔴 High  
**Estimated Time:** 4 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  

---

## 🎯 Objective

Create the base package structure for `@nexus-state/query` with development infrastructure setup.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files:**
- `packages/query/package.json` (NEW)
- `packages/query/tsconfig.json` (NEW)
- `packages/query/src/index.ts` (NEW)
- `packages/query/README.md` (NEW)
- `packages/query/.eslintrc.js` (NEW)

---

## 🔍 Current State Analysis

```bash
# Check current structure
ls -la packages/query/
```

**Findings:**
- Current behavior: Query folder exists with only ARCHITECTURE.md and ROADMAP.md
- Issues: No package structure, no package.json, no source code
- Root cause: Package development hasn't started yet

---

## ✅ Acceptance Criteria

- [ ] `package.json` created with correct dependencies
- [ ] `tsconfig.json` configured for TypeScript
- [ ] `src/index.ts` created with base exports
- [ ] `README.md` contains package description
- [ ] `.eslintrc.js` configured
- [ ] `pnpm install` runs without errors
- [ ] `pnpm run build` runs without errors

---

## 📝 Implementation Steps

### Step 1: Create package.json

**What:** Create package configuration

**How:**
```json
{
  "name": "@nexus-state/query",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist && mkdir dist",
    "dev": "tsc -w",
    "test": "vitest run src",
    "test:coverage": "vitest run --coverage src",
    "lint": "eslint . --ext .ts"
  },
  "files": ["dist", "README.md", "CHANGELOG.md"],
  "dependencies": {
    "@nexus-state/core": "workspace:*"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^3.2.4",
    "eslint": "^8.40.0",
    "typescript": "^5.0.0",
    "vitest": "^3.2.4"
  }
}
```

**Validation:**
```bash
cd packages/query
cat package.json
```

### Step 2: Create tsconfig.json

**What:** Configure TypeScript compilation

**How:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Validation:**
```bash
cat tsconfig.json
```

### Step 3: Create base index.ts

**What:** Create entry point with base exports

**How:**
```typescript
// Query Atom API
export { queryAtom } from './queryAtom';
export type { QueryAtom, QueryState, QueryOptions } from './types';

// Cache
export { queryCache } from './queryCache';
export type { QueryCache, CacheEntry } from './types';

// Utilities
export { invalidateQuery, refetchQuery } from './utils';

// Types
export type {
  QueryKey,
  QueryFunction,
  QueryConfig,
  StaleTime,
  CacheTime
} from './types';
```

**Validation:**
```bash
cat src/index.ts
```

### Step 4: Create README.md

**What:** Package documentation

**How:**
```markdown
# @nexus-state/query

[![npm version](https://img.shields.io/npm/v/@nexus-state/query.svg)](https://www.npmjs.com/package/@nexus-state/query)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/query)](https://bundlephobia.com/package/@nexus-state/query)
[![License](https://img.shields.io/npm/l/@nexus-state/query.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> 🔄 Data fetching and caching on top of Nexus State atoms

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## ✨ Features

- 🎯 Query Atoms for async data
- 💾 Smart caching with GC
- 🔄 Request deduplication
- 🔁 Background refetch
- ⚡ Optimistic updates

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/query
```

## 🚀 Quick Start

```typescript
import { queryAtom } from '@nexus-state/query';
import { useAtomValue } from '@nexus-state/react';

const userQuery = queryAtom({
  key: ['user', userId],
  fetcher: () => fetch(`/api/users/${userId}`).then(r => r.json())
});

function UserProfile() {
  const user = useAtomValue(userQuery);
  return <div>{user.name}</div>;
}
```
```

**Validation:**
```bash
cat README.md
```

### Step 5: Create .eslintrc.js

**What:** Configure ESLint

**How:**
```javascript
module.exports = {
  root: true,
  extends: ['../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
  },
};
```

**Validation:**
```bash
cat .eslintrc.js
```

---

## 🧪 Validation Commands

```bash
# Navigate to package
cd packages/query

# Install dependencies
pnpm install

# Run build
pnpm run build

# Check linting
pnpm run lint

# Run tests (empty for now)
pnpm run test
```

**Expected Output:**
```
✓ Build successful
✓ ESLint passing
✓ Tests running (0 tests yet)
```

---

## 📚 Context & Background

### Why This Matters

Base infrastructure is critical for starting development. Without it, you cannot:
- Compile TypeScript
- Run tests
- Publish package to npm

### Technical Context

The package follows the same conventions as other packages in the monorepo:
- TypeScript strict mode
- Vitest for testing
- ESLint for linting
- pnpm workspace for dependencies

### Related Documentation

- [ARCHITECTURE.md](../../packages/query/ARCHITECTURE.md)
- [Phase 08 README.md](./README.md)

---

## 🔗 Related Tasks

- **Depends On:** None (first task in phase)
- **Blocks:** QUERY-002, QUERY-003, QUERY-004, QUERY-005, QUERY-006, QUERY-007, QUERY-008, QUERY-009, QUERY-010
- **Related:** TASK-007 (Suspense support - will integrate with query)

---

## 📊 Definition of Done

- [ ] All files created
- [ ] `pnpm install` runs successfully
- [ ] `pnpm run build` runs successfully
- [ ] `pnpm run lint` runs successfully
- [ ] Structure ready for development

---

## 🚀 Implementation Checklist

```bash
# 1. Create branch
git checkout -b feature/QUERY-001

# 2. Create files
# (Follow steps above)

# 3. Verify build
cd packages/query
pnpm run build

# 4. Commit
git add .
git commit -m "feat(query): create base package structure

- Add package.json with dependencies
- Add tsconfig.json for TypeScript
- Add base index.ts with exports
- Add README.md with documentation
- Add .eslintrc.js

Resolves: QUERY-001"

# 5. Push
git push origin feature/QUERY-001
```

---

## 📝 Notes for AI Agent

### Key Considerations

- Follow conventions from other packages (@nexus-state/core, @nexus-state/react)
- Use workspace:* for internal repository dependencies
- Configure proper exports for ESM and CJS

### Code Style

```typescript
// Use named exports
export { queryAtom } from './queryAtom';

// Avoid default exports
```

### Testing Patterns

```typescript
// Tests will be added in QUERY-009
describe('queryAtom', () => {
  it('should create query atom', () => {
    // Tests will come later
  });
});
```

---

## 🐛 Known Issues / Blockers

- [ ] No known issues

---

## 📈 Progress Tracking

**Started:** TBD  
**Last Updated:** 2026-02-28  
**Completed:** TBD  

**Time Spent:** 0 hours (vs estimated 4 hours)

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-03-01  
**Actual Completion:** TBD

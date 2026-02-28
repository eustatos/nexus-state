# FORM-001: Initialize Package Structure

## 📋 Task Overview

**Priority:** 🔴 High  
**Estimated Time:** 0.5 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Set up the basic package structure, build configuration, and dependencies for `@nexus-state/forms`.

---

## 📦 Affected Components

**Package:** `@nexus-state/forms` (new)  
**Files to Create:**
- `packages/forms/package.json`
- `packages/forms/tsconfig.json`
- `packages/forms/tsconfig.esm.json`
- `packages/forms/tsconfig.cjs.json`
- `packages/forms/.eslintrc.js`
- `packages/forms/README.md`
- `packages/forms/src/index.ts`

---

## 🔍 Current State Analysis

```bash
# Check if directory exists
ls -la packages/forms/

# Current state: Only ARCHITECTURE.md and ROADMAP.md exist
```

**Findings:**
- Directory exists with planning docs only
- No implementation files
- No package.json or build configuration
- Need to create full package structure

---

## ✅ Acceptance Criteria

- [ ] `package.json` created with correct dependencies
- [ ] TypeScript configuration files created
- [ ] ESLint configuration created
- [ ] Build scripts working (ESM + CJS)
- [ ] Basic README.md with package overview
- [ ] Empty barrel export in `src/index.ts`
- [ ] `npm run build` succeeds
- [ ] `npm run lint` succeeds
- [ ] Package properly linked in monorepo

---

## 📝 Implementation Steps

### Step 1: Create package.json

**File:** `packages/forms/package.json`

```json
{
  "name": "@nexus-state/forms",
  "version": "0.0.1",
  "description": "Type-safe form state management for Nexus State",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.mjs",
      "require": "./dist/react/index.js"
    }
  },
  "files": [
    "dist",
    "src",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "npm run build:esm && npm run build:cjs && npm run build:types",
    "build:esm": "tsc -p tsconfig.esm.json",
    "build:cjs": "tsc -p tsconfig.cjs.json",
    "build:types": "tsc -p tsconfig.json --emitDeclarationOnly",
    "dev": "tsc -p tsconfig.esm.json --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix"
  },
  "keywords": [
    "state-management",
    "forms",
    "validation",
    "react",
    "typescript",
    "atoms"
  ],
  "author": "Nexus State Team",
  "license": "MIT",
  "dependencies": {
    "@nexus-state/core": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "eslint": "^8.40.0",
    "typescript": "^5.0.0",
    "vitest": "^0.34.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "zod": "^3.0.0",
    "yup": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    },
    "zod": {
      "optional": true
    },
    "yup": {
      "optional": true
    }
  },
  "sideEffects": false
}
```

### Step 2: Create TypeScript Configurations

**File:** `packages/forms/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

**File:** `packages/forms/tsconfig.esm.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ES2020",
    "target": "ES2020",
    "outDir": "./dist",
    "declaration": false
  }
}
```

**File:** `packages/forms/tsconfig.cjs.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2015",
    "outDir": "./dist",
    "declaration": false,
    "outExtension": {
      ".js": ".cjs"
    }
  }
}
```

### Step 3: Create ESLint Configuration

**File:** `packages/forms/.eslintrc.js`

```javascript
module.exports = {
  extends: ['../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Strict rules for forms package
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'warn',
  },
};
```

### Step 4: Create Initial README

**File:** `packages/forms/README.md`

```markdown
# @nexus-state/forms

Type-safe form state management built on Nexus State atoms.

## Features

- 🔬 **Atomic Fields** - Each field is an independent atom
- 🎯 **Type-Safe** - Full TypeScript inference
- ⚡ **Granular Updates** - Only changed fields re-render
- ✅ **Validation** - Built-in and custom validators
- 📦 **Lightweight** - <3KB core (gzipped)
- 🔌 **Framework Agnostic** - Works with any UI framework

## Installation

```bash
npm install @nexus-state/forms @nexus-state/core
```

## Quick Start

```typescript
import { formAtom } from '@nexus-state/forms';

const loginForm = formAtom({
  initialValues: {
    email: '',
    password: ''
  }
});
```

## Documentation

- [API Reference](./docs/api.md)
- [Validation Guide](./docs/validation.md)
- [Examples](../../apps/demo-forms/)

## Status

🚧 **Under Development** - v0.0.1 (Alpha)

## License

MIT
```

### Step 5: Create Entry Point

**File:** `packages/forms/src/index.ts`

```typescript
/**
 * @nexus-state/forms
 * 
 * Type-safe form state management for Nexus State
 * 
 * @packageDocumentation
 */

// Types will be exported here
// Core functionality will be exported here

export const version = '0.0.1';
```

### Step 6: Build and Verify

```bash
# Install dependencies
cd packages/forms
pnpm install

# Build package
npm run build

# Run linter
npm run lint

# Verify output
ls -la dist/
```

**Validation:**
```bash
# Expected output structure:
dist/
├── index.js       (CJS)
├── index.mjs      (ESM)
├── index.d.ts     (Types)
└── index.d.ts.map (Source map)
```

---

## 🧪 Validation Commands

```bash
# From package root
cd packages/forms

# Install dependencies
pnpm install

# Build
npm run build

# Lint
npm run lint

# Verify package linking
cd ../..
pnpm install

# Test from another package
cd packages/core
node -e "console.log(require('../forms/package.json').name)"
```

**Expected Output:**
```
✓ Build successful (ESM + CJS)
✓ Linting passed
✓ Package linked in monorepo
```

---

## 📚 Context & Background

### Why This Matters

Proper package structure is critical for:
- Tree-shaking and bundle optimization
- Dual module support (ESM + CJS)
- TypeScript type resolution
- Developer experience

### Technical Context

The package follows Nexus State conventions:
- Workspace protocol for internal deps
- Dual build output (ESM + CJS)
- Strict TypeScript configuration
- ESLint for code quality
- Vitest for testing

### Related Documentation

- [Nexus State Package Structure](../../docs/DEVELOPMENT_GUIDE.md)
- [TypeScript Configuration](../../tsconfig.json)
- [Monorepo Setup](../../package.json)

---

## 🔗 Related Tasks

- **Blocks:** FORM-002 (needs package structure)
- **Blocks:** All other FORM tasks

---

## 📊 Definition of Done

- [ ] Package builds successfully (ESM + CJS)
- [ ] Linting passes with no errors
- [ ] Package linked in monorepo
- [ ] README created
- [ ] TypeScript strict mode enabled
- [ ] No `any` types in configuration
- [ ] `sideEffects: false` for tree-shaking
- [ ] Version set to 0.0.1

---

## 🚀 Implementation Checklist

```bash
# 1. Create package structure
mkdir -p packages/forms/src

# 2. Create package.json
# [Copy content from Step 1]

# 3. Create TypeScript configs
# [Copy content from Step 2]

# 4. Create ESLint config
# [Copy content from Step 3]

# 5. Create README
# [Copy content from Step 4]

# 6. Create entry point
# [Copy content from Step 5]

# 7. Install dependencies
cd packages/forms
pnpm install

# 8. Build
npm run build

# 9. Lint
npm run lint

# 10. Commit
git add packages/forms/
git commit -m "feat(forms): initialize package structure

- Add package.json with dependencies
- Configure TypeScript (ESM + CJS)
- Add ESLint configuration
- Create basic README
- Add barrel export

Resolves: FORM-001

Generated with [Continue](https://continue.dev)
Co-Authored-By: Continue <noreply@continue.dev>"
```

---

## 📝 Notes for AI Agent

### Key Considerations

- Use `workspace:*` protocol for internal dependencies
- Enable `strict` mode in TypeScript
- Set `sideEffects: false` for tree-shaking
- Include both ESM and CJS builds
- Make peer dependencies optional

### File Structure

```
packages/forms/
├── src/
│   └── index.ts          # Barrel export
├── dist/                 # Build output (gitignored)
├── package.json
├── tsconfig.json
├── tsconfig.esm.json
├── tsconfig.cjs.json
├── .eslintrc.js
└── README.md
```

### Common Pitfalls

1. **Forgetting peer dependencies** - React, Zod, Yup must be peer deps
2. **Wrong module format** - Must support both ESM and CJS
3. **Missing sideEffects** - Breaks tree-shaking
4. **Strict mode not enabled** - Allows `any` types

---

## 🐛 Known Issues / Blockers

None currently - this is the first task.

---

## 📈 Progress Tracking

**Started:** TBD  
**Last Updated:** 2026-02-28  
**Completed:** TBD

**Time Spent:** 0 hours (vs estimated 0.5 hours)

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-02-28  
**Actual Completion:** TBD

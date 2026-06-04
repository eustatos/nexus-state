# QUAL-001: Enable TypeScript Strict Mode

## 📋 Task Overview

**Priority:** 🔴 High  
**Estimated Time:** 4-6 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Enable TypeScript strict mode across all packages to catch type errors early and improve code reliability.

---

## 📦 Affected Packages

All 12 packages need strict mode enabled:

1. `@nexus-state/core`
2. `@nexus-state/react`
3. `@nexus-state/vue`
4. `@nexus-state/svelte`
5. `@nexus-state/devtools`
6. `@nexus-state/persist`
7. `@nexus-state/middleware`
8. `@nexus-state/immer`
9. `@nexus-state/async`
10. `@nexus-state/family`
11. `@nexus-state/web-worker`
12. `@nexus-state/cli`

---

## 🔍 Current State Analysis

```bash
# Check current strict mode settings
find packages -name "tsconfig.json" -exec grep -l "strict" {} \;

# Expected: Some packages have strict: false or it's not set
```

**Current Issues:**
- Inconsistent TypeScript configurations
- Some packages may have `any` types
- Missing null checks
- Implicit any parameters

---

## ✅ Acceptance Criteria

- [ ] All packages have `"strict": true` in tsconfig.json
- [ ] All TypeScript compilation errors fixed
- [ ] No `@ts-ignore` comments added (fix types properly)
- [ ] No use of `any` type (use `unknown` or proper types)
- [ ] All packages build successfully
- [ ] All tests still pass

---

## 📝 Implementation Steps

### Step 1: Audit Current TypeScript Configuration

**Check existing tsconfig.json files:**

```bash
# List all tsconfig.json files
find packages -name "tsconfig.json"

# Check which have strict mode
for file in $(find packages -name "tsconfig.json"); do
  echo "=== $file ==="
  grep -A 5 "compilerOptions" "$file" | grep "strict"
done
```

### Step 2: Enable Strict Mode Package-by-Package

Start with packages that have the fewest errors.

**Order of implementation (easiest first):**

1. `@nexus-state/middleware` (simple, small)
2. `@nexus-state/persist` (small API)
3. `@nexus-state/immer` (wrapper package)
4. `@nexus-state/async` (small implementation)
5. `@nexus-state/family` (small implementation)
6. `@nexus-state/web-worker` (small implementation)
7. `@nexus-state/cli` (isolated)
8. `@nexus-state/svelte` (adapter)
9. `@nexus-state/vue` (adapter)
10. `@nexus-state/react` (adapter, well-tested)
11. `@nexus-state/devtools` (complex)
12. `@nexus-state/core` (most complex, do last)

### Step 3: Update tsconfig.json Template

**File:** `packages/[package]/tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    
    // Existing settings
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*", "index.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Step 4: Fix Common TypeScript Strict Mode Errors

#### Error 1: Implicit Any

```typescript
// ❌ Before (error with strict mode)
function example(param) {
  return param;
}

// ✅ After
function example(param: unknown): unknown {
  return param;
}

// Or with proper typing
function example<T>(param: T): T {
  return param;
}
```

#### Error 2: Null/Undefined Checks

```typescript
// ❌ Before (error with strictNullChecks)
function getValue(atom: Atom<string>) {
  return atom.name.toUpperCase(); // Error: name might be undefined
}

// ✅ After
function getValue(atom: Atom<string>): string {
  return atom.name?.toUpperCase() ?? 'UNNAMED';
}

// Or with guard
function getValue(atom: Atom<string>): string {
  if (!atom.name) {
    return 'UNNAMED';
  }
  return atom.name.toUpperCase();
}
```

#### Error 3: Object Property Access

```typescript
// ❌ Before
const value = obj[key]; // Error: Element implicitly has 'any' type

// ✅ After
const value = obj[key as keyof typeof obj];

// Or with proper typing
function getValue<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

#### Error 4: Function Parameters

```typescript
// ❌ Before
const callback = (value) => console.log(value);

// ✅ After
const callback = (value: unknown) => console.log(value);

// Or with generic
const callback = <T>(value: T) => console.log(value);
```

### Step 5: Enable Strict Mode for Each Package

**Process for each package:**

```bash
# 1. Navigate to package
cd packages/middleware

# 2. Update tsconfig.json
# Add "strict": true to compilerOptions

# 3. Try to build
npm run build

# 4. Fix errors one by one
# Read error messages carefully
# Apply fixes from Step 4

# 5. Verify tests still pass
npm run test

# 6. Move to next package
cd ../persist
```

### Step 6: Create Root tsconfig.json for Consistency

**File:** `tsconfig.base.json` (root level)

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

Then update each package's tsconfig.json:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "outDir": "./dist"
  },
  "include": ["src/**/*", "index.ts"]
}
```

### Step 7: Document Common Patterns

**File:** `docs/guides/typescript.md` (update)

```markdown
## TypeScript Strict Mode Patterns

### Handling Unknown Types
\`\`\`typescript
function processValue(value: unknown) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (typeof value === 'number') {
    return value * 2;
  }
  throw new Error('Unsupported type');
}
\`\`\`

### Null Safety
\`\`\`typescript
function getName(atom: Atom<string>): string {
  return atom.name ?? `atom-${atom.id.toString()}`;
}
\`\`\`

### Generic Constraints
\`\`\`typescript
function getAtomValue<T>(atom: Atom<T>, store: Store): T {
  return store.get(atom);
}
\`\`\`
```

---

## 🧪 Validation Commands

```bash
# Build all packages
npm run build

# Should show no TypeScript errors
# If errors exist, they must be fixed

# Run tests
npm run test

# All tests should pass
# Coverage should not decrease

# Type check only (faster)
npm run type-check
# Or
npx tsc --noEmit
```

---

## 📚 Context & Background

### Why Strict Mode Matters

1. **Catches Bugs Early:** Type errors found at compile time vs runtime
2. **Better IDE Support:** Autocomplete and refactoring work better
3. **Self-Documentation:** Types serve as inline documentation
4. **Prevents Regressions:** Type system prevents breaking changes
5. **Industry Standard:** Expected in production libraries

### TypeScript Strict Mode Components

- **strictNullChecks:** Catch null/undefined errors
- **noImplicitAny:** Require explicit types
- **strictFunctionTypes:** Sound function parameter checks
- **strictBindCallApply:** Type-check bind/call/apply
- **strictPropertyInitialization:** Class properties must be initialized
- **noImplicitThis:** Require explicit `this` type
- **alwaysStrict:** Use strict mode JavaScript

---

## 🔗 Related Tasks

- **Depends On:** Phase 00 complete (all tests passing)
- **Blocks:** QUAL-007 (Type Safety Improvements)
- **Related:** QUAL-002 (ESLint fixes may surface after strict mode)

---

## 📊 Definition of Done

- [ ] `"strict": true` in all 12 package tsconfig.json files
- [ ] All packages build without TypeScript errors
- [ ] All tests pass (100% pass rate maintained)
- [ ] No `@ts-ignore` or `@ts-expect-error` added
- [ ] No use of `any` type (use `unknown` or proper types)
- [ ] Documentation updated with TypeScript patterns
- [ ] CI builds successfully

---

## 🚀 Implementation Checklist

```bash
# 1. Create base tsconfig
cat > tsconfig.base.json << 'EOF'
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    // ... (see Step 6)
  }
}
EOF

# 2. Process each package (start with simplest)
for package in middleware persist immer async family web-worker cli svelte vue react devtools core; do
  echo "Processing @nexus-state/$package"
  cd packages/$package
  
  # Update tsconfig to extend base
  # Fix TypeScript errors
  # Verify build
  npm run build
  
  # Verify tests
  npm run test
  
  cd ../..
done

# 3. Verify all packages
npm run build

# 4. Run all tests
npm run test

# 5. Commit
git add packages/*/tsconfig.json tsconfig.base.json
git commit -m "feat(typescript): enable strict mode across all packages

- Add tsconfig.base.json with strict mode settings
- Update all package tsconfig files to extend base
- Fix type errors in all packages
- Eliminate 'any' types, use proper type annotations
- Add null/undefined checks where needed

All packages now build with TypeScript strict mode.
Test coverage maintained at 95%+.

Resolves: QUAL-001"
```

---

## 📝 Notes for AI Agent

### Strategy for Fixing Errors

1. **Start Small:** Do one package at a time
2. **Read Errors Carefully:** TypeScript error messages are helpful
3. **Fix Root Causes:** Don't just add type assertions
4. **Test Frequently:** Run tests after each fix
5. **Ask for Help:** If stuck, check TypeScript handbook

### Common Fixes

```typescript
// Fix 1: Add type to function parameters
const fn = (x: number) => x * 2;

// Fix 2: Handle nullable values
const name = atom.name ?? 'default';

// Fix 3: Use type guards
if (typeof value === 'string') {
  console.log(value.toUpperCase());
}

// Fix 4: Proper generics
function get<T>(atom: Atom<T>): T { ... }

// Fix 5: Use unknown instead of any
function process(data: unknown) { ... }
```

### Performance Tips

```bash
# Type check without emitting files (faster)
npx tsc --noEmit

# Watch mode for rapid iteration
npx tsc --watch --noEmit

# Check specific package
cd packages/core && npx tsc --noEmit
```

---

**Created:** 2026-02-23  
**Estimated Completion:** 2026-02-25  
**Actual Completion:** TBD

# STAB-011: Fix package.json Configurations

## 📋 Task Overview

**Priority:** 🔴 Critical  
**Estimated Time:** 2-3 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Fix package.json configurations in 7 packages that have incorrect `main`, missing `types`, `exports`, and `files` fields to enable proper npm publishing.

---

## 📦 Affected Components

**Packages:**
- `@nexus-state/async`
- `@nexus-state/family`
- `@nexus-state/persist`
- `@nexus-state/svelte`
- `@nexus-state/vue`
- `@nexus-state/immer`
- `@nexus-state/middleware`
- `@nexus-state/web-worker`

**Files:**
- `packages/async/package.json`
- `packages/family/package.json`
- `packages/persist/package.json`
- `packages/svelte/package.json`
- `packages/vue/package.json`
- `packages/immer/package.json`
- `packages/middleware/package.json`
- `packages/web-worker/package.json`

---

## 🔍 Current State Analysis

```bash
# Check current package.json configurations
grep -r '"main":' packages/*/package.json
```

**Findings:**
- ❌ 7 packages have `"main": "index.ts"` instead of `"dist/index.js"`
- ❌ Missing `"types"` field in 7 packages
- ❌ Missing `"exports"` field in 7 packages
- ❌ Missing `"files"` field in 9 packages
- ❌ 2 packages have `"@nexus-state/core": "*"` instead of `"workspace:*"`

**Impact:**
- Packages cannot be published to npm
- TypeScript types won't be available to consumers
- ESM/CJS compatibility issues
- Wrong files may be published

---

## ✅ Acceptance Criteria

- [ ] All 8 packages have `"main": "dist/index.js"`
- [ ] All 8 packages have `"types": "dist/index.d.ts"`
- [ ] All 8 packages have proper `"exports"` configuration
- [ ] All packages have `"files"` array listing publishable files
- [ ] All workspace dependencies use `"workspace:*"`
- [ ] All packages build successfully
- [ ] Package structure validated with `npm pack --dry-run`

---

## 📝 Implementation Steps

### Step 1: Fix async package

**File:** `packages/async/package.json`

**Changes:**
```json
{
  "name": "@nexus-state/async",
  "version": "0.1.3",
  "description": "Asynchronous utilities for Nexus State",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "@nexus-state/core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.9.3",
    "vitest": "^3.0.7"
  },
  "keywords": ["state-management", "async", "nexus-state"],
  "repository": {
    "type": "git",
    "url": "https://github.com/eustatos/nexus-state",
    "directory": "packages/async"
  },
  "homepage": "https://nexus-state.website.yandexcloud.net/",
  "license": "MIT"
}
```

**Validation:**
```bash
cd packages/async
npm run build
npm pack --dry-run
```

### Step 2: Fix family package

**File:** `packages/family/package.json`

**Changes:** Same pattern as async

### Step 3: Fix persist package

**File:** `packages/persist/package.json`

**Changes:** Same pattern as async

### Step 4: Fix svelte package

**File:** `packages/svelte/package.json`

**Additional:** Add peerDependencies
```json
{
  "peerDependencies": {
    "svelte": "^4.0.0 || ^5.0.0"
  }
}
```

### Step 5: Fix vue package

**File:** `packages/vue/package.json`

**Additional:** Add peerDependencies
```json
{
  "peerDependencies": {
    "vue": "^3.0.0"
  }
}
```

### Step 6: Fix immer package

**File:** `packages/immer/package.json`

**Additional:** Add immer as peerDependency
```json
{
  "peerDependencies": {
    "immer": "^10.0.0"
  }
}
```

### Step 7: Fix middleware package

**File:** `packages/middleware/package.json`

**Changes:** Same pattern as async

### Step 8: Fix web-worker package

**File:** `packages/web-worker/package.json`

**Changes:** Same pattern as async

### Step 9: Update devtools package

**File:** `packages/devtools/package.json`

**Add missing `files` field:**
```json
{
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ]
}
```

### Step 10: Verify all packages

**Script to verify:**
```bash
#!/bin/bash
# verify-packages.sh

echo "Verifying package.json configurations..."

for pkg in packages/*/package.json; do
  echo ""
  echo "Checking: $pkg"
  
  # Check main field
  main=$(jq -r '.main' "$pkg")
  if [[ "$main" == "dist/index.js" || "$main" == "./dist/cjs/index.js" ]]; then
    echo "✓ main field correct"
  else
    echo "✗ main field incorrect: $main"
  fi
  
  # Check types field
  types=$(jq -r '.types' "$pkg")
  if [[ "$types" != "null" ]]; then
    echo "✓ types field present"
  else
    echo "✗ types field missing"
  fi
  
  # Check exports field
  exports=$(jq -r '.exports' "$pkg")
  if [[ "$exports" != "null" ]]; then
    echo "✓ exports field present"
  else
    echo "✗ exports field missing"
  fi
  
  # Check files field
  files=$(jq -r '.files' "$pkg")
  if [[ "$files" != "null" ]]; then
    echo "✓ files field present"
  else
    echo "✗ files field missing"
  fi
done

echo ""
echo "Verification complete!"
```

---

## 🧪 Validation Commands

```bash
# 1. Build all packages
npm run build

# 2. Verify package configurations
chmod +x scripts/verify-packages.sh
./scripts/verify-packages.sh

# 3. Test dry-run publish for each package
cd packages/async && npm pack --dry-run
cd packages/family && npm pack --dry-run
cd packages/persist && npm pack --dry-run
# ... repeat for all packages

# 4. Verify TypeScript compilation
npm run build

# 5. Run tests
npm run test
```

**Expected Output:**
```
✓ All packages have correct main field
✓ All packages have types field
✓ All packages have exports field
✓ All packages have files field
✓ All builds successful
✓ npm pack dry-run successful for all packages
```

---

## 📚 Context & Background

### Why This Matters

These package.json configurations are critical for npm publishing:
- `main`: Entry point for require()
- `types`: TypeScript definitions
- `exports`: Modern ESM/CJS support
- `files`: Controls what gets published
- Workspace dependencies ensure correct monorepo resolution

### Technical Context

npm publishing process:
1. Reads `package.json` to determine what to include
2. Uses `files` array to include specific files
3. Defaults to including README, LICENSE, package.json
4. Uses `main` for require(), `exports` for import
5. TypeScript uses `types` field to locate definitions

### Related Documentation

- [npm package.json documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Node.js Packages](https://nodejs.org/api/packages.html)

---

## 🔗 Related Tasks

- **Depends On:** None (can start immediately)
- **Blocks:** npm publishing process
- **Related:** STAB-003 (async tests), STAB-004 (family tests)

---

## 📊 Definition of Done

- [ ] All 8 packages updated
- [ ] All packages build successfully
- [ ] npm pack --dry-run succeeds for all
- [ ] Verification script created and passing
- [ ] TypeScript types generate correctly
- [ ] Workspace dependencies correct
- [ ] Changes committed with conventional commit message
- [ ] Documentation updated if needed

---

## 🚀 Implementation Checklist

```bash
# 1. Create branch
git checkout -b fix/package-json-configurations

# 2. Update async package
# Edit packages/async/package.json
npm run build --workspace=packages/async

# 3. Update family package
# Edit packages/family/package.json
npm run build --workspace=packages/family

# 4. Update persist package
# Edit packages/persist/package.json
npm run build --workspace=packages/persist

# 5. Update svelte package
# Edit packages/svelte/package.json
npm run build --workspace=packages/svelte

# 6. Update vue package
# Edit packages/vue/package.json
npm run build --workspace=packages/vue

# 7. Update immer package
# Edit packages/immer/package.json
npm run build --workspace=packages/immer

# 8. Update middleware package
# Edit packages/middleware/package.json
npm run build --workspace=packages/middleware

# 9. Update web-worker package
# Edit packages/web-worker/package.json
npm run build --workspace=packages/web-worker

# 10. Update devtools package
# Edit packages/devtools/package.json

# 11. Create verification script
# Create scripts/verify-packages.sh

# 12. Run full validation
npm run build
./scripts/verify-packages.sh

# 13. Test publish dry-run
for dir in packages/*/; do
  cd "$dir"
  npm pack --dry-run
  cd ../..
done

# 14. Commit
git add packages/*/package.json scripts/verify-packages.sh
git commit -m "fix(packages): correct package.json configurations for npm publishing

- Fix main field to point to dist/index.js
- Add types field for TypeScript definitions
- Add exports field for ESM/CJS support
- Add files field to control published content
- Fix workspace dependencies to use workspace:*
- Add peerDependencies where needed (svelte, vue, immer)
- Ensure all packages follow consistent structure

Affected packages:
- @nexus-state/async
- @nexus-state/family
- @nexus-state/persist
- @nexus-state/svelte
- @nexus-state/vue
- @nexus-state/immer
- @nexus-state/middleware
- @nexus-state/web-worker
- @nexus-state/devtools

Resolves: STAB-011

Generated with [Continue](https://continue.dev)
Co-Authored-By: Continue <noreply@continue.dev>"

# 15. Push
git push origin fix/package-json-configurations
```

---

## 📝 Notes for AI Agent

### Key Considerations

- **Consistency:** Use same pattern across all packages
- **peerDependencies:** Only for framework bindings (react, vue, svelte) and immer
- **files field:** Include dist, README, CHANGELOG, LICENSE
- **exports:** Use same structure for all packages (except devtools which has dual build)

### Common Template

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ]
}
```

### Special Cases

**devtools** already has dual build (ESM + CJS):
```json
{
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts"
}
```
Just add `files` field to it.

### Testing Pattern

After each package update:
```bash
cd packages/[package-name]
npm run build
npm pack --dry-run
cd ../..
```

---

## 🐛 Known Issues / Blockers

- [ ] Some packages may have TypeScript compilation errors - fix those first
- [ ] Ensure dist/ directory exists after build
- [ ] pnpm workspace resolution may require `pnpm install` after changes

---

## 📈 Progress Tracking

**Started:** TBD  
**Last Updated:** 2026-03-01  
**Completed:** TBD

**Time Spent:** 0 hours (vs estimated 2-3 hours)

**Progress:**
- [ ] async - 0/1
- [ ] family - 0/1
- [ ] persist - 0/1
- [ ] svelte - 0/1
- [ ] vue - 0/1
- [ ] immer - 0/1
- [ ] middleware - 0/1
- [ ] web-worker - 0/1
- [ ] devtools - 0/1
- [ ] verification script - 0/1

---

**Created:** 2026-03-01  
**Estimated Completion:** 2026-03-02  
**Actual Completion:** TBD

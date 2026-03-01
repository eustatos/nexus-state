# QUAL-003: Set Up Pre-commit Hooks (Optimized for Monorepo)

## 📋 Task Overview

**Priority:** 🟡 Medium  
**Estimated Time:** 1-2 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Configure lightning-fast pre-commit hooks for a monorepo that check only changed packages and don't slow down development.

---

## 📦 Recommended Stack

| Tool                | Purpose                   | Why It's Optimal                                                                                   |
| :------------------ | :------------------------ | :------------------------------------------------------------------------------------------------- |
| **lefthook**        | Git hooks manager         | Blazing fast, parallel execution, built-in monorepo support, zero dependencies, single YAML config |
| **@commitlint/cli** | Commit message validation | Industry standard for Conventional Commits                                                         |
| **prettier**        | Code formatting           | Already present in most projects, works great with lefthook                                        |
| **pnpm**            | Package manager           | Essential for monorepos — symlinks and caching speed up everything                                 |

---

## ✅ Acceptance Criteria

- [ ] lefthook installed and configured
- [ ] **Parallel execution** of ESLint, Prettier, and TypeScript
- [ ] Checks run **only for changed packages**
- [ ] Prettier formats code automatically
- [ ] commitlint validates commit messages
- [ ] **Execution time < 1 second** for a single changed file
- [ ] Works across all packages in the monorepo

---

## 📝 Implementation Steps

### Step 1: Install Dependencies

```bash
# Install lefthook (single binary)
pnpm add -D @arkweid/lefthook

# Install commitlint (if not already)
pnpm add -D @commitlint/cli @commitlint/config-conventional

# Prettier is usually already in the monorepo
pnpm add -D prettier
```

### Step 2: Configure Lefthook

**File:** `lefthook.yml`

```yaml
# lefthook.yml - single config for the entire monorepo
pre-commit:
  parallel: true # KEY: everything runs in parallel!
  commands:
    # Code formatting (fast, safe)
    prettier:
      glob: '*.{js,ts,jsx,tsx,json,md,yml,yaml}'
      run: pnpm prettier --write {staged_files}
      stage_fixed: true # automatically re-stages formatted files

    # Lint staged files
    eslint:
      glob: '*.{js,ts,jsx,tsx}'
      run: pnpm eslint --fix {staged_files}
      stage_fixed: true

    # TypeScript check ONLY for changed packages
    typecheck:
      glob: 'packages/*/src/**/*.{ts,tsx}'
      run: |
        PKG=$(echo {staged_files} | grep -o "packages/[^/]*" | head -1)
        if [ -n "$PKG" ]; then
          cd $PKG && pnpm tsc --noEmit
        fi

    # Tests for changed files
    test:
      glob: 'packages/*/src/**/*.{ts,tsx}'
      run: |
        PKG=$(echo {staged_files} | grep -o "packages/[^/]*" | head -1)
        if [ -n "$PKG" ]; then
          cd $PKG && pnpm vitest related {staged_files} --run
        fi

# Commit message validation
commit-msg:
  commands:
    commitlint:
      run: pnpm commitlint --edit {1}

# Protect main branch (optional)
pre-push:
  commands:
    audit:
      run: pnpm audit --prod
    typecheck-all:
      run: pnpm tsc --noEmit
```

### Step 3: Configure Commitlint

**File:** `commitlint.config.js`

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build',
        'revert',
      ],
    ],
    'subject-case': [0],
    'body-max-line-length': [0],
  },
};
```

### Step 4: Configure Prettier

**File:** `.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**File:** `.prettierignore`

```
# Build output
dist/
build/
coverage/

# Dependencies
node_modules/
pnpm-lock.yaml
package-lock.json

# Generated
.turbo/
*.min.js
*.min.css
```

### Step 5: Add Skip Hooks Option

```bash
# Standard Git option works
git commit --no-verify -m "emergency fix"
```

**Document in root `CONTRIBUTING.md`:**

````markdown
## Git Hooks (Powered by Lefthook ⚡)

This project uses lefthook for lightning-fast pre-commit checks:

### What runs on commit (in parallel ⚡):

- ✅ ESLint checks code style
- ✅ Prettier formats code
- ✅ TypeScript validates types
- ✅ Tests run for changed files

All of this takes **< 1 second** for a single file!

### Skipping Hooks:

```bash
git commit --no-verify -m "your message"
# ⚠️ Emergency use only!
```
````

````

---

## 🧪 Validation Commands

```bash
# 1. Install hooks (single command!)
pnpm lefthook install

# 2. Validate config
pnpm lefthook validate

# 3. Make a test change
echo "// test" >> packages/core/src/index.ts
git add packages/core/src/index.ts

# 4. Watch the MAGIC of parallel execution!
git commit -m "test: verify lefthook"

# Expected output:
# ⚡ pre-commit: commands running in parallel...
#   ✅ prettier (1.2s)
#   ✅ eslint (0.8s)
#   ✅ typecheck (0.5s)
#   ✅ test (1.1s)
# Total: ~1.3s
````

---

## 📚 Context & Background

### Why Pre-commit Hooks Matter

1. **Prevent Bad Commits:** Catch issues before they reach the repo
2. **Automate Quality:** No manual "remember to lint"
3. **Consistent Standards:** Everyone follows same rules
4. **Fast Feedback:** Fail fast, fix faster
5. **Clean History:** Better commits = better git log

### Why Lefthook for Monorepos

Lefthook was chosen because it:

- Runs checks **in parallel** (not sequentially)
- Natively understands monorepo structures
- Has **zero dependencies** (single binary)
- Uses simple YAML configuration
- Works perfectly with `pnpm workspaces`

---

## 🔗 Related Tasks

- **Depends On:** QUAL-002 (ESLint must be passing)
- **Blocks:** None (improves workflow)
- **Related:** QUAL-006 (Code review checklist)

---

## 📊 Definition of Done

- [ ] lefthook installed and configured
- [ ] Pre-commit hooks run in parallel
- [ ] Only changed packages are checked
- [ ] ESLint runs on staged files
- [ ] Prettier auto-formats code
- [ ] TypeScript checks changed packages
- [ ] Tests run for affected files
- [ ] Commit-msg hook validates format
- [ ] Invalid commits are rejected
- [ ] Documentation updated
- [ ] Team notified of new hooks

---

## 🚀 Quick Start Checklist

```bash
# 1. Install dependencies
pnpm add -D @arkweid/lefthook @commitlint/cli @commitlint/config-conventional

# 2. Install hooks
pnpm lefthook install

# 3. Create config files
# - lefthook.yml (from Step 2)
# - commitlint.config.js (from Step 3)
# - .prettierrc.json (from Step 4)

# 4. Test hooks
echo "// test" >> packages/core/src/index.ts
git add packages/core/src/index.ts
git commit -m "test: verify hooks"

# 5. Clean up test
git reset HEAD~1
rm packages/core/src/index.ts
git checkout packages/core/src/index.ts

# 6. Update documentation
# (from Step 5)

# 7. Commit the hooks setup
git add lefthook.yml commitlint.config.js .prettierrc.json .prettierignore
git add docs/CONTRIBUTING.md
git commit -m "chore: set up pre-commit hooks with lefthook

- Install lefthook for parallel git hooks
- Configure ESLint, Prettier, TypeScript to run on staged files
- Add package-scoped type checking and tests
- Set up commitlint for Conventional Commits
- Document hook usage in CONTRIBUTING.md

Pre-commit checks run in parallel (<1s for single file)
Commit format enforced via commitlint

Resolves: QUAL-003"
```

---

## 📝 Notes

### Common Issues

**Issue 1: Hooks not running**

```bash
# Solution: Reinstall hooks
pnpm lefthook install
```

**Issue 2: Hooks too slow**

```bash
# Solution: Check parallel execution
# Verify lefthook.yml has 'parallel: true'
# Ensure you're not running checks on all packages
```

**Issue 3: commitlint fails**

```bash
# Solution: Follow format
git commit -m "type(scope): subject"
# Example: "feat(core): add new API endpoint"
```

### Emergency Bypass

```bash
# When absolutely necessary (production emergency)
git commit --no-verify -m "fix: critical production bug"

# But ALWAYS fix properly after:
# - Run lint manually
# - Run tests
# - Create follow-up commit if needed
```

---

**Created:** 2026-02-23  
**Estimated Completion:** 2026-02-24  
**Actual Completion:** TBD

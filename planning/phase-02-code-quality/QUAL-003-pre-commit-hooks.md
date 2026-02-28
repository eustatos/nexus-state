# QUAL-003: Set Up Pre-commit Hooks

## 📋 Task Overview

**Priority:** 🟡 Medium  
**Estimated Time:** 2-3 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Configure automated pre-commit hooks using Husky and lint-staged to enforce code quality standards before commits reach the repository.

---

## 📦 Tools to Install

- **Husky** - Git hooks management
- **lint-staged** - Run linters on staged files only
- **prettier** - Code formatting (if not already installed)

---

## 🔍 Current State Analysis

```bash
# Check if Husky is already installed
ls -la .husky/

# Check if lint-staged is configured
cat package.json | grep -A 5 "lint-staged"

# Expected: May not exist yet
```

---

## ✅ Acceptance Criteria

- [ ] Husky installed and configured
- [ ] lint-staged runs on pre-commit
- [ ] TypeScript type-check runs before commit
- [ ] ESLint runs on staged files
- [ ] Prettier formats code automatically
- [ ] Tests run for affected packages
- [ ] Commits fail if quality checks fail
- [ ] Performance <5 seconds for small changes

---

## 📝 Implementation Steps

### Step 1: Install Dependencies

```bash
# Install Husky
npm install --save-dev husky

# Install lint-staged
npm install --save-dev lint-staged

# Install prettier (if not already)
npm install --save-dev prettier

# Install commitlint (for commit message validation)
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### Step 2: Initialize Husky

```bash
# Initialize Husky
npx husky install

# Add prepare script to package.json (auto-install hooks)
npm pkg set scripts.prepare="husky install"

# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Create commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit ${1}'
```

### Step 3: Configure lint-staged

**File:** `package.json`

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run --passWithNoTests"
    ],
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
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

# Config
.eslintrc.js
```

### Step 5: Configure Commitlint

**File:** `commitlint.config.js`

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Formatting, missing semi-colons, etc.
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding missing tests
        'chore',    // Updating build tasks, package manager configs, etc.
        'ci',       // CI configuration changes
        'build',    // Changes that affect the build system
        'revert',   // Reverts a previous commit
      ],
    ],
    'subject-case': [0], // Allow any case for subject
    'body-max-line-length': [0], // No limit on body line length
  },
};
```

### Step 6: Optimize Performance

**Problem:** Pre-commit hooks can slow down workflow

**Solution:** Only run on changed files

**File:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Only run lint-staged if there are staged files
if git diff --cached --quiet; then
  exit 0
fi

# Run lint-staged
npx lint-staged

# Optional: Run type check on changed packages only
CHANGED_PACKAGES=$(git diff --cached --name-only | grep -E '^packages/[^/]+/' | sed 's|^packages/\([^/]*\)/.*|\1|' | sort -u)

if [ -n "$CHANGED_PACKAGES" ]; then
  for pkg in $CHANGED_PACKAGES; do
    echo "Type checking @nexus-state/$pkg..."
    cd packages/$pkg && npx tsc --noEmit && cd ../.. || exit 1
  done
fi
```

### Step 7: Add Skip Hooks Option

**For emergency commits:**

```bash
# Allow developers to skip hooks when necessary
git commit --no-verify -m "emergency fix"
```

**Document in README:**

```markdown
## Git Hooks

This project uses Husky for pre-commit hooks. To skip hooks:

\`\`\`bash
git commit --no-verify
\`\`\`

⚠️ Use sparingly - hooks exist for quality assurance.
```

### Step 8: Create Hook Documentation

**File:** `docs/CONTRIBUTING.md` (update)

```markdown
## Pre-commit Hooks

We use automated checks before commits:

### What runs on pre-commit?

1. **ESLint** - Checks code style
2. **Prettier** - Formats code
3. **Type Check** - Validates TypeScript types
4. **Tests** - Runs tests for changed files

### Commit Message Format

Follow Conventional Commits:

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring

**Example:**
\`\`\`
feat(core): add time travel support

Implements snapshot-based time travel for debugging.
Includes undo/redo functionality.

Resolves: #123
\`\`\`

### Skipping Hooks

Only when absolutely necessary:

\`\`\`bash
git commit --no-verify
\`\`\`
```

---

## 🧪 Validation Commands

```bash
# 1. Install hooks
npm run prepare

# 2. Verify Husky installed
ls -la .husky/
# Should see: pre-commit, commit-msg

# 3. Make a test change
echo "// test" >> packages/core/src/index.ts

# 4. Stage the change
git add packages/core/src/index.ts

# 5. Try to commit (should trigger hooks)
git commit -m "test: verify pre-commit hooks"

# Expected: 
# - ESLint runs
# - Prettier formats
# - Type check runs
# - Tests run (if any related)

# 6. Try invalid commit message
git commit -m "invalid message format"
# Expected: Commit rejected by commitlint

# 7. Try valid commit
git commit -m "test: verify hooks working"
# Expected: Commit succeeds

# 8. Revert test change
git reset HEAD~1
git checkout packages/core/src/index.ts
```

---

## 📚 Context & Background

### Why Pre-commit Hooks?

1. **Prevent Bad Commits:** Catch issues before they reach repo
2. **Automate Quality:** No manual "remember to lint"
3. **Consistent Standards:** Everyone follows same rules
4. **Fast Feedback:** Fail fast, fix faster
5. **Clean History:** Better commits = better git log

### Husky vs Alternatives

- **Husky:** Most popular, well-maintained
- **pre-commit (Python):** More features but requires Python
- **lefthook:** Faster but less popular
- **simple-git-hooks:** Lightweight but basic

Husky chosen for: popularity, ease of use, npm ecosystem integration

---

## 🔗 Related Tasks

- **Depends On:** QUAL-002 (ESLint must be passing)
- **Blocks:** None (improves workflow)
- **Related:** QUAL-006 (Code review checklist)

---

## 📊 Definition of Done

- [ ] Husky installed and configured
- [ ] Pre-commit hook runs lint-staged
- [ ] Commit-msg hook validates format
- [ ] ESLint runs on staged files
- [ ] Prettier auto-formats code
- [ ] Type check runs on changed packages
- [ ] Invalid commits rejected
- [ ] Documentation updated
- [ ] Team notified of new hooks

---

## 🚀 Implementation Checklist

```bash
# 1. Install dependencies
npm install --save-dev husky lint-staged prettier \
  @commitlint/cli @commitlint/config-conventional

# 2. Initialize Husky
npx husky install
npm pkg set scripts.prepare="husky install"

# 3. Create hooks
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit ${1}'

# 4. Configure lint-staged
# (Add to package.json - see Step 3)

# 5. Create .prettierrc.json
# (See Step 4)

# 6. Create commitlint.config.js
# (See Step 5)

# 7. Test hooks
echo "test" >> test.txt
git add test.txt
git commit -m "test: verify hooks"
# Should run checks

# 8. Clean up test
rm test.txt
git reset HEAD~1

# 9. Update documentation
# (See Step 8)

# 10. Commit
git add .husky/ package.json .prettierrc.json commitlint.config.js
git add docs/CONTRIBUTING.md
git commit -m "chore: set up pre-commit hooks with Husky

- Install Husky for git hooks management
- Configure lint-staged for staged file linting
- Add Prettier for code formatting
- Add commitlint for commit message validation
- Optimize performance (only check changed files)
- Document hook usage in CONTRIBUTING.md

Pre-commit checks: ESLint, Prettier, TypeScript, Tests
Commit format: Conventional Commits

Resolves: QUAL-003"
```

---

## 📝 Notes for AI Agent

### Hook Performance Tips

```bash
# ❌ Slow: Run all tests
"*.ts": ["npm run test"]

# ✅ Fast: Run related tests only
"*.ts": ["vitest related --run"]

# ❌ Slow: Lint everything
"*.ts": ["eslint ."]

# ✅ Fast: Lint staged files only
"*.ts": ["eslint --fix"]
```

### Common Issues

**Issue 1: Hooks not running**
```bash
# Solution: Reinstall hooks
rm -rf .husky
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**Issue 2: Hooks too slow**
```bash
# Solution: Reduce scope
# Only run on changed packages
# Cache results where possible
# Skip heavy operations
```

**Issue 3: Commitlint fails**
```bash
# Solution: Follow format
git commit -m "type(scope): subject"
# Not: "random commit message"
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

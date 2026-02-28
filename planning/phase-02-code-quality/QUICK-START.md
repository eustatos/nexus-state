# Quick Start Guide - Code Quality Phase

> **Goal:** Establish enterprise-grade code quality standards

> **Current Status:** ✅ QUAL-001 (TypeScript Strict Mode) and QUAL-002 (ESLint Fixes) complete. 2/7 tasks done (29%).
> - TypeScript strict mode enabled across all packages
> - ESLint errors eliminated (0 errors)
> - ⚠️ 32 ESLint warnings remain in devtools (non-blocking)
> - Next: QUAL-005 (Security Audit) or fix remaining devtools warnings

---

## 🚀 Getting Started (30 seconds)

```bash
# 1. Verify current state
npm run lint     # Should show 0 errors (11/11 packages)
npm run test     # Check current test status (299/317 passing)

# 2. Navigate to planning
cd planning/phase-01-code-quality

# 3. Review progress
# See INDEX.md for task status

# 4. Continue with QUAL-005 or fix remaining warnings
cat QUAL-005-security-audit.md
```

---

## 📋 Task Priority Order (Recommended)

### Start Here (Foundation)
1. **QUAL-001** - TypeScript Strict Mode (4-6h) ← START HERE
2. **QUAL-002** - ESLint Fixes (3-4h)
3. **QUAL-005** - Security Audit (2-3h)

### Then Do (Automation)
4. **QUAL-003** - Pre-commit Hooks (2-3h)
5. **QUAL-004** - Code Duplication (4-6h)

### Finally (Polish)
6. **QUAL-007** - Type Safety (3-4h)
7. **QUAL-006** - Code Review Checklist (1-2h)

---

## 🎯 For Your First Task (QUAL-001)

### TypeScript Strict Mode - Quick Guide

```bash
# 1. Read the task
cat QUAL-001-typescript-strict-mode.md

# 2. Create base tsconfig
cat > tsconfig.base.json << 'EOF'
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
EOF

# 3. Enable for one package at a time
cd packages/middleware  # Start with simplest

# 4. Try to build
npm run build

# 5. Fix errors iteratively
# Read TypeScript errors carefully
# Apply fixes from task documentation

# 6. Verify tests
npm run test

# 7. Move to next package
cd ../persist
```

**Time:** ~4-6 hours total  
**Difficulty:** Medium  
**Impact:** Prevents entire classes of bugs

---

## 📖 Common Workflows

### Workflow 1: TypeScript Strict Mode

```bash
# For each package:
cd packages/[package]

# 1. Update tsconfig
# Add "strict": true

# 2. Build and see errors
npm run build 2>&1 | tee errors.txt

# 3. Fix errors one by one
# See common fixes in task doc

# 4. Test
npm run test

# 5. Next package
cd ../[next-package]
```

### Workflow 2: ESLint Fixes

```bash
# 1. Run lint
npm run lint

# 2. Auto-fix what you can
npm run lint -- --fix

# 3. Manually fix remaining
# Follow task documentation

# 4. Verify clean
npm run lint  # Should show 0 errors

# 5. Test
npm run test
```

### Workflow 3: Security Audit

```bash
# 1. Run audit
npm audit

# 2. Auto-fix
npm audit fix

# 3. Check remaining
npm audit

# 4. Manual fixes
# Review each vulnerability

# 5. Verify
npm audit --audit-level=moderate
```

---

## ✅ Completion Checklist (For Every Task)

```bash
# 1. Implementation complete
# (Follow task steps)

# 2. Run quality checks
npm run build    # No errors
npm run test     # All passing
npm run lint     # Zero errors

# 3. Verify metrics
# (Check task acceptance criteria)

# 4. Commit with proper message
git add .
git commit -m "type(scope): description

- Change 1
- Change 2

Metric before → after

Resolves: TASK-ID"

# 5. Update task status in INDEX.md
# Change ⬜ to ✅
```

---

## 🐛 Common Issues & Solutions

### Issue: TypeScript strict mode errors

```typescript
// Error: Object is possibly 'undefined'
const value = obj.property.toUpperCase();

// Solution: Add null check
const value = obj.property?.toUpperCase() ?? 'DEFAULT';
```

### Issue: ESLint 'any' type error

```typescript
// Error: Unexpected any
function fn(data: any) { }

// Solution: Use unknown or proper type
function fn(data: unknown) { }
function fn<T>(data: T) { }
```

### Issue: Security vulnerability can't auto-fix

```bash
# 1. Check details
npm audit | grep -A 10 "Package: vulnerable-lib"

# 2. Try manual update
npm update vulnerable-lib

# 3. If still broken, use override
# package.json:
{
  "overrides": {
    "vulnerable-lib": "^safe-version"
  }
}
```

### Issue: Pre-commit hooks too slow

```bash
# Solution: Run on staged files only
# In lint-staged config:
{
  "*.ts": ["eslint --fix"]  # Only staged files
}

# Not:
{
  "*.ts": ["eslint ."]  # All files (slow!)
}
```

---

## 📊 Success Metrics

Track these for each task:

### QUAL-001: TypeScript Strict Mode
- ✅ All packages have `"strict": true`
- ✅ Build successful with no errors
- ✅ No `any` types used

### QUAL-002: ESLint Fixes
- ✅ `npm run lint` shows 0 errors
- ✅ 0 warnings (or documented)
- ✅ All auto-fixes applied

### QUAL-003: Pre-commit Hooks
- ✅ Husky installed
- ✅ Lint runs on commit
- ✅ Bad commits rejected

### QUAL-004: Code Duplication
- ✅ Duplication <5%
- ✅ Common utilities extracted
- ✅ Test utils consolidated

### QUAL-005: Security Audit
- ✅ Zero high/critical vulnerabilities
- ✅ `npm audit` passes
- ✅ SECURITY.md created

---

## 🔗 Useful Commands

### TypeScript

```bash
# Type check without building
npx tsc --noEmit

# Type check specific package
cd packages/core && npx tsc --noEmit

# Watch mode
npx tsc --watch --noEmit
```

### ESLint

```bash
# Lint all files
npm run lint

# Lint with auto-fix
npm run lint -- --fix

# Lint specific file
npx eslint packages/core/src/index.ts

# Lint with max warnings (CI)
npx eslint . --max-warnings 0
```

### Security

```bash
# Audit all
npm audit

# Audit production only
npm audit --production

# Audit JSON output
npm audit --json > audit-report.json

# Fix automatically
npm audit fix

# Fix force (may break)
npm audit fix --force
```

### Quality Tools

```bash
# Code duplication
npx jscpd packages/ --min-lines 5

# Bundle size
ls -lh packages/*/dist/

# Coverage
npm run test -- --coverage
```

---

## 💡 Pro Tips for AI Agents

### 1. Incremental Progress

```bash
# ❌ Don't: Try to fix everything at once
npm run build  # 100 errors!

# ✅ Do: Fix one package at a time
cd packages/middleware
npm run build  # 5 errors - manageable!
```

### 2. Read Error Messages

TypeScript errors are usually clear:

```
Error: Object is possibly 'null'
  → Solution: Add null check

Error: Parameter 'x' implicitly has 'any' type
  → Solution: Add type annotation
```

### 3. Test After Each Fix

```bash
# After fixing each file:
npm run test -- path/to/file.test.ts

# Don't wait until all fixes done
```

### 4. Commit Frequently

```bash
# Good commit pattern:
git commit -m "fix(core): add type annotations to store.ts"
git commit -m "fix(core): add null checks to atom.ts"

# Not:
# (100 changes in one commit)
```

### 5. Use Task Documentation

Every task has:
- Common error patterns
- Copy-paste solutions
- Validation commands

**Don't reinvent the wheel!**

---

## 🎓 Learning Resources

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Strict Mode Guide](https://www.typescriptlang.org/tsconfig#strict)

### ESLint
- [ESLint Rules](https://eslint.org/docs/rules/)
- [TypeScript ESLint](https://typescript-eslint.io/)

### Security
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk Docs](https://docs.snyk.io/)

### Git Hooks
- [Husky](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/okonet/lint-staged)

---

## 📞 Getting Help

If stuck:

1. **Re-read task file** - Solutions usually there
2. **Check existing code** - See patterns used
3. **Search TypeScript errors** - Often documented
4. **Check git history** - `git log --follow <file>`
5. **Ask project owner** - Create issue

---

## 🎉 After Your First Task

1. **Update INDEX.md** - Mark task as ✅
2. **Update this file** - Add lessons learned
3. **Share progress** - Post in discussions
4. **Pick next task** - Keep momentum!

---

## 🚦 Phase Checklist

Before starting:
- [ ] Phase 00 100% complete
- [ ] All tests passing
- [ ] Clean git status

During phase:
- [ ] Follow task order
- [ ] Test frequently
- [ ] Commit often
- [ ] Update progress

After completion:
- [ ] All tasks ✅
- [ ] All metrics met
- [ ] Documentation updated
- [ ] Ready for Phase 02

---

**Happy Coding! 🚀**

*Quality > Speed. Take time to do it right.*

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-23  
**Next Review:** After first task completion

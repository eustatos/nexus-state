# Quick Start Guide for AI Agents

> **Goal:** Get started on Core Stabilization tasks immediately

---

## 🚀 Getting Started (30 seconds)

```bash
# 1. Navigate to project
cd /path/to/nexus-state

# 2. Check current status
npm run test

# 3. Read task assignment
cat planning/phase-00-core-stabilization/[TASK-ID].md

# 4. Start working!
```

---

## 📋 Task Priority Order (Recommended)

### Start Here (Foundational)
1. **STAB-001** - Create test files (30 min) ← START HERE
2. **STAB-002** - Clean backup files (15 min)

### Then Do (Core Tests)
3. **STAB-003** - Async package tests (4h)
4. **STAB-004** - Family package tests (4h)
5. **STAB-005** - Persist package tests (4h)
6. **STAB-006** - Web-worker tests (4h)

### Finally (Polish)
7. **STAB-007** - Core coverage boost (4h)
8. **STAB-008** - TypeScript strict mode (3h)
9. **STAB-009** - Performance benchmarks (3h)
10. **STAB-010** - API documentation (2h)

---

## 🎯 For Your First Task

### If Starting STAB-001 (Recommended First Task)

```bash
# 1. Read the task
cat planning/phase-00-core-stabilization/STAB-001-create-missing-test-files.md

# 2. Create test files
touch packages/async/index.test.ts
touch packages/family/index.test.ts
touch packages/persist/index.test.ts
touch packages/web-worker/index.test.ts

# 3. Copy template content (see task file)

# 4. Run tests
npm run test

# 5. Commit
git add packages/*/index.test.ts
git commit -m "feat(tests): add placeholder test files

Resolves: STAB-001"
```

**Time:** ~30 minutes  
**Difficulty:** Easy  
**Impact:** Unblocks 4 other tasks

---

## 📖 Task File Structure

Every task file has this structure:

```
1. Task Overview      → Status, priority, time
2. Objective          → What to achieve
3. Current State      → What exists now
4. Acceptance Criteria → How to know it's done
5. Implementation     → Step-by-step guide
6. Validation         → How to test
7. Context            → Why this matters
8. Checklist          → Final steps
```

**Pro Tip:** Read sections 1-4 first, then follow section 5 step-by-step.

---

## ✅ Completion Checklist (For Every Task)

Before marking a task complete:

```bash
# 1. Run tests
npm run test

# 2. Check coverage (if applicable)
npm run test -- --coverage

# 3. Lint code
npm run lint

# 4. Build (verify no errors)
npm run build

# 5. Commit with proper message
git commit -m "type(scope): description

- Detail 1
- Detail 2

Resolves: TASK-ID"
```

---

## 🐛 Common Issues & Solutions

### Issue: Tests not found

```bash
# Solution: Create index.test.ts file
touch packages/[package]/index.test.ts
```

### Issue: Import errors

```bash
# Solution: Check package.json exports
cat packages/[package]/package.json
```

### Issue: TypeScript errors

```bash
# Solution: Check tsconfig.json
cat packages/[package]/tsconfig.json
```

### Issue: Coverage not increasing

```bash
# Solution: Check what's uncovered
npm run test -- --coverage --coverage.reporter=html
open coverage/index.html
```

---

## 📊 Success Metrics

Track these for each task:

- ✅ **Tests passing:** All new tests green
- ✅ **Coverage:** Target met (usually 90%+)
- ✅ **Build:** No build errors
- ✅ **Lint:** No linting errors
- ✅ **Commit:** Proper commit message

---

## 🔗 Useful Commands

```bash
# Run specific package tests
cd packages/[package] && npm run test

# Watch mode (auto-rerun on changes)
npm run test -- --watch

# Coverage report
npm run test -- --coverage

# Run single test file
npm run test -- path/to/file.test.ts

# Run tests matching pattern
npm run test -- -t "test name pattern"

# Benchmark tests
npm run bench

# Lint
npm run lint

# Format
npm run format
```

---

## 💡 Pro Tips for AI Agents

### 1. Start Small
- Complete STAB-001 first (easiest)
- Builds confidence and momentum
- Unblocks other tasks

### 2. Read Existing Tests
- Check `packages/core/src/index.test.ts`
- Copy patterns for consistency
- Learn project conventions

### 3. Test-Driven Development
- Write test first (it should fail)
- Implement feature
- Test passes ✅

### 4. Incremental Commits
- Commit after each test file
- Easier to review
- Easier to rollback if needed

### 5. Ask for Help
- Check task's "Context & Background"
- Review related tasks
- Refer to main docs

---

## 🎓 Learning Resources

### Project-Specific
- [Main README](../../README.md)
- [Development Plan](../../docs/DEVELOPMENT_PLAN.md)
- [Core Package README](../../packages/core/README.md)

### Testing with Vitest
- [Vitest Docs](https://vitest.dev/)
- [Example Tests](../../packages/core/src/index.test.ts)
- [Benchmark Guide](https://vitest.dev/guide/features.html#benchmarking-experimental)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

---

## 📞 Getting Help

If stuck:

1. **Re-read the task file** - Often the answer is there
2. **Check related tasks** - May provide context
3. **Review existing code** - See how it's done elsewhere
4. **Check git history** - `git log --follow <file>`
5. **Ask project owner** - Create GitHub issue

---

## 🎉 After Your First Task

1. **Update task status** - Mark as ✅ Done
2. **Update INDEX.md** - Update progress
3. **Share results** - Post in discussions
4. **Pick next task** - Continue momentum!

---

**Happy Coding! 🚀**

*Remember: Quality > Speed. Take time to understand each task fully.*

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-23  
**Next Review:** After first task completion

## ⚡ TL;DR - Read in 90 seconds:

### 🚨 NON-NEGOTIABLE RULES:

1. **TypeScript strict mode** - NO `any`, explicit return types
2. **Testing with fixtures** - Use existing fixtures, create new ones in `tests/fixtures/`
3. **Performance first** - Monitor bundle size, avoid allocations in hot paths
4. **English only** - Code, comments, commits, documentation
5. **Named exports only** - No default exports
6. **Immutable updates** - Never mutate parameters or state

### 📋 BEFORE STARTING ANY TASK:

- [ ] Read the task file completely
- [ ] Check existing patterns in similar modules
- [ ] Understand dependencies between modules
- [ ] Review related fixtures in `tests/fixtures/`
- [ ] Estimate if task fits in context (split if >3K tokens or >5 files)

### 🎯 CURRENT PRIORITY CONTEXT:

- Always check `.ai/context/current-context.md` for active phase
- Focus on completing one subtask before moving to another
- Create checkpoints for natural breaking points

### 🔧 QUALITY GATES (MUST PASS):

- ✅ TypeScript strict mode passes (no errors)
- ✅ Tests use fixtures and have >90% coverage
- ✅ No performance regressions (measure!)
- ✅ Documentation updated (JSDoc + examples)
- ✅ No breaking changes to public API

### 🔄 CONTEXT MANAGEMENT:

- At 80% context: Start wrapping up current subtask
- At 90% context: MUST propose task splitting
- Use checkpoint pattern: Complete logical units before continuing

### 💰 TOKEN OPTIMIZATION:

- Reference files, don't include full contents
- Show patterns once, reference variations
- Summarize completed work before continuing
- Use TL;DR sections in all documents

---

**NEED DETAILS? READ:**

- [TypeScript Rules](./01-typescript-standards.md)
- [Testing Guide](./02-testing-standards.md)
- [Performance Guide](./03-performance-standards.md)
- [Context Management](./04-context-management.md)
- [Documentation Guide](./05-documentation-standards.md)

**ALWAYS CHECK:** `.ai/context/current-context.md` for project-specific priorities

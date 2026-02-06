# `.ai/rules/00-tldr-quick-start.md`

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
- [ ] **CHECK & UPDATE** `.ai/context/current-context.md`
- [ ] Estimate if task fits in context (split if >3K tokens or >5 files)

### 🎯 CONTEXT FILE QUICK GUIDE:

#### **Workflow for `.ai/context/current-context.md`:**

1. **ALWAYS check first** → What phase/task am I continuing?
2. **Update at key moments:**
   - ✅ **Starting** → Fill template from `.ai/context/template.md`
   - ✅ **Completing subtask** → Add to RECENTLY COMPLETED
   - ✅ **Making decision** → Add to ARCHITECTURAL DECISIONS
   - ✅ **Pausing** → Fill CONTEXT FOR CONTINUATION section
   - ✅ **Every 30 mins** → Update "Last Updated" timestamp
3. **Task done** → Move to archive, start fresh template

#### **Status Emojis (USE THESE):**

- 🟢 **ACTIVE** - Currently working
- 🟡 **PAUSED** - Stopped mid-task (fill continuation section)
- 🔴 **BLOCKED** - Needs human input/unresolved issue
- ✅ **COMPLETED** - Task done, ready for archive

### 🔧 QUALITY GATES (MUST PASS):

- ✅ TypeScript strict mode passes (no errors)
- ✅ Tests use fixtures and have >90% coverage
- ✅ No performance regressions (measure!)
- ✅ Documentation updated (JSDoc + examples)
- ✅ No breaking changes to public API
- ✅ **Context file updated** with decisions/progress

### 🔄 CONTEXT & TOKEN MANAGEMENT:

#### **Context Limit Protocol:**

- ⚠️ **80% context used** → Start wrapping up current logical unit
- 🚨 **90% context used** → **MUST** propose task splitting
- 🛑 **95% context used** → STOP, save state, propose continuation

#### **Automatic Split Triggers:**

Split task immediately if ANY:

- > 300 lines of new code
- > 5 files significantly changed
- > 10 test cases needed
- > 3 major functions to implement
- Task has >5 acceptance criteria

#### **Token Optimization:**

- Reference files (`see src/core/file.ts`), don't include contents
- Show patterns once, reference variations
- Summarize completed work before continuing
- Use TL;DR sections in all documents

### 🚀 WORKFLOW SUMMARY:

1. **START:** Check context file → Understand current phase/task
2. **PLAN:** Read task → Estimate complexity → Split if needed
3. **CODE:** Follow standards → Use fixtures → Update context regularly
4. **TEST:** Write tests → Measure performance → Update metrics
5. **DOCUMENT:** Add JSDoc → Update examples → Fill completion checklist
6. **HANDOFF:** Update context → Archive if done → Clear for next task

### ⚠️ CRITICAL REMINDERS:

- **NEVER use `any` type** - use `unknown` with type guards
- **ALWAYS use fixtures** - create in `tests/fixtures/` if missing
- **MEASURE performance** - before and after optimizations
- **UPDATE context file** - at every significant milestone
- **SPLIT EARLY** - better small PRs than incomplete context-heavy attempts

---

**NEED DETAILS? READ:**

- [TypeScript Rules](./01-typescript-standards.md)
- [Testing Guide](./02-testing-standards.md)
- [Performance Guide](./03-performance-standards.md)
- [Context Management](./04-context-management.md)
- [Documentation Guide](./05-documentation-standards.md)

**ALWAYS CHECK & UPDATE:** `.ai/context/current-context.md`  
**TEMPLATE AT:** `.ai/context/template.md`  
**ARCHIVES:** `.ai/context/archive/` for completed tasks

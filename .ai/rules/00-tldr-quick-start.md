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
- [ ] **CHECK & UPDATE** `.ai/context/current-context/` (AsciiDoc format)
- [ ] Estimate if task fits in context (split if >3K tokens or >5 files)

### 🎯 CONTEXT FILE QUICK GUIDE:

#### **AsciiDoc Context Structure:**

```
.ai/context/
├── current-context/          # Active context (AsciiDoc format)
│   ├── index.adoc            # Main index with includes
│   ├── basic-info.adoc       # Project, phase, task info
│   ├── current-focus.adoc    # What's being worked on now
│   ├── recently-completed.adoc # Recent progress
│   ├── architectural-decisions.adoc # Design decisions
│   ├── active-files.adoc     # Files being modified
│   ├── task-dependencies.adoc # Task relationships
│   ├── acceptance-criteria.adoc # Success criteria
│   ├── performance-metrics.adoc # Performance targets
│   ├── known-issues.adoc     # Problems and questions
│   ├── continuation-context.adoc # Where to continue
│   ├── session-notes.adoc    # Insights and lessons
│   └── completion-checklist.adoc # Final checklist
├── template/                 # Template structure
└── archive/                  # Completed tasks
```

#### **Workflow for AsciiDoc Context:**

1. **ALWAYS check first** → Read `current-context/index.adoc` for current phase/task
2. **Update at key moments:**
   - ✅ **Starting** → Copy template structure to `current-context/`
   - ✅ **Completing subtask** → Update `recently-completed.adoc`
   - ✅ **Making decision** → Update `architectural-decisions.adoc`
   - ✅ **Pausing** → Update `continuation-context.adoc`
   - ✅ **Every 30 mins** → Update relevant `.adoc` files
3. **Task done** → Move `current-context/` to archive, copy fresh template

#### **Status Emojis (USE THESE):**

- 🟢 **ACTIVE** - Currently working
- 🟡 **PAUSED** - Stopped mid-task (update continuation-context.adoc)
- 🔴 **BLOCKED** - Needs human input (update known-issues.adoc)
- ✅ **COMPLETED** - Task done, ready for archive

### 🔧 QUALITY GATES (MUST PASS):

- ✅ TypeScript strict mode passes (no errors)
- ✅ Tests use fixtures and have >90% coverage
- ✅ No performance regressions (measure!)
- ✅ Documentation updated (JSDoc + examples)
- ✅ No breaking changes to public API
- ✅ **AsciiDoc context files updated** with decisions/progress

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

#### **Token Optimization (AsciiDoc aware):**

- Reference files (`see src/core/file.ts`), don't include contents
- Use AsciiDoc includes for modular context
- Show patterns once, reference variations
- Summarize completed work in `recently-completed.adoc`
- Use TL;DR sections in all documents

### 🚀 WORKFLOW SUMMARY:

1. **START:** Check `current-context/index.adoc` → Understand current phase/task
2. **PLAN:** Read task → Estimate complexity → Split if needed
3. **CODE:** Follow standards → Use fixtures → Update `.adoc` files regularly
4. **TEST:** Write tests → Measure performance → Update `performance-metrics.adoc`
5. **DOCUMENT:** Add JSDoc → Update examples → Fill `completion-checklist.adoc`
6. **HANDOFF:** Archive context → Clear `current-context/` → Copy fresh template

### ⚠️ CRITICAL REMINDERS:

- **NEVER use `any` type** - use `unknown` with type guards
- **ALWAYS use fixtures** - create in `tests/fixtures/` if missing
- **MEASURE performance** - before and after optimizations
- **UPDATE AsciiDoc context files** - at every significant milestone
- **USE AsciiDoc formatting** - for better readability and organization
- **SPLIT EARLY** - better small PRs than incomplete context-heavy attempts

---

**NEED DETAILS? READ:**

- [TypeScript Rules](./01-typescript-standards.md)
- [Testing Guide](./02-testing-standards.md)
- [Performance Guide](./03-performance-standards.md)
- [Context Management](./04-context-management.md) ← **UPDATED!**
- [Documentation Guide](./05-documentation-standards.md)

**ALWAYS CHECK & UPDATE:** `.ai/context/current-context/` (AsciiDoc format)  
**TEMPLATE AT:** `.ai/context/template/`  
**ARCHIVES:** `.ai/context/archive/` for completed tasks

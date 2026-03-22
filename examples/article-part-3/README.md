# Part 3: Advanced Patterns - StackBlitz Demo Tasks

> **Goal:** Create working StackBlitz demos for "React Forms Deep Dive: Part 3" article on Dev.to

**Article:** `planning/article-forms/phase-03-drafting/part-03-advanced-patterns-1/devto-v1.md`

**Target:** Reduce article from 1224 lines to ~550 lines by moving code to demos

---

## 📁 Demo Organization

```
examples/article-part-3/
├── multi-step-forms/       # Multi-step Wizards
│   ├── 01-rhf-state-based/
│   ├── 02-rhf-url-based/
│   └── 03-nexus-state/
├── dynamic-forms/           # Conditional & Schema-driven
│   ├── 01-conditional-rendering/
│   └── 02-schema-driven/
└── form-arrays/             # Repeatable Field Groups
    ├── 01-rhf-field-array/
    └── 02-nexus-field-array/
```

---

## 📋 Demo Tasks

### Demo 1: Multi-step Form (RHF State-based)

**Path:** `examples/article-part-3/multi-step-forms/01-rhf-state-based/`

**Stack:** React Hook Form + Zod

**Features:**
- [ ] 3-step wizard (Personal → Address → Payment)
- [ ] State-based navigation (`useState`)
- [ ] Per-step validation with `trigger()`
- [ ] Progress indicator with ARIA
- [ ] Submit handler with console.log

**Files to create:**
- [ ] `package.json` (react, react-hook-form, zod, @hookform/resolvers)
- [ ] `vite.config.ts`
- [ ] `tsconfig.json`
- [ ] `index.html`
- [ ] `src/main.tsx`
- [ ] `src/App.tsx` (main form component)
- [ ] `src/schemas.ts` (Zod schemas for each step)
- [ ] `src/components/ProgressIndicator.tsx`
- [ ] `src/components/Step1.tsx`
- [ ] `src/components/Step2.tsx`
- [ ] `src/components/Step3.tsx`
- [ ] `README.md` (instructions for StackBlitz)

**Estimated time:** 45 minutes

**StackBlitz URL:** _To be filled after creation_

---

### Demo 2: Multi-step Form (RHF URL-based)

**Path:** `examples/article-part-3/multi-step-forms/02-rhf-url-based/`

**Stack:** React Hook Form + Zod + React Router

**Features:**
- [ ] 3-step wizard with URL params (`?step=1`)
- [ ] `useSearchParams` for state management
- [ ] Browser history support (back/forward)
- [ ] Validation on step change
- [ ] Shareable links to specific steps

**Files to create:**
- [ ] `package.json` (add react-router-dom)
- [ ] `vite.config.ts`
- [ ] `tsconfig.json`
- [ ] `index.html`
- [ ] `src/main.tsx` (with BrowserRouter)
- [ ] `src/App.tsx`
- [ ] `src/schemas.ts`
- [ ] `src/components/ProgressIndicator.tsx`
- [ ] `src/components/Step1.tsx`
- [ ] `src/components/Step2.tsx`
- [ ] `src/components/Step3.tsx`
- [ ] `README.md`

**Estimated time:** 60 minutes

**StackBlitz URL:** _To be filled after creation_

---

### Demo 3: Multi-step Form (Nexus State)

**Path:** `examples/article-part-3/multi-step-forms/03-nexus-state/`

**Stack:** @nexus-state/form + @nexus-state/core + @nexus-state/react

**Features:**
- [ ] Built-in multi-step form management
- [ ] `createMultiStepForm` or custom implementation
- [ ] `formActions.nextStep()`, `formActions.prevStep()`
- [ ] Automatic per-step validation
- [ ] DevTools integration demo

**Files to create:**
- [ ] `package.json` (@nexus-state/* packages)
- [ ] `vite.config.ts`
- [ ] `tsconfig.json`
- [ ] `index.html`
- [ ] `src/main.tsx`
- [ ] `src/App.tsx`
- [ ] `src/store.ts` (form atoms)
- [ ] `src/components/ProgressIndicator.tsx`
- [ ] `src/components/Step1.tsx`
- [ ] `src/components/Step2.tsx`
- [ ] `src/components/Step3.tsx`
- [ ] `README.md`

**Estimated time:** 60 minutes

**StackBlitz URL:** _To be filled after creation_

---

### Demo 4: Dynamic Forms (Conditional Rendering)

**Path:** `examples/article-part-3/dynamic-forms/01-conditional-rendering/`

**Stack:** React Hook Form + useWatch

**Features:**
- [ ] Vehicle type selector (car/boat/motorcycle)
- [ ] Conditional fields based on selection
- [ ] Nested conditions (insurance checkbox)
- [ ] Dynamic validation rules
- [ ] ARIA for dynamically shown fields

**Files to create:**
- [ ] `package.json`
- [ ] `vite.config.ts`
- [ ] `tsconfig.json`
- [ ] `index.html`
- [ ] `src/main.tsx`
- [ ] `src/App.tsx`
- [ ] `src/schemas.ts` (conditional validation)
- [ ] `README.md`

**Estimated time:** 45 minutes

**StackBlitz URL:** _To be filled after creation_

---

### Demo 5: Dynamic Forms (Schema-driven)

**Path:** `examples/article-part-3/dynamic-forms/02-schema-driven/`

**Stack:** Custom schema-driven approach

**Features:**
- [ ] `FieldConfig[]` schema definition
- [ ] `visible: (formData) => boolean` conditions
- [ ] `required: (formData) => boolean` conditions
- [ ] Automatic field rendering from schema
- [ ] Dependencies tracking

**Files to create:**
- [ ] `package.json`
- [ ] `vite.config.ts`
- [ ] `tsconfig.json`
- [ ] `index.html`
- [ ] `src/main.tsx`
- [ ] `src/App.tsx`
- [ ] `src/schema.ts` (FieldConfig definitions)
- [ ] `src/engine/FieldRenderer.tsx`
- [ ] `src/engine/useDynamicForm.ts`
- [ ] `README.md`

**Estimated time:** 60 minutes

**StackBlitz URL:** _To be filled after creation_

---

### Demo 6: Form Arrays (RHF)

**Path:** `examples/article-part-3/form-arrays/01-rhf-field-array/`

**Stack:** React Hook Form + useFieldArray

**Features:**
- [ ] Dynamic skill list (add/remove/reorder)
- [ ] `useFieldArray` hook usage
- [ ] Nested validation for array items
- [ ] Move up/down functionality
- [ ] Empty state handling

**Files to create:**
- [ ] `package.json`
- [ ] `vite.config.ts`
- [ ] `tsconfig.json`
- [ ] `index.html`
- [ ] `src/main.tsx`
- [ ] `src/App.tsx`
- [ ] `src/schemas.ts`
- [ ] `src/components/SkillList.tsx`
- [ ] `src/components/SkillItem.tsx`
- [ ] `README.md`

**Estimated time:** 45 minutes

**StackBlitz URL:** _To be filled after creation_

---

### Demo 7: Form Arrays (Nexus State)

**Path:** `examples/article-part-3/form-arrays/02-nexus-field-array/`

**Stack:** @nexus-state/form + useFieldArray

**Features:**
- [ ] `createFieldArray` or `useFieldArray` from nexus-state/form
- [ ] Append, remove, swap operations
- [ ] Validation per array item
- [ ] State persistence demonstration
- [ ] Comparison with RHF approach

**Files to create:**
- [ ] `package.json`
- [ ] `vite.config.ts`
- [ ] `tsconfig.json`
- [ ] `index.html`
- [ ] `src/main.tsx`
- [ ] `src/App.tsx`
- [ ] `src/store.ts` (field array atom)
- [ ] `src/components/SkillList.tsx`
- [ ] `src/components/SkillItem.tsx`
- [ ] `README.md`

**Estimated time:** 60 minutes

**StackBlitz URL:** _To be filled after creation_

---

## 📊 Progress Tracking

| Demo | Status | Files | Tested | StackBlitz URL |
|------|--------|-------|--------|----------------|
| 01 RHF State-based | ✅ Complete | 12/12 | ✅ MCP Verified | Ready to upload |
| 02 RHF URL-based | ✅ Complete | 14/14 | ✅ Build passed | Ready to upload |
| 03 Nexus State | ⬜ Not Started | 0/12 | ❌ | - |
| 04 Conditional | ⬜ Not Started | 0/10 | ❌ | - |
| 05 Schema-driven | ⬜ Not Started | 0/10 | ❌ | - |
| 06 RHF Field Array | ⬜ Not Started | 0/10 | ❌ | - |
| 07 Nexus Field Array | ⬜ Not Started | 0/10 | ❌ | - |

**Total Progress:** 2/7 demos (29%)

### Per-Section Progress

| Section | Demos | Progress |
|---------|-------|----------|
| Multi-step Forms | 3 | 2/3 (67%) |
| Dynamic Forms | 2 | 0/2 (0%) |
| Form Arrays | 2 | 0/2 (0%) |

### Test Results Summary

| Demo | Tests | Passed | Failed |
|------|-------|--------|--------|
| 01 RHF State-based | 17 | 17 ✅ | 0 |
| 02 RHF URL-based | 0 | 0 | 0 (not tested yet) |

---

## 🎯 Quality Checklist (for each demo)

### Before committing:
- [ ] All dependencies installed
- [ ] `npm run dev` works locally
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] All buttons/inputs work
- [ ] Validation triggers correctly
- [ ] ARIA attributes present
- [ ] Responsive design (basic)

### For StackBlitz:
- [ ] `README.md` with instructions
- [ ] Clear entry point (`App.tsx`)
- [ ] Dependencies pinned (not `*`)
- [ ] No external API calls (or mock data)
- [ ] Works in preview pane

---

## 📝 Article Integration Plan

After all demos are created:

1. **Update article** (`devto-v1.md`):
   - Replace full code examples with key snippets
   - Add "📎 Try it yourself: [StackBlitz Demo](url)" links
   - Keep only essential inline code (~200 lines total)

2. **Expected reduction:**
   - Before: 1224 lines
   - After: ~550 lines (55% reduction)

3. **Update series navigation:**
   - Add links to all Part 3 demos
   - Create index page for demo collection

---

## 🔗 StackBlitz Publishing Guide

### For each demo:

1. **Push to GitHub:**
   ```bash
   cd examples/article-part-3/01-rhf-state-based
   git add .
   git commit -m "Add StackBlitz demo: RHF State-based Multi-step"
   git push
   ```

2. **Import to StackBlitz:**
   - Go to https://stackblitz.com
   - Click "Import Project"
   - Paste GitHub URL
   - Wait for setup

3. **Get shareable link:**
   - Click "Share" button
   - Copy URL
   - Add to this document

4. **Optional - Embed in article:**
   ```markdown
   <iframe 
     src="https://stackblitz.com/edit/xxx?embed=1&file=src/App.tsx"
     style="width:100%;height:500px;border:none;"
   />
   ```

---

## 📅 Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| **Setup** | Create directory structure, templates | 30 min |
| **Demo 1-3** | Multi-step forms (all variants) | 2.5 hours |
| **Demo 4-5** | Dynamic forms | 1.5 hours |
| **Demo 6-7** | Form arrays | 1.5 hours |
| **Testing** | Test all demos, fix bugs | 1 hour |
| **StackBlitz** | Upload all 7 demos | 1 hour |
| **Article** | Update article with links | 1 hour |
| **Total** | | **~9 hours** |

---

**Parent Task:** `planning/article-forms/phase-03-drafting/part-03-advanced-patterns-1/devto-v1.md`

**Related:** Part 1 & Part 2 demos (if any)

---

## 📎 Appendix: Template Files

See `examples/article-part-3/_template/` for base template files:
- `package.json` template
- `vite.config.ts` template
- `tsconfig.json` template
- Basic component structure

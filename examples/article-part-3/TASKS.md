# StackBlitz Demo Tasks - Summary

> **Created:** 2026-03-18
> **For Article:** `planning/article-forms/phase-03-drafting/part-03-advanced-patterns-1/devto-v1.md`
> **Target:** Reduce article from 1224 lines to ~550 lines

---

## 📁 Created Structure

```
examples/article-part-3/
├── README.md                          # Main task tracker
├── _template/                         # Base template for all demos
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       └── App.tsx
├── multi-step-forms/
│   ├── README.md                      # Tasks for 3 demos
│   ├── 01-rhf-state-based/            # TO BE CREATED
│   ├── 02-rhf-url-based/              # TO BE CREATED
│   └── 03-nexus-state/                # TO BE CREATED
├── dynamic-forms/
│   ├── README.md                      # Tasks for 2 demos
│   ├── 01-conditional-rendering/      # TO BE CREATED
│   └── 02-schema-driven/              # TO BE CREATED
└── form-arrays/
    ├── README.md                      # Tasks for 2 demos
    ├── 01-rhf-field-array/            # TO BE CREATED
    └── 02-nexus-field-array/          # TO BE CREATED
```

---

## 📋 Task Summary

| Section | Demos | Files per Demo | Total Files | Est. Time |
|---------|-------|----------------|-------------|-----------|
| Multi-step Forms | 3 | 12 | 36 | 2.5 hours |
| Dynamic Forms | 2 | 10 | 20 | 1.5 hours |
| Form Arrays | 2 | 10 | 20 | 1.5 hours |
| **Total** | **7** | **~11 avg** | **76** | **~5.5 hours** |

---

## 🎯 Quick Start

### For each demo:

1. **Copy template:**
   ```bash
   cd examples/article-part-3/multi-step-forms
   cp -r ../../_template 01-rhf-state-based
   ```

2. **Add dependencies:**
   ```bash
   cd 01-rhf-state-based
   npm install react-hook-form zod @hookform/resolvers
   ```

3. **Create components:**
   - Follow checklist in section README.md

4. **Test:**
   ```bash
   npm run dev
   npm run build
   ```

5. **Publish:**
   ```bash
   git add .
   git commit -m "Add demo: 01-rhf-state-based"
   git push
   # Import to StackBlitz
   ```

---

## 📊 Expected Article Reduction

| Section | Before (lines) | After (lines) | Reduction |
|---------|----------------|---------------|-----------|
| Introduction | 100 | 80 | -20% |
| Multi-step Forms | 400 | 150 | -62% |
| Dynamic Forms | 350 | 150 | -57% |
| Form Arrays | 200 | 100 | -50% |
| Conclusion | 50 | 70 | +40% |
| **Total** | **1224** | **~550** | **-55%** |

---

## ✅ Quality Checklist

### For each demo before publishing:

**Code Quality:**
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All imports resolved
- [ ] Code formatted (Prettier)

**Functionality:**
- [ ] All buttons work
- [ ] Validation triggers correctly
- [ ] Error messages show
- [ ] Success state works

**Accessibility:**
- [ ] Labels for all inputs
- [ ] aria-invalid on errors
- [ ] aria-describedby for hints
- [ ] role="alert" on errors
- [ ] Keyboard navigation works

**StackBlitz:**
- [ ] Works in preview
- [ ] Dependencies installed
- [ ] No external API calls (or mocked)
- [ ] README with instructions

---

## 🔗 Integration with Article

After all demos are created:

1. **Update `devto-v1.md`:**
   - Replace code blocks with snippets
   - Add "📎 Try it: [StackBlitz](url)" links
   - Keep only key logic inline (~20 lines per example)

2. **Update series navigation:**
   - Add Part 3 demo index
   - Link to Part 1 & Part 2 (if they have demos)

3. **Add cover image:**
   - Create diagram showing 3 patterns
   - Upload to Dev.to

---

## 📅 Timeline

| Day | Task | Duration |
|-----|------|----------|
| 1 | Create multi-step-forms demos (3) | 2.5 hours |
| 2 | Create dynamic-forms demos (2) | 1.5 hours |
| 3 | Create form-arrays demos (2) | 1.5 hours |
| 4 | Test all demos, fix bugs | 1 hour |
| 5 | Upload to StackBlitz | 1 hour |
| 6 | Update article with links | 1 hour |
| **Total** | | **~8.5 hours** |

---

## 📎 Related Files

- **Article:** `planning/article-forms/phase-03-drafting/part-03-advanced-patterns-1/devto-v1.md`
- **Part 1:** `planning/article-forms/phase-03-drafting/part-01-foundations/`
- **Part 2:** `planning/article-forms/phase-03-drafting/part-02-ux-accessibility/`
- **Examples Main:** `examples/README.md`

---

**Status:** ⬜ Ready to start

**Next Action:** Pick first demo (01-rhf-state-based) and follow checklist in `multi-step-forms/README.md`

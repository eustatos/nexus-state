# TS-001: Audit All `any` Types in Codebase

## 📋 Task Overview

**Priority:** 🔴 High
**Estimated Time:** 2-3 hours
**Status:** ⬜ Not Started
**Assignee:** AI Agent

---

## 🎯 Objective

Create a comprehensive baseline report of all `any` types in the codebase to track progress and prioritize fixes.

---

## 📦 Scope

**Files to audit:**
- All `.ts` and `.tsx` files in `packages/*/src/`
- Exclude: `*.test.ts`, `*.spec.ts`, `node_modules/`, `dist/`

**What to find:**
- Explicit `: any` type annotations
- `as any` type assertions
- `any` in generics (e.g., `Promise<any>`)
- Implicit `any` (parameters without types)
- `any` in type aliases and interfaces

---

## ✅ Acceptance Criteria

- [ ] Grep commands executed for all patterns
- [ ] Results saved to `planning/phase-01-code-quality/reports/any-types-baseline.txt`
- [ ] Count by package documented
- [ ] Top 10 files with most `any` identified
- [ ] JSON report created for tracking
- [ ] Baseline committed to git

---

## 📝 Implementation Steps

### Step 1: Create Reports Directory

```bash
mkdir -p planning/phase-01-code-quality/reports
```

### Step 2: Run Comprehensive Grep

```bash
# Find all 'any' type annotations
grep -rn ": any" packages/*/src --include="*.ts" --include="*.tsx" > planning/phase-01-code-quality/reports/any-types-baseline.txt

# Find all 'as any' assertions
grep -rn "as any" packages/*/src --include="*.ts" --include="*.tsx" >> planning/phase-01-code-quality/reports/any-types-baseline.txt

# Find all 'any' in generics
grep -rn "<any>" packages/*/src --include="*.ts" --include="*.tsx" >> planning/phase-01-code-quality/reports/any-types-baseline.txt
```

### Step 3: Count by Package

```bash
echo "=== ANY TYPES BY PACKAGE ===" > planning/phase-01-code-quality/reports/any-types-summary.txt

for pkg in packages/*/; do
  pkg_name=$(basename $pkg)
  count=$(grep -r ": any" "$pkg/src" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
  echo "$pkg_name: $count" >> planning/phase-01-code-quality/reports/any-types-summary.txt
done
```

### Step 4: Create JSON Report

**File:** `planning/phase-01-code-quality/reports/any-types-baseline.json`

```json
{
  "auditDate": "2026-02-26",
  "phase": "Phase 01: Type Safety",
  "task": "TS-001",
  "summary": {
    "totalAnyTypes": 0,
    "totalFiles": 0,
    "packagesAudited": 12
  },
  "byPackage": {
    "core": 0,
    "react": 0,
    "vue": 0,
    "svelte": 0,
    "family": 0,
    "async": 0,
    "persist": 0,
    "middleware": 0,
    "immer": 0,
    "devtools": 0,
    "web-worker": 0,
    "cli": 0
  }
}
```

---

## 🧪 Validation Commands

```bash
# 1. Verify report files exist
ls -la planning/phase-01-code-quality/reports/

# 2. Check baseline has content
wc -l planning/phase-01-code-quality/reports/any-types-baseline.txt
# Expected: >100 lines

# 3. Verify summary is complete
cat planning/phase-01-code-quality/reports/any-types-summary.txt
# Expected: 12 packages listed
```

---

## 📊 Definition of Done

- [ ] All grep commands executed successfully
- [ ] `any-types-baseline.txt` created (>100 lines)
- [ ] `any-types-summary.txt` created (12 packages)
- [ ] `any-types-baseline.json` created and valid
- [ ] Summary documented in README.md
- [ ] Reports committed to git

---

## 🚀 Execution Checklist

```bash
# 1. Create reports directory
mkdir -p planning/phase-01-code-quality/reports

# 2. Run audit
grep -rn ": any" packages/*/src --include="*.ts" --include="*.tsx" > planning/phase-01-code-quality/reports/any-types-baseline.txt

# 3. Create summary
echo "=== ANY TYPES BY PACKAGE ===" > planning/phase-01-code-quality/reports/any-types-summary.txt
for pkg in packages/*/; do
  pkg_name=$(basename $pkg)
  count=$(grep -r ": any" "$pkg/src" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
  echo "$pkg_name: $count" >> planning/phase-01-code-quality/reports/any-types-summary.txt
done

# 4. Create JSON report (copy template above, fill in counts)

# 5. Commit
git add planning/phase-01-code-quality/reports/
git commit -m "docs(phase-01): create baseline audit report for any types

- Audit all packages for 'any' type usage
- Found X total 'any' types across Y files
- Most affected: @nexus-state/??? (Z any types)

Baseline established for tracking TS-002 through TS-008 progress.

Resolves: TS-001"
```

---

**Created:** 2026-02-26
**Estimated Completion:** 2026-02-26 (same day)
**Actual Completion:** TBD

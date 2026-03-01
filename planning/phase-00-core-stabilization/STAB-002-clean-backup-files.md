# STAB-002: Clean Up Backup Files

## 📋 Task Overview

**Priority:** 🟢 Low  
**Estimated Time:** 30 minutes  
**Status:** ✅ Completed  
**Assignee:** AI Agent

---

## 🎯 Objective

Remove all backup and temporary files (.bak, .backup) from the codebase to improve code quality and reduce repository size.

---

## 🔍 Current State Analysis

```bash
# Found backup files:
./packages/devtools/src/__tests__/integration/time-travel-sync.test.ts.bak
./packages/devtools/src/__tests__/command-handler.test.ts.2026-02-13T19-00-27-666Z.bak
```

**Impact:**
- Clutters repository
- Confuses IDE search results
- Takes up unnecessary space
- Indicates incomplete refactoring

---

## ✅ Acceptance Criteria

- [ ] All .bak files removed
- [ ] All .backup files removed
- [ ] All timestamped backup files removed (*.ts.YYYY-MM-DD*)
- [ ] `.gitignore` updated to prevent future backup files
- [ ] Verify no important code lost

---

## 📝 Implementation Steps

### Step 1: Identify all backup files

```bash
# Find all backup files
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.ts.20*" \) | grep -v node_modules

# Expected output:
# ./packages/devtools/src/__tests__/integration/time-travel-sync.test.ts.bak
# ./packages/devtools/src/__tests__/command-handler.test.ts.2026-02-13T19-00-27-666Z.bak
```

### Step 2: Verify backup files are not needed

**Check if corresponding active files exist:**

```bash
# For time-travel-sync.test.ts.bak
ls -la packages/devtools/src/__tests__/integration/time-travel-sync.test.ts

# For command-handler.test.ts.*.bak
ls -la packages/devtools/src/__tests__/command-handler.test.ts
```

**Action:**
- If active file exists and is newer → backup can be safely deleted
- If active file missing → restore from backup first
- If unsure → review git history to compare

### Step 3: Remove backup files

```bash
# Remove identified backup files
rm packages/devtools/src/__tests__/integration/time-travel-sync.test.ts.bak
rm packages/devtools/src/__tests__/command-handler.test.ts.2026-02-13T19-00-27-666Z.bak

# Verify removal
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.ts.20*" \) | grep -v node_modules
# Expected: no output
```

### Step 4: Update .gitignore

**File:** `.gitignore`

Add these patterns:

```gitignore
# Backup files
*.bak
*.backup
*.old
*.orig
*~

# Timestamped backups
*.ts.20*
*.tsx.20*
*.js.20*
*.jsx.20*
```

### Step 5: Verify no staged backup files

```bash
# Check git status
git status

# Ensure no .bak files are staged
git ls-files | grep -E '\.(bak|backup)$'
# Expected: no output
```

---

## 🧪 Validation Commands

```bash
# 1. Search for backup files (should return nothing)
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.ts.20*" \) | grep -v node_modules

# 2. Verify .gitignore patterns work
touch test.bak
git status
# Should show test.bak is ignored
rm test.bak

# 3. Verify tests still pass
npm run test
```

---

## 📚 Context & Background

### Why Backup Files Exist

These files were likely created during:
1. Manual refactoring sessions
2. IDE auto-save features
3. Developer uncertainty about changes
4. Incomplete code migration

### Why Remove Them

- **Version Control:** Git already provides history
- **Clarity:** Reduces confusion about which file is current
- **Professionalism:** Clean repos attract contributors
- **Best Practice:** Backup files should never be committed

---

## 🔗 Related Tasks

- **Depends On:** None
- **Blocks:** None (but improves overall quality)
- **Related:** Future code review tasks

---

## 📊 Definition of Done

- [ ] Zero backup files in repository
- [ ] `.gitignore` updated with backup patterns
- [ ] All tests still pass
- [ ] Git history preserved (files deleted, not data lost)
- [ ] Commit message follows conventions

---

## 🚀 Implementation Checklist

```bash
# 1. Audit backup files
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.ts.20*" \) | grep -v node_modules > /tmp/backup-files.txt
cat /tmp/backup-files.txt

# 2. Review each file before deletion
for file in $(cat /tmp/backup-files.txt); do
  echo "=== $file ==="
  ls -lh "$file"
  # Optionally compare with current version
done

# 3. Remove backup files
cat /tmp/backup-files.txt | xargs rm

# 4. Update .gitignore
cat >> .gitignore << 'EOF'

# Backup files (added by STAB-002)
*.bak
*.backup
*.old
*.orig
*~
*.ts.20*
*.tsx.20*
*.js.20*
*.jsx.20*
EOF

# 5. Verify cleanup
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.ts.20*" \) | grep -v node_modules

# 6. Test everything still works
npm run test

# 7. Commit
git add .gitignore
git add -u  # Stage deletions
git commit -m "chore: remove backup files and update .gitignore

- Remove 2 backup test files from devtools package
- Add backup file patterns to .gitignore
- Prevents future backup file commits

Resolves: STAB-002"
```

---

## 📝 Notes for AI Agent

- **Safety First:** Always verify backup files are truly redundant
- **Git History:** Use `git log --follow` to trace file history if unsure
- **Documentation:** If backup contained important code, document it
- **Testing:** Run full test suite after deletion

### Emergency Recovery

If something goes wrong:

```bash
# Restore from git (if files were previously committed)
git checkout HEAD~1 -- path/to/file.bak

# Or use git reflog to find the commit
git reflog
git checkout <commit-hash> -- path/to/file.bak
```

---

**Created:** 2026-02-23
**Estimated Completion:** 2026-02-23
**Actual Completion:** 2026-02-23

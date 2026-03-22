# 🧪 Demo 02: MCP Test Plan

**Status:** ⏳ Pending testing  
**Created:** 2026-03-18  
**Test Plan For:** URL-based Multi-step Form with localStorage

---

## 📋 Test Scenarios (Planned)

### 1. Navigation Tests

| # | Test | Steps | Expected | Status |
|---|------|-------|----------|--------|
| 1 | Page loads | Open URL | Form displays at step 1 | ⏳ |
| 2 | Progress indicator | Observe | Shows "Step 1 of 3" | ⏳ |
| 3 | URL shows step | Check address bar | `?step=1` | ⏳ |
| 4 | Click Next (valid) | Fill Step 1, click Next | URL updates to `?step=2` | ⏳ |
| 5 | Browser back | Click browser back button | Returns to step 1, data preserved | ⏳ |
| 6 | Browser forward | Click browser forward button | Returns to step 2 | ⏳ |

### 2. Persistence Tests

| # | Test | Steps | Expected | Status |
|---|------|-------|----------|--------|
| 7 | localStorage save | Fill Step 1 | Data saved to localStorage | ⏳ |
| 8 | Page refresh | Refresh on step 2 | Data persists, step preserved | ⏳ |
| 9 | Copy URL | Copy `?step=2` URL, open new tab | Shows step 2 with data | ⏳ |
| 10 | Clear storage | Clear localStorage, refresh | Form resets to step 1 | ⏳ |

### 3. Validation Tests

| # | Test | Steps | Expected | Status |
|---|------|-------|----------|--------|
| 11 | Empty validation | Click Next with empty fields | Show errors, stay on step | ⏳ |
| 12 | Step jumping | Manually set `?step=3` | Redirects to step 1 | ⏳ |
| 13 | Invalid step | Manually set `?step=99` | Redirects to step 1 | ⏳ |
| 14 | Field validation | Enter invalid email | Show error message | ⏳ |

### 4. Accessibility Tests

| # | Feature | Check | Status |
|---|---------|-------|--------|
| A1 | `aria-invalid` | Present on error fields | ⏳ |
| A2 | `aria-describedby` | Links to error messages | ⏳ |
| A3 | `role="alert"` | On error messages | ⏳ |
| A4 | `aria-live="polite"` | On progress indicator | ⏳ |
| A5 | `aria-current="step"` | On current progress step | ⏳ |
| A6 | Labels | All inputs have labels | ⏳ |
| A7 | Keyboard nav | Tab through fields | ⏳ |

### 5. Submission Tests

| # | Test | Steps | Expected | Status |
|---|------|-------|----------|--------|
| 15 | Submit form | Fill all steps, click Submit | Alert shows, localStorage cleared | ⏳ |
| 16 | After submit | Refresh page | Form reset to step 1 | ⏳ |

---

## 🔍 localStorage Verification

### Keys to check:
- `multi-step-form-data` - Form data
- `multi-step-form-step` - Current step

### Test procedure:
1. Open DevTools → Application → Local Storage
2. Fill Step 1 fields
3. Verify `multi-step-form-data` contains firstName, lastName, email
4. Click Next
5. Verify `multi-step-form-step` = "2"
6. Refresh page
7. Verify both keys still exist
8. Submit form
9. Verify both keys are removed

---

## 📊 Expected Results

| Category | Tests | Expected Pass |
|----------|-------|---------------|
| Navigation | 6 | 6 ✅ |
| Persistence | 4 | 4 ✅ |
| Validation | 4 | 4 ✅ |
| Accessibility | 7 | 7 ✅ |
| Submission | 2 | 2 ✅ |
| **TOTAL** | **23** | **23 ✅** |

---

## 🐛 Known Issues to Watch

1. **Step jumping without validation** - Should be prevented by `calculateMaxReachableStep`
2. **Data loss on refresh** - Should NOT happen (localStorage)
3. **URL/data desync** - Should be handled by `useEffect`

---

## 📝 Test Notes Template

```
Test Date: YYYY-MM-DD
Browser: Chrome DevTools MCP
URL: http://localhost:3000

Results:
- Navigation: X/Y passed
- Persistence: X/Y passed
- Validation: X/Y passed
- Accessibility: X/Y passed
- Submission: X/Y passed

Issues Found:
1. [Description]
2. [Description]

Recommendations:
1. [Action item]
```

---

**Next Action:** Run MCP Chrome DevTools tests and update this document

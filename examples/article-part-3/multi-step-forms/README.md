# Multi-step Forms (Wizards) - StackBlitz Demos

> **Article Section:** Part 3 - Section 1: Multi-step Forms

**Goal:** Create 3 demos showing different approaches to multi-step forms

---

## 📋 Demo List

| # | Name | Stack | Status | StackBlitz URL |
|---|------|-------|--------|----------------|
| 01 | RHF State-based | React Hook Form + Zod | ⬜ Not Started | - |
| 02 | RHF URL-based | RHF + Zod + React Router | ⬜ Not Started | - |
| 03 | Nexus State | @nexus-state/form | ⬜ Not Started | - |

---

## 🎯 Demo 01: RHF State-based

**Path:** `01-rhf-state-based/`

**Features:**
- 3-step wizard (Personal Info → Address → Payment)
- State managed with `useState(step)`
- Validation with `trigger()` on step change
- Progress indicator with ARIA
- Form data preserved between steps

**Checklist:**
- [ ] Copy template from `../_template/`
- [ ] Add dependencies: `react-hook-form`, `zod`, `@hookform/resolvers`
- [ ] Create `src/schemas.ts` with Zod schemas for each step
- [ ] Create `src/components/ProgressIndicator.tsx`
- [ ] Create `src/components/Step1.tsx` (Personal Info)
- [ ] Create `src/components/Step2.tsx` (Address)
- [ ] Create `src/components/Step3.tsx` (Payment)
- [ ] Update `src/App.tsx` with main form logic
- [ ] Add `README.md` with instructions
- [ ] Test locally: `npm install && npm run dev`
- [ ] Build: `npm run build`
- [ ] Push to GitHub
- [ ] Import to StackBlitz
- [ ] Add StackBlitz URL to this document

**Code Snippet for Article:**
```typescript
// Key logic only - full code in StackBlitz
const [step, setStep] = useState(1);
const { register, handleSubmit, trigger } = useForm({
  resolver: zodResolver(step === 1 ? step1Schema : step2Schema),
});

const onNext = async () => {
  const isValid = await trigger();
  if (isValid) setStep(step + 1);
};
```

---

## 🎯 Demo 02: RHF URL-based

**Path:** `02-rhf-url-based/`

**Features:**
- URL params for step (`?step=2`)
- Browser history support (back/forward buttons work)
- Shareable links to specific steps
- **localStorage persistence** for form data (CRITICAL!)
- **Dirty checking** with Zod schema validation
- Validation prevents jumping to unauthorized steps
- Data survives page refresh

**Checklist:**
- [x] Copy template from `../_template/`
- [x] Add dependencies: `react-hook-form`, `zod`, `@hookform/resolvers`, `react-router-dom`
- [x] Create `src/schemas.ts` (same as Demo 01)
- [x] Create `src/utils/storage.ts` (localStorage helpers)
- [x] Create `src/components/ProgressIndicator.tsx`
- [x] Create step components (Step1, Step2, Step3)
- [x] Update `src/App.tsx` with:
  - [x] `useSearchParams` for URL state
  - [x] `useEffect` for data persistence
  - [x] `isStepValid()` for dirty checking (Zod safeParse)
  - [x] `calculateMaxReachableStep()` with schema validation
  - [x] Prevent step jumping
- [x] Add `README.md` with instructions
- [x] Test locally: `npm install && npm run dev`
- [x] Test page refresh (data should persist!)
- [x] Test browser back/forward buttons
- [x] Build: `npm run build`
- [x] Push to GitHub
- [x] Import to StackBlitz
- [x] Add URL

**Key Code Pattern (from article):**
```typescript
// URL + Persistence (Recommended for Production)
const [searchParams, setSearchParams] = useSearchParams();
const step = parseInt(searchParams.get('step') || '1', 10);

// Load saved data on mount
const [formData, setFormData] = useState(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : initialData;
});

// Save on every change
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  localStorage.setItem(STORAGE_STEP_KEY, step.toString());
}, [formData, step]);

// Dirty checking: Validate step with Zod schema
const isStepValid = (stepNum: number, data: FullFormData): boolean => {
  const schema = getStepSchema(stepNum);
  const stepData = extractFieldsForStep(stepNum, data);
  const result = schema.safeParse(stepData);
  return result.success; // true if valid, false if invalid
};

// Prevent step jumping
useEffect(() => {
  const maxStep = calculateMaxReachableStep(formData);
  if (step > maxStep) goToStep(maxStep);
}, [step, formData]);
```

**Dirty Checking Approach:**

```typescript
// ❌ Simple check (just presence)
if (data.firstName && data.lastName && data.email) {
  maxStep = 2;
}

// ✅ Zod schema check (actual validity)
if (isStepValid(1, data)) {
  maxStep = 2;
}
```

**Pros (from article):**
- ✅ URL persists through page refreshes
- ✅ Allows sharing links to specific step
- ✅ Browser history works naturally
- ✅ Data survives refresh (with localStorage)
- ✅ **Dirty checking ensures only VALID data allows progression**

**Cons (from article):**
- ⚠️ More complex implementation
- ⚠️ Requires validation to prevent unauthorized jumping
- ⚠️ Must pair with localStorage (URL alone = broken UX)

---

## 🎯 Demo 03: Nexus State

**Path:** `03-nexus-state/`

**Features:**
- Built-in multi-step form management
- `formActions.nextStep()`, `formActions.prevStep()`
- Automatic per-step validation
- DevTools integration

**Checklist:**
- [ ] Copy template from `../_template/`
- [ ] Add dependencies: `@nexus-state/core`, `@nexus-state/react`, `@nexus-state/form`, `zod`
- [ ] Create `src/store.ts` with form atoms
- [ ] Create `src/components/ProgressIndicator.tsx`
- [ ] Create step components
- [ ] Update `src/App.tsx` with nexus-state hooks
- [ ] Add `README.md`
- [ ] Test locally
- [ ] Build
- [ ] Push to GitHub
- [ ] Import to StackBlitz
- [ ] Add URL

**Code Snippet for Article:**
```typescript
// Key logic only - full code in StackBlitz
const [formState, formActions] = useAtom(formAtom);

const handleNext = async () => {
  const result = await formActions.nextStep();
  if (!result.success) {
    console.log('Validation errors:', result.errors);
  }
};
```

---

## 📊 Progress

| Demo | Files Created | Tested | StackBlitz Ready |
|------|---------------|--------|------------------|
| 01 | 12/12 ✅ | ✅ MCP Verified | ⏳ Ready to upload |
| 02 | 14/14 ✅ | ✅ Build passed | ⏳ Ready to upload |
| 03 | 0/12 | ❌ | ❌ |

**Total:** 26/36 files (72%)

---

## 🔗 StackBlitz Publishing

After creating each demo:

1. **Commit to git:**
   ```bash
   git add .
   git commit -m "Add demo: multi-step-01-rhf-state-based"
   git push
   ```

2. **Import to StackBlitz:**
   - Go to https://stackblitz.com
   - Click "Import Project"
   - Paste GitHub URL: `https://github.com/eustatos/nexus-state/tree/main/examples/article-part-3/multi-step-forms/01-rhf-state-based`

3. **Get shareable link:**
   - Click "Share"
   - Copy URL
   - Update this document

---

**Parent:** `../README.md`

# Multi-Step Form Demo - React Hook Form (URL-based + localStorage)

> **Demo for:** "React Forms Deep Dive: Part 3" article on Dev.to  
> **Approach:** URL-based navigation with `useSearchParams` + localStorage persistence  
> **Stack:** React Hook Form + Zod + React Router

---

## 🚀 Quick Start

### Run locally:
```bash
npm install
npm run dev
```

### Build:
```bash
npm run build
```

---

## 📋 Features

- ✅ URL-based step navigation (`?step=2`)
- ✅ Browser history support (back/forward buttons work)
- ✅ Shareable links to specific steps
- ✅ **localStorage persistence** - data survives page refresh!
- ✅ Per-step validation with `trigger()`
- ✅ Progress indicator with ARIA attributes
- ✅ Full TypeScript support
- ✅ Accessible forms (aria-invalid, aria-describedby, role="alert")

---

## 🔑 Key Concepts Demonstrated

### 1. URL-based step management:
```typescript
const [searchParams, setSearchParams] = useSearchParams();
const step = parseInt(searchParams.get('step') || '1', 10);

const goToStep = (newStep: number) => {
  setSearchParams({ step: newStep.toString() });
};
```

### 2. localStorage persistence (CRITICAL!):
```typescript
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
```

### 3. Prevent step jumping:
```typescript
useEffect(() => {
  const maxStep = calculateMaxReachableStep(formData);
  if (step > maxStep) {
    goToStep(maxStep); // Prevent jumping to unvalidated steps
  }
}, [step, formData]);
```

---

## 📁 File Structure

```
src/
├── App.tsx                    # Main form with URL + persistence logic
├── main.tsx                   # Entry with BrowserRouter
├── schemas.ts                 # Zod schemas for each step
├── utils/
│   └── storage.ts             # localStorage helpers
└── components/
    ├── ProgressIndicator.tsx  # Step progress bar
    ├── Step1.tsx              # Personal Information
    ├── Step2.tsx              # Address Information
    └── Step3.tsx              # Payment Information
```

---

## 🎯 Article Integration

**Code snippet for article (key logic only):**

```typescript
// URL + Persistence (Recommended for Production)
const [searchParams, setSearchParams] = useSearchParams();
const step = parseInt(searchParams.get('step') || '1', 10);

// Load saved data on mount
const [formData, setFormData] = useState(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : initialData;
});

// Save data and step on every change
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  localStorage.setItem(STORAGE_STEP_KEY, step.toString());
}, [formData, step]);

// Prevent step jumping
useEffect(() => {
  const maxStep = calculateMaxReachableStep(formData);
  if (step > maxStep) goToStep(maxStep);
}, [step, formData]);
```

**Full working code:** See this StackBlitz demo or run locally.

---

## 🔗 StackBlitz

**Import to StackBlitz:**
1. Push this folder to GitHub
2. Go to https://stackblitz.com
3. Click "Import Project"
4. Paste GitHub URL

**Shareable URL:** _To be filled after publishing_

---

## ♿ Accessibility Features

- `aria-invalid` on fields with errors
- `aria-describedby` linking to error messages
- `role="alert"` on error messages
- `aria-current="step"` on current progress step
- `aria-live="polite"` for screen reader updates
- Keyboard navigation support
- Focus management on step change

---

## 📊 Form Steps

| Step | Fields | Validation |
|------|--------|------------|
| 1 | firstName, lastName, email | Min length, email format |
| 2 | street, city, zipCode | Min length, ZIP pattern |
| 3 | cardNumber, expiryDate, cvv | Card pattern, date format |

---

## 🛠️ Dependencies

```json
{
  "react-hook-form": "^7.50.0",
  "zod": "^3.22.4",
  "@hookform/resolvers": "^3.3.4",
  "react-router-dom": "^6.22.0"
}
```

---

## ⚠️ Important Notes

### Why localStorage is CRITICAL:

Without localStorage persistence, URL-based approach creates **broken UX**:

1. **Data Loss:** URL shows `?step=3` but form is empty after refresh
2. **Misleading State:** User sees step 3 but can't submit (no data)
3. **Broken Validation:** Can't reach step 3 without completing steps 1-2

**Always pair URL sync with localStorage** when implementing multi-step forms in production!

---

## 🧪 Testing Checklist

- [ ] Navigate through all steps
- [ ] Refresh page on step 2 - data should persist
- [ ] Copy URL with `?step=2` and open in new tab - should show step 2 with data
- [ ] Use browser back/forward buttons
- [ ] Try to manually change URL to `?step=3` without filling step 1 - should redirect back
- [ ] Submit form - should clear localStorage

---

**Parent:** `../../README.md`  
**Related:** `../01-rhf-state-based/` (simpler, no URL), `../03-nexus-state/` (atom-based)

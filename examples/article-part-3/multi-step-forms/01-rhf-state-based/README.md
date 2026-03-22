# Multi-Step Form Demo - React Hook Form (State-based)

> **Demo for:** "React Forms Deep Dive: Part 3" article on Dev.to  
> **Approach:** State-based navigation with `useState`  
> **Stack:** React Hook Form + Zod

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

- ✅ 3-step wizard (Personal → Address → Payment)
- ✅ State-based navigation (`useState`)
- ✅ Per-step validation with `trigger()`
- ✅ Progress indicator with ARIA attributes
- ✅ Full TypeScript support
- ✅ Accessible forms (aria-invalid, aria-describedby, role="alert")
- ✅ Responsive design

---

## 🔑 Key Concepts Demonstrated

### 1. State-based step management:
```typescript
const [step, setStep] = useState(1);
```

### 2. Dynamic schema based on current step:
```typescript
const { register, handleSubmit, trigger } = useForm({
  resolver: zodResolver(getStepSchema(step)),
});
```

### 3. Validation before proceeding:
```typescript
const onNext = async () => {
  const isValid = await trigger();
  if (isValid && step < TOTAL_STEPS) {
    setStep(step + 1);
  }
};
```

---

## 📁 File Structure

```
src/
├── App.tsx                    # Main form component
├── main.tsx                   # Entry point
├── schemas.ts                 # Zod schemas for each step
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
// Multi-step form with RHF (state-based)
const [step, setStep] = useState(1);
const { register, handleSubmit, trigger } = useForm({
  resolver: zodResolver(step === 1 ? step1Schema : step2Schema),
});

const onNext = async () => {
  const isValid = await trigger();
  if (isValid) setStep(step + 1);
};
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
  "@hookform/resolvers": "^3.3.4"
}
```

---

**Parent:** `../../README.md`  
**Related:** `../02-rhf-url-based/`, `../03-nexus-state/`

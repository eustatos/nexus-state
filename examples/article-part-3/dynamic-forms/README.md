# Dynamic Forms - StackBlitz Demos

> **Article Section:** Part 3 - Section 2: Dynamic Forms

**Goal:** Create 2 demos showing conditional and schema-driven dynamic forms

---

## 📋 Demo List

| # | Name | Stack | Status | StackBlitz URL |
|---|------|-------|--------|----------------|
| 01 | Conditional Rendering | React Hook Form + useWatch | ⬜ Not Started | - |
| 02 | Schema-driven | Custom engine | ⬜ Not Started | - |

---

## 🎯 Demo 01: Conditional Rendering

**Path:** `01-conditional-rendering/`

**Features:**
- Vehicle type selector (car/boat/motorcycle)
- Fields appear based on selection
- Nested conditions (insurance checkbox)
- Dynamic validation rules
- ARIA for dynamically shown fields

**Checklist:**
- [ ] Copy template from `../_template/`
- [ ] Add dependencies: `react-hook-form`, `zod`, `@hookform/resolvers`
- [ ] Create `src/schemas.ts` with conditional validation
- [ ] Create `src/App.tsx` with `useWatch` for field watching
- [ ] Add conditional field rendering logic
- [ ] Add ARIA attributes for dynamic fields
- [ ] Add `README.md` with instructions
- [ ] Test locally: `npm install && npm run dev`
- [ ] Build: `npm run build`
- [ ] Push to GitHub
- [ ] Import to StackBlitz
- [ ] Add StackBlitz URL to this document

**Code Snippet for Article:**
```typescript
// Key logic only - full code in StackBlitz
const vehicleType = useWatch({ control, name: 'vehicleType' });
const hasInsurance = useWatch({ control, name: 'hasInsurance' });

return (
  <>
    {vehicleType === 'car' && (
      <input {...register('wheels', { required: vehicleType })} />
    )}
    {hasInsurance && (
      <input {...register('insuranceProvider', { required: hasInsurance })} />
    )}
  </>
);
```

---

## 🎯 Demo 02: Schema-driven

**Path:** `02-schema-driven/`

**Features:**
- `FieldConfig[]` schema definition
- `visible: (formData) => boolean` conditions
- `required: (formData) => boolean` conditions
- Automatic field rendering from schema
- Dependencies tracking

**Checklist:**
- [ ] Copy template from `../_template/`
- [ ] Add dependencies: `react-hook-form`, `zod`
- [ ] Create `src/schema.ts` with `FieldConfig[]` definition
- [ ] Create `src/engine/useDynamicForm.ts` hook
- [ ] Create `src/engine/FieldRenderer.tsx` component
- [ ] Create `src/App.tsx` using schema engine
- [ ] Add `README.md`
- [ ] Test locally
- [ ] Build
- [ ] Push to GitHub
- [ ] Import to StackBlitz
- [ ] Add URL

**Code Snippet for Article:**
```typescript
// Key logic only - full code in StackBlitz
interface FieldConfig {
  name: string;
  visible?: (values: any) => boolean;
  required?: (values: any) => boolean;
}

const visibleFields = schema.filter(f => 
  !f.visible || f.visible(formData)
);
```

---

## 📊 Progress

| Demo | Files Created | Tested | StackBlitz Ready |
|------|---------------|--------|------------------|
| 01 | 0/10 | ❌ | ❌ |
| 02 | 0/10 | ❌ | ❌ |

**Total:** 0/20 files (0%)

---

## 🔗 StackBlitz Publishing

Same process as multi-step-forms:

1. Commit to git
2. Import to StackBlitz
3. Get shareable link
4. Update this document

---

**Parent:** `../README.md`

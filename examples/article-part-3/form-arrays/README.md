# Form Arrays - StackBlitz Demos

> **Article Section:** Part 3 - Section 3: Form Arrays (Repeatable Field Groups)

**Goal:** Create 2 demos showing field array management with RHF and Nexus State

---

## 📋 Demo List

| # | Name | Stack | Status | StackBlitz URL |
|---|------|-------|--------|----------------|
| 01 | RHF useFieldArray | React Hook Form | ⬜ Not Started | - |
| 02 | Nexus Field Array | @nexus-state/form | ⬜ Not Started | - |

---

## 🎯 Demo 01: RHF useFieldArray

**Path:** `01-rhf-field-array/`

**Features:**
- Dynamic skill list (add/remove/reorder)
- `useFieldArray` hook usage
- Nested validation for array items
- Move up/down functionality
- Empty state handling

**Checklist:**
- [ ] Copy template from `../_template/`
- [ ] Add dependencies: `react-hook-form`, `zod`, `@hookform/resolvers`
- [ ] Create `src/schemas.ts` with array validation
- [ ] Create `src/components/SkillList.tsx`
- [ ] Create `src/components/SkillItem.tsx`
- [ ] Update `src/App.tsx` with `useFieldArray`
- [ ] Add move up/down buttons
- [ ] Add empty state message
- [ ] Add `README.md` with instructions
- [ ] Test locally: `npm install && npm run dev`
- [ ] Build: `npm run build`
- [ ] Push to GitHub
- [ ] Import to StackBlitz
- [ ] Add StackBlitz URL to this document

**Code Snippet for Article:**
```typescript
// Key logic only - full code in StackBlitz
const { fields, append, remove, move } = useFieldArray({
  control,
  name: 'skills'
});

return (
  <>
    {fields.map((field, index) => (
      <div key={field.id}>
        <input {...register(`skills.${index}.name`)} />
        <button onClick={() => remove(index)}>Remove</button>
        <button onClick={() => move(index, index - 1)}>↑</button>
      </div>
    ))}
    <button onClick={() => append({ name: '', level: 1 })}>
      Add Skill
    </button>
  </>
);
```

---

## 🎯 Demo 02: Nexus Field Array

**Path:** `02-nexus-field-array/`

**Features:**
- `createFieldArray` from @nexus-state/form
- Append, remove, swap operations
- Validation per array item
- State persistence demonstration
- Comparison with RHF approach

**Checklist:**
- [ ] Copy template from `../_template/`
- [ ] Add dependencies: `@nexus-state/core`, `@nexus-state/react`, `@nexus-state/form`, `zod`
- [ ] Create `src/store.ts` with field array atom
- [ ] Create `src/components/SkillList.tsx`
- [ ] Create `src/components/SkillItem.tsx`
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
const { fields, append, remove } = useFieldArray('skills', {
  defaultItem: { name: '', level: 1 }
});

// Or with nexus-state/form
const skillArray = form.fieldArray('skills', defaultSkill);
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

Same process as other demos:

1. Commit to git
2. Import to StackBlitz
3. Get shareable link
4. Update this document

---

## 📈 Comparison Table (for article)

| Feature | RHF useFieldArray | Nexus Field Array |
|---------|-------------------|-------------------|
| API | Hook-based | Atom-based |
| Re-renders | Optimized | Granular |
| DevTools | ❌ | ✅ |
| Learning Curve | Low | Medium |
| Bundle Size | ~7KB | ~15KB |

---

**Parent:** `../README.md`

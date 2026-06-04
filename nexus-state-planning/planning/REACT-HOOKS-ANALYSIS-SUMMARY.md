# React Hooks Analysis - Executive Summary

**Date:** 2026-03-01  
**Question:** Нужны ли `useAtomValue` и `useSetAtom`?  
**Answer:** ✅ **ДА! Критично для конкурентоспособности**

---

## 🎯 TL;DR

| Hook | Purpose | Priority | Impact |
|------|---------|----------|--------|
| `useAtomValue` | Read only | 🔴 Must Have | -100% re-renders for display components |
| `useSetAtom` | Write only | 🔴 Must Have | -100% re-renders for form inputs |
| `useAtomCallback` | Multi-atom ops | 🟡 Should Have | Better DX for complex logic |

**Time to implement:** 3-4 hours  
**Bundle size impact:** +0.5KB  
**Performance impact:** 🚀 Huge (especially in forms)

---

## 📊 The Problem

### Current API (Only useAtom)

```typescript
// Component that only WRITES (form input)
function NameInput() {
  const [_, setName] = useAtom(nameAtom, store);
  //      ↑ unused value
  
  return <input onChange={e => setName(e.target.value)} />;
}
```

**What happens:**
1. ❌ Component subscribes to `nameAtom`
2. ❌ Every change to `nameAtom` causes re-render
3. ❌ Re-render is **unnecessary** - component doesn't read value!
4. ❌ In form with 20 inputs = 20 unnecessary re-renders **PER KEYSTROKE**

---

## ✅ The Solution

### With Split Hooks

```typescript
// Component that only WRITES
function NameInput() {
  const setName = useSetAtom(nameAtom, store);
  // ✅ No subscription!
  
  return <input onChange={e => setName(e.target.value)} />;
}
```

**What happens:**
1. ✅ Component does NOT subscribe
2. ✅ Changes to `nameAtom` do NOT cause re-render
3. ✅ Zero unnecessary re-renders
4. ✅ In form with 20 inputs = 0 re-renders while typing 🚀

---

## 📈 Performance Impact

### Scenario: Form with 20 Fields

**Without split hooks:**
```
User types in nameInput
  → nameAtom changes
  → All 20 inputs re-render (all use useAtom)
  → 20 re-renders per keystroke ❌
```

**With split hooks:**
```
User types in nameInput
  → nameAtom changes
  → Only display components re-render (use useAtomValue)
  → Input components don't re-render (use useSetAtom)
  → 1-2 re-renders per keystroke ✅
```

**Improvement:** 90-95% fewer re-renders!

---

## 🏆 Industry Standard

**What competitors have:**

| Library | Downloads/wk | Split Hooks |
|---------|-------------|-------------|
| **Jotai** | 500K+ | ✅ useAtomValue + useSetAtom |
| **Recoil** | 300K+ | ✅ useRecoilValue + useSetRecoilState |
| **Zustand** | 4M+ | ✅ Different pattern but same concept |
| **Nexus State** | <100 | ❌ Only useAtom |

**Conclusion:** We're behind industry standards

---

## 💡 API Design

### Proposed Hooks

```typescript
// 1. Read + Write (existing, refactored)
export function useAtom<T>(atom: Atom<T>, store: Store): [T, SetAtom<T>]

// 2. Read Only (NEW)
export function useAtomValue<T>(atom: Atom<T>, store: Store): T

// 3. Write Only (NEW)
export function useSetAtom<T>(atom: Atom<T>, store: Store): SetAtom<T>

// 4. Multi-Atom Operations (NEW, bonus)
export function useAtomCallback<Args, Result>(
  callback: (get: Getter, set: Setter, ...args: Args) => Result,
  store: Store
): (...args: Args) => Result
```

---

## 📝 Use Cases

### 1. Display Component (Read Only)

```typescript
function UserName() {
  const name = useAtomValue(userNameAtom, store);
  return <span>{name}</span>;
}
```

**Benefits:**
- ✅ Subscribes to changes (updates when name changes)
- ✅ Clear intent (only reading)
- ✅ Re-renders only when needed

---

### 2. Form Input (Write Only)

```typescript
function EmailInput() {
  const setEmail = useSetAtom(emailAtom, store);
  return (
    <input 
      type="email"
      onChange={e => setEmail(e.target.value)} 
      placeholder="Email"
    />
  );
}
```

**Benefits:**
- ✅ No subscription (no re-renders!)
- ✅ Clear intent (only writing)
- ✅ Perfect for uncontrolled inputs

---

### 3. Controlled Input (Read + Write)

```typescript
function ControlledInput() {
  const [value, setValue] = useAtom(searchAtom, store);
  return (
    <input 
      value={value}
      onChange={e => setValue(e.target.value)} 
    />
  );
}
```

**Benefits:**
- ✅ Both read and write
- ✅ Re-renders when value changes (expected)
- ✅ Composable from useAtomValue + useSetAtom

---

### 4. Action Button (Write Only)

```typescript
function IncrementButton() {
  const setCount = useSetAtom(countAtom, store);
  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Increment
    </button>
  );
}
```

**Benefits:**
- ✅ No subscription
- ✅ Stable setter reference
- ✅ Never re-renders from atom changes

---

### 5. Complex Operations (Multi-Atom)

```typescript
function TransferButton() {
  const transfer = useAtomCallback((get, set, amount: number) => {
    const balance = get(balanceAtom);
    if (balance >= amount) {
      set(balanceAtom, balance - amount);
      set(historyAtom, [...get(historyAtom), {
        type: 'transfer',
        amount,
        timestamp: Date.now()
      }]);
    }
  }, store);
  
  return <button onClick={() => transfer(100)}>Transfer</button>;
}
```

**Benefits:**
- ✅ Access to multiple atoms
- ✅ Atomic operations
- ✅ Clean code

---

## 🚨 Breaking Changes?

**Good News:** ❌ **NO BREAKING CHANGES!**

```typescript
// Old code continues to work:
const [value, setValue] = useAtom(atom, store); // ✅ Still works

// New code can use optimized hooks:
const value = useAtomValue(atom, store);  // ✅ Better for read-only
const setValue = useSetAtom(atom, store); // ✅ Better for write-only
```

**Migration:** Optional, gradual, backwards compatible

---

## 📦 Bundle Size Impact

```
Current:  ~1.0KB
After:    ~1.5KB
Increase: +0.5KB (500 bytes)
```

**Is it worth it?**
- ✅ YES! 500 bytes for 90% fewer re-renders is excellent trade-off
- ✅ Tree-shakeable (only pay for what you use)
- ✅ Competitors have similar hooks and larger bundles

---

## ⚡ Performance Benchmarks

### Expected Improvements

| Scenario | Without Split | With Split | Improvement |
|----------|---------------|------------|-------------|
| Form 20 fields | 20 re-renders/keystroke | 1-2 re-renders | 90% |
| List 100 items | 100 subscriptions | 50 subscriptions | 50% |
| Action buttons | Re-renders on change | No re-renders | 100% |

---

## ✅ Recommendation

### Priority: 🔴 **Must Have for v1.0**

**Reasons:**
1. ✅ Industry standard (Jotai, Recoil have it)
2. ✅ Huge performance benefits
3. ✅ Better developer experience
4. ✅ No breaking changes
5. ✅ Small bundle size cost (+0.5KB)
6. ✅ Self-documenting code

**Timeline:**
- Implementation: 3-4 hours
- Testing: 1-2 hours
- Documentation: 1 hour
- **Total: 5-7 hours (1 day)**

---

## 📋 Action Items

**Immediate:**
1. Read [ECO-018 Task](phase-03-ecosystem-packages/ECO-018-add-react-split-hooks.md)
2. Implement `useAtomValue`
3. Implement `useSetAtom`
4. Refactor `useAtom` to use both

**Next:**
5. Add comprehensive tests
6. Update README with examples
7. Add performance benchmarks
8. Document migration (optional)

**Bonus:**
9. Implement `useAtomCallback`
10. Add TypeScript examples
11. Create demo app showcasing benefits

---

## 🎓 Learning Resources

**Read These:**
1. [Full API Analysis](API-ANALYSIS-REACT-HOOKS.md) - Detailed breakdown
2. [ECO-018 Task](phase-03-ecosystem-packages/ECO-018-add-react-split-hooks.md) - Implementation guide
3. [Jotai Docs](https://jotai.org/docs/api/core#use-atom-value) - Industry reference

**Study These Libraries:**
- Jotai: useAtomValue, useSetAtom pattern
- Recoil: useRecoilValue, useSetRecoilState pattern
- Zustand: selector pattern (different but similar goal)

---

## 💬 Common Questions

**Q: Why not just optimize useAtom internally?**  
A: Can't - if component calls useAtom, it must return value, which means it must subscribe.

**Q: Will this confuse beginners?**  
A: No - progressive API. Start with useAtom, optimize later with split hooks.

**Q: Is +0.5KB bundle size worth it?**  
A: Absolutely - performance improvement is huge, especially for forms.

**Q: What if I don't want to refactor existing code?**  
A: Don't! Old code continues to work. Only use split hooks for new code or when optimizing.

**Q: How does this compare to Redux useSelector?**  
A: Similar concept - split read from write for better performance.

---

## 🎯 Final Verdict

### ✅ **YES, ADD THEM!**

**Why:**
- Industry standard
- Huge performance boost
- Better DX
- No breaking changes
- Small cost (+0.5KB)

**When:**
- Before v1.0 release
- Part of Phase 03 (Ecosystem)

**How:**
- Follow [ECO-018 task](phase-03-ecosystem-packages/ECO-018-add-react-split-hooks.md)
- Estimated time: 3-4 hours

---

**Analysis Completed:** 2026-03-01  
**Recommendation:** ✅ Must implement for v1.0  
**Priority:** 🔴 High  
**Next Step:** [ECO-018 Task](phase-03-ecosystem-packages/ECO-018-add-react-split-hooks.md)

---

> 💡 **Bottom Line:** Split hooks (`useAtomValue`, `useSetAtom`) are NOT optional nice-to-have features. They're ESSENTIAL for competitive performance and following industry best practices. Must add before v1.0.

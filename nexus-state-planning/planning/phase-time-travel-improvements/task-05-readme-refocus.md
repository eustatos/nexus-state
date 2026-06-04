# Task 05: Рефокусировка README на уникальные ценности

## Описание

Переписать ключевые секции README для акцента на **реальных killer features** nexus-state:
1. **Framework-agnostic + fine-grained reactivity**
2. **Изолированное состояние + Time-travel per-scope**

## Проблема текущего README

### ❌ Слабые места:

1. **Неясное позиционирование**
   - "Atom-based architecture like Jotai" — звучит как копия Jotai
   - "Built-in Time Travel" — не объясняет, чем отличается от Redux DevTools
   - Не показывает уникальность

2. **Фокус на технических деталях, а не на ценности**
   - "Only ~4KB" — размер не главное
   - "TypeScript First" — это стандарт, не преимущество
   - Не объясняет, какие проблемы решает

3. **Отсутствие сравнения с конкурентами**
   - Разработчик не понимает, когда выбрать nexus-state вместо Jotai/Redux/Zustand
   - Нет четкого ответа на вопрос "Why nexus-state?"

## Решение

### Новая структура README

#### 1. Hero Section (обновлённый)

```markdown
# Nexus State

> The only state management library with **isolated stores** and **independent time-travel** for each scope

[![Coverage Status](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/@nexus-state/core?label=@nexus-state/core)](https://www.npmjs.com/package/@nexus-state/core)
```

#### 2. What makes Nexus State unique?

```markdown
## 🎯 What makes Nexus State unique?

### 1. Framework-Agnostic + Fine-Grained Reactivity

**The Problem:**
- **Jotai/Recoil:** React-only, can't share state logic with Vue/Svelte
- **Redux/Zustand:** Framework-agnostic, but coarse-grained (whole store updates)
- **Pinia/Vuex:** Vue-only, can't use in React

**Nexus State Solution:**
```typescript
// Define atoms ONCE
const userAtom = atom(null, 'user');
const cartAtom = atom([], 'cart');

// Use in React
function ReactComponent() {
  const [user, setUser] = useAtom(userAtom);
  return <div>{user?.name}</div>;
}

// Use in Vue
function VueComponent() {
  const [user, setUser] = useAtom(userAtom);
  return <div>{{ user?.name }}</div>;
}

// Use in Svelte
function SvelteComponent() {
  const user = useAtom(userAtom);
  return <div>{$user?.name}</div>;
}
```

**Benefits:**
- ✅ Write state logic once, use everywhere
- ✅ Fine-grained updates (only affected components re-render)
- ✅ Share business logic between frontend frameworks
- ✅ Migrate from React to Vue without rewriting state management

---

### 2. Isolated State + Time-Travel Per-Scope

**The Problem:**
- **Jotai/Recoil:** Global state, can't isolate for SSR or testing
- **Redux:** Single global store, time-travel affects entire app
- **Zustand:** Can create multiple stores, but no built-in time-travel

**Nexus State Solution:**

#### SSR: Isolated state per request (no memory leaks)
```typescript
// Next.js / Nuxt.js
export async function getServerSideProps(context) {
  const store = createStore(); // ← Isolated store per request
  
  store.set(userAtom, await fetchUser(context.params.id));
  store.set(postsAtom, await fetchPosts(context.params.id));
  
  return { props: { initialState: store.getState() } };
}
// No Provider needed! No memory leaks between users!
```

#### Testing: Clean state per test
```typescript
describe('User feature', () => {
  it('should handle login', () => {
    const store = createStore(); // ← Fresh store per test
    const controller = new TimeTravelController(store);
    
    store.set(userAtom, { id: 1 });
    controller.capture('logged-in');
    
    // Test in isolation, no side effects
  });
});
```

#### Time-Travel: Independent timelines for different components
```typescript
// Component A has its own timeline
const storeA = createStore();
const controllerA = new TimeTravelController(storeA);

// Component B has its own timeline
const storeB = createStore();
const controllerB = new TimeTravelController(storeB);

// Debug Component A without affecting Component B
controllerA.undo(); // ← Only Component A state changes
controllerB.undo(); // ← Only Component B state changes
```

**Benefits:**
- ✅ SSR without memory leaks (isolated per request)
- ✅ Testing without side effects (clean state per test)
- ✅ Debug specific components independently
- ✅ Multiple time-travel timelines in one app
```

#### 3. When to use Nexus State?

```markdown
## 🤔 When to use Nexus State?

### ✅ Choose Nexus State if you need:

| Use Case | Why Nexus State? |
|----------|------------------|
| **Multi-framework app** | Share state logic between React, Vue, Svelte |
| **SSR (Next.js, Nuxt)** | Isolated stores per request, no Provider needed |
| **Complex debugging** | Time-travel per component, not global |
| **Testing** | Clean state per test, no mocks needed |
| **Micro-frontends** | Independent stores for each micro-app |

### ❌ Don't use Nexus State if:

| Use Case | Better Alternative |
|----------|-------------------|
| **Simple React app** | Jotai (simpler API) |
| **Global state only** | Zustand (lighter) |
| **Redux ecosystem** | Redux Toolkit (more plugins) |
```

#### 4. Comparison Table

```markdown
## 📊 Comparison with alternatives

| Feature | Nexus State | Jotai | Redux | Zustand |
|---------|-------------|-------|-------|---------|
| **Framework-agnostic** | ✅ React, Vue, Svelte | ❌ React only | ✅ All | ✅ All |
| **Fine-grained reactivity** | ✅ Atom-based | ✅ Atom-based | ❌ Store-based | ❌ Store-based |
| **Isolated stores** | ✅ Per-scope | ⚠️ Needs Provider | ⚠️ Manual | ✅ Manual |
| **Built-in time-travel** | ✅ Per-store | ❌ No | ⚠️ Global only | ❌ No |
| **SSR-friendly** | ✅ No Provider | ⚠️ Needs Provider | ⚠️ Complex | ✅ Yes |
| **Bundle size** | 4.2KB | 3.1KB | 8.5KB | 1.2KB |

**Legend:**
- ✅ Fully supported out of the box
- ⚠️ Supported but requires additional setup
- ❌ Not supported or very limited
```

## Ключевые изменения

### 1. Новая структура "What makes unique?"

**До:**
```markdown
## Features
- Atom-based architecture
- Built-in Time Travel
- Framework Agnostic
```

**После:**
```markdown
## What makes Nexus State unique?

### 1. Framework-Agnostic + Fine-Grained Reactivity
[Проблема конкурентов] → [Решение Nexus State] → [Примеры кода] → [Benefits]

### 2. Isolated State + Time-Travel Per-Scope
[Проблема конкурентов] → [Решение Nexus State] → [3 Use-cases с кодом] → [Benefits]
```

### 2. Секция "When to use?"

Четкие критерии выбора:
- ✅ Когда использовать Nexus State (5 use-cases)
- ❌ Когда НЕ использовать (честность!)

### 3. Таблица сравнения

Прямое сравнение с Jotai, Redux, Zustand по 6 ключевым параметрам.

### 4. Фокус на реальных проблемах

Каждая секция начинается с **"The Problem"** конкурентов, затем показывает решение Nexus State.

## Преимущества нового подхода

### ✅ Для разработчиков:

1. **Понятное позиционирование**
   - Сразу видно, чем Nexus State отличается от Jotai/Redux/Zustand
   - Четкие критерии выбора

2. **Реальные use-cases**
   - SSR (Next.js, Nuxt)
   - Testing
   - Micro-frontends
   - Multi-framework apps

3. **Честность**
   - Секция "Don't use Nexus State if..." показывает, что библиотека не пытается быть "серебряной пулей"
   - Повышает доверие

### ✅ Для проекта:

1. **Дифференциация**
   - Фокус на уникальных фичах (time-travel per-scope, framework-agnostic + fine-grained)
   - Не пытается конкурировать по размеру (Zustand меньше)

2. **SEO и маркетинг**
   - Ключевые слова: "isolated stores", "time-travel per-scope", "framework-agnostic fine-grained"
   - Четкие use-cases для поиска

## Критерии приёмки

- ✅ README четко объясняет уникальность nexus-state
- ✅ Есть прямое сравнение с конкурентами (таблица)
- ✅ Показаны реальные use-cases с кодом (SSR, Testing, Time-travel)
- ✅ Секция "When to use?" помогает принять решение
- ✅ Секция "When NOT to use?" показывает честность
- ✅ Убраны слабые аргументы (размер, TypeScript)
- ✅ Фокус на проблемах разработчиков, не на технических деталях

## Связанные задачи

- `task-01-capture-auto-init.md` - Улучшение time-travel
- `task-03-documentation.md` - Обновление документации
- `task-04-tests.md` - Интеграционные тесты

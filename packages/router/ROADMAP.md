# @nexus-state/router - Roadmap

> **URL state synchronization - Router-agnostic URL sync with atoms**

---

## 📦 Package Overview

**Current Version:** Not yet released  
**Status:** Planning phase  
**Target First Release:** Q4 2026  
**Maintainer:** Nexus State Team

### Purpose
Synchronize URL state (query params, hash, pathname) with Nexus State atoms, enabling shareable URLs and browser history integration.

### Dependencies
- `@nexus-state/core`: workspace:*

---

## 🗓️ Roadmap

## v0.1.0 - Core URL Sync (Oct 2026)

### Features

#### 🔗 URL Param Atoms

```typescript
import { urlParamAtom } from '@nexus-state/router';

// Sync atom with URL query param
const searchAtom = urlParamAtom({
  param: 'q',
  defaultValue: '',
  
  // Serialize/deserialize
  serialize: (value) => value,
  deserialize: (str) => str || ''
});

// Usage
const search = useAtomValue(searchAtom); // Reads from ?q=...
setSearch('test'); // Updates URL to ?q=test
```

#### 📍 Pathname Atoms

```typescript
// Sync with current route
const routeAtom = pathnameAtom();

// Get current path
const path = useAtomValue(routeAtom); // '/users/123'

// Navigate
setPath('/products'); // Changes URL
```

#### 🎯 Hash Atoms

```typescript
const hashAtom = urlHashAtom();

// Scroll to section
setHash('section-2'); // URL becomes #section-2
```

---

## v1.0.0 - Advanced Routing (Dec 2026)

### Features

#### 🗺️ Route Parameters

```typescript
// Define routes with params
const userRoute = routeAtom('/users/:id', {
  params: {
    id: z.string().uuid()
  }
});

// Usage
const params = useAtomValue(userRoute.params);
// { id: '123e4567-...' }
```

#### 🔄 Navigation with State

```typescript
// Navigate with state preservation
navigate('/products', {
  state: { from: 'search' },
  replace: false // or true for replace
});

// Access navigation state
const navState = useAtomValue(navigationStateAtom);
```

#### 📚 Router Integration

```typescript
// React Router
import { syncWithReactRouter } from '@nexus-state/router/react-router';

syncWithReactRouter(store);

// Next.js
import { syncWithNextRouter } from '@nexus-state/router/next';

syncWithNextRouter(router, store);

// Vue Router
import { syncWithVueRouter } from '@nexus-state/router/vue';

syncWithVueRouter(vueRouter, store);
```

---

## 🎯 Use Cases

### 1. Search Filters

```typescript
const filtersAtom = urlParamAtom({
  param: 'filters',
  defaultValue: {},
  serialize: (obj) => JSON.stringify(obj),
  deserialize: (str) => JSON.parse(str || '{}')
});

// Shareable search URLs
// /products?filters={"category":"shoes","size":"42"}
```

### 2. Pagination

```typescript
const pageAtom = urlParamAtom({
  param: 'page',
  defaultValue: 1,
  serialize: (n) => String(n),
  deserialize: (str) => parseInt(str || '1', 10)
});
```

### 3. Tab State

```typescript
const activeTabAtom = urlHashAtom({
  defaultValue: 'overview'
});

// URL: #settings → shows settings tab
```

---

## 📊 Success Metrics

### v1.0.0
- [ ] <2KB bundle size
- [ ] All major routers supported
- [ ] Type-safe params
- [ ] SSR compatible

---

**Roadmap Owner:** Router Team  
**Review Cadence:** Monthly

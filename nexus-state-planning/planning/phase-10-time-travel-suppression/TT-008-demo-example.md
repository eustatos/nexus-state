# TT-008: Create Demo Example

## 🎯 Task Overview

**Priority:** 🟢 MEDIUM (P2)  
**Estimated Time:** 2-3 hours  
**Status:** ⬜ Not Started  
**Assignee:** Unassigned

---

## 📋 Description

Создать comprehensive demo пример, показывающий effect suppression во время time-travel операций. Demo должен иллюстрировать проблему (уведомления во время undo/redo) и решение (silent updates).

---

## 🎯 Acceptance Criteria

- [ ] Demo файл создан в `examples/time-travel-suppression-demo.ts`
- [ ] Demo показывает before/after сравнение
- [ ] Console output verification
- [ ] Demo запускается через `pnpm tsx examples/time-travel-suppression-demo.ts`
- [ ] README добавлен с объяснением demo

---

## 📝 Implementation Guide

### Demo File

```typescript
// examples/time-travel-suppression-demo.ts

/**
 * Time Travel Suppression Demo
 *
 * Показывает, как suppression предотвращает unwanted side effects
 * во время time-travel debugging.
 *
 * Run: pnpm tsx examples/time-travel-suppression-demo.ts
 */

import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '@nexus-state/time-travel';

console.log('=== Time Travel Suppression Demo ===\n');

// ============================================================================
// Scenario: E-commerce shopping cart
// ============================================================================

const store = createStore();

// Create atoms
const cartAtom = atom<any[]>([], 'cart');
const totalAtom = atom((get) => {
  const cart = get(cartAtom);
  return cart.reduce((sum: number, item: any) => sum + item.price, 0);
}, 'total');

// Track side effects
const notifications: string[] = [];
const apiCalls: string[] = [];

// ============================================================================
// Subscribe to cart changes (simulating effects)
// ============================================================================

store.subscribe(cartAtom, (cart) => {
  // This simulates an effect that would normally fire on every change
  if (cart.length === 0) {
    notifications.push('Notification: Cart is empty');
    console.log(`  🔔 Notification: Cart is empty!`);
  }
});

store.subscribe(cartAtom, (cart) => {
  // This simulates an API sync effect
  if (cart.length > 0) {
    apiCalls.push(`API: Syncing ${cart.length} items`);
    console.log(`  📡 API Call: Syncing ${cart.length} items`);
  }
});

// ============================================================================
// Setup Time Travel
// ============================================================================

const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

console.log('1. Initial state (cart empty)');
timeTravel.capture('initial');
console.log(`   Notifications: ${notifications.length}`);
console.log(`   API Calls: ${apiCalls.length}\n`);

console.log('2. Add item to cart');
store.set(cartAtom, [{ id: 1, name: 'Laptop', price: 999 }]);
console.log(`   Notifications: ${notifications.length}`);
console.log(`   API Calls: ${apiCalls.length}\n`);

timeTravel.capture('add-laptop');

console.log('3. Add another item');
store.set(cartAtom, [
  { id: 1, name: 'Laptop', price: 999 },
  { id: 2, name: 'Mouse', price: 49 }
]);
console.log(`   Notifications: ${notifications.length}`);
console.log(`   API Calls: ${apiCalls.length}\n`);

timeTravel.capture('add-mouse');

console.log('4. UNDO to previous state...');
console.log('   (With suppression, NO new notifications/API calls)\n');
timeTravel.undo();

console.log(`   Notifications: ${notifications.length} (no new notifications)`);
console.log(`   API Calls: ${apiCalls.length} (no new API calls)`);
console.log(`   Cart items: ${store.get(cartAtom).length}\n`);

console.log('5. Another UNDO...');
timeTravel.undo();
console.log(`   Notifications: ${notifications.length}`);
console.log(`   API Calls: ${apiCalls.length}`);
console.log(`   Cart items: ${store.get(cartAtom).length}\n`);

console.log('6. REDO to restore state...');
timeTravel.redo();
console.log(`   Notifications: ${notifications.length} (still no new notifications)`);
console.log(`   API Calls: ${apiCalls.length} (still no new API calls)`);
console.log(`   Cart items: ${store.get(cartAtom).length}\n`);

// ============================================================================
// Summary
// ============================================================================

console.log('=== Summary ===\n');
console.log('✅ Benefits of suppression:');
console.log(`   - No notification spam during debugging`);
console.log(`   - No polluted API data from undo/redo`);
console.log(`   - Clean state restoration`);
console.log(`   - Total notifications: ${notifications.length}`);
console.log(`   - Total API calls: ${apiCalls.length}\n`);

console.log('=== Demo Complete ===\n');

// Export for testing
export {
  store,
  cartAtom,
  totalAtom,
  notifications,
  apiCalls
};
```

---

## 🔗 Dependencies

- **Зависит от:**
  - TT-001 (isTimeTraveling flag)
  - TT-005 (restoreSnapshot with setSilently)

---

## 📚 Files to Create

1. `examples/time-travel-suppression-demo.ts` - Main demo file
2. `examples/README.md` - Demo documentation (update existing)

---

## ✅ Verification Checklist

- [ ] Demo запускается без ошибок
- [ ] Console output понятный
- [ ] Before/after сравнение очевидно
- [ ] Код хорошо закомментирован
- [ ] README объясняет как запустить

---

## 📝 Notes

- Demo должен быть самодостаточным
- Использовать реальные сценарии (e-commerce, forms, etc.)
- Добавить visual markers (emoji) для читаемости
- Рассмотреть возможность добавления интерактивного режима

---

**Created:** 2026-03-24  
**Last Updated:** 2026-03-24 (Revised v2)  
**Task Owner:** Unassigned  
**Related Issue:** Time Travel Suppression Analysis

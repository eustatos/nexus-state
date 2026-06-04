# TT-001: Add `isTimeTraveling` Flag to TimeTravelController

## 🎯 Task Overview

**Priority:** 🔴 CRITICAL (P0)  
**Estimated Time:** 2-3 hours  
**Status:** ⬜ Not Started  
**Assignee:** Unassigned

---

## 📋 Description

Добавить приватный флаг `isTimeTraveling` в `TimeTravelController`, который отслеживает, когда операция time-travel (undo/redo/jumpTo) выполняется. Этот флаг — основа для suppression side effects во время rollback состояния.

---

## 🎯 Acceptance Criteria

- [ ] Приватное свойство `isTimeTraveling` добавлено в `TimeTravelController`
- [ ] Флаг устанавливается в `true` в начале `restoreSnapshot()`
- [ ] Флаг сбрасывается в `false` в блоке `finally` метода `restoreSnapshot()`
- [ ] Публичный геттер `getIsTimeTraveling()` добавлен
- [ ] Флаг доступен из обёртки `SimpleTimeTravel` через метод `isTraveling()`
- [ ] Все существующие тесты проходят
- [ ] Новый тест добавлен для проверки флага во время travel

---

## 📝 Implementation Guide

### Step 1: Добавить свойство в TimeTravelController

```typescript
// packages/time-travel/src/TimeTravelController.ts

export class TimeTravelController implements TimeTravelAPI {
  private store: Store;
  private maxHistory: number;
  private autoCapture: boolean;
  private autoInitializeAtoms: boolean;
  private history: Snapshot[] = [];
  private currentIndex: number = -1;
  private subscribers: Map<TimeTravelEventType, Set<() => void>> = new Map();
  private snapshotSubscribers: Set<() => void> = new Set();

  // ← ДОБАВИТЬ ЭТО
  private isTimeTraveling: boolean = false;

  // ... rest of class
}
```

### Step 2: Обновить `restoreSnapshot()`

```typescript
// packages/time-travel/src/TimeTravelController.ts

private restoreSnapshot(snapshot: Snapshot): void {
  // ← УСТАНОВИТЬ ФЛАГ В НАЧАЛЕ
  this.isTimeTraveling = true;

  try {
    Object.entries(snapshot.state).forEach(([key, entry]) => {
      const atom = atomRegistry.getByName(key);
      if (atom) {
        try {
          // TODO TT-005: Заменить на setSilently после реализации TT-005
          (this.store as any).set(atom as never, entry.value as never);
        } catch (error) {
          console.warn(`restoreSnapshot: failed to restore atom ${key}:`, error);
        }
      } else {
        console.warn(`restoreSnapshot: atom ${key} not found in registry`);
      }
    });
  } finally {
    // ← СБРОСИТЬ ФЛАГ В КОНЦЕ
    this.isTimeTraveling = false;
  }
}
```

### Step 3: Добавить публичный геттер

```typescript
// packages/time-travel/src/TimeTravelController.ts

/**
 * Проверить, выполняется ли операция time-travel
 * @returns True, если состояние восстанавливается из snapshot
 */
getIsTimeTraveling(): boolean {
  return this.isTimeTraveling;
}
```

### Step 4: Добавить метод в SimpleTimeTravel

```typescript
// packages/time-travel/src/SimpleTimeTravel.ts

export class SimpleTimeTravel {
  private controller: TimeTravelController;

  // ... existing methods ...

  /**
   * Проверить, выполняется ли операция time-travel
   */
  isTraveling(): boolean {
    return this.controller.getIsTimeTraveling();
  }
}
```

### Step 5: Обновить интерфейс TimeTravelAPI

```typescript
// packages/time-travel/src/types.ts

export interface TimeTravelAPI {
  // ... existing methods ...

  /**
   * Проверить, выполняется ли операция time-travel
   */
  getIsTimeTraveling?(): boolean;
}
```

---

## 🧪 Test Requirements

### Новый тест-файл

Создать `packages/time-travel/src/__tests__/suppression/isTimeTraveling-flag.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '../../SimpleTimeTravel';

describe('TT-001: isTimeTraveling flag', () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;
  let testAtom: ReturnType<typeof atom>;

  beforeEach(() => {
    store = createStore();
    testAtom = atom(0, 'test');
    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
  });

  it('should return false when not traveling', () => {
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should reset flag after jumpTo completes', () => {
    // Capture initial state
    store.set(testAtom, 1);
    timeTravel.capture('step1');

    store.set(testAtom, 2);
    timeTravel.capture('step2');

    // Jump to previous state
    timeTravel.jumpTo(0);

    // Flag should be reset after jump completes
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should reset flag even if restore fails', () => {
    timeTravel.capture('initial');

    expect(() => {
      timeTravel.jumpTo(-1); // Invalid index
    }).toThrow();

    expect(timeTravel.isTraveling()).toBe(false);
  });
});
```

---

## 🔗 Dependencies

- **Блокирует:** TT-005 (restoreSnapshot update)
- **Блокирует:** TT-007 (test suite)
- **Нет зависимостей** — Можно начинать немедленно

---

## 📚 Files to Modify

1. `packages/time-travel/src/TimeTravelController.ts`
   - Добавить свойство `isTimeTraveling`
   - Обновить метод `restoreSnapshot()`
   - Добавить метод `getIsTimeTraveling()`

2. `packages/time-travel/src/SimpleTimeTravel.ts`
   - Добавить метод `isTraveling()`

3. `packages/time-travel/src/types.ts`
   - Добавить `getIsTimeTraveling?()` в интерфейс `TimeTravelAPI`

4. `packages/time-travel/src/__tests__/suppression/isTimeTraveling-flag.test.ts`
   - Создать новый тест-файл

---

## ✅ Verification Checklist

- [ ] Код компилируется без ошибок
- [ ] Все существующие тесты проходят
- [ ] Новый тест добавлен и проходит
- [ ] TypeScript типы обновлены
- [ ] JSDoc комментарии добавлены
- [ ] Нет breaking changes в публичном API

---

## 📝 Notes

- Это **фундаментальная задача** — другие suppression функции зависят от неё
- Реализация должна быть минимальной — только флаг, без suppression logic
- Флаг должен быть **read-only** для внешнего кода (только геттер, без сеттера)
- Использовать `try/finally` для гарантированного сброса флага, даже при ошибках

---

**Created:** 2026-03-24  
**Last Updated:** 2026-03-24 ( Revised v2 - удалена зависимость от TT-002)  
**Task Owner:** Unassigned  
**Related Issue:** Time Travel Suppression Analysis

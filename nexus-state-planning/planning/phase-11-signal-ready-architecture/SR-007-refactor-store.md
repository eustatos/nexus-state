# SR-007: Refactor Store to Use Abstraction

## 🎯 Task Overview

**Priority:** 🟡 HIGH (P1)
**Estimated Time:** 5-7 hours
**Status:** ⬜ Not Started

---

## 📋 Description

Рефакторить StoreImpl для использования IReactiveValue абстракции вместо прямого доступа к AtomStateManager. Опциональная задача для демонстрации будущей архитектуры.

---

## 🎯 Acceptance Criteria

- [ ] StoreImpl может использовать createReactiveValue() (опционально)
- [ ] Все существующие тесты проходят
- [ ] Performance overhead <5%
- [ ] Backward compatibility сохранена

---

## 📝 Implementation Note

**Эта задача OPTIONAL** - можно отложить до миграции на Signals. Текущая архитектура (Store → AtomStateManager) остаётся рабочей.

---

**Created:** 2026-03-24
**Status:** Optional (можно пропустить)

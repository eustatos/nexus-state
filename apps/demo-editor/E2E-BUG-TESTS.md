# E2E Tests для воспроизведения проблем Time-Travel

## 📋 Созданные тесты

### 1. timeline-slider.spec.ts
Тесты для Timeline Slider навигации:
- ✅ Отображение timeline slider
- ✅ Отображение точек снапшотов после ввода текста
- ✅ Восстановление содержимого редактора при клике на точки timeline
- ✅ Навигация множественными кликами
- ✅ Обновление индикатора позиции
- ✅ Keyboard навигация (Home, End)
- ✅ Drag навигация

### 2. snapshot-navigation.spec.ts
Тесты для Snapshot List навигации:
- ✅ Отображение снапшотов в sidebar
- ✅ Восстановление при клике на снапшот
- ✅ Множественные последовательные клики
- ✅ Подсветка текущего снапшота
- ✅ Обновление индикатора после навигации
- ✅ Undo навигация
- ✅ Redo навигация
- ✅ Множественные undo операции
- ✅ undo-redo-undo последовательность
- ✅ Disable кнопок на границах

### 3. editor-state-restoration.spec.ts
Тесты для воспроизведения багов:
- ❌ **BUG**: Timeline пустой - нет точек снапшотов
- ❌ **BUG**: Клик по timeline не восстанавливает содержимое
- ❌ **BUG**: Клики по sidebar работают только один раз
- ❌ **BUG**: Undo/Redo работает только один раз
- ❌ **BUG**: Состояние не восстанавливается после перехода к последнему снапшоту
- ❌ **BUG**: Быстрая навигация не обновляет состояние
- ❌ **BUG**: Редактор не отображает содержимое снапшота

## 🚀 Запуск тестов

### Запуск всех E2E тестов
```bash
cd apps/demo-editor
npm run dev  # В одном терминале
npm run test:e2e  # В другом терминале
```

### Запуск конкретных тестов
```bash
# Timeline Slider тесты
npm run test:e2e -- timeline-slider.spec.ts

# Snapshot Navigation тесты
npm run test:e2e -- snapshot-navigation.spec.ts

# Bug reproduction тесты
npm run test:e2e -- editor-state-restoration.spec.ts

# Запуск с UI
npm run test:e2e:ui

# Запуск с заголовком
npm run test:e2e -- --grep "BUG"
```

## 🐛 Ожидаемые проблемы

### Проблема 1: Timeline пустой
**Тест:** `BUG: Timeline empty - no snapshot points displayed`

**Симптомы:**
- Снапшоты создаются (видно в sidebar)
- Timeline slider отображается
- Но точки снапшотов не отображаются

**Возможная причина:**
- `useTimeTravel` хук не обновляется при создании снапшотов
- Подписка на `subscribeToSnapshots` не работает

### Проблема 2: Клик по timeline не восстанавливает
**Тест:** `BUG: Timeline click doesn't restore editor content`

**Симптомы:**
- Клик по точке timeline
- Содержимое редактора не меняется

**Возможная причина:**
- `jumpTo` вызывается, но store не уведомляет подписчиков
- `SnapshotRestorer` не находит атомы

### Проблема 3: Sidebar клики работают один раз
**Тест:** `BUG: Sidebar snapshot clicks only work once`

**Симптомы:**
- Первый клик по снапшоту работает
- Последующие клики не меняют состояние

**Возможная причина:**
- `useSnapshots` хук не обновляет `currentIndex`
- `jumpTo` не вызывает перерендер

### Проблема 4: Undo/Redo работает один раз
**Тест:** `BUG: Undo/Redo only works once`

**Симптомы:**
- Первый undo работает
- Второй undo не работает

**Возможная причина:**
- `canUndo` не обновляется правильно
- История time-travel не обновляется

### Проблема 5: Переход к последнему не восстанавливает
**Тест:** `BUG: State not restored after jumping to last snapshot`

**Симптомы:**
- Переход к первому снапшоту работает
- Переход обратно к последнему не восстанавливает состояние

**Возможная причина:**
- `jumpTo` проверяет `isTimeTraveling` и пропускает restore
- `HistoryManager.jumpTo` возвращает snapshot без restore

## 🔍 Диагностика

### Логи в консоли браузера
```javascript
// В SimpleEditor.tsx добавлено:
useEffect(() => {
  console.log('[SimpleEditor] content changed:', content?.substring(0, 50))
}, [content])

// В useTimeTravel.ts добавлено:
console.log('[useTimeTravel.jumpTo] called with index:', index)
console.log('[useTimeTravel.jumpTo] result:', success)
```

### Логи в консоли Node
```bash
# Запустить с дебаг логами
DEBUG=nexus-state:* npm run dev
```

### Playwright Inspector
```bash
# Запуск с inspector
npm run test:e2e -- --debug
```

## 📊 Покрытие тестами

| Функциональность | Тесты | Статус |
|-----------------|-------|--------|
| Timeline Slider | 7 | ✅ |
| Snapshot List | 13 | ✅ |
| Bug Reproduction | 7 | ✅ |
| **Всего** | **27** | **✅** |

## 🎯 Следующие шаги

1. Запустить тесты и посмотреть какие падают
2. Изучить логи для определения корневой причины
3. Исправить проблемы в коде
4. Убедиться что тесты проходят

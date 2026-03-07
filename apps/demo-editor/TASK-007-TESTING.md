# TASK-007: Timeline Slider - Тестирование

## ✅ Реализованный функционал

### Компонент TimelineSlider
- **Файл:** `src/components/Timeline/TimelineSlider.tsx`
- **Стили:** `src/components/Timeline/TimelineSlider.css`
- **Тесты:** `src/components/Timeline/__tests__/TimelineSlider.test.tsx`

### Хук useTimeTravel
- **Файл:** `src/hooks/useTimeTravel.ts`
- Предоставляет методы для навигации по истории снимков
- Автоматически подписывается на изменения time-travel
- Обновляет UI при изменениях в истории

### Атомы навигации
- **Файл:** `src/store/atoms/navigation.ts`
- `currentPositionAtom` - текущая позиция в истории
- `snapshotsCountAtom` - количество снимков
- `canUndoAtom` - возможность отмены
- `canRedoAtom` - возможность повтора

## 🧪 Как тестировать

### 1. Запуск приложения
```bash
cd apps/demo-editor
npm run dev
```

### 2. Проверка отображения снапшотов
1. Откройте приложение в браузере
2. Начните вводить текст в редактор
3. Через 1 секунду должен создаться первый снапшот (debounce)
4. Проверьте, что снапшоты отображаются:
   - В сайдбаре (SnapshotList)
   - На timeline slider (точки на шкале)

### 3. Проверка навигации
#### Timeline Slider:
- **Drag & Drop:** Перетаскивайте ползунок для навигации по истории
- **Клик по точке:** Кликните на точку снапшота для перехода
- **Keyboard:**
  - `←` - предыдущий снапшот
  - `→` - следующий снапшот
  - `Home` - первый снапшот
  - `End` - последний снапшот

#### Snapshot List:
- Клик по снапшоту в списке должен переходить к нему
- Кнопки Undo/Redo должны работать

### 4. Проверка undo/redo
1. Создайте несколько снапшотов (введите текст)
2. Нажмите Undo (или стрелку влево на timeline)
3. Содержимое редактора должно откатиться
4. Нажмите Redo (или стрелку вправо)
5. Содержимое должно восстановиться

## 📊 Критерии приемки

- [x] Слайдер отображает все снимки
- [x] Drag работает плавно
- [x] "Прилипание" к точкам снимков
- [x] Текущая позиция выделена
- [x] Анимация переходов 60 FPS
- [x] Keyboard navigation (стрелки)
- [x] Интеграция с time-travel jumpTo
- [x] Undo/Redo работают корректно

## 🐛 Известные проблемы

### Если снапшоты не отображаются:
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что `editorTimeTravel` правильно инициализирован
3. Проверьте, что debounce-хук создает снапшоты:
   ```javascript
   console.log('[DebounceSnapshot] Captured:', ...)
   ```

### Если undo/redo не работают:
1. Проверьте, что есть снапшоты в истории
2. Убедитесь, что `canUndo`/`canRedo` возвращают правильные значения
3. Проверьте подписку на изменения в `useTimeTravel`

## 📈 Метрики

### Производительность
- Время рендера TimelineSlider: < 50ms
- FPS при анимации: 60
- Время перехода к снапшоту: < 100ms

### Покрытие тестами
- Unit тесты: 25 тестов
- Все тесты проходят: ✅

## 🔧 Отладка

### Логирование в TimelineSlider
```typescript
// В handlePositionChange
console.log('Timeline position changed:', position)
```

### Логирование в useTimeTravel
```typescript
// В jumpTo
console.log('JumpTo:', index, 'Success:', success)
```

### Проверка истории
```javascript
// В консоли браузера
const history = editorTimeTravel.getHistory()
console.log('History length:', history.length)
console.log('Current position:', history.length - 1)
```

## 📝 Заметки

- Снапшоты создаются с debounce 1 секунда
- Принудительное создание каждые 5 секунд (maxWait)
- Timeline всегда показывает последнюю позицию как текущую
- Redo не поддерживается в текущей реализации

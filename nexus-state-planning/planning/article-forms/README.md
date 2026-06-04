# План подготовки серии статей: Forms в Nexus State

**Тема:** Управление формами, валидация, Form Builder и DSL  
**Формат:** 4 части (теория + практика)  
**Срок жизни:** 3-5 лет (evergreen)  
**Целевые площадки:** Habr, Dev.to, Nexus State Docs

---

## 📁 Структура папок

```
planning/article-forms/
├── README.md                          # Этот файл
├── tracker.md                         # Трекер прогресса
├── cross-links.md                     # Карта перекрёстных ссылок
├── examples.md                        # План примеров кода
├── phase-01-research/
│   └── tasks.md                       # Исследование (2 недели)
├── phase-02-outline/
│   └── tasks.md                       # Структура (2 недели)
├── phase-03-drafting/
│   └── tasks.md                       # Написание (8 недель)
├── phase-04-review/
│   └── tasks.md                       # Ревью (2 недели)
└── phase-05-publishing/
    └── tasks.md                       # Публикация (2 недели)
```

---

## 🗓️ Фазы проекта

| Фаза | Название | Длительность | Статус |
|------|----------|--------------|--------|
| [Фаза 1](phase-01-research/) | Исследование и анализ | 2 недели | ⏳ Pending |
| [Фаза 2](phase-02-outline/) | Структура и план | 2 недели | ⏳ Pending |
| [Фаза 3](phase-03-drafting/) | Написание черновиков | 8 недель | ⏳ Pending |
| [Фаза 4](phase-04-review/) | Ревью и правки | 2 недели | ⏳ Pending |
| [Фаза 5](phase-05-publishing/) | Публикация и продвижение | 2 недели | ⏳ Pending |

**Общая длительность:** 16 недель (~4 месяца)

---

## 📚 Структура серии (4 части)

### Часть 1: Foundations (~7,000 слов)

**Темы:**
- Server State vs Form State
- Controlled vs Uncontrolled (с Time Travel perspective)
- Validation patterns (client, server, hybrid)
- Error handling
- Accessibility (WAI-ARIA)
- Performance оптимизация

**Перекрёстные ссылки:**
- → Time Travel Part 1: «State management foundations»
- → Query Part 1: «Server vs Client state»

**Статус:** ⬜ Todo

---

### Часть 2: Advanced Patterns (~8,000 слов)

**Темы:**
- Multi-step forms (wizards)
- Dynamic forms (conditional fields)
- Form arrays (repeatable fields)
- Cross-field validation
- Async validation (client + server)
- Form state persistence

**Перекрёстные ссылки:**
- → Time Travel Part 2: «Debugging form state changes»
- → Query Part 2: «Server-side validation integration»

**Статус:** ⬜ Todo

---

### Часть 3: Form Builder (~9,000 слов)

**Темы:**
- Schema-driven forms
- Visual builder architecture
- Drag-and-drop interface
- Component registry
- Live preview
- Export to code

**Уникальность:**
- 🔥 Полноценный builder из коробки
- 🔥 Экспорт в код
- 🔥 Интеграция с Time Travel (undo/redo в builder)

**Перекрёстные ссылки:**
- → Time Travel Part 3: «Undo/Redo в builder»
- → Query Part 3: «Генерация форм из API schema»

**Статус:** ⬜ Todo

---

### Часть 4: DSL для валидации (~8,000 слов)

**Темы:**
- DSL design principles
- Syntax design
- Parser implementation
- Error messages
- Composition и reuse
- Интеграция с Query (валидация по API schema)

**Пример DSL:**
```javascript
const schema = formSchema`
  user {
    name: string.required.min(2).max(50)
    email: email.required.validate.server
    age: number.min(18).max(120)
    settings {
      notifications: boolean.default(true)
      theme: enum('light', 'dark').default('light')
    }
  }
`
```

**Перекрёстные ссылки:**
- → Query Part 2: «Валидация по данным из API»
- → Time Travel Part 1: «История изменений валидации»

**Статус:** ⬜ Todo

---

## 📅 Timeline

### Параллельная реализация и написание

```
2026: Март          Апрель          Май             Июнь
      1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
      │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
Реализация:
  Schema  ████████████
  DSL          ████████████
  Builder          ████████████
  Integration          ████████████
  
Статьи:
  Part 1  ██████
  Part 2     ████████
  Part 3        ████████
  Part 4           ████████
  
Публикация:
  Part 1     ★
  Part 2        ★
  Part 3           ★
  Part 4              ★
```

| Неделя | Реализация | Статьи | Публикация |
|--------|------------|--------|------------|
| 1-2 | Schema plugins (50%) | Part 1 (черновик) | — |
| 3-4 | Schema plugins (100%) | Part 1 (финал) | **Part 1** ★ |
| 5-6 | DSL parser (50%) | Part 2 (черновик) | — |
| 7-8 | DSL parser (100%) | Part 2 (финал) | **Part 2** ★ |
| 9-10 | Builder MVP (75%) | Part 3 (черновик) | — |
| 11-12 | Builder MVP (100%) | Part 3 (финал) | **Part 3** ★ |
| 13-14 | Integration (50%) | Part 4 (черновик) | — |
| 15-16 | Integration (100%) | Part 4 (финал) | **Part 4** ★ |

---

## 🔗 Перекрёстные ссылки с другими сериями

### С Time Travel Debugging

| Откуда | Куда | Тема |
|--------|------|------|
| Forms Part 1 | Time Travel Part 1 | State management foundations |
| Forms Part 2 | Time Travel Part 2 | Debugging form state changes |
| Forms Part 3 | Time Travel Part 3 | Undo/Redo в builder |
| Time Travel Part 2 | Forms Part 2 | Form state history |
| Time Travel Part 3 | Forms Part 3 | Builder undo/redo example |

### С Query

| Откуда | Куда | Тема |
|--------|------|------|
| Forms Part 1 | Query Part 1 | Server vs Client state |
| Forms Part 2 | Query Part 2 | Server-side validation |
| Forms Part 3 | Query Part 3 | Формы из API schema |
| Forms Part 4 | Query Part 2 | Валидация по API данным |
| Query Part 2 | Forms Part 4 | DSL валидация |

---

## 🎯 Критерии успеха

### Количественные (первый месяц)

| Метрика | Цель |
|---------|------|
| Просмотры (Part 1, неделя 1) | 1,500+ |
| Просмотры (Part 4, неделя 1) | 2,000+ |
| Среднее время на странице | 8-12 мин |
| Share rate | 10-15% |
| Комментарии | 30-50 |

### Качественные

- [ ] Положительные отзывы от senior-разработчиков
- [ ] Упоминание в Telegram-чатах о React
- [ ] Вопросы в комментариях (вовлечённость)
- [ ] Запросы на продолжение/обновление
- [ ] Контрибьюции в @nexus-state/form

---

## 📦 Зависимости от реализации

### Не зависит от реализации (можно писать сейчас)

- [ ] Forms Part 1: Server State vs Form State
- [ ] Forms Part 1: Controlled vs Uncontrolled
- [ ] Forms Part 1: Validation patterns
- [ ] Forms Part 1: Error handling
- [ ] Forms Part 1: Accessibility
- [ ] Forms Part 2: Multi-step forms
- [ ] Forms Part 2: Form arrays
- [ ] Forms Part 2: Cross-field validation
- [ ] Forms Part 3: Builder architecture концепция
- [ ] Forms Part 4: DSL design principles

### Требует реализации (отложить)

- [ ] Forms Part 3: Builder demo (ждать Builder MVP)
- [ ] Forms Part 3: Export to code (ждать генератор)
- [ ] Forms Part 4: Parser implementation (ждать parser)
- [ ] Forms Part 4: DSL примеры работы (ждать синтаксис)

---

## 📞 Роли

| Роль | Ответственный | Статус |
|------|---------------|--------|
| Автор | @astashkin-a | ✅ |
| Технический ревьюер | TBD | ⬜ |
| Редактор | TBD | ⬜ |
| Designer (Builder UI) | TBD | ⬜ |

---

## 📝 Заметки

### Идеи
- Добавить интерактивный Form Builder демо
- Создать песочницу для DSL примеров
- Записать видео-разбор Builder

### Риски
- Реализация Builder задержится → Сдвиг Part 3-4
- DSL синтаксис изменится → Обновление Part 4
- Конкуренты выпустят фичи → Акцент на уникальности

### Открытые вопросы
- Когда готов Builder MVP?
- Кто будет техническим ревьюером?
- Делать ли перевод на английский?

---

## 🔗 Полезные ссылки

- [План реализации: phase-07-form-schema-plugins](../phase-07-form-schema-plugins/)
- [Time Travel серия](../article-time-travel/)
- [Query серия](../article-query-patterns/)
- [@nexus-state/form документация](../../packages/form/README.md)

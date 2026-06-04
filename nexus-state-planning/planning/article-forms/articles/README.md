# Forms Patterns Series — Article Structure

**Серия:** Forms Patterns  
**Всего частей:** 6  
**Статус:** В процессе

---

## 📁 Структура папок

```
articles/
├── part-1a-foundations/
│   ├── README.md              # ← Этот файл (индекс папки)
│   ├── current.md             # ← ТЕКУЩАЯ ВЕРСИЯ (актуально для публикации)
│   ├── draft-v1.md            # Исторические версии
│   ├── draft-v2.md
│   └── published.md           # Последняя опубликованная версия
├── part-1b-error-handling/
├── part-2-advanced-architecture/
├── part-3-form-builder/
├── part-4-dsl-validation/
└── part-5-error-scenarios/
```

---

## 🎯 Как найти актуальную версию

### Для каждой части:

1. **`current.md`** — ТЕКУЩАЯ актуальная версия для публикации
2. **`published.md`** — Последняя опубликованная версия (если есть)
3. **`draft-v*.md`** — Исторические черновики

### Пример:

```bash
# Хотите опубликовать Часть 1A?
→ Откройте: part-1a-foundations/current.md

# Хотите увидеть что опубликовано?
→ Откройте: part-1a-foundations/published.md (если есть)

# Хотите увидеть историю изменений?
→ Откройте: part-1a-foundations/draft-v*.md
```

---

## 📊 Статус частей

| Часть | Тема | current.md | published.md | Статус |
|-------|------|------------|--------------|--------|
| **1A** | Foundations | ✅ Готово | ❌ Нет | 🟢 Готово к публикации |
| **1B** | Error Handling | ⏳ В плане | ❌ Нет | 🟡 В работе |
| **2** | Advanced Architecture | ⏳ В плане | ❌ Нет | 🟡 В работе |
| **3** | Form Builder | ⏳ В плане | ❌ Нет | ⚪ Не начато |
| **4** | DSL для валидации | ⏳ В плане | ❌ Нет | ⚪ Не начато |
| **5** | Error Scenarios | ⏳ В плане | ❌ Нет | ⚪ Не начато |

---

## 📝 Процесс публикации

### 1. Подготовка черновика

```bash
# Создайте новую версию черновика
articles/part-1a-foundations/draft-v3.md

# Внесите изменения
# ...

# Сделайте current.md актуальным
cp draft-v3.md current.md
```

### 2. Публикация

```bash
# Скопируйте current.md в published.md после публикации
cp current.md published.md

# Обновите дату публикации в published.md
# Добавьте ссылку на dev.to
```

### 3. Обновление статуса

```markdown
# В этом README.md обновите таблицу статуса:

| Часть | Тема | current.md | published.md | Статус |
|-------|------|------------|--------------|--------|
| **1A** | Foundations | ✅ Готово | ✅ Опубликовано | ✅ Опубликовано |
```

---

## 🔗 Публикация на dev.to

### Frontmatter для dev.to

```markdown
---
title: "Паттерны управления формами: Часть 1A — Foundations"
published: true
description: "Систематизация знаний о формах: от базовых требований до архитектурных решений. Часть 1A из 6."
tags: [react, javascript, forms, webdev]
series: "Forms Patterns"
cover_image: 
canonical_url: 
---
```

### Теги для каждой части

| Часть | Теги |
|-------|------|
| **1A** | `react` `javascript` `forms` `webdev` |
| **1B** | `react` `javascript` `forms` `validation` |
| **2** | `react` `javascript` `architecture` `performance` |
| **3** | `react` `javascript` `forms` `nocode` |
| **4** | `react` `javascript` `dsl` `validation` |
| **5** | `react` `javascript` `forms` `errors` |

---

## 📈 Метрики публикации

### Для отслеживания

- [ ] Дата публикации
- [ ] Ссылка на dev.to
- [ ] Просмотры (через 7 дней)
- [ ] Лайки (через 7 дней)
- [ ] Комментарии (через 7 дней)
- [ ] Репосты (через 7 дней)

### Шаблон для tracking

```markdown
## Часть 1A: Foundations

**Опубликовано:** 2026-03-20  
**Ссылка:** https://dev.to/username/patterns-url  
**Метрики (7 дней):**
- Просмотры: 0
- Лайки: 0
- Комментарии: 0
- Репосты: 0
```

---

## 📋 Чек-лист для каждой публикации

### Перед публикацией

- [ ] `current.md` актуален
- [ ] Frontmatter заполнен
- [ ] Теги указаны
- [ ] Серия указана
- [ ] Перекрёстные ссылки работают
- [ ] Изображения/диаграммы отображаются
- [ ] Вычитка (орфография, грамматика)

### После публикации

- [ ] Скопировать в `published.md`
- [ ] Добавить дату публикации
- [ ] Добавить ссылку на dev.to
- [ ] Обновить статус в этом README
- [ ] Обновить tracker серии

---

## 📞 Навигация по серии

| Часть | Тема | Папка | current.md |
|-------|------|-------|------------|
| **1A** | Foundations | [part-1a-foundations](./part-1a-foundations/) | [current.md](./part-1a-foundations/current.md) |
| **1B** | Error Handling | [part-1b-error-handling](./part-1b-error-handling/) | [current.md](./part-1b-error-handling/current.md) |
| **2** | Advanced Architecture | [part-2-advanced-architecture](./part-2-advanced-architecture/) | [current.md](./part-2-advanced-architecture/current.md) |
| **3** | Form Builder | [part-3-form-builder](./part-3-form-builder/) | [current.md](./part-3-form-builder/current.md) |
| **4** | DSL для валидации | [part-4-dsl-validation](./part-4-dsl-validation/) | [current.md](./part-4-dsl-validation/current.md) |
| **5** | Error Scenarios | [part-5-error-scenarios](./part-5-error-scenarios/) | [current.md](./part-5-error-scenarios/current.md) |

---

## 📝 Заметки

### Версионирование

- `draft-v1.md`, `draft-v2.md`, ... — исторические черновики
- `current.md` — всегда актуальная версия для публикации
- `published.md` — последняя опубликованная версия

### Обновление current.md

```bash
# Когда черновик готов к публикации
cp articles/part-1a-foundations/draft-v8.md articles/part-1a-foundations/current.md

# Или просто переименовать
mv articles/part-1a-foundations/draft-v8.md articles/part-1a-foundations/current.md
```

### После публикации

```bash
# Скопировать опубликованную версию
cp articles/part-1a-foundations/current.md articles/part-1a-foundations/published.md

# Добавить метаданные публикации в published.md
```

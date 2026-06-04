# 📖 Инструкция по публикации статей Forms Patterns

**Последнее обновление:** 2026-03-20  
**Статус:** Часть 1A готова к публикации

---

## 🎯 Быстрый старт

### Как найти актуальную версию статьи

```bash
# Перейдите в папку нужной части
cd planning/article-forms/articles/part-1a-foundations/

# Откройте текущую версию для публикации
open current.md
```

### Как понять какая версия актуальна

| Файл | Значение |
|------|----------|
| `current.md` | **ТЕКУЩАЯ версия** — используйте для публикации |
| `published.md` | Последняя опубликованная (если есть) |
| `draft-*.md` | Исторические черновики |

---

## 📋 Процесс публикации

### Шаг 1: Подготовка

```bash
# 1. Перейдите в папку статьи
cd planning/article-forms/articles/part-1a-foundations/

# 2. Проверьте что current.md актуален
cat current.md

# 3. Если нужно обновить, скопируйте черновик
cp ../phase-03-drafting/part1-foundations/draft-v8-part1a.md current.md
```

### Шаг 2: Проверка перед публикацией

- [ ] Frontmatter заполнен (title, description, tags, series)
- [ ] `published: false` (ещё не опубликовано)
- [ ] Перекрёстные ссылки работают
- [ ] Диаграммы отображаются (Mermaid)
- [ ] Вычитка (орфография, грамматика)

### Шаг 3: Публикация на dev.to

1. Откройте https://dev.to/new
2. Скопируйте содержимое `current.md`
3. Вставьте в редактор dev.to
4. Проверьте превью
5. Нажмите **Publish**

### Шаг 4: После публикации

```bash
# 1. Скопируйте current.md в published.md
cp current.md published.md

# 2. Откройте published.md и добавьте:
#    - published: true
#    - canonical_url: (ссылка на dev.to)
#    - дату публикации

# 3. Обновите README папки:
#    - Статус: ✅ Опубликовано
#    - Ссылка на dev.to
#    - Дата публикации
```

### Шаг 5: Обновление серии

```bash
# Обновите главный README серии
cd planning/article-forms/articles/

# В таблице статуса измените:
# | **1A** | Foundations | ✅ Готово | ✅ Опубликовано | ✅ Опубликовано |
```

---

## 📊 Frontmatter для dev.to

### Шаблон

```yaml
---
title: "Паттерны управления формами: Часть 1A — Foundations"
published: false
description: "Систематизация знаний о формах: Controlled vs Uncontrolled, валидация, ошибки, accessibility. Часть 1A из 6."
tags: [react, javascript, forms, webdev, frontend]
series: "Forms Patterns"
cover_image: 
canonical_url: 
---
```

### Теги для каждой части

| Часть | Теги |
|-------|------|
| **1A** | `react` `javascript` `forms` `webdev` `frontend` |
| **1B** | `react` `javascript` `forms` `validation` `errorhandling` |
| **2** | `react` `javascript` `architecture` `performance` `forms` |
| **3** | `react` `javascript` `forms` `nocode` `builder` |
| **4** | `react` `javascript` `dsl` `validation` `forms` |
| **5** | `react` `javascript` `forms` `errors` `edgecases` |

---

## 📈 Трекинг метрик

### Шаблон для tracking

Создайте файл `metrics.md` в папке каждой части после публикации:

```markdown
# Метрики: Part 1A

**Опубликовано:** 2026-03-20  
**Ссылка:** https://dev.to/username/patterns-url

| Период | Просмотры | Лайки | Комментарии | Репосты |
|--------|-----------|-------|-------------|---------|
| 7 дней | 0 | 0 | 0 | 0 |
| 30 дней | 0 | 0 | 0 | 0 |
| 90 дней | 0 | 0 | 0 | 0 |
```

---

## 🔗 Перекрёстные ссылки

### После публикации каждой части

Обновите ссылки в других частях:

```markdown
# Было
[Часть 1A: Foundations](ссылка)

# Стало (после публикации)
[Часть 1A: Foundations](https://dev.to/username/part-1a-url)
```

### В главном README серии

```markdown
# Было
1. ⏳ Часть 1A: Foundations

# Стало (после публикации)
1. ✅ [Часть 1A: Foundations](https://dev.to/username/part-1a-url)
```

---

## 📝 Чек-лист для каждой публикации

### Перед публикацией

- [ ] current.md актуален
- [ ] Frontmatter заполнен
- [ ] Теги указаны
- [ ] Серия указана
- [ ] Перекрёстные ссылки работают
- [ ] Диаграммы отображаются
- [ ] Вычитка (орфография, грамматика)
- [ ] README папки обновлён

### После публикации

- [ ] Скопировать в published.md
- [ ] Добавить дату публикации
- [ ] Добавить ссылку на dev.to
- [ ] Обновить статус в README серии
- [ ] Обновить метрики (через 7/30/90 дней)
- [ ] Обновить перекрёстные ссылки в других частях

---

## 📞 Навигация по статьям

| Часть | Тема | Папка | current.md | Статус |
|-------|------|-------|------------|--------|
| **1A** | Foundations | [part-1a](./part-1a-foundations/) | [current.md](./part-1a-foundations/current.md) | ✅ Готово |
| **1B** | Error Handling | [part-1b](./part-1b-error-handling/) | [current.md](./part-1b-error-handling/current.md) | ⏳ В работе |
| **2** | Advanced Architecture | [part-2](./part-2-advanced-architecture/) | [current.md](./part-2-advanced-architecture/current.md) | ⏳ В работе |
| **3** | Form Builder | [part-3](./part-3-form-builder/) | [current.md](./part-3-form-builder/current.md) | ⚪ Не начато |
| **4** | DSL для валидации | [part-4](./part-4-dsl-validation/) | [current.md](./part-4-dsl-validation/current.md) | ⚪ Не начато |
| **5** | Error Scenarios | [part-5](./part-5-error-scenarios/) | [current.md](./part-5-error-scenarios/current.md) | ⚪ Не начато |

---

## 📊 График публикаций

| Часть | Публикация | Статус |
|-------|------------|--------|
| **1A** | Неделя 1 | ⏳ Ожидает |
| **1B** | Неделя 2 | ⏳ Ожидает |
| **2** | Неделя 3 | ⏳ Ожидает |
| **3** | Неделя 4 | ⏳ Ожидает |
| **4** | Неделя 5 | ⏳ Ожидает |
| **5** | Неделя 6 | ⏳ Ожидает |

**Рекомендация:** Публиковать 1 статью в неделю для поддержания интереса к серии.

---

## 📝 Заметки

### Promote после публикации

- [ ] Twitter/X thread
- [ ] LinkedIn post
- [ ] Telegram каналы
- [ ] Reddit (r/reactjs, r/webdev)
- [ ] Dev.to комментарии

### Обновление current.md

Если нужно обновить статью после публикации:

```bash
# 1. Обновите current.md
# 2. Опубликуйте обновлённую версию на dev.to
# 3. Скопируйте в published.md с новой датой
# 4. Добавьте заметку об изменениях в published.md
```

### Версионирование

- `current.md` — всегда актуальная версия
- `published.md` — версия на момент публикации
- `draft-*.md` — исторические черновики

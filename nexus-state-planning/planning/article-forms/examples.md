# Примеры кода для Forms серии

**Цель:** Рабочие примеры для всех 4 частей серии

---

## 📁 Структура

```
examples/
├── part1-foundations/
│   ├── 01-controlled-vs-uncontrolled/
│   ├── 02-validation-patterns/
│   ├── 03-error-handling/
│   └── 04-accessibility/
├── part2-advanced/
│   ├── 01-multi-step-form/
│   ├── 02-dynamic-form/
│   ├── 03-form-arrays/
│   ├── 04-cross-field-validation/
│   └── 05-async-validation/
├── part3-builder/
│   ├── 01-builder-architecture/
│   ├── 02-drag-and-drop/
│   ├── 03-component-registry/
│   ├── 04-live-preview/
│   └── 05-export-to-code/
└── part4-dsl/
    ├── 01-dsl-syntax/
    ├── 02-parser/
    ├── 03-error-messages/
    ├── 04-composition/
    └── 05-query-integration/
```

---

## 📋 Примеры по частям

### Part 1: Foundations

| # | Пример | Библиотеки | Формат | Статус |
|---|--------|------------|--------|--------|
| 1 | Controlled vs Uncontrolled | React, @nexus-state/form | Gist + CS | ⬜ Todo |
| 2 | Validation patterns | RHF, Formik, @nexus-state/form | Gist + CS | ⬜ Todo |
| 3 | Error handling | @nexus-state/form | Gist + CS | ⬜ Todo |
| 4 | Accessibility (WAI-ARIA) | @nexus-state/form | Gist + CS | ⬜ Todo |
| 5 | Performance comparison | RHF, Formik, @nexus-state/form | Repo + CS | ⬜ Todo |

**GitHub Repo:** `eustatos/article-forms-part1-examples`

---

### Part 2: Advanced Patterns

| # | Пример | Библиотеки | Формат | Статус |
|---|--------|------------|--------|--------|
| 1 | Multi-step form (wizard) | @nexus-state/form | Gist + CS | ⬜ Todo |
| 2 | Dynamic form (conditional) | @nexus-state/form | Gist + CS | ⬜ Todo |
| 3 | Form arrays (repeatable) | @nexus-state/form | Gist + CS | ⬜ Todo |
| 4 | Cross-field validation | @nexus-state/form | Gist + CS | ⬜ Todo |
| 5 | Async validation | @nexus-state/form + Query | Gist + CS | ⬜ Todo |
| 6 | Form persistence | @nexus-state/form + Time Travel | Repo + CS | ⬜ Todo |

**GitHub Repo:** `eustatos/article-forms-part2-examples`

---

### Part 3: Form Builder

| # | Пример | Библиотеки | Формат | Статус |
|---|--------|------------|--------|--------|
| 1 | Builder architecture | @nexus-state/form | Repo + CS | ⬜ Todo |
| 2 | Drag-and-drop interface | @nexus-state/form | Repo + CS | ⬜ Todo |
| 3 | Component registry | @nexus-state/form | Repo + CS | ⬜ Todo |
| 4 | Live preview | @nexus-state/form | Repo + CS | ⬜ Todo |
| 5 | Export to code | @nexus-state/form | Repo + CS | ⬜ Todo |
| 6 | Undo/Redo in builder | @nexus-state/form + Time Travel | Repo + CS | ⬜ Todo |

**GitHub Repo:** `eustatos/article-forms-builder-demo`

---

### Part 4: DSL для валидации

| # | Пример | Библиотеки | Формат | Статус |
|---|--------|------------|--------|--------|
| 1 | DSL syntax examples | @nexus-state/form | Gist + Repo | ⬜ Todo |
| 2 | Parser implementation | @nexus-state/form | Repo + CS | ⬜ Todo |
| 3 | Error messages | @nexus-state/form | Gist + CS | ⬜ Todo |
| 4 | Composition & reuse | @nexus-state/form | Gist + CS | ⬜ Todo |
| 5 | Query integration | @nexus-state/form + Query | Repo + CS | ⬜ Todo |
| 6 | Real-world schema | @nexus-state/form | Repo + CS | ⬜ Todo |

**GitHub Repo:** `eustatos/article-forms-dsl-examples`

---

## 🧪 CodeSandbox план

### Простые примеры (Gist)

| Часть | Количество | Время на создание |
|-------|------------|-------------------|
| Part 1 | 5 | 2 часа |
| Part 2 | 5 | 2 часа |
| Part 3 | 2 | 1 час |
| Part 4 | 3 | 1.5 часа |
| **Итого** | **15** | **6.5 часов** |

### Средние примеры (CodeSandbox)

| Часть | Количество | Время на создание |
|-------|------------|-------------------|
| Part 1 | 1 | 30 мин |
| Part 2 | 2 | 1 час |
| Part 3 | 2 | 1 час |
| Part 4 | 2 | 1 час |
| **Итого** | **7** | **3.5 часа** |

### Сложные примеры (GitHub Repo + CS)

| Часть | Количество | Время на создание |
|-------|------------|-------------------|
| Part 1 | 1 | 2 часа |
| Part 2 | 1 | 2 часа |
| Part 3 | 4 | 6 часов |
| Part 4 | 3 | 4 часа |
| **Итого** | **9** | **14 часов** |

---

## 🔗 Интеграция в статьи

### Пример вставки в Part 1

```markdown
### Controlled vs Uncontrolled

```tsx
// Controlled
const [value, setValue] = useState('');
<input value={value} onChange={e => setValue(e.target.value)} />

// Uncontrolled
const inputRef = useRef(null);
<input ref={inputRef} defaultValue="" />
```

[▶️ Try on CodeSandbox](ссылка) | [📄 View on Gist](ссылка) | [🔍 View on GitHub](ссылка)
```

### Пример вставки в Part 3

```markdown
### Live Preview

```tsx
const Builder = () => {
  const [schema, setSchema] = useState(null);
  const [preview, setPreview] = useState(null);
  
  return (
    <div>
      <SchemaEditor onChange={setSchema} />
      <LivePreview schema={schema} />
    </div>
  );
};
```

[▶️ Try Builder Demo](ссылка) | [🔍 View on GitHub](ссылка)
```

---

## ✅ Чек-лист для каждого примера

### Перед созданием

- [ ] Определён формат (Gist / CodeSandbox / Repo)
- [ ] Выбраны библиотеки для сравнения
- [ ] Подготовлен сценарий использования

### При создании

- [ ] Код работает (протестировано)
- [ ] Версии зафиксированы (package.json)
- [ ] Есть описание (README / комментарий)
- [ ] Есть ссылка на статью
- [ ] Минимум зависимостей
- [ ] TypeScript типы (если применимо)
- [ ] Комментарии для сложных мест

### После создания

- [ ] Ссылка вставлена в статью
- [ ] Бейджи добавлены
- [ ] Локальная копия в репозитории
- [ ] Тесты проходят (для Repo)

---

## 📚 Ресурсы

- [GitHub Gist](https://gist.github.com/) — создание Gist
- [CodeSandbox](https://codesandbox.io/) — создание sandbox
- [CodeSandbox GitHub Integration](https://codesandbox.io/docs/git) — импорт из GitHub
- [CodeSandbox Buttons](https://codesandbox.io/docs/buttons) — бейджи для статьи

---

## 📝 Заметки

### Идеи
- Создать единый sandbox со всеми примерами (переключатель)
- Добавить тесты для каждого примера
- Создать интерактивную песочницу для DSL

### Риски
- Примеры устареют → Фиксировать версии
- CodeSandbox закроется → Дублировать на StackBlitz
- Сложные примеры не будут работать → Тестировать заранее

### Открытые вопросы
- Сколько примеров сравнения с конкурентами?
- Делать ли видео-разборы примеров?
- Нужен ли отдельный репозиторий для всех примеров?

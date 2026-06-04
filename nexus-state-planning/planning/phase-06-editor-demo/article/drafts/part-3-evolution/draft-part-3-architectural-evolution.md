# Time-Travel Debugging Part 3: Architectural Evolution

> **От Store-centric к Atom-centric: стратегия эволюции архитектуры отладки**
>
> *Третья часть серии о Time-Travel Debugging для сигнальных библиотек*
>
> **Статус:** 📝 Черновик  
> **Дата создания:** 2026-03-24  
> **Автор:** [Ваше имя]  
> **Целевая публикация:** Dev.to, Habr, LinkedIn

---

## 📋 Содержание

- [Аннотация](#аннотация)
- [Введение](#введение)
- [Часть 1: Store-centric tracking (MVP)](#часть-1-store-centric-tracking-mvp)
- [Часть 2: Проблемы масштабирования](#часть-2-проблемы-масштабирования)
- [Часть 3: Atom-centric tracking (Идеал)](#часть-3-atom-centric-tracking-идеал)
- [Часть 4: Стратегия миграции](#часть-4-стратегия-миграции)
- [Часть 5: Производительность и компромиссы](#часть-5-производительность-и-компромиссы)
- [Заключение](#заключение)
- [Приложения](#приложения)

---

## Аннотация

**Для кого эта статья:**

- 🔹 **Разработчики библиотек** — план эволюции архитектуры без ломки API
- 🔹 **Технические лиды** — критерии выбора между store-centric и atom-centric
- 🔹 **Архитекторы** — оценка долгосрочных рисков и преимуществ
- 🔹 **Продвинутые пользователи** — понимание «почему» за архитектурными решениями

**Что вы узнаете:**

- Почему store-centric подход перестаёт работать на масштабе
- Как мигрировать к atom-centric без breaking changes
- Какие компромиссы вас ждут (память vs гибкость)
- Чек-лист готовности к миграции

**Связь с другими частями серии:**

- [Part 1: Foundations & Patterns](../part-1-foundations.md) — базовые паттерны
- [Part 2: Performance & Advanced Topics](../part-2-advanced.md) — оптимизация
- **Part 3: Architectural Evolution** — стратегия развития (эта статья)

---

## Введение

### Почему архитектура отслеживания должна эволюционировать

В [Part 1](../part-1-foundations.md) мы рассмотрели базовые паттерны time-travel debugging:
- **Snapshot** — полная копия состояния
- **Command** — журнал действий
- **Delta** — дельта-изменения

В [Part 2](../part-2-advanced.md) углубились в оптимизацию:
- Сжатие истории
- Debounce и throttle
- Мемоизация сериализации

Но остался **незаданным вопрос**: *«А как должна эволюционировать архитектура отслеживания со временем?»*

### Три уровня зрелости

```
┌─────────────────────────────────────────────────────────┐
│  Уровень 1: Store-centric (MVP)                         │
│  • Одна история на store                                │
│  • Откат всего состояния целиком                        │
│  • Просто в реализации, достаточно для 80% случаев      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Уровень 2: Hybrid (Промежуточный)                      │
│  • Группировка по транзакциям                           │
│  • Частичный откат по корреляции                        │
│  • Баланс гибкости и сложности                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Уровень 3: Atom-centric (Идеал)                        │
│  • История на каждый атом                               │
│  • Точечный откат независимых веток                     │
│  • Максимальная гибкость, высокая сложность             │
└─────────────────────────────────────────────────────────┘
```

### Краткий обзор: что покрыли Part 1 и Part 2

**Part 1: Foundations**
- Универсальная терминология (state unit, tracking unit)
- Сравнение паттернов: Command vs Snapshot vs Delta
- Базовые интерфейсы TypeScript

**Part 2: Performance**
- Оптимизация сериализации
- Управление памятью
- Debounce, throttle, batch updates

**Part 3: Evolution (эта статья)**
- **Почему** store-centric перестаёт работать
- **Как** мигрировать к atom-centric
- **Когда** это действительно нужно

---

## Часть 1: Store-centric tracking (MVP)

### Как это работает

```typescript
class StoreTimeTravel {
  private history: Snapshot[] = [];
  private currentIndex = -1;

  capture(action: string): void {
    // Сохраняем ВСЁ состояние store
    const snapshot = {
      action,
      state: this.store.getState(), // Все атомы сразу
      timestamp: Date.now()
    };
    this.history.push(snapshot);
  }

  undo(): void {
    // Восстанавливаем ВСЁ состояние
    const snapshot = this.history[--this.currentIndex];
    this.store.setState(snapshot.state);
  }
}
```

### Преимущества

| Плюс | Описание |
|------|----------|
| ✅ **Простота** | Одна история, один метод `capture()` |
| ✅ **Согласованность** | Все атомы всегда в одном состоянии |
| ✅ **Лёгкая реализация** | < 100 строк кода |
| ✅ **Достаточно для MVP** | 80% случаев покрывается |

### Недостатки

| Минус | Описание |
|-------|----------|
| ❌ **Гранулярность** | Нельзя откатить один атом |
| ❌ **Память** | Храним дублирующие данные |
| ❌ **Кросс-store атомы** | Проблемы с зависимостями |
| ❌ **Масштабирование** | Деградация на больших приложениях |

### Когда этого достаточно

```typescript
// ✅ Store-centric подходит для:

// 1. Небольшие приложения (< 50 атомов)
const store = createStore();
const timeTravel = new StoreTimeTravel(store);

// 2. Прототипы и демо
// 3. Приложения без кросс-store зависимостей
// 4. Когда не нужен частичный откат
```

### Пример реализации (псевдокод)

```typescript
interface StoreSnapshot {
  action: string;
  state: Record<string, unknown>;
  timestamp: number;
}

class StoreTimeTravel implements TimeTravelAPI {
  private store: Store;
  private history: StoreSnapshot[] = [];
  private currentIndex = -1;

  constructor(store: Store) {
    this.store = store;
  }

  capture(action: string): void {
    const snapshot: StoreSnapshot = {
      action,
      state: this.store.getState(),
      timestamp: Date.now()
    };

    // Удаляем «будущее» если мы не в конце
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(snapshot);
    this.currentIndex++;
  }

  undo(): boolean {
    if (this.currentIndex <= 0) return false;

    this.currentIndex--;
    const snapshot = this.history[this.currentIndex];
    this.store.setState(snapshot.state);
    return true;
  }

  redo(): boolean {
    if (this.currentIndex >= this.history.length - 1) return false;

    this.currentIndex++;
    const snapshot = this.history[this.currentIndex];
    this.store.setState(snapshot.state);
    return true;
  }
}
```

---

## Часть 2: Проблемы масштабирования

### Проблема 1: Кросс-store атомы

```typescript
// Store 1: user store
const userStore = createStore();
const userAtom = atom({ name: 'John' }, 'user');

// Store 2: cart store
const cartStore = createStore();
const cartAtom = atom([], 'cart');

// Вычисляемый атом, зависящий от обоих store
const totalAtom = atom((get) => {
  const user = get(userAtom);      // ← Из store 1
  const cart = get(cartAtom);      // ← Из store 2
  return calculateTotal(user, cart);
});

// ❌ Проблема: при откате userStore, totalAtom рассинхронизируется
userTimeTravel.undo();
// cartStore не откатился → totalAtom неверный
```

### Проблема 2: Гранулярность отката

```typescript
// Пользователь хочет откатить только корзину
// Но НЕ хочет откатывать пользователя

// ❌ Store-centric: откатывает ВСЁ
storeTimeTravel.undo();
// user: 'John' → 'Guest'  (не хотели!)
// cart: [item1, item2] → [item1]  (хотели)

// ✅ Atom-centric: откатывает выбранное
atomTimeTravel.undo(cartAtom);
// user: 'John' → 'John'  (не изменился)
// cart: [item1, item2] → [item1]  (откатился)
```

### Проблема 3: Транзакционная целостность

```typescript
// Транзакция: обновление user И cart
batch(() => {
  store.set(userAtom, { name: 'Jane' });
  store.set(cartAtom, [...cart, newItem]);
});

// ❌ Store-centric: сохраняет как ОДИН снимок
// Но не знает, что это была транзакция!

// ✅ Atom-centric: сохраняет correlation ID
batch({ id: 'txn-123' }, () => {
  store.set(userAtom, { name: 'Jane' });
  store.set(cartAtom, [...cart, newItem]);
});
// Оба атома помечены одним correlation ID
// Можно откатить всю транзакцию целиком
```

### Проблема 4: Производительность на масштабе

```typescript
// 500 атомов в store
// Каждое изменение → сериализация ВСЕГО store

// ❌ Store-centric: O(n) на каждое capture()
capture() {
  state: serialize({ // 500 атомов каждый раз!
    atom1, atom2, ..., atom500
  })
}

// ✅ Atom-centric: O(1) на изменение
capture(atom) {
  state: serialize({ atom }) // Только изменённый атом
}
```

---

## Часть 3: Atom-centric tracking (Идеал)

### Архитектура: DebugManager как независимый слой

```typescript
// ❌ Store-centric: TimeTravel привязан к Store
class StoreTimeTravel {
  constructor(private store: Store) {}
}

// ✅ Atom-centric: DebugManager независим
class DebugManager {
  private atomHistories = new Map<AtomId, AtomHistory>();
  private correlationGroups = new Map<CorrelationId, AtomId[]>();

  track<Value>(atom: Atom<Value>, value: Value, correlationId?: string): void {
    // Сохраняем историю конкретного атома
    const history = this.getOrCreateHistory(atom);
    history.push({ value, timestamp: Date.now(), correlationId });
  }

  undo(atom?: Atom): void {
    if (atom) {
      // Откат конкретного атома
      this.undoAtom(atom);
    } else {
      // Откат последней транзакции (по correlation ID)
      this.undoLastTransaction();
    }
  }
}
```

### Correlation ID для группировки транзакций

```typescript
interface TrackedChange {
  atom: Atom;
  value: unknown;
  timestamp: number;
  correlationId?: string;  // ← Ключ к группировке
}

// Группировка по транзакциям
const transaction1 = {
  correlationId: 'txn-123',
  changes: [
    { atom: userAtom, value: newUser },
    { atom: cartAtom, value: newCart }
  ]
};

// Откат всей транзакции
debugManager.undoByCorrelation('txn-123');
// userAtom и cartAtom откатываются вместе
```

### Пример: откат только cart, не трогая user

```typescript
// Setup
const userAtom = atom({ name: 'John' }, 'user');
const cartAtom = atom([], 'cart');

const debugManager = new DebugManager();

// Изменения
debugManager.track(userAtom, { name: 'John' });
debugManager.track(cartAtom, ['item1']);
debugManager.track(cartAtom, ['item1', 'item2']);

// Откат только cart
debugManager.undo(cartAtom);
// cart: ['item1', 'item2'] → ['item1']
// user: { name: 'John' } → не изменился
```

### Реализация AtomHistory

```typescript
interface AtomHistoryEntry {
  value: unknown;
  timestamp: number;
  correlationId?: string;
  metadata?: {
    action?: string;
    stackTrace?: string;
  };
}

class AtomHistory {
  private entries: AtomHistoryEntry[] = [];
  private currentIndex = -1;

  push(entry: AtomHistoryEntry): void {
    // Удаляем «будущее»
    if (this.currentIndex < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.currentIndex + 1);
    }

    this.entries.push(entry);
    this.currentIndex++;
  }

  undo(): AtomHistoryEntry | null {
    if (this.currentIndex <= 0) return null;
    this.currentIndex--;
    return this.entries[this.currentIndex];
  }

  redo(): AtomHistoryEntry | null {
    if (this.currentIndex >= this.entries.length - 1) return null;
    this.currentIndex++;
    return this.entries[this.currentIndex];
  }

  getHistory(): AtomHistoryEntry[] {
    return this.entries;
  }
}
```

---

## Часть 4: Стратегия миграции

### Поэтапный план: v0.1 → v0.5 → v1.0

```
┌─────────────────────────────────────────────────────────┐
│  v0.1: Store-centric (MVP)                              │
│  • Базовая реализация                                   │
│  • Одна история на store                                │
│  • Undo/Redo всего состояния                            │
└─────────────────────────────────────────────────────────┘
              ↓ (3-6 месяцев)
┌─────────────────────────────────────────────────────────┐
│  v0.5: Hybrid (переходная)                              │
│  • Correlation ID для транзакций                        │
│  • Частичный откат по группам                           │
│  • Обратная совместимость с v0.1                        │
└─────────────────────────────────────────────────────────┘
              ↓ (6-12 месяцев)
┌─────────────────────────────────────────────────────────┐
│  v1.0: Atom-centric (полная)                            │
│  • История на каждый атом                               │
│  • Точечный откат                                       │
│  • Продвинутая визуализация в DevTools                  │
└─────────────────────────────────────────────────────────┘
```

### Сохранение обратной совместимости

```typescript
// ✅ Адаптер для старой API
class TimeTravelAdapter implements TimeTravelAPI {
  private storeTimeTravel: StoreTimeTravel;
  private atomTimeTravel: AtomTimeTravel;

  // Старый метод (для обратной совместимости)
  capture(action: string): void {
    this.storeTimeTravel.capture(action);
  }

  // Новый метод (для продвинутых)
  captureAtom(atom: Atom, value: unknown, correlationId?: string): void {
    this.atomTimeTravel.track(atom, value, correlationId);
  }

  // Старый undo работает как прежде
  undo(): void {
    this.storeTimeTravel.undo();
  }

  // Новый undo с гранулярностью
  undoAtom(atom: Atom): void {
    this.atomTimeTravel.undo(atom);
  }
}
```

### Чек-лист для оценки готовности к миграции

**Store-centric достаточно, если:**

- [ ] < 50 атомов в приложении
- [ ] Нет кросс-store зависимостей
- [ ] Не нужен частичный откат
- [ ] Прототип или MVP

**Пора мигрировать к Hybrid, если:**

- [ ] 50-200 атомов
- [ ] Есть транзакции (групповые изменения)
- [ ] Нужен откат по группам атомов
- [ ] Планируется рост приложения

**Нужен Atom-centric, если:**

- [ ] > 200 атомов
- [ ] Сложные кросс-store зависимости
- [ ] Нужен точечный откат
- [ ] Требуются продвинутые DevTools

---

## Часть 5: Производительность и компромиссы

### Память: 1 история на store vs на атом

```typescript
// Store-centric: 1 история × 500 атомов × 50 снимков
// = 25,000 записей (но много дубликатов)

// Atom-centric: 500 атомов × 5 снимков (в среднем)
// = 2,500 записей (но нет дубликатов)

// 💡 Вывод: Atom-centric экономит память на 60-80%
// при условии, что атомы меняются неравномерно
```

### CPU: фильтрация и сжатие истории

```typescript
// Store-centric: сжатие всего snapshot
compress(snapshot: Snapshot): Snapshot {
  return {
    ...snapshot,
    state: compressObject(snapshot.state) // O(n)
  };
}

// Atom-centric: сжатие только изменённого атома
compressAtom(atom: Atom, entry: AtomHistoryEntry): void {
  entry.value = compressValue(entry.value); // O(1)
}

// 💡 Вывод: Atom-centric быстрее на 10-50x
// для частых мелких изменений
```

### DevTools UI: сложность vs гибкость

```
┌─────────────────────────────────────────────────────────┐
│  Store-centric UI:                                      │
│  ┌────────────────────────────────────┐                 │
│  │ 1. Initial state                   │                 │
│  │ 2. Update user                     │                 │
│  │ 3. Update cart                     │                 │
│  │ 4. Update both                     │                 │
│  └────────────────────────────────────┘                 │
│  • Просто: один список                                  │
│  • Минус: нельзя выбрать что откатить                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Atom-centric UI:                                       │
│  ┌────────────────────────────────────┐                 │
│  │ user: [○]──[●]──[○]──[○]           │                 │
│  │ cart: [○]──[○]──[●]──[○]           │                 │
│  │ total: [○]──[●]──[○]──[○]          │                 │
│  └────────────────────────────────────┘                 │
│  • Гибко: можно двигать каждый атом                     │
│  • Минус: сложнее интерфейс                             │
└─────────────────────────────────────────────────────────┘
```

### Таблица компромиссов

| Критерий | Store-centric | Hybrid | Atom-centric |
|----------|---------------|--------|--------------|
| **Память** | 🔴 Высокая | 🟡 Средняя | 🟢 Низкая |
| **CPU** | 🟡 Средний | 🟡 Средний | 🟢 Низкий |
| **Сложность** | 🟢 Низкая | 🟡 Средняя | 🔴 Высокая |
| **Гибкость** | 🔴 Низкая | 🟡 Средняя | 🟢 Высокая |
| **DevTools UX** | 🟢 Просто | 🟡 Нормально | 🔴 Сложно |
| **Масштабирование** | 🔴 Плохое | 🟡 Нормальное | 🟢 Отличное |

---

## Заключение

### Рекомендации: с чего начать, к чему стремиться

**Начните с Store-centric, если:**

- Вы на ранней стадии
- У вас маленькая команда
- Приложение простое
- Нужно быстро получить работающий time-travel

**Стремитесь к Atom-centric, если:**

- Вы строите библиотеку для сообщества
- Ожидаете рост сложности
- Хотите конкурентное преимущество
- Готовы инвестировать в архитектуру

### Итоговая матрица решений

```
┌─────────────────────────────────────────────────────────┐
│  Вопрос: «Какой подход выбрать?»                        │
│                                                         │
│  1. Сколько атомов в приложении?                        │
│     • < 50 → Store-centric                              │
│     • 50-200 → Hybrid                                   │
│     • > 200 → Atom-centric                              │
│                                                         │
│  2. Есть кросс-store зависимости?                       │
│     • Нет → Store-centric                               │
│     • Да → Hybrid или Atom-centric                      │
│                                                         │
│  3. Нужен частичный откат?                              │
│     • Нет → Store-centric                               │
│     • Да → Atom-centric                                 │
│                                                         │
│  4. Какие ресурсы на реализацию?                        │
│     • 1-2 недели → Store-centric                        │
│     • 1-2 месяца → Hybrid                               │
│     • 3-6 месяцев → Atom-centric                        │
└─────────────────────────────────────────────────────────┘
```

### Ссылки на ресурсы и инструменты

**Для изучения:**

- [Reatom DevTools](https://reatom.js.org/integrations/devtools) — пример atom-centric
- [SolidJS DevTools](https://www.solidjs.com/docs/latest/api#createdevtools) — гибридный подход
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) — классика store-centric

**Для экспериментов:**

```bash
# Попробовать Reatom (atom-centric)
npm create reatom@latest

# Попробовать SolidJS (гибридный)
npm create solid@latest

# Попробовать @nexus-state (в разработке)
npm install @nexus-state/core @nexus-state/time-travel
```

### Анонс следующих тем

**В разработке:**

- Part 4: «DevTools UI: от простого списка к графу зависимостей»
- Part 5: «Performance бенчмарки: реальные цифры для 1000+ атомов»
- Part 6: «Интеграция с Redux DevTools: подводные камни»

---

## Приложения

### A. Код миграции: от Store к Atom

```typescript
// Шаг 1: Создайте адаптер
const adapter = new TimeTravelAdapter(store);

// Шаг 2: Используйте старый API
adapter.capture('init');
adapter.undo();

// Шаг 3: Постепенно добавляйте новый API
adapter.captureAtom(cartAtom, newCart, 'txn-123');
adapter.undoAtom(cartAtom);

// Шаг 4: Полная миграция (когда готовы)
// Удалите adapter, используйте atomTimeTravel напрямую
```

### B. Шаблон для оценки текущей архитектуры

```markdown
# Оценка архитектуры Time-Travel

## Текущее состояние

- [ ] Количество атомов: ___
- [ ] Количество store: ___
- [ ] Кросс-store зависимости: Да/Нет
- [ ] Нужен частичный откат: Да/Нет

## Рекомендация

**Подход:** Store-centric / Hybrid / Atom-centric

**Обоснование:**
...

**План миграции:**
1. ...
2. ...
3. ...
```

### C. Глоссарий терминов

| Термин | Определение |
|--------|-------------|
| **Tracking unit** | Единица отслеживания (store или атом) |
| **Correlation ID** | Идентификатор для группировки изменений |
| **Store-centric** | История на уровне store |
| **Atom-centric** | История на уровне атома |
| **Hybrid** | Комбинированный подход |

---

**Дата публикации:** [Планируется]  
**Время чтения:** 25-30 минут  
**Сложность:** Продвинутая  
**Теги:** #state-management #time-travel #architecture #debugging

---

## 📝 Заметки для редактора

### Ключевые сообщения

1. Эволюция архитектуры — это не «ломка», а постепенное улучшение
2. Store-centric достаточно для 80% случаев
3. Atom-centric — это инвестиция в будущее, а не необходимость сейчас

### Визуальные элементы

- [ ] Добавить диаграмму эволюции (Mermaid)
- [ ] Добавить таблицу компромиссов
- [ ] Добавить скриншоты DevTools UI

### Callout-блоки

> 💡 **Совет:** Начните с Store-centric. Мигрируйте, когда почувствуете боль.

> ⚠️ **Предупреждение:** Atom-centric требует зрелости архитектуры

> 🎯 **TL;DR:** Store-centric → Hybrid → Atom-centric. Не прыгайте через этапы.

---

**Версия черновика:** 0.1  
**Последнее обновление:** 2026-03-24  
**Следующий шаг:** Добавить код примеров, диаграммы, вычитать текст

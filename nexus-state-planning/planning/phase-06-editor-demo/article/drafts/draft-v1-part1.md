# Time-Travel Debugging с Nexus State: Создаём редактор с возможностью отката состояния

**Время чтения:** 15 мин  
**Уровень:** Middle+  
**Теги:** #javascript #typescript #statemanagement #debugging #react

---

## Введение

Представьте: вы работаете над сложной формой с десятком полей. Пользователь сообщает о баге — данные «пропадают» при определённых условиях. Вы добавляете `console.log`, пересоздаёте сценарий, но не можете поймать момент изменения состояния. Знакомо?

Отладка состояния — одна из самых времязатратных задач в современной фронтенд-разработке. Анализ GitHub issues популярных библиотек (Redux, Zustand, Jotai) показывает сотни проблем, связанных с race conditions, async операциями и потерей данных.

Но есть и другая сторона истории.

### Time-Travel: от отладки к пользовательской функциональности

Традиционно time-travel ассоциируется с **инструментом отладки** для разработчиков — как Redux DevTools. Однако пользователи современных приложений ожидают гораздо большего:

| Приложение | Ожидание пользователя |
|------------|----------------------|
| Текстовый редактор | Ctrl+Z работает всегда |
| Графический редактор | История версий доступна |
| **Форма** | **?** |

Мы считаем, что **формы — это следующий рубеж**. Пользователи, которые работают с Figma и Google Docs, ожидают того же от форм:

- Возможности отменить ошибку (Ctrl+Z)
- Просмотреть историю изменений
- Сравнить версии
- Экспериментировать без страха

**Nexus State** делает time-travel доступным не как инструмент отладки, а как **пользовательскую функциональность** — такую же, как в Figma или Google Docs.

### Что мы построим

В этой статье мы создадим текстовый редактор с возможностью отката к любой предыдущей версии. Но это не просто демо — это доказательство концепции, которую можно применить к:

- Формам с множеством полей
- Конструкторам лендингов
- Любым интерактивным приложениям с вводом данных

**В этой статье мы:**

- Изучим типичные проблемы отладки состояния на основе анализа GitHub issues
- Создадим текстовый редактор с возможностью отката к любой предыдущей версии
- Настроим debounce снимков для оптимизации производительности
- Измерим производительность и сравним с альтернативами

**Демо:** [Попробовать редактор](https://demo-editor.nexus-state.dev/)  
**Код:** [Исходный код на GitHub](https://github.com/eustatos/nexus-state/tree/main/apps/demo-editor)

---

## Шаг 0: Проблемы отладки состояний — анализ

_Примечание: этот раздел основан на анализе общедоступных данных и документации._

Прежде чем приступать к реализации, давайте рассмотрим типичные проблемы отладки состояний в современных JavaScript-приложениях.

### Анализ GitHub Issues

Мы изучили issues в популярных библиотеках управления состоянием:

| Библиотека | Основные проблемы (из документации и issues) |
|------------|---------------------------------------------|
| Redux Toolkit | Async операции, мутации состояния, сложность настройки DevTools |
| Zustand | Отсутствие встроенного undo/redo, нет DevTools из коробки |
| Jotai | Нет встроенного time-travel, частые ре-рендеры |
| MobX | Сложность настройки DevTools, проблемы с TypeScript decorators |

**Типичные проблемы разработчиков:**

1. **State не обновляется после async операций**
   - Пример: «After dispatching async thunk, state remains unchanged»
   - Частое решение: использование thunk/saga middleware

2. **Race conditions при частых обновлениях**
   - Пример: «Rapid fire updates cause lost state»
   - Частое решение: debounce, batch updates

3. **Сложность отслеживания источника изменений**
   - Частое решение: DevTools, логирование действий

4. **Потеря состояния при перезагрузке**
   - Частое решение: persistence middleware, localStorage

5. **Проблемы с undo/redo**
   - Частое решение: кастомная реализация или специализированные библиотеки

**Вывод:** Существующие библиотеки не предоставляют встроенных инструментов для отладки истории изменений «из коробки».

### Анализ редакторов: популярные решения

Мы изучили, как реализованы undo/redo в популярных редакторах:

| Редактор | Паттерн | Глубина | Хранение |
|----------|---------|---------|----------|
| Google Docs | Delta + Operational Transform | 30 дней | Server |
| Figma | Delta + Periodic Snapshots | Unlimited | Server + IDB |
| VS Code | Command + Snapshot | 100+ | Memory |
| Photoshop | Snapshot | 1000 | Memory |
| Excalidraw | Snapshot | 29 | LocalStorage |

**Ключевые наблюдения:**

- Большинство редакторов используют **Snapshot pattern** (полные копии состояния)
- Продвинутые редакторы (Google Docs, Figma) используют **Delta pattern** (только изменения)
- Средняя глубина истории: **50-100 действий**
- Неограниченную историю предлагают少数 (Figma, Audacity)

### Ожидания пользователей

Анализ популярных приложений показывает, что пользователи ожидают от системы undo/redo:

- **Jump-to-version** — возможность перейти к любой версии. Реализовано в Figma[^1], Google Docs[^2], VS Code[^3].
- **Названия действий** в истории (например, «Удаление абзаца»). Используется в Photoshop History Panel[^4], Redux DevTools[^5].
- **Дельта изменений** (+/- символы). Стандарт для Google Docs Suggestion Mode[^2], GitHub Diff[^6].
- **Горячие клавиши** (Ctrl+Z, Ctrl+Y). Стандарт де-факто для всех редакторов[^7][^8].

> «Undo/redo — must-have для любого редактора. Пользователи ожидают Ctrl+Z везде.»  
> — Из обсуждения в сообществе

[^1]: https://help.figma.com/hc/en-us/articles/4404664585495
[^2]: https://support.google.com/docs/answer/190843
[^3]: https://code.visualstudio.com/updates/v1_39
[^4]: https://helpx.adobe.com/photoshop/using/history-panel.html
[^5]: https://github.com/reduxjs/redux-devtools
[^6]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests
[^7]: https://en.wikipedia.org/wiki/Undo
[^8]: https://learn.microsoft.com/en-us/windows/win32/uxguide/inter-undo

### Выводы для статьи

Мы сформулировали требования к нашей реализации:

1. **Гибридный подход** (Snapshot + Delta) для баланса памяти и производительности
2. **Debounce создание снимков** для предотвращения race conditions
3. **Метаданные для каждого снимка** (время, действие, дельта)
4. **User-facing функциональность** (горячие клавиши, визуальная история)
5. **Производительность:** цель < 50ms на снимок, < 100ms на восстановление

Теперь, вооружившись этими знаниями, приступим к реализации.

---

## Шаг 1: Настройка проекта

Создадим новый React + TypeScript проект с помощью Vite:

```bash
# Создаём проект
pnpm create vite@latest demo-editor --template react-ts
cd demo-editor

# Устанавливаем зависимости
pnpm add @nexus-state/core @nexus-state/react
pnpm add @codemirror/state @codemirror/view @codemirror/lang-javascript @codemirror/theme-one-dark
pnpm add lucide-react lodash-es

# Устанавливаем типы
pnpm add -D @types/lodash-es
```

**Структура проекта:**

```
demo-editor/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   ├── Timeline/
│   │   └── Snapshots/
│   ├── store/
│   │   ├── atoms.ts
│   │   ├── timeTravel.ts
│   │   └── store.ts
│   ├── hooks/
│   │   └── useDebounceSnapshots.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

Запустите проект для проверки:

```bash
pnpm dev
```

Откройте `http://localhost:5173` — вы должны увидеть базовый React шаблон.

---

## Шаг 2: Создание атомов

Атомы — это базовые единицы состояния в Nexus State. Каждый атом представляет собой независимый фрагмент состояния, на который могут подписываться компоненты.

Создайте файл `src/store/atoms.ts`:

```typescript
import { atom } from '@nexus-state/core'

// Основное содержимое редактора
export const contentAtom = atom('', 'editor.content')

// Позиция курсора
export const cursorAtom = atom(
  { line: 0, col: 0 },
  'editor.cursor'
)

// Статистика документа
export const statsAtom = atom(
  {
    characters: 0,
    words: 0,
    lines: 0,
    lastSaved: null as number | null
  },
  'editor.stats'
)

// Флаг «грязного» состояния (были ли изменения)
export const isDirtyAtom = atom(false, 'editor.dirty')

// Флаг сохранения
export const isSavingAtom = atom(false, 'editor.saving')
```

**Ключевые моменты:**

- Второй параметр (`'editor.content'`) — имя атома для отладки в DevTools
- Атомы могут хранить примитивы, объекты, массивы
- Вычисляемые атомы создаются с функцией-геттером

Добавим вычисляемый атом для статистики:

```typescript
// Вычисляемый атом — автоматически обновляется при изменении contentAtom
export const computedStatsAtom = atom((get) => {
  const content = get(contentAtom)
  
  return {
    characters: content.length,
    words: content.trim() ? content.trim().split(/\s+/).length : 0,
    lines: content.split('\n').length,
    lastSaved: get(statsAtom).lastSaved
  }
}, 'editor.computedStats')
```

---

## Шаг 3: Настройка time-travel

Time-travel в Nexus State реализован через класс `SimpleTimeTravel`. Он отслеживает изменения атомов и создаёт снимки состояния.

Создайте файл `src/store/timeTravel.ts`:

```typescript
import { SimpleTimeTravel } from '@nexus-state/core'
import { editorStore } from './store'

export const editorTimeTravel = new SimpleTimeTravel(editorStore, {
  // Максимальное количество снимков в истории
  maxHistory: 100,
  
  // Отключаем авто-снимки — используем debounce
  autoCapture: false,
  
  // Delta-сжатие для экономии памяти
  deltaSnapshots: {
    enabled: true,
    fullSnapshotInterval: 10,        // Полный снимок каждые 10 изменений
    maxDeltaChainLength: 20,         // Максимальная длина цепочки дельт
    changeDetection: 'deep'          // Глубокое сравнение изменений
  },
  
  // TTL для атомов (очистка старых данных)
  atomTTL: 300000, // 5 минут
  
  // Настройки отслеживания
  trackingConfig: {
    autoTrack: true,                 // Автоматически отслеживать новые атомы
    trackComputed: true,             // Отслеживать вычисляемые атомы
    trackWritable: true,             // Отслеживать записываемые атомы
    trackPrimitive: true             // Отслеживать примитивные значения
  },
  
  // Стратегия очистки
  cleanupStrategy: 'lru',            // Least Recently Used
  gcInterval: 60000                  // Сборка мусора каждую минуту
})
```

**Обоснование параметров:**

- `maxHistory: 100` — значение основано на анализе популярных редакторов (VS Code: 100+, Photoshop: 1000)
- `deltaSnapshots.enabled: true` — delta-сжатие уменьшает размер снимков по сравнению с полными копиями
- `autoCapture: false` — используем debounce для предотвращения race conditions
- `atomTTL: 300000` — очистка старых снимков для экономии памяти

---

## Шаг 4: Debounce для снимков

Одна из ключевых проблем при реализации time-travel — **race conditions при частых обновлениях**. Для решения этой проблемы используем debounce.

Создайте хук `src/hooks/useDebounceSnapshots.ts`:

```typescript
import { useRef, useCallback, useEffect } from 'react'
import { debounce } from 'lodash-es'
import { editorTimeTravel } from '@/store/timeTravel'
import { useSetAtom } from '@nexus-state/react'
import { isSavingAtom } from '@/store/atoms'

export interface UseDebounceSnapshotsOptions {
  delay?: number        // Задержка перед созданием снимка (мс)
  maxWait?: number      // Максимальное время ожидания (мс)
  enabled?: boolean     // Включить/выключить
}

export function useDebounceSnapshots(
  options: UseDebounceSnapshotsOptions = {}
) {
  const {
    delay = 1000,       // 1 секунда по умолчанию
    maxWait = 5000,     // Принудительно каждые 5 секунд
    enabled = true
  } = options

  const captureRef = useRef<ReturnType<typeof debounce> | null>(null)
  const setIsSaving = useSetAtom(isSavingAtom)

  // Создаём debounced функцию захвата
  useEffect(() => {
    if (!enabled) {
      captureRef.current?.cancel()
      captureRef.current = null
      return
    }

    captureRef.current = debounce(
      (action: string) => {
        const snapshot = editorTimeTravel.capture(action)
        if (snapshot) {
          console.log('[DebounceSnapshot] Captured:', {
            action,
            id: snapshot.id,
            timestamp: snapshot.metadata.timestamp
          })
          setIsSaving(false)
        }
      },
      delay,
      { maxWait, leading: false, trailing: true }
    )

    return () => {
      captureRef.current?.cancel()
      captureRef.current = null
    }
  }, [delay, maxWait, enabled, setIsSaving])

  /**
   * Создание снимка с debounce
   */
  const captureSnapshot = useCallback((
    action: string = 'text-edit',
    newContent?: string
  ) => {
    if (!enabled || !captureRef.current) return
    captureRef.current(action)
  }, [enabled])

  /**
   * Принудительный захват (игнорирует debounce)
   */
  const forceCapture = useCallback((
    action: string = 'manual-save'
  ) => {
    if (!enabled) return
    const snapshot = editorTimeTravel.capture(action)
    if (snapshot) {
      console.log('[ForceCapture] Captured:', {
        action,
        id: snapshot.id
      })
    }
  }, [enabled])

  /**
   * Отмена отложенного захвата
   */
  const cancelPending = useCallback(() => {
    captureRef.current?.cancel()
  }, [])

  return {
    captureSnapshot,
    forceCapture,
    cancelPending
  }
}
```

**Как это работает:**

1. Пользователь вводит текст
2. Хук ждёт 1 секунду после последнего изменения
3. Если за 1 секунду не было новых изменений — создаётся снимок
4. Если прошло 5 секунд — снимок создаётся принудительно (maxWait)

Это предотвращает создание слишком частых снимков и решает проблему race conditions.

---

_(Продолжение следует...)_

В следующих разделах:
- Интеграция CodeMirror редактора
- Создание компонентов Timeline и SnapshotList
- Навигация по истории (undo/redo/jumpTo)
- Сравнение версий (diff view)
- Бенчмарки производительности

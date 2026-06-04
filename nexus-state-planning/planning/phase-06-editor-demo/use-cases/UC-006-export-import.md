# UC-006: Экспорт/Импорт состояния (Export/Import State)

## 📋 Описание

Демонстрация возможностей экспорта истории time-travel в различные форматы и импорта ранее сохраненного состояния.

## 🎯 Цель

Показать, как Nexus State позволяет сохранять, экспортировать и восстанавливать состояние приложения и историю изменений.

## 👤 Персона

**Разработчик/Тестировщик** — хочет сохранить состояние для отладки, поделиться багом или восстановить предыдущую сессию.

## 📖 Предусловия

- В редакторе есть содержимое
- В истории есть несколько снимков
- Time-travel активен

## 🔄 Поток

### Сценарий 1: Экспорт истории в JSON

1. **Пользователь нажимает кнопку "Export"**
   - Открывается modal экспорта
   - Выбор формата (JSON, HTML, Markdown)
   - Выбор диапазона (вся история / выбранные снимки)

2. **Пользователь выбирает опции**
   - Формат: JSON
   - Включить содержимое снимков: Да
   - Включить метаданные: Да
   - Сжать данные: Опционально

3. **Экспорт выполняется**
   - Генерация файла
   - Скачивание автоматически
   - Или копирование в буфер

### Сценарий 2: Импорт состояния

1. **Пользователь перетаскивает JSON файл**
   - Drag & drop зона в сайдбаре
   - Валидация файла
   - Предпросмотр содержимого

2. **Пользователь подтверждает импорт**
   - Выбор стратегии (Заменить / Добавить к истории)
   - Импорт выполняется
   - История обновляется

### Сценарий 3: Shareable URL

1. **Пользователь нажимает "Share"**
   - Генерация уникального URL
   - Состояние кодируется в query params
   - Или сохраняется на сервере

2. **URL копируется в буфер**
   - Ссылка готова к отправке
   - Получатель может восстановить состояние

## 🎨 UI Элементы

```
┌─────────────────────────────────────────────────────────────────┐
│ Export State                                          [×]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Format:  ○ JSON  ○ HTML  ○ Markdown  ○ Plain Text             │
│                                                                 │
│  Range:   ○ All snapshots (15)                                 │
│           ○ Selected snapshots (3)                              │
│           ○ Current state only                                  │
│                                                                 │
│  Options:                                                       │
│           ☑ Include snapshot content                            │
│           ☑ Include metadata                                    │
│           ☐ Compress data (gzip)                                │
│           ☐ Exclude sensitive data                              │
│                                                                 │
│  Preview: 15 snapshots, ~12 KB                                  │
│                                                                 │
│  [Copy to Clipboard]  [Download File]  [Cancel]                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Import State                                          [×]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Drag & drop JSON file here                                     │
│  or click to browse                                             │
│                                                                 │
│  ─────────────────  OR  ─────────────────                       │
│                                                                 │
│  Paste JSON content:                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ {"snapshots":[...], "currentState":{...}}                  │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Strategy:  ○ Replace current history                           │
│             ○ Append to existing history                        │
│                                                                 │
│  [Import] [Cancel]                                              │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Техническая реализация

### Атомы экспорта/импорта

```typescript
// store/atoms/export.ts
import { atom } from '@nexus-state/core'

export interface ExportOptions {
  format: 'json' | 'html' | 'markdown' | 'plaintext'
  range: 'all' | 'selected' | 'current'
  selectedIds?: string[]
  includeContent: boolean
  includeMetadata: boolean
  compress: boolean
}

export interface ImportOptions {
  strategy: 'replace' | 'append'
  data: ExportedState
}

export interface ExportedState {
  version: string
  exportedAt: number
  snapshots: Array<{
    id: string
    timestamp: number
    action: string
    state: Record<string, any>
    metadata?: any
  }>
  currentState: Record<string, any>
}

export const exportOptionsAtom = atom<ExportOptions>({
  format: 'json',
  range: 'all',
  includeContent: true,
  includeMetadata: true,
  compress: false
}, 'export.options')

export const importModalOpenAtom = atom(false, 'import.modal.open')
export const exportModalOpenAtom = atom(false, 'export.modal.open')
```

### Хук для экспорта

```typescript
// hooks/useExportImport.ts
import { useCallback } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'
import type { ExportOptions, ExportedState } from '@/store/atoms/export'

export function useExportImport() {
  const exportState = useCallback((options: ExportOptions): Blob => {
    const history = editorTimeTravel.getHistory()
    const currentSnapshot = editorTimeTravel.getCurrentSnapshot()

    let snapshotsToExport = history

    if (options.range === 'selected' && options.selectedIds) {
      snapshotsToExport = history.filter(s =>
        options.selectedIds!.includes(s.id)
      )
    } else if (options.range === 'current') {
      snapshotsToExport = currentSnapshot ? [currentSnapshot] : []
    }

    const exported: ExportedState = {
      version: '1.0',
      exportedAt: Date.now(),
      snapshots: snapshotsToExport.map(snapshot => ({
        id: snapshot.id,
        timestamp: snapshot.timestamp,
        action: snapshot.metadata?.action || 'unknown',
        state: options.includeContent ? snapshot.state : {},
        metadata: options.includeMetadata ? snapshot.metadata : {}
      })),
      currentState: currentSnapshot?.state || {}
    }

    let content: string

    switch (options.format) {
      case 'json':
        content = JSON.stringify(exported, null, 2)
        break
      case 'html':
        content = formatAsHTML(exported)
        break
      case 'markdown':
        content = formatAsMarkdown(exported)
        break
      default:
        content = formatAsPlainText(exported)
    }

    if (options.compress) {
      // TODO: Implement gzip compression
    }

    return new Blob([content], { type: 'application/json' })
  }, [])

  const downloadFile = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const copyToClipboard = useCallback(async (blob: Blob): Promise<boolean> => {
    try {
      const text = await blob.text()
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }, [])

  const importState = useCallback((
    data: ExportedState,
    strategy: 'replace' | 'append'
  ): boolean => {
    try {
      if (strategy === 'replace') {
        editorTimeTravel.clearHistory()
      }

      // Import snapshots
      for (const snapshotData of data.snapshots) {
        // Restore snapshot data into time-travel history
        // This requires internal API access or custom import method
      }

      // Restore current state
      if (data.currentState) {
        editorTimeTravel.importState(data.currentState)
      }

      return true
    } catch (error) {
      console.error('Import failed:', error)
      return false
    }
  }, [])

  const handleFileUpload = useCallback((file: File): Promise<ExportedState> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }, [])

  return {
    exportState,
    downloadFile,
    copyToClipboard,
    importState,
    handleFileUpload
  }
}
```

### Форматирование экспорта

```typescript
// utils/exportFormatters.ts
import type { ExportedState } from '@/store/atoms/export'

export function formatAsHTML(data: ExportedState): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Exported State - ${new Date(data.exportedAt).toLocaleString()}</title>
  <style>
    body { font-family: system-ui; padding: 20px; }
    .snapshot { border: 1px solid #ddd; margin: 10px 0; padding: 15px; }
    .meta { color: #666; font-size: 12px; }
    pre { background: #f5f5f5; padding: 10px; overflow: auto; }
  </style>
</head>
<body>
  <h1>Exported State</h1>
  <p>Exported at: ${new Date(data.exportedAt).toLocaleString()}</p>
  <p>Snapshots: ${data.snapshots.length}</p>
  
  ${data.snapshots.map(s => `
    <div class="snapshot">
      <h3>${s.action}</h3>
      <div class="meta">
        ID: ${s.id} | ${new Date(s.timestamp).toLocaleString()}
      </div>
      <pre>${JSON.stringify(s.state, null, 2)}</pre>
    </div>
  `).join('')}
</body>
</html>
  `.trim()
}

export function formatAsMarkdown(data: ExportedState): string {
  return `
# Exported State

**Exported at:** ${new Date(data.exportedAt).toLocaleString()}
**Snapshots:** ${data.snapshots.length}

## Snapshots

${data.snapshots.map(s => `
### ${s.action}

- **ID:** ${s.id}
- **Time:** ${new Date(s.timestamp).toLocaleString()}

\`\`\`json
${JSON.stringify(s.state, null, 2)}
\`\`\`
`).join('')}
  `.trim()
}

export function formatAsPlainText(data: ExportedState): string {
  return `
Exported State
==============
Exported at: ${new Date(data.exportedAt).toLocaleString()}
Snapshots: ${data.snapshots.length}

${data.snapshots.map(s => `
---
${s.action}
ID: ${s.id}
Time: ${new Date(s.timestamp).toLocaleString()}

${JSON.stringify(s.state, null, 2)}
`).join('')}
  `.trim()
}
```

### Export/Import Modal Components

```typescript
// components/Export/ExportModal.tsx
import { useState } from 'react'
import { useExportImport } from '@/hooks/useExportImport'
import { useExportOptions } from '@/hooks/useExportOptions'

export function ExportModal({ onClose }: { onClose: () => void }) {
  const { exportState, downloadFile, copyToClipboard } = useExportImport()
  const [options, setOptions] = useState({
    format: 'json' as const,
    range: 'all' as const,
    includeContent: true,
    includeMetadata: true,
    compress: false
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)
    const blob = exportState(options)
    const filename = `nexus-state-export-${Date.now()}.${options.format}`
    downloadFile(blob, filename)
    setIsExporting(false)
    onClose()
  }

  const handleCopy = async () => {
    const blob = exportState(options)
    const success = await copyToClipboard(blob)
    if (success) {
      // Show toast notification
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal export-modal">
        <h2>Export State</h2>

        <div className="form-group">
          <label>Format:</label>
          <select
            value={options.format}
            onChange={(e) => setOptions({ ...options, format: e.target.value as any })}
          >
            <option value="json">JSON</option>
            <option value="html">HTML</option>
            <option value="markdown">Markdown</option>
            <option value="plaintext">Plain Text</option>
          </select>
        </div>

        <div className="form-group">
          <label>Range:</label>
          <select
            value={options.range}
            onChange={(e) => setOptions({ ...options, range: e.target.value as any })}
          >
            <option value="all">All snapshots</option>
            <option value="selected">Selected snapshots</option>
            <option value="current">Current state only</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={options.includeContent}
              onChange={(e) => setOptions({ ...options, includeContent: e.target.checked })}
            />
            Include snapshot content
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={options.includeMetadata}
              onChange={(e) => setOptions({ ...options, includeMetadata: e.target.checked })}
            />
            Include metadata
          </label>
        </div>

        <div className="modal-actions">
          <button onClick={handleCopy} disabled={isExporting}>
            Copy to Clipboard
          </button>
          <button onClick={handleExport} disabled={isExporting}>
            Download File
          </button>
          <button onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
```

## 📊 Ожидаемые результаты

| Метрика | Значение |
|---------|----------|
| Время экспорта (15 снимков) | < 100ms |
| Время импорта | < 200ms |
| Размер JSON (15 снимков) | ~10-20 KB |
| Поддерживаемые форматы | 4+ |

## ✅ Критерии приемки

- [ ] Экспорт в JSON работает корректно
- [ ] Экспорт в HTML/Markdown/Text работает
- [ ] Импорт из JSON восстанавливает состояние
- [ ] Drag & drop для файлов
- [ ] Копирование в буфер обмена
- [ ] Скачивание файла

## 🔗 Связанные use case'ы

- [[UC-002]](./UC-002.md) — Массовое редактирование
- [[UC-004]](./UC-004.md) — Сравнение версий
- [[UC-010]](./UC-010.md) — Shareable URL

## 📝 Заметки

- Добавить поддержку gzip сжатия для больших экспортов
- Валидация импортируемых данных
- Возможность экспорта отдельных снимков

import { useCallback } from 'react'
import { Trash2, Copy, FileText, Type, AlignLeft, Clock } from 'lucide-react'
import { useAtomValue } from '@nexus-state/react'
import { contentAtom } from '@/store/atoms/editor'
import { statsAtom } from '@/store/atoms/stats'
import { isDirtyAtom, lastSavedAtom, isSavingAtom } from '@/store/atoms/editor'
import { editorStore } from '@/store/store'
import './EditorToolbar.css'

export interface EditorToolbarProps {
  onClear?: () => void
  onCopy?: () => void
  showStats?: boolean
}

/**
 * Toolbar component для editorа
 *
 * Содержит кнопки для:
 * - Очистки editorа (Clear)
 * - Копирования содержимого (Copy)
 * - Статистики (опционально)
 */
export function EditorToolbar({ onClear, onCopy, showStats = false }: EditorToolbarProps) {
  const content = useAtomValue(contentAtom, editorStore)
  const stats = useAtomValue(statsAtom, editorStore)
  const isDirty = useAtomValue(isDirtyAtom, editorStore)
  const isSaving = useAtomValue(isSavingAtom, editorStore)
  const lastSaved = useAtomValue(lastSavedAtom, editorStore)

  const handleClear = useCallback(() => {
    onClear?.()
  }, [onClear])

  const handleCopy = useCallback(async () => {
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      onCopy?.()
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [content, onCopy])

  /**
   * Formatирование времени с последнего сохранения
   */
  const formatLastSaved = (timestamp: number | null): string => {
    if (!timestamp) return 'Not saved'

    const now = Date.now()
    const diff = now - timestamp

    if (diff < 1000) return 'Just now'
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`

    return new Date(timestamp).toLocaleTimeString()
  }

  /**
   * Formatирование времени чтения
   */
  const formatReadingTime = (minutes: number): string => {
    if (minutes === 0) return '< 1 min'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  /**
   * Formatирование больших чисел
   */
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0'
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <button
          onClick={handleClear}
          title="Clear editor"
          className="toolbar-button"
          type="button"
          disabled={!content}
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={handleCopy}
          title="Copy to clipboard"
          className="toolbar-button"
          type="button"
          disabled={!content}
        >
          <Copy size={16} />
        </button>
      </div>

      {showStats && (
        <div className="toolbar-stats-group">
          <div className="toolbar-stat-item" title="Characters">
            <FileText size={12} className="toolbar-stat-icon" />
            <span className="toolbar-stat-value">{formatNumber(stats.characters)}</span>
          </div>

          <div className="toolbar-stat-divider" />

          <div className="toolbar-stat-item" title="Words">
            <Type size={12} className="toolbar-stat-icon" />
            <span className="toolbar-stat-value">{formatNumber(stats.words)}</span>
          </div>

          <div className="toolbar-stat-divider" />

          <div className="toolbar-stat-item" title="Lines">
            <AlignLeft size={12} className="toolbar-stat-icon" />
            <span className="toolbar-stat-value">{formatNumber(stats.lines)}</span>
          </div>

          <div className="toolbar-stat-divider" />

          <div className="toolbar-stat-item" title="Reading time">
            <Clock size={12} className="toolbar-stat-icon" />
            <span className="toolbar-stat-value">{formatReadingTime(stats.readingTime)}</span>
          </div>

          <div className="toolbar-status-divider" />

          <div className="toolbar-save-status">
            {isSaving ? (
              <span className="toolbar-status-saving">Saving...</span>
            ) : isDirty ? (
              <span className="toolbar-status-unsaved">Unsaved</span>
            ) : lastSaved ? (
              <span className="toolbar-status-saved">{formatLastSaved(lastSaved)}</span>
            ) : (
              <span className="toolbar-status-not-saved">Not saved</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

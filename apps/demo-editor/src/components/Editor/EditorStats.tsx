import { useAtomValue } from '@nexus-state/react'
import { statsAtom } from '@/store/atoms/stats'
import { isDirtyAtom, lastSavedAtom, isSavingAtom } from '@/store/atoms/editor'
import { editorStore } from '@/store/store'
import { FileText, Type, AlignLeft, Clock } from 'lucide-react'
import './EditorStats.css'

export interface EditorStatsProps {
  className?: string
}

/**
 * Компонент статистики редактора
 *
 * Отображает в реальном времени:
 * - Количество символов
 * - Количество слов
 * - Количество строк
 * - Время чтения
 * - Статус сохранения
 */
export function EditorStats({ className = '' }: EditorStatsProps) {
  const stats = useAtomValue(statsAtom, editorStore)
  const isDirty = useAtomValue(isDirtyAtom, editorStore)
  const isSaving = useAtomValue(isSavingAtom, editorStore)
  const lastSaved = useAtomValue(lastSavedAtom, editorStore)

  /**
   * Форматирование времени с последнего сохранения
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
   * Форматирование времени чтения
   */
  const formatReadingTime = (minutes: number): string => {
    if (minutes === 0) return '< 1 min'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  /**
   * Форматирование больших чисел
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
    <div className={`editor-stats ${className}`}>
      {/* Statistics */}
      <div className="stats-group">
        <div className="stat-item" title="Characters">
          <FileText size={14} className="stat-icon" />
          <span className="stat-value">{formatNumber(stats.characters)}</span>
          <span className="stat-label">Chars</span>
        </div>

        <div className="stat-divider" />

        <div className="stat-item" title="Words">
          <Type size={14} className="stat-icon" />
          <span className="stat-value">{formatNumber(stats.words)}</span>
          <span className="stat-label">Words</span>
        </div>

        <div className="stat-divider" />

        <div className="stat-item" title="Lines">
          <AlignLeft size={14} className="stat-icon" />
          <span className="stat-value">{formatNumber(stats.lines)}</span>
          <span className="stat-label">Lines</span>
        </div>

        <div className="stat-divider" />

        <div className="stat-item" title="Reading time">
          <Clock size={14} className="stat-icon" />
          <span className="stat-value">{formatReadingTime(stats.readingTime)}</span>
          <span className="stat-label">Read</span>
        </div>
      </div>

      {/* Save status */}
      <div className="stats-save-status">
        {isSaving ? (
          <div className="save-status saving">
            <span className="status-dot" />
            <span>Saving...</span>
          </div>
        ) : isDirty ? (
          <div className="save-status saving">
            <span className="status-dot" />
            <span>Unsaved changes</span>
          </div>
        ) : lastSaved ? (
          <div className="save-status saved">
            <span className="status-dot" />
            <span>Saved {formatLastSaved(lastSaved)}</span>
          </div>
        ) : (
          <div className="save-status">
            <span className="text-muted">Not saved yet</span>
          </div>
        )}
      </div>
    </div>
  )
}

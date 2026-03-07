import { useCallback } from 'react'
import { Trash2, Copy } from 'lucide-react'
import { useAtomValue } from '@nexus-state/react'
import { contentAtom } from '@/store/atoms/editor'
import { editorStore } from '@/store/store'
import './EditorToolbar.css'

export interface EditorToolbarProps {
  onClear?: () => void
  onCopy?: () => void
}

/**
 * Toolbar компонент для редактора
 * 
 * Содержит кнопки для:
 * - Очистки редактора (Clear)
 * - Копирования содержимого (Copy)
 */
export function EditorToolbar({ onClear, onCopy }: EditorToolbarProps) {
  const content = useAtomValue(contentAtom, editorStore)

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
    </div>
  )
}

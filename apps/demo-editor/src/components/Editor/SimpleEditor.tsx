import { useEffect } from 'react'
import { useAtomValue, useSetAtom } from '@nexus-state/react'
import { contentAtom, cursorAtom, isSavingAtom } from '@/store/atoms/editor'
import { editorStore } from '@/store/store'
import { useDebounceSnapshots } from '@/hooks/useDebounceSnapshots'
import './Editor.css'

export interface SimpleEditorProps {
  readOnly?: boolean
  placeholder?: string
  className?: string
}

/**
 * Простой компонент редактора на базе textarea
 */
export function SimpleEditor({
  readOnly = false,
  placeholder = 'Start typing or paste your text here...',
  className = ''
}: SimpleEditorProps) {
  const content = useAtomValue(contentAtom, editorStore)
  const setContent = useSetAtom(contentAtom, editorStore)
  const setCursor = useSetAtom(cursorAtom, editorStore)
  const setIsSaving = useSetAtom(isSavingAtom, editorStore)

  // Хук для debounce создания снимков
  const { captureSnapshot, resetPreviousContent } = useDebounceSnapshots({
    delay: 1000,
    maxWait: 5000,
    enabled: true
  })

  // Логирование изменений content
  console.log('[SimpleEditor] Render - content:', content?.substring(0, 50))

  // Инициализация предыдущего контента
  if (content && !readOnly) {
    resetPreviousContent(content)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    console.log('[SimpleEditor] handleChange - newContent:', newContent.substring(0, 50))
    setContent(newContent)

    const textarea = e.target
    const textBeforeCursor = newContent.substring(0, textarea.selectionStart)
    const lines = textBeforeCursor.split('\n')

    setCursor({
      line: lines.length - 1,
      col: lines[lines.length - 1].length
    })

    setIsSaving(true)
    captureSnapshot('text-edit', newContent)
  }

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement
    const textBeforeCursor = content.substring(0, textarea.selectionStart)
    const lines = textBeforeCursor.split('\n')

    setCursor({
      line: lines.length - 1,
      col: lines[lines.length - 1].length
    })
  }

  return (
    <textarea
      className={`simple-editor ${className}`}
      data-testid="editor"
      value={content || ''}
      onChange={handleChange}
      onSelect={handleSelect}
      placeholder={placeholder}
      readOnly={readOnly}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
    />
  )
}

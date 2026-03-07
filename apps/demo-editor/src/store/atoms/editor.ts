import { atom } from '@nexus-state/core'

/**
 * Содержимое редактора
 * 
 * Основной атом для хранения текста документа.
 */
export const contentAtom = atom('', 'editor.content')

/**
 * Позиция курсора
 * 
 * Хранит текущую позицию курсора в редакторе.
 * line - номер строки (0-based)
 * col - номер колонки (0-based)
 */
export const cursorAtom = atom<{ line: number; col: number }>(
  { line: 0, col: 0 },
  'editor.cursor'
)

/**
 * Выделение текста
 * 
 * Хранит информацию о выделенном тексте.
 * from - позиция начала выделения
 * to - позиция конца выделения
 * null - если нет активного выделения
 */
export const selectionAtom = atom<{ from: number; to: number } | null>(
  null,
  'editor.selection'
)

/**
 * Флаг "грязного" состояния
 * 
 * true - есть несохраненные изменения
 * false - все изменения сохранены в снимке
 */
export const isDirtyAtom = atom(false, 'editor.isDirty')

/**
 * Флаг сохранения (debounce в процессе)
 * 
 * true - снимок создается (debounce)
 * false - снимок создан или нет изменений
 */
export const isSavingAtom = atom(false, 'editor.isSaving')

/**
 * Время последнего сохранения
 * 
 * Timestamp последнего созданного снимка time-travel.
 * null - если снимки еще не создавались
 */
export const lastSavedAtom = atom<number | null>(null, 'editor.lastSaved')

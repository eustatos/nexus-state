import { atom } from '@nexus-state/core'

/**
 * Editor content
 *
 * Main atom for document text storage.
 */
export const contentAtom = atom('', 'editor.content')

/**
 * Cursor position
 *
 * Stores current cursor position in editor.
 * line - line number (0-based)
 * col - column number (0-based)
 */
export const cursorAtom = atom<{ line: number; col: number }>(
  { line: 0, col: 0 },
  'editor.cursor'
)

/**
 * Text selection
 *
 * Stores information about selected text.
 * from - selection start position
 * to - selection end position
 * null - if no active selection
 */
export const selectionAtom = atom<{ from: number; to: number } | null>(
  null,
  'editor.selection'
)

/**
 * Dirty state flag
 *
 * true - has unsaved changes
 * false - all changes saved to snapshot
 */
export const isDirtyAtom = atom(false, 'editor.isDirty')

/**
 * Saving flag (debounce in progress)
 *
 * true - snapshot being created (debounce)
 * false - snapshot created or no changes
 */
export const isSavingAtom = atom(false, 'editor.isSaving')

/**
 * Last save time
 *
 * Timestamp of last created time-travel snapshot.
 * null - if no snapshots created yet
 */
export const lastSavedAtom = atom<number | null>(null, 'editor.lastSaved')

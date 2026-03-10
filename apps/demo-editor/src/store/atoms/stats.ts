import { atom } from '@nexus-state/core'
import { contentAtom } from './editor'

/**
 * Editor statistics
 */
export interface EditorStats {
  /** Character count (with spaces) */
  characters: number
  /** Character count (without spaces) */
  charactersNoSpaces: number
  /** Word count */
  words: number
  /** Line count */
  lines: number
  /** Reading time in minutes (rounded up) */
  readingTime: number
  /** Average word length */
  avgWordLength: number
  /** Average line length */
  avgLineLength: number
}

/**
 * Computed editor statistics
 *
 * Automatically recalculates when contentAtom changes.
 * Uses computed atom pattern with getter function.
 */
export const statsAtom = atom<EditorStats>((get) => {
  const content = get(contentAtom)

  const characters = content.length
  const charactersNoSpaces = content.replace(/\s/g, '').length
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const lines = content.split('\n').length

  // ~200 characters per minute for average reader
  const readingTime = Math.ceil(characters / 200 / 60)

  // Average word length (characters per word)
  const avgWordLength = words > 0
    ? Math.round((charactersNoSpaces / words) * 10) / 10
    : 0

  // Average line length (characters per line)
  const avgLineLength = lines > 0
    ? Math.round((characters / lines) * 10) / 10
    : 0

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    readingTime,
    avgWordLength,
    avgLineLength
  }
}, 'editor.stats')

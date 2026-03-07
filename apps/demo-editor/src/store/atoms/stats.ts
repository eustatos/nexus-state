import { atom } from '@nexus-state/core'
import { contentAtom } from './editor'

/**
 * Статистика редактора
 */
export interface EditorStats {
  /** Количество символов (с пробелами) */
  characters: number
  /** Количество символов (без пробелов) */
  charactersNoSpaces: number
  /** Количество слов */
  words: number
  /** Количество строк */
  lines: number
  /** Время чтения в минутах (округлено вверх) */
  readingTime: number
  /** Средняя длина слова */
  avgWordLength: number
  /** Средняя длина строки */
  avgLineLength: number
}

/**
 * Вычисляемая статистика редактора
 * 
 * Автоматически пересчитывается при изменении contentAtom.
 * Использует паттерн computed atom с функцией-геттером.
 */
export const statsAtom = atom<EditorStats>((get) => {
  const content = get(contentAtom)
  
  const characters = content.length
  const charactersNoSpaces = content.replace(/\s/g, '').length
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const lines = content.split('\n').length
  
  // ~200 символов в минуту для среднего читателя
  const readingTime = Math.ceil(characters / 200 / 60)
  
  // Средняя длина слова (символов на слово)
  const avgWordLength = words > 0 
    ? Math.round((charactersNoSpaces / words) * 10) / 10 
    : 0
  
  // Средняя длина строки (символов на строку)
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

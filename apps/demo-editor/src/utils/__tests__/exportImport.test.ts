/**
 * Тесты для утилит экспорта/импорта
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  exportState,
  exportAsBlob,
  downloadFile,
  copyToClipboard,
  importState,
  readFileAsJson,
  validateExportedState,
  generateFilename
} from '../exportImport'
import { formatAsHTML, formatAsMarkdown, formatAsPlainText } from '../exportFormatters'
import { editorTimeTravel } from '@/store/timeTravel'

// Мокаем URL.createObjectURL и revokeObjectURL для jsdom
beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test-url')
  URL.revokeObjectURL = vi.fn()
})

// Моки для editorTimeTravel
vi.mock('@/store/timeTravel', () => ({
  editorTimeTravel: {
    getHistory: vi.fn(() => []),
    getCurrentSnapshot: vi.fn(() => null),
    importState: vi.fn(() => true),
    clearHistory: vi.fn()
  }
}))

describe('exportFormatters', () => {
  const mockExportedState = {
    version: '1.0',
    exportedAt: Date.now(),
    snapshots: [
      {
        id: 'snapshot-1',
        timestamp: Date.now() - 1000,
        action: 'text-edit',
        state: { content: { value: 'Hello', type: 'writable' } },
        metadata: { atomCount: 1 }
      },
      {
        id: 'snapshot-2',
        timestamp: Date.now(),
        action: 'paste',
        state: { content: { value: 'Hello World', type: 'writable' } },
        metadata: { atomCount: 1 }
      }
    ],
    currentState: { content: { value: 'Hello World', type: 'writable' } },
    metadata: {
      totalSnapshots: 2
    }
  }

  describe('formatAsHTML', () => {
    it('должен генерировать валидный HTML', () => {
      const html = formatAsHTML(mockExportedState)

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html')
      expect(html).toContain('</html>')
      expect(html).toContain('Exported State')
      expect(html).toContain('snapshot-1')
      expect(html).toContain('snapshot-2')
    })

    it('должен включать метаданные', () => {
      const html = formatAsHTML(mockExportedState)

      expect(html).toContain('Snapshots: 2')
      expect(html).toContain(new Date(mockExportedState.exportedAt).toLocaleString())
    })
  })

  describe('formatAsMarkdown', () => {
    it('должен генерировать валидный Markdown', () => {
      const md = formatAsMarkdown(mockExportedState)

      expect(md).toContain('# 📦 Exported State')
      expect(md).toContain('**Exported at:**')
      expect(md).toContain('**Snapshots:** 2')
      expect(md).toContain('```json')
    })

    it('должен включать все снимки', () => {
      const md = formatAsMarkdown(mockExportedState)

      expect(md).toContain('#1: text-edit')
      expect(md).toContain('#2: paste')
    })
  })

  describe('formatAsPlainText', () => {
    it('должен генерировать текстовый формат', () => {
      const text = formatAsPlainText(mockExportedState)

      expect(text).toContain('EXPORTED STATE')
      expect(text).toContain('Exported at:')
      expect(text).toContain('Snapshots: 2')
    })
  })
})

describe('exportImport utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateFilename', () => {
    it('должен генерировать имя файла с timestamp', () => {
      const filename = generateFilename('json')

      expect(filename).toMatch(/nexus-state-export-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json/)
    })

    it('должен использовать правильное расширение для markdown', () => {
      const filename = generateFilename('markdown')

      expect(filename).toMatch(/\.md$/)
    })

    it('должен использовать правильное расширение для plaintext', () => {
      const filename = generateFilename('plaintext')

      expect(filename).toMatch(/\.txt$/)
    })
  })

  describe('validateExportedState', () => {
    it('должен возвращать false для невалидных данных', () => {
      expect(validateExportedState(null)).toBe(false)
      expect(validateExportedState({})).toBe(false)
      expect(validateExportedState({ snapshots: [] })).toBe(false)
      expect(validateExportedState({ version: '1.0' })).toBe(false)
    })

    it('должен возвращать true для валидных данных', () => {
      const validData = {
        version: '1.0',
        exportedAt: Date.now(),
        snapshots: [
          {
            id: 'test-1',
            timestamp: Date.now(),
            state: {}
          }
        ],
        currentState: {}
      }

      expect(validateExportedState(validData)).toBe(true)
    })

    it('должен проверять каждый снимок', () => {
      const invalidData = {
        version: '1.0',
        exportedAt: Date.now(),
        snapshots: [
          {
            id: 'test-1',
            // missing timestamp
            state: {}
          }
        ],
        currentState: {}
      }

      expect(validateExportedState(invalidData)).toBe(false)
    })
  })

  describe('exportState', () => {
    it('должен экспортировать все снимки при range=all', () => {
      const mockSnapshots = [
        {
          id: 'snap-1',
          metadata: { timestamp: Date.now(), action: 'edit', atomCount: 1 },
          state: { content: { value: 'test', type: 'writable' } }
        }
      ]

      vi.mocked(editorTimeTravel.getHistory).mockReturnValue(mockSnapshots as any)
      vi.mocked(editorTimeTravel.getCurrentSnapshot).mockReturnValue(mockSnapshots[0] as any)

      const result = exportState({
        format: 'json',
        range: 'all',
        includeContent: true,
        includeMetadata: true,
        compress: false
      })

      expect(result.snapshots.length).toBe(1)
      expect(result.snapshots[0].id).toBe('snap-1')
    })

    it('должен экспортировать только текущий снимок при range=current', () => {
      const mockSnapshot = {
        id: 'current-snap',
        metadata: { timestamp: Date.now(), action: 'edit', atomCount: 1 },
        state: { content: { value: 'current', type: 'writable' } }
      }

      vi.mocked(editorTimeTravel.getHistory).mockReturnValue([])
      vi.mocked(editorTimeTravel.getCurrentSnapshot).mockReturnValue(mockSnapshot as any)

      const result = exportState({
        format: 'json',
        range: 'current',
        includeContent: true,
        includeMetadata: true,
        compress: false
      })

      expect(result.snapshots.length).toBe(1)
      expect(result.snapshots[0].id).toBe('current-snap')
    })

    it('должен фильтровать снимки при range=selected', () => {
      const mockSnapshots = [
        {
          id: 'snap-1',
          metadata: { timestamp: Date.now(), action: 'edit', atomCount: 1 },
          state: {}
        },
        {
          id: 'snap-2',
          metadata: { timestamp: Date.now(), action: 'paste', atomCount: 1 },
          state: {}
        }
      ]

      vi.mocked(editorTimeTravel.getHistory).mockReturnValue(mockSnapshots as any)
      vi.mocked(editorTimeTravel.getCurrentSnapshot).mockReturnValue(null)

      const result = exportState({
        format: 'json',
        range: 'selected',
        selectedIds: ['snap-1'],
        includeContent: true,
        includeMetadata: true,
        compress: false
      })

      expect(result.snapshots.length).toBe(1)
      expect(result.snapshots[0].id).toBe('snap-1')
    })
  })

  describe('exportAsBlob', () => {
    it('должен создавать Blob с JSON данными', () => {
      vi.mocked(editorTimeTravel.getHistory).mockReturnValue([])
      vi.mocked(editorTimeTravel.getCurrentSnapshot).mockReturnValue(null)

      const blob = exportAsBlob({
        format: 'json',
        range: 'all',
        includeContent: true,
        includeMetadata: true,
        compress: false
      })

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/json')
    })

    it('должен создавать Blob с HTML данными', () => {
      vi.mocked(editorTimeTravel.getHistory).mockReturnValue([])
      vi.mocked(editorTimeTravel.getCurrentSnapshot).mockReturnValue(null)

      const blob = exportAsBlob({
        format: 'html',
        range: 'all',
        includeContent: true,
        includeMetadata: true,
        compress: false
      })

      expect(blob.type).toBe('text/html')
    })

    it('должен создавать Blob с Markdown данными', () => {
      vi.mocked(editorTimeTravel.getHistory).mockReturnValue([])
      vi.mocked(editorTimeTravel.getCurrentSnapshot).mockReturnValue(null)

      const blob = exportAsBlob({
        format: 'markdown',
        range: 'all',
        includeContent: true,
        includeMetadata: true,
        compress: false
      })

      expect(blob.type).toBe('text/markdown')
    })
  })

  describe('importState', () => {
    it('должен очищать историю при стратегии replace', () => {
      const mockData = {
        version: '1.0',
        exportedAt: Date.now(),
        snapshots: [],
        currentState: {}
      }

      importState({
        strategy: 'replace',
        data: mockData
      })

      expect(editorTimeTravel.clearHistory).toHaveBeenCalled()
    })

    it('должен возвращать успех при успешном импорте', () => {
      const mockData = {
        version: '1.0',
        exportedAt: Date.now(),
        snapshots: [
          {
            id: 'snap-1',
            timestamp: Date.now(),
            action: 'edit',
            state: { content: { value: 'test', type: 'writable' } }
          }
        ],
        currentState: {}
      }

      vi.mocked(editorTimeTravel.importState).mockReturnValue(true)

      const result = importState({
        strategy: 'replace',
        data: mockData
      })

      expect(result.success).toBe(true)
      expect(result.importedCount).toBeGreaterThan(0)
    })

    it('должен возвращать ошибку при невалидных данных', () => {
      const result = importState({
        strategy: 'replace',
        data: { snapshots: 'invalid' } as any
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('readFileAsJson', () => {
    it('должен читать файл и парсить JSON', async () => {
      const mockData = { test: 'data' }
      const mockFile = new Blob([JSON.stringify(mockData)], { type: 'application/json' })

      const result = await readFileAsJson<typeof mockData>(mockFile as File)

      expect(result).toEqual(mockData)
    })

    it('должен выбрасывать ошибку при невалидном JSON', async () => {
      const mockFile = new Blob(['invalid json'], { type: 'application/json' })

      await expect(readFileAsJson(mockFile as File)).rejects.toThrow('Invalid JSON format')
    })
  })

  describe('downloadFile', () => {
    it('должен создавать ссылку для скачивания', () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      const createElementSpy = vi.spyOn(document, 'createElement')
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      const removeChildSpy = vi.spyOn(document.body, 'removeChild')

      downloadFile(blob, 'test.txt')

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    })
  })

  describe('copyToClipboard', () => {
    const originalClipboard = navigator.clipboard

    afterEach(() => {
      navigator.clipboard = originalClipboard
    })

    it('должен копировать текст в буфер', async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined)
      // @ts-ignore - мокаем clipboard
      navigator.clipboard = { writeText: writeTextSpy }
      
      // Мокаем blob.text()
      const blob = { text: vi.fn().mockResolvedValue('test') } as any

      const result = await copyToClipboard(blob)

      expect(result).toBe(true)
      expect(writeTextSpy).toHaveBeenCalledWith('test')
    })

    it('должен возвращать false при ошибке', async () => {
      const writeTextSpy = vi.fn().mockRejectedValue(new Error('Failed'))
      // @ts-ignore - мокаем clipboard
      navigator.clipboard = { writeText: writeTextSpy }
      
      // Мокаем blob.text() с ошибкой
      const blob = { text: vi.fn().mockRejectedValue(new Error('Failed')) } as any

      const result = await copyToClipboard(blob)

      expect(result).toBe(false)
    })
  })
})

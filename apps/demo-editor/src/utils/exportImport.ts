/**
 * Utilities for editor state export and import
 */

import { editorTimeTravel } from '@/store/timeTravel'
import type { Snapshot } from '@nexus-state/core'
import type { ExportedState } from './exportFormatters'
import { formatAsHTML, formatAsMarkdown, formatAsPlainText } from './exportFormatters'

export type ExportFormat = 'json' | 'html' | 'markdown' | 'plaintext'
export type ExportRange = 'all' | 'selected' | 'current'

export interface ExportOptions {
  /** Export format */
  format: ExportFormat
  /** Export range */
  range: ExportRange
  /** Selected snapshot IDs (for range='selected') */
  selectedIds?: string[]
  /** Include snapshot content */
  includeContent: boolean
  /** Include metadata */
  includeMetadata: boolean
  /** Compress data */
  compress: boolean
}

export interface ImportOptions {
  /** Import strategy */
  strategy: 'replace' | 'append'
  /** Data to import */
  data: ExportedState
}

export interface ImportResult {
  /** Import success status */
  success: boolean
  /** Number of imported snapshots */
  importedCount: number
  /** Error message if any */
  error?: string
}

/**
 * Export editor state
 *
 * @param options - Export options
 * @returns Exported state data
 */
export function exportState(options: ExportOptions): ExportedState {
  const history = editorTimeTravel.getHistory()
  const currentSnapshot = editorTimeTravel.getCurrentSnapshot()

  // Filter snapshots by range
  let snapshotsToExport: Snapshot[] = history

  if (options.range === 'selected' && options.selectedIds) {
    snapshotsToExport = history.filter(s =>
      options.selectedIds!.includes(s.id)
    )
  } else if (options.range === 'current') {
    snapshotsToExport = currentSnapshot ? [currentSnapshot] : []
  }

  // Build exported data
  const exported: ExportedState = {
    version: '1.0',
    exportedAt: Date.now(),
    snapshots: snapshotsToExport.map(snapshot => ({
      id: snapshot.id,
      timestamp: snapshot.metadata.timestamp,
      action: snapshot.metadata.action || 'unknown',
      state: options.includeContent ? snapshot.state : {},
      metadata: options.includeMetadata ? snapshot.metadata : {}
    })),
    currentState: currentSnapshot?.state || {},
    metadata: {
      totalSnapshots: snapshotsToExport.length
    }
  }

  return exported
}

/**
 * Export state as Blob for download
 *
 * @param options - Export options
 * @returns Blob with exported data
 */
export function exportAsBlob(options: ExportOptions): Blob {
  const exported = exportState(options)
  let content: string
  let mimeType: string

  switch (options.format) {
    case 'html':
      content = formatAsHTML(exported)
      mimeType = 'text/html'
      break
    case 'markdown':
      content = formatAsMarkdown(exported)
      mimeType = 'text/markdown'
      break
    case 'plaintext':
      content = formatAsPlainText(exported)
      mimeType = 'text/plain'
      break
    default:
      content = JSON.stringify(exported, null, 2)
      mimeType = 'application/json'
  }

  return new Blob([content], { type: mimeType })
}

/**
 * Download exported data to file
 *
 * @param blob - Blob with data
 * @param filename - File name
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copy exported data to clipboard
 *
 * @param blob - Blob with data
 * @returns true if successful
 */
export async function copyToClipboard(blob: Blob): Promise<boolean> {
  try {
    const text = await blob.text()
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Generate filename for export
 *
 * @param format - Export format
 * @returns File name
 */
export function generateFilename(format: ExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const extensions: Record<ExportFormat, string> = {
    json: 'json',
    html: 'html',
    markdown: 'md',
    plaintext: 'txt'
  }
  return `editor-export-${timestamp}.${extensions[format]}`
}

/**
 * Import state into editor
 *
 * @param options - Import options
 * @returns Import result
 */
export function importState(options: ImportOptions): ImportResult {
  try {
    // Validate data
    if (!options.data || !options.data.snapshots) {
      return {
        success: false,
        importedCount: 0,
        error: 'Invalid data format'
      }
    }

    // Clear history on replace strategy
    if (options.strategy === 'replace') {
      editorTimeTravel.clearHistory()
    }

    // Import snapshots
    let importedCount = 0
    for (const snapshot of options.data.snapshots) {
      try {
        // Restore snapshot via internal API
        // Using importState from time-travel
        editorTimeTravel.importState(snapshot.state)
        importedCount++
      } catch (error) {
        console.error('Failed to import snapshot:', error)
      }
    }

    // Restore current state
    if (options.data.currentState) {
      // Import current state if needed
    }

    return {
      success: true,
      importedCount
    }
  } catch (error) {
    return {
      success: false,
      importedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Read file as JSON
 *
 * @param file - File to read
 * @returns Promise with parsed data
 */
export async function readFileAsJSON(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Validate exported data
 *
 * @param data - Data to validate
 * @returns true if data is valid
 */
export function validateExportedData(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false
  }

  if (!data.version || !data.snapshots) {
    return false
  }

  if (!Array.isArray(data.snapshots)) {
    return false
  }

  // Validate each snapshot
  for (const snapshot of data.snapshots) {
    if (!snapshot.id || !snapshot.timestamp) {
      return false
    }
  }

  return true
}
